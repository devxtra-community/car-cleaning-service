import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../config/logger';
import { generateAccessToken, generateRefreshToken } from 'src/config/jwt';
import { createUser } from './auth_service';
import { pool } from '../../database/connectDatabase';

export const registerUser = async (req: Request, res: Response) => {
  try {
    logger.info('Registration attempt', { email: req.body.email });

    const { email, password, role, app_type, full_name } = req.body;

    if (!email || !password || !role || !app_type || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const user = await createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Registration failed', { error: error.message });
    } else {
      logger.error('Registration failed', { error });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, clientType } = req.body;

    if (!email || !password || !clientType) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and clientType are required',
      });
    }

    // 🔑 Direct PostgreSQL query (NO findUserByEmail)
    const result = await pool.query(
      `
      SELECT id, email, password, role
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // 🔐 Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role }, clientType);

    const refreshToken = generateRefreshToken({ userId: user.id }, clientType);

    if (clientType === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    logger.info('User logged in', {
      userId: user.id,
      clientType,
    });

    res.status(200).json({
      success: true,
      accessToken,
      ...(clientType === 'mobile' && { refreshToken }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('Login failed', { error: error.message });
    } else {
      logger.error('Login failed', { error });
    }

    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};
