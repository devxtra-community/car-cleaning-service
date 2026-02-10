import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { logger } from '../../config/logger';
import { pool } from '../../database/connectDatabase';
import { createUser, CreateUserInput } from './auth_service';
import { uploadToS3 } from 'src/middlewares/uploadMiddleware';

/**
 * Register a new user (supervisor, cleaner, admin, super_admin, accountant)
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };
    // Extract files
    const documentFile = files?.document?.[0];
    const profilePhotoFile = files?.profile_image?.[0];

    // Validate required document
    if (!documentFile) {
      return res.status(400).json({
        success: false,
        message: 'Document file is required',
      });
    }

    // Upload document to S3
    const documentUrl = await uploadToS3(documentFile);

    // Upload profile photo to S3 (if provided)
    let profilePhotoUrl: string | undefined;
    if (profilePhotoFile) {
      profilePhotoUrl = await uploadToS3(profilePhotoFile);
    }

    // Build base user data
    const base = {
      email: req.body.email,
      password: req.body.password,
      full_name: req.body.full_name,
      document: documentUrl, // S3 URL
      document_id: req.body.document_id,
      age: Number(req.body.age),
      nationality: req.body.nationality,
      client_type: req.body.client_type || 'web',
      profile_image: profilePhotoUrl, // S3 URL (optional)
      phone: req.body.phone,
    };

    let payload: CreateUserInput;

    // Build role-specific payload
    switch (req.body.role) {
      case 'supervisor':
        payload = {
          ...base,
          role: 'supervisor',
          supervisor: {
            building_id: req.body.building_id,
          },
        };
        break;

      case 'cleaner':
        payload = {
          ...base,
          role: 'cleaner',
          cleaner: {
            supervisor_id: req.body.supervisor_id,
            floor_id: req.body.floor_id || undefined,
          },
        };
        break;

      case 'admin':
      case 'super_admin':
      case 'accountant':
        payload = {
          ...base,
          role: req.body.role,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user role',
        });
    }

    // Create user
    const user = await createUser(payload);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error: unknown) {
    logger.error('Registration failed', { err: error });

    let statusCode = 500;
    let message = 'Failed to register user';
    let errorMessage: string | undefined;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message === 'USER_ALREADY_EXISTS') {
        statusCode = 409;
        message = 'User with this email already exists';
      } else if (error.message === 'EMAIL_REQUIRED') {
        statusCode = 400;
        message = 'Email is required';
      } else if (error.message === 'PASSWORD_REQUIRED') {
        statusCode = 400;
        message = 'Password is required';
      } else if (error.message === 'FULL_NAME_REQUIRED') {
        statusCode = 400;
        message = 'Full name is required';
      } else if (error.message === 'DOCUMENT_REQUIRED') {
        statusCode = 400;
        message = 'Document is required';
      } else if (error.message === 'BUILDING_ID_REQUIRED_FOR_SUPERVISOR') {
        statusCode = 400;
        message = 'Building ID is required for supervisor';
      } else if (error.message === 'SUPERVISOR_ID_REQUIRED_FOR_CLEANER') {
        statusCode = 400;
        message = 'Supervisor ID is required for cleaner';
      } else if (error.message === 'BUILDING_NOT_FOUND') {
        statusCode = 404;
        message = 'Building not found';
      } else if (error.message === 'SUPERVISOR_NOT_FOUND') {
        statusCode = 404;
        message = 'Supervisor not found';
      }
    }

    return res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { email, password, client_type = 'web' } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    await client.query('BEGIN');

    const result = await client.query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);

    if (!result.rows.length) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      await client.query('ROLLBACK');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Import JWT utilities
    const { generateAccessToken, generateRefreshToken, hashToken } =
      await import('../../config/jwt');
    const { v4: uuidv4 } = await import('uuid');

    // Generate tokens
    const tokenId = uuidv4();
    const tokenVersion = user.token_version || 0;

    const accessToken = generateAccessToken(
      {
        userId: user.id,
        role: user.role,
        tokenVersion,
      },
      client_type
    );

    const refreshToken = generateRefreshToken(
      {
        userId: user.id,
        tokenId,
        tokenVersion,
        clientType: client_type,
      },
      client_type
    );

    // Store refresh token in database
    const expiresSeconds = client_type === 'web' ? 7 * 86400 : 90 * 86400;

    await client.query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_id,
        token_hash,
        client_type,
        expires_at
      )
      VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 second'))
      `,
      [user.id, tokenId, hashToken(refreshToken), client_type, expiresSeconds]
    );

    await client.query('COMMIT');

    // Set httpOnly cookie for web clients
    if (client_type === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: 7 * 86400000,
      });
    }

    // Remove password from response
    delete user.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      ...(client_type === 'mobile' && { refreshToken }),
      data: user,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Login failed', { err: error });
    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  } finally {
    client.release();
  }
};

/**
 * Logout user
 */
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh',
    });

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout failed', { err: error });
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

/**
 * Get all supervisors
 */
export const getSupervisors = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        s.id as supervisor_id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.document_id,
        u.age,
        u.nationality,
        u.document,
        u.profile_image,
        u.phone,
        b.building_name,
        b.id as building_id
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN buildings b ON s.building_id = b.id
      ORDER BY u.full_name ASC
      `
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Failed to fetch supervisors', { err: error });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch supervisors',
    });
  }
};

/**
 * Get all cleaners
 */
export const getCleaners = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        c.id as cleaner_id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.document_id,
        u.age,
        u.nationality,
        u.document,
        u.profile_image,
        u.phone,
        c.floor_id,
        c.total_tasks,
        c.total_earning,
        b.building_name,
        b.id as building_id,
        s.id as supervisor_id,
        s_u.full_name as supervisor_name
      FROM cleaners c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN buildings b ON c.building_id = b.id
      LEFT JOIN supervisors s ON c.supervisor_id = s.id
      LEFT JOIN users s_u ON s.user_id = s_u.id
      ORDER BY u.full_name ASC
      `
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Failed to fetch cleaners', { err: error });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cleaners',
    });
  }
};

/**
 * Get all cleaners assigned to a specific supervisor
 */
export const getCleanersBySupervisor = async (req: Request, res: Response) => {
  try {
    const { supervisorId } = req.params;

    if (!supervisorId) {
      return res.status(400).json({
        success: false,
        message: 'Supervisor ID is required',
      });
    }

    const result = await pool.query(
      `
      SELECT 
        c.id as cleaner_id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.document_id,
        u.age,
        u.nationality,
        u.document,
        u.profile_image,
        u.phone,
        c.floor_id,
        c.total_tasks,
        c.total_earning,
        b.building_name,
        b.id as building_id,
        s.id as supervisor_id,
        s_u.full_name as supervisor_name
      FROM cleaners c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN buildings b ON c.building_id = b.id
      LEFT JOIN supervisors s ON c.supervisor_id = s.id
      LEFT JOIN users s_u ON s.user_id = s_u.id
      WHERE c.supervisor_id = $1
      ORDER BY u.full_name ASC
      `,
      [supervisorId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Failed to fetch cleaners by supervisor', { err: error });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch cleaners',
    });
  }
};
