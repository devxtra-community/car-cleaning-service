import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../config/logger';
import { generateAccessToken, generateRefreshToken } from 'src/config/jwt';
import { createUser } from './auth_service';
import { pool } from '../../database/connectDatabase';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role, full_name, client_type, document, age, nationality } = req.body;

    if (!email || !password || !role || !full_name || !client_type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    if (!['web', 'mobile'].includes(client_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid client_type',
      });
    }

    const user = await createUser({
      email,
      password,
      role,
      full_name,
      client_type,
      document,
      age,
      nationality,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (err: unknown) {
    // changed from 'error'
    if (err instanceof Error) {
      logger.error('Registration failed', { error: err.message });
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    logger.error('Registration failed', { error: err });
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const result = await pool.query(
      `
      SELECT id, email, password, role, client_type
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

    const accessToken = generateAccessToken({ userId: user.id, role: user.role }, user.client_type);

    const refreshToken = generateRefreshToken({ userId: user.id }, user.client_type);

    if (user.client_type === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    logger.info('User logged in', {
      userId: user.id,
      client: user.client_type,
    });

    return res.status(200).json({
      success: true,
      accessToken,
      ...(user.client_type === 'mobile' && { refreshToken }),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('LOGIN ERROR:', error.message);
      logger.error('Login failed', { error: error.message });

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    console.error('LOGIN ERROR:', error);
    logger.error('Login failed', { error });

    return res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};