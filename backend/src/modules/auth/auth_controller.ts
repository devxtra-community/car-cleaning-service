import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../config/logger';
import { generateAccessToken, generateRefreshToken, hashToken, ClientType } from '../../config/jwt';
import { pool } from '../../database/connectDatabase';
import { createUser } from './auth_service';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from 'src/middlewares/authMiddleware';
import { validateCreateUser } from './validator_User';

export const RegisterUser = async (req: AuthRequest, res: Response) => {
  try {
    // 🔐 Only admin / super_admin
    if (!['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // ✅ Validate body based on role
    validateCreateUser(req.body);

    const user = await createUser({
      ...req.body,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'USER_ALREADY_EXISTS') {
        return res.status(409).json({ success: false, message: 'User already exists' });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Registration failed',
      });
    }

    return res.status(400).json({
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

    /* ---------------- WEB FIX ONLY ---------------- */
    if (clientType === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
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
    await client.query('ROLLBACK');
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
