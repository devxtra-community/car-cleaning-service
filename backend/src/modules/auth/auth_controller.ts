import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../config/logger';
import { generateAccessToken, generateRefreshToken, hashToken, ClientType } from '../../config/jwt';
import { pool } from '../../database/connectDatabase';
import { createUser } from './auth_service';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from 'src/middlewares/authMiddleware';

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
      document,
    } = req.body;

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

    // Optional: revoke previous refresh tokens ONLY for same client
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

    await client.query(
      `
      INSERT INTO refresh_tokens (
        user_id,
        token_id,
        token_hash,
        client_type,
        expires_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        NOW() + ($5 || ' seconds')::INTERVAL
      )
      `,
      [
        user.id,
        tokenId,
        hashToken(refreshToken),
        clientType,
        clientType === 'web' ? 7 * 24 * 60 * 60 : 90 * 24 * 60 * 60,
      ]
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
  } catch (err) {
    await pool.query('ROLLBACK');
    logger.error('Login failed', { err });

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
  } catch (err) {
    logger.error('Logout-all failed', { err });
    return res.status(500).json({
      success: false,
      message: 'Logout all failed',
    });
  }
};
