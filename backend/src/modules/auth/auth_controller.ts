import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { logger } from '../../config/logger';
import { pool } from '../../database/connectDatabase';
import { UserRole } from 'src/database/schema/usersSchema';

type ClientType = 'web' | 'mobile';

const SALT_ROUNDS = 12;

interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  client_type: ClientType;
  full_name: string;
  document: string;
  document_id: string;
  age: number;
  nationality: string;

  // super_admin / admin / accountant
  staff?: {
    employee_id: string;
    salary: number;
  };

  // supervisor
  supervisor?: {
    total_work_done?: number;
    work_location_id?: string | null;
    building_id?: string;
  };

  // cleaner
  cleaner?: {
    supervisor_id?: string | null;
    total_work?: number;
    incentives?: number;
    work_location_id?: string | null;
    floor_id?: string;
  };
}

export const createUser = async (data: CreateUserInput) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const email = data.email.toLowerCase().trim();

    const exists = await client.query(`SELECT id FROM users WHERE email=$1`, [email]);

    if (exists.rows.length) throw new Error('USER_ALREADY_EXISTS');

    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 1. USERS
    const userRes = await client.query(
      `
      INSERT INTO users (
        email,password,role,full_name,document,document_id,age,nationality
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        email,
        hashed,
        data.role,
        data.full_name,
        data.document,
        data.document_id,
        data.age,
        data.nationality,
      ]
    );

    const user = userRes.rows[0];

    // 2. SUPERVISOR
    if (data.role === 'supervisor') {
      if (!data.supervisor?.building_id) throw new Error('BUILDING_REQUIRED');

      await client.query(
        `
        INSERT INTO supervisors (user_id,building_id)
        VALUES ($1,$2)
        `,
        [user.id, data.supervisor.building_id]
      );
    }

    // 3. CLEANER
    if (data.role === 'cleaner') {
      if (!data.cleaner?.supervisor_id) throw new Error('SUPERVISOR_REQUIRED');

      // get building from supervisor
      const sup = await client.query(`SELECT building_id FROM supervisors WHERE id=$1`, [
        data.cleaner.supervisor_id,
      ]);

      if (!sup.rows.length) throw new Error('SUPERVISOR_NOT_FOUND');

      const buildingId = sup.rows[0].building_id;

      await client.query(
        `
        INSERT INTO cleaners (
          user_id,
          supervisor_id,
          building_id,
          floor_id,
          total_tasks,
          total_earning,
          incentive_target
        )
        VALUES ($1,$2,$3,$4,0,0,0)
        `,
        [user.id, data.cleaner.supervisor_id, buildingId, data.cleaner.floor_id ?? null]
      );
    }

    await client.query('COMMIT');

    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Register a new user
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const user = await createUser(userData);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error: unknown) {
    logger.error('User registration failed', { err: error });

    if ((error as Error).message === 'USER_ALREADY_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    if ((error as Error).message === 'BUILDING_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: 'Building is required for supervisor registration',
      });
    }

    if ((error as Error).message === 'SUPERVISOR_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: 'Supervisor is required for cleaner registration',
      });
    }

    if ((error as Error).message === 'SUPERVISOR_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Supervisor not found',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to register user',
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

    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

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
    const { generateAccessToken, generateRefreshToken, hashToken } = await import('../../config/jwt');
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
    const expiresSeconds = client_type === 'web' ? 7 * 86400 : 90 * 86400; // 7 days for web, 90 days for mobile

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
        maxAge: 7 * 86400000, // 7 days in milliseconds
      });
    }

    // Remove password from response
    delete user.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      ...(client_type === 'mobile' && { refreshToken }), // Only send refreshToken in response for mobile
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
    // Logout logic (e.g., clear tokens, session, etc.)
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
