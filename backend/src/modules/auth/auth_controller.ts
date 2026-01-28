import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../config/logger';
import { generateAccessToken, generateRefreshToken } from 'src/config/jwt';
import { pool } from '../../database/connectDatabase';
import { hashToken } from '../../config/jwt';
import { createUser } from './auth_service';

export const registerUser = async (req: Request, res: Response) => {
  console.log('---- REGISTER DEBUG ----');
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);
  console.log('------------------------');

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
      document,
    } = req.body;

    // Get document URL from uploaded file or from body
    const documentUrl = req.file ? `/uploads/documents/${req.file.filename}` : document;

    if (!documentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Document image is required',
      });
    }

    if (
      !email ||
      !password ||
      !role ||
      !full_name ||
      !document_id ||
      !age ||
      !nationality ||
      !documentUrl
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
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

    // Extract role-specific data from request body
    const { staff, supervisor, cleaner } = req.body;

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
      ...(supervisor && { supervisor }),
      ...(cleaner && { cleaner }),
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
        message: 'Invalid client_type. Must be "web" or "mobile"',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await pool.query(
      `
      SELECT id, password, role
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Add client_type to user object from request
    user.client_type = client_type;

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await pool.query(
      `
  UPDATE users
  SET last_login = NOW()
  WHERE id = $1
  `,
      [user.id]
    );
    const accessToken = generateAccessToken({ userId: user.id, role: user.role }, user.client_type);

    const refreshToken = generateRefreshToken({ userId: user.id }, user.client_type);

    const refreshExpiry = user.client_type === 'web' ? '7 days' : '90 days';

    await pool.query(
      `
      UPDATE refresh_tokens
      SET revoked = TRUE
      WHERE user_id = $1 AND client_type = $2 AND revoked = FALSE
      `,
      [user.id, user.client_type]
    );

    await pool.query(
      `
      INSERT INTO refresh_tokens (user_id, token_hash, client_type, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '${refreshExpiry}')
      `,
      [user.id, hashToken(refreshToken), user.client_type]
    );

    if (user.client_type === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return res.status(200).json({
      success: true,
      accessToken,
      ...(user.client_type === 'mobile' && { refreshToken }),
    });
  } catch (err) {
    logger.error('Login failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      await pool.query(
        `
        UPDATE refresh_tokens
        SET revoked = TRUE
        WHERE token_hash = $1 AND revoked = FALSE
        `,
        [hashToken(refreshToken)]
      );
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    });

    logger.info('User logged out securely');

    return res.status(200).json({
      success: true,
      message: 'Logged out securely',
    });
  } catch (err) {
    logger.error('Logout failed', { err });

    return res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};
