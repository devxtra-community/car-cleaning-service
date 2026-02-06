import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../config/logger';
import { generateAccessToken, generateRefreshToken, hashToken, ClientType } from '../../config/jwt';
import { pool } from '../../database/connectDatabase';
import { createUser } from './auth_service';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from 'src/middlewares/authMiddleware';

import { uploadToS3 } from '../../middlewares/uploadMiddleware';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      role,
      full_name,
      client_type = 'web',
      document_id,
      age,
      nationality,
      building_id, // Get building_id from FormData
    } = req.body;

    // Upload document to S3 if file was uploaded
    let documentUrl = '';
    if (req.file) {
      console.log('Uploading document to S3...');
      documentUrl = await uploadToS3(req.file);
      console.log('Document uploaded to:', documentUrl);
    }

    if (!documentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Document image is required',
      });
    }

    // Validation
    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    if (!document_id || !age || !nationality) {
      return res.status(400).json({
        success: false,
        message: 'Personal information is incomplete',
      });
    }

    if (!['web', 'mobile'].includes(client_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client_type',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const { staff, supervisor, cleaner, supervisor_id, floor_id } = req.body;

    // For supervisors, create supervisor object with building_id
    const supervisorData = role === 'supervisor' && building_id ? { building_id } : supervisor;

    // For cleaners, create cleaner object with supervisor_id and floor_id
    const cleanerData =
      role === 'cleaner' && supervisor_id
        ? {
            supervisor_id,
            ...(floor_id && { floor_id }),
          }
        : cleaner;

    const user = await createUser({
      email,
      password,
      role,
      client_type,
      full_name,
      document: documentUrl,
      document_id: document_id,
      age: age,
      nationality,
      ...(staff && { staff }),
      ...(supervisorData && { supervisor: supervisorData }),
      ...(cleanerData && { cleaner: cleanerData }),
    });

    logger.info('User registered successfully', {
      userId: user.id,
      role: user.role,
      clientType: user.client_type,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_ALREADY_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
      });
    }

    logger.error('Registration failed', { err });

    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

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

    if (!['web', 'mobile'].includes(client_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client_type',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const { rows } = await client.query(
      `
      SELECT id, password, role, token_version
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const clientType = client_type as ClientType;
    const tokenId = uuidv4();

    const accessToken = generateAccessToken(
      {
        userId: user.id,
        role: user.role,
        tokenVersion: user.token_version,
      },
      clientType
    );

    const refreshToken = generateRefreshToken(
      {
        userId: user.id,
        tokenId,
        tokenVersion: user.token_version,
        clientType,
      },
      clientType
    );

    await client.query('BEGIN');

    // Revoke previous refresh tokens for same client
    await client.query(
      `
      UPDATE refresh_tokens
      SET revoked = TRUE
      WHERE user_id = $1
        AND client_type = $2
        AND revoked = FALSE
      `,
      [user.id, clientType]
    );

    // ✅ SAFE INTERVAL FOR POSTGRES / NEON
    const expiresSeconds = clientType === 'web' ? 7 * 24 * 60 * 60 : 90 * 24 * 60 * 60;

    await client.query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_id,
        token_hash,
        client_type,
        expires_at
      )
      VALUES ($1,$2,$3,$4, NOW() + ($5 * INTERVAL '1 second'))
      `,
      [user.id, tokenId, hashToken(refreshToken), clientType, expiresSeconds]
    );

    await client.query(
      `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
      `,
      [user.id]
    );

    await client.query('COMMIT');

    // Web → HttpOnly cookie
    if (clientType === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      accessToken,
      ...(clientType === 'mobile' && { refreshToken }),
    });
  } catch {
    await client.query('ROLLBACK');
    logger.error('Login failed');

    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  } finally {
    client.release();
  }
};
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId; // from auth middleware

    await pool.query(
      `
      UPDATE users
      SET token_version = token_version + 1
      WHERE id = $1
      `,
      [userId]
    );

    await pool.query(
      `
      UPDATE refresh_tokens
      SET revoked = TRUE
      WHERE user_id = $1
      `,
      [userId]
    );

    res.clearCookie('refreshToken', {
      path: '/api/auth/refresh',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    logger.error('Logout failed', { err: error });
    return res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
};

// Get all supervisors for cleaner assignment
export const getSupervisors = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        s.id,
        s.user_id,
        s.building_id,
        u.full_name,
        u.email
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
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
 * Get all cleaners with their user details and supervisor info
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
        c.floor_id,
        c.total_tasks,
        c.total_earning,
        b.building_name,
        s_u.full_name as supervisor_name
      FROM cleaners c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN buildings b ON c.building_id = b.id
      LEFT JOIN supervisors s ON c.supervisor_id = s.id
      LEFT JOIN users s_u ON s.user_id = s_u.id
      ORDER BY c.created_at DESC
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
