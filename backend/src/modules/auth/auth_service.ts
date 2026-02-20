import bcrypt from 'bcrypt';
import { pool } from '../../database/connectDatabase';
import { AppError } from 'src/middlewares/error-handler';
import { generateAccessToken, generateRefreshToken, hashToken, ClientType } from '../../config/jwt';
import { v4 as uuidv4 } from 'uuid';

const SALT_ROUNDS = 12;

// ============================================================
// TYPES
// ============================================================

type BaseUserInput = {
  email: string;
  password: string;
  full_name: string;
  document: string;
  document_id: string;
  age: number;
  nationality: string;
  profile_image?: string;
  phone?: string;
  base_salary?: number;
};

type SupervisorInput = BaseUserInput & {
  role: 'supervisor';
  supervisor: { building_id: string };
};

type CleanerInput = BaseUserInput & {
  role: 'cleaner';
  cleaner: { supervisor_id: string; floor_id?: string };
};

type StaffInput = BaseUserInput & {
  role: 'super_admin' | 'admin' | 'accountant';
};

export type CreateUserInput = SupervisorInput | CleanerInput | StaffInput;

export interface LoginResult {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
}

// ============================================================
// REGISTER
// ============================================================

export const createUser = async (data: CreateUserInput) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!data.email) throw new AppError('Email is required', 400, 'EMAIL_REQUIRED');
    if (!data.password) throw new AppError('Password is required', 400, 'PASSWORD_REQUIRED');
    if (!data.full_name) throw new AppError('Full name is required', 400, 'FULL_NAME_REQUIRED');
    if (!data.document) throw new AppError('Document is required', 400, 'DOCUMENT_REQUIRED');
    if (!data.document_id)
      throw new AppError('Document ID is required', 400, 'DOCUMENT_ID_REQUIRED');
    if (!data.age) throw new AppError('Age is required', 400, 'AGE_REQUIRED');
    if (!data.nationality)
      throw new AppError('Nationality is required', 400, 'NATIONALITY_REQUIRED');

    const email = data.email.toLowerCase().trim();

    const exists = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (exists.rows.length) {
      throw new AppError('User already exists', 409, 'USER_ALREADY_EXISTS');
    }

    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

    // --- Supervisor pre-checks ---
    if (data.role === 'supervisor') {
      if (!data.supervisor.building_id) {
        throw new AppError(
          'Building ID is required for supervisor',
          400,
          'BUILDING_ID_REQUIRED_FOR_SUPERVISOR'
        );
      }
      const buildingExists = await client.query(`SELECT id FROM buildings WHERE id = $1`, [
        data.supervisor.building_id,
      ]);
      if (!buildingExists.rows.length) {
        throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
      }
    }

    // --- Cleaner pre-checks ---
    if (data.role === 'cleaner') {
      if (!data.cleaner.supervisor_id) {
        throw new AppError(
          'Supervisor ID is required for cleaner',
          400,
          'SUPERVISOR_ID_REQUIRED_FOR_CLEANER'
        );
      }
      const supervisorCheck = await client.query(
        `SELECT s.building_id, u.full_name
         FROM supervisors s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = $1`,
        [data.cleaner.supervisor_id]
      );
      if (!supervisorCheck.rows.length) {
        throw new AppError('Supervisor not found', 404, 'SUPERVISOR_NOT_FOUND');
      }
      if (!supervisorCheck.rows[0].building_id) {
        throw new AppError(
          'Supervisor is not assigned to a building',
          400,
          'SUPERVISOR_NOT_ASSIGNED_TO_BUILDING'
        );
      }
    }

    // --- Insert user ---
    const userRes = await client.query(
      `INSERT INTO users (
        email, password, role, full_name, document, document_id,
        age, nationality, profile_image, phone, base_salary
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        email,
        hashed,
        data.role,
        data.full_name,
        data.document,
        data.document_id,
        data.age,
        data.nationality,
        data.profile_image || null,
        data.phone || null,
        data.base_salary || 0,
      ]
    );

    const user = userRes.rows[0];

    // --- Supervisor role update ---
    if (data.role === 'supervisor') {
      const supervisorResult = await client.query(
        `UPDATE supervisors SET building_id = $1 WHERE user_id = $2 RETURNING *`,
        [data.supervisor.building_id, user.id]
      );
      if (!supervisorResult.rows.length) {
        throw new AppError(
          'Failed to update supervisor record',
          500,
          'FAILED_TO_UPDATE_SUPERVISOR'
        );
      }
    }

    // --- Cleaner role update ---
    if (data.role === 'cleaner') {
      const supervisorData = await client.query(
        `SELECT s.building_id, u.full_name
         FROM supervisors s
         JOIN users u ON s.user_id = u.id
         WHERE s.id = $1`,
        [data.cleaner.supervisor_id]
      );

      const { building_id, full_name: supervisor_full_name } = supervisorData.rows[0];

      if (data.cleaner.floor_id) {
        const floorCheck = await client.query(
          `SELECT id FROM floors WHERE id = $1 AND building_id = $2`,
          [data.cleaner.floor_id, building_id]
        );
        if (!floorCheck.rows.length) {
          throw new AppError('Floor not found in building', 404, 'FLOOR_NOT_FOUND_IN_BUILDING');
        }
      }

      const cleanerResult = await client.query(
        `UPDATE cleaners
         SET supervisor_id = $1, building_id = $2, floor_id = $3, supervisor_full_name = $4
         WHERE user_id = $5
         RETURNING *`,
        [
          data.cleaner.supervisor_id,
          building_id,
          data.cleaner.floor_id || null,
          supervisor_full_name,
          user.id,
        ]
      );
      if (!cleanerResult.rows.length) {
        throw new AppError('Failed to update cleaner record', 500, 'FAILED_TO_UPDATE_CLEANER');
      }
    }

    await client.query('COMMIT');
    delete user.password;
    return user;
  } catch (err: unknown) {
    await client.query('ROLLBACK');

    // Re-wrap DB constraint errors as AppError
    if (typeof err === 'object' && err !== null && 'code' in err && 'constraint' in err) {
      const dbErr = err as { code?: string; constraint?: string };
      if (dbErr.code === '23505') {
        if (dbErr.constraint === 'cleaners_user_id_key') {
          throw new AppError('Cleaner record already exists', 409, 'CLEANER_RECORD_ALREADY_EXISTS');
        }
        if (dbErr.constraint === 'supervisors_user_id_key') {
          throw new AppError(
            'Supervisor record already exists',
            409,
            'SUPERVISOR_RECORD_ALREADY_EXISTS'
          );
        }
      }
    }

    throw err;
  } finally {
    client.release();
  }
};

// ============================================================
// LOGIN
// ============================================================

export const loginService = async (
  email: string,
  password: string,
  clientType: ClientType
): Promise<LoginResult> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(`SELECT * FROM users WHERE email = $1`, [
      email.toLowerCase().trim(),
    ]);

    if (!result.rows.length) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const tokenVersion = user.token_version || 0;
    const tokenId = uuidv4();

    const accessToken = generateAccessToken(
      { userId: user.id, role: user.role, tokenVersion },
      clientType
    );

    const refreshToken = generateRefreshToken(
      { userId: user.id, tokenId, tokenVersion, clientType },
      clientType
    );

    const expiresSeconds = clientType === 'web' ? 7 * 86400 : 90 * 86400;

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token_id, token_hash, client_type, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 second'))`,
      [user.id, tokenId, hashToken(refreshToken), clientType, expiresSeconds]
    );

    await client.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

    await client.query('COMMIT');

    delete user.password;
    return { user, accessToken, refreshToken };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ============================================================
// LOGOUT — delete token from DB (was missing in original)
// ============================================================

export const logoutService = async (userId: string, tokenId?: string) => {
  const client = await pool.connect();

  try {
    if (tokenId) {
      // Logout current session only
      await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1 AND token_id = $2`, [
        userId,
        tokenId,
      ]);
    } else {
      // Logout all sessions
      await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
      await client.query(`UPDATE users SET token_version = token_version + 1 WHERE id = $1`, [
        userId,
      ]);
    }
  } finally {
    client.release();
  }
};

// ============================================================
// CLEANERS
// ============================================================

export const getAllCleanersService = async () => {
  const { rows } = await pool.query(
    `SELECT
      c.id AS cleaner_id, c.user_id, c.building_id, c.floor_id,
      c.supervisor_id, c.total_tasks, c.total_earning, c.created_at,
      u.full_name, u.email, u.phone, u.age, u.nationality,
      u.document, u.document_id, u.profile_image, u.base_salary,
      b.building_name,
      s_u.full_name AS supervisor_name
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN buildings b ON c.building_id = b.id
     LEFT JOIN supervisors s ON c.supervisor_id = s.id
     LEFT JOIN users s_u ON s.user_id = s_u.id
     WHERE u.role = 'cleaner'
     ORDER BY u.full_name ASC`
  );
  return rows;
};

export const getCleanersBySupervisorService = async (supervisorId: string) => {
  const { rows } = await pool.query(
    `SELECT
      c.id AS cleaner_id, u.id AS user_id, u.full_name, u.email,
      u.document_id, u.age, u.nationality, u.document, u.profile_image,
      u.phone, c.floor_id, c.total_tasks, c.total_earning,
      b.building_name, b.id AS building_id,
      s.id AS supervisor_id, s_u.full_name AS supervisor_name
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN buildings b ON c.building_id = b.id
     LEFT JOIN supervisors s ON c.supervisor_id = s.id
     LEFT JOIN users s_u ON s.user_id = s_u.id
     WHERE c.supervisor_id = $1
     ORDER BY u.full_name ASC`,
    [supervisorId]
  );
  return rows;
};

// ============================================================
// SUPERVISORS
// ============================================================

export const getAllSupervisorsService = async () => {
  const { rows } = await pool.query(
    `SELECT
      s.id AS supervisor_id, s.user_id, s.building_id, s.location_id, s.created_at,
      u.full_name, u.email, u.phone, u.age, u.nationality,
      u.document, u.document_id, u.profile_image, u.base_salary,
      b.building_name
     FROM supervisors s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN buildings b ON s.building_id = b.id
     WHERE u.role = 'supervisor'
     ORDER BY u.full_name ASC`
  );
  return rows;
};

export const getSupervisorsByBuildingService = async (buildingId: string) => {
  const { rows } = await pool.query(
    `SELECT
      s.id, s.user_id, s.building_id, s.full_name,
      u.email, u.phone
     FROM supervisors s
     JOIN users u ON s.user_id = u.id
     WHERE s.building_id = $1 AND u.role = 'supervisor'
     ORDER BY s.full_name ASC`,
    [buildingId]
  );
  return rows;
};

// ============================================================
// ACCOUNTANTS & ADMINS
// ============================================================

export const getAllAccountantsService = async () => {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, phone, age, nationality, document_id,
            base_salary, profile_image, building_id, floor_id,
            joining_date, last_login, created_at
     FROM users WHERE role = 'accountant' ORDER BY created_at DESC`
  );
  return rows;
};

export const getAllAdminsService = async () => {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, phone, age, nationality, document_id,
            base_salary, profile_image, joining_date, last_login, created_at
     FROM users WHERE role = 'admin' ORDER BY created_at DESC`
  );
  return rows;
};
