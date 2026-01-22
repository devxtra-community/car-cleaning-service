import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { logger } from '../../config/logger';
import { generateAccessToken, generateRefreshToken } from 'src/config/jwt';
import { createUser } from './auth_service';
import { pool } from '../../database/connectDatabase';

type ClientType = "web" | "mobile";
 
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role, full_name, document, age, nationality } = req.body;

    if (!email || !password || !role || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    //  Decide allowed clients internally
    const mobileRoles = ["supervisor", "cleaner"];
    const allowed_clients = mobileRoles.includes(role)
      ? ["mobile"]
      : ["web"];

    const user = await createUser({
      email,
      password,
      role,
      full_name,
      document,
      age,
      nationality,
      allowed_clients
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    logger.error('Registration failed', { error });
    res.status(500).json({
      success: false,
      message: 'Registration failed',
    });
  }
};
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const requestedClient = req.headers['x-client-type'] as ClientType;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (!requestedClient || !['web','mobile'].includes(requestedClient)) {
      return res.status(400).json({ success: false, message: 'Invalid client type' });
    }

    const result = await pool.query(
      `SELECT id,email,password,role,allowed_clients FROM users WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.allowed_clients.includes(requestedClient)) {
      return res.status(403).json({ success: false, message: 'Access denied for this platform' });
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role }, requestedClient);
    const refreshToken = generateRefreshToken({ userId: user.id }, requestedClient);

    if (requestedClient === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    logger.info('User logged in', { userId: user.id, client: requestedClient });

    res.status(200).json({
      success: true,
      accessToken,
      ...(requestedClient === 'mobile' && { refreshToken }),
    });
  } catch (error) {
    logger.error('Login failed', { error });
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};