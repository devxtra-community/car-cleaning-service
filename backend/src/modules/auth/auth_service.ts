import bcrypt from 'bcrypt';
import { pool } from '../../database/connectDatabase';
import { AppError } from 'src/middlewares/error-handler';
import { generateAccessToken, generateRefreshToken, hashToken, ClientType } from '../../config/jwt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { sendMail } from 'src/config/sendWelcomeMail';
const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 15;

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
  building_id: string; // FK → buildings(id) ON DELETE SET NULL
};

type CleanerInput = BaseUserInput & {
  role: 'cleaner';
  building_id: string; // chosen first — anchor for floor + supervisor filtering
  floor_id: string; // must belong to building_id
  supervisor_id?: string; // supervisors.id (optional) — must be in same building
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

export const createUser = async (data: CreateUserInput) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Base validation ───────────────────────────────────────
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

    // ── Duplicate email check ─────────────────────────────────
    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length) {
      throw new AppError('User already exists', 409, 'USER_ALREADY_EXISTS');
    }

    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

    // ─────────────────────────────────────────────────────────
    // SUPERVISOR pre-checks
    // Multiple supervisors allowed per building — no uniqueness
    // constraint on supervisors.building_id.
    // ─────────────────────────────────────────────────────────
    if (data.role === 'supervisor') {
      if (!data.building_id) {
        throw new AppError(
          'Building ID is required for supervisor',
          400,
          'BUILDING_ID_REQUIRED_FOR_SUPERVISOR'
        );
      }
      const building = await client.query(`SELECT id FROM buildings WHERE id = $1`, [
        data.building_id,
      ]);
      if (!building.rows.length) {
        throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
      }
    }

    // ─────────────────────────────────────────────────────────
    // CLEANER pre-checks
    //
    // 1. building_id must exist
    // 2. floor_id must belong to that building
    // 3. supervisor_id (optional): must exist, be active,
    //    and belong to the same building
    //    — queried by supervisors.id (PK), not user_id
    // ─────────────────────────────────────────────────────────
    if (data.role === 'cleaner') {
      if (!data.building_id) {
        throw new AppError(
          'Building ID is required for cleaner',
          400,
          'BUILDING_ID_REQUIRED_FOR_CLEANER'
        );
      }
      if (!data.floor_id) {
        throw new AppError(
          'Floor ID is required for cleaner',
          400,
          'FLOOR_ID_REQUIRED_FOR_CLEANER'
        );
      }

      // 1. Building must exist
      const building = await client.query(`SELECT id FROM buildings WHERE id = $1`, [
        data.building_id,
      ]);
      if (!building.rows.length) {
        throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
      }

      // 2. Floor must belong to this building
      const floor = await client.query(`SELECT id FROM floors WHERE id = $1 AND building_id = $2`, [
        data.floor_id,
        data.building_id,
      ]);
      if (!floor.rows.length) {
        throw new AppError(
          'Floor not found or does not belong to the selected building',
          404,
          'FLOOR_NOT_FOUND_IN_BUILDING'
        );
      }

      // 3. Supervisor (optional)
      //    supervisor_id = supervisors.id (PK), not user_id
      if (data.supervisor_id) {
        const supervisor = await client.query(
          `SELECT id, building_id, is_active
           FROM supervisors
           WHERE id = $1`,
          [data.supervisor_id]
        );
        if (!supervisor.rows.length) {
          throw new AppError('Supervisor not found', 404, 'SUPERVISOR_NOT_FOUND');
        }
        if (!supervisor.rows[0].is_active) {
          throw new AppError('Supervisor is not active', 400, 'SUPERVISOR_NOT_ACTIVE');
        }
        if (supervisor.rows[0].building_id !== data.building_id) {
          throw new AppError(
            'Supervisor does not belong to the selected building',
            400,
            'SUPERVISOR_BUILDING_MISMATCH'
          );
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // Step 1 — INSERT into users
    // ─────────────────────────────────────────────────────────
    const userBuildingId =
      data.role === 'supervisor' || data.role === 'cleaner' ? data.building_id : null;

    const userFloorId = data.role === 'cleaner' ? data.floor_id : null;

    const userRes = await client.query(
      `INSERT INTO users (
         email, password, role, full_name, document, document_id,
         age, nationality, profile_image, phone, base_salary,
         building_id, floor_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, email, role, full_name, document, document_id,
                 age, nationality, profile_image, phone, base_salary,
                 building_id, floor_id, created_at, updated_at`,
      [
        email,
        hashed,
        data.role,
        data.full_name,
        data.document,
        data.document_id,
        data.age,
        data.nationality,
        data.profile_image ?? null,
        data.phone ?? null,
        data.base_salary ?? 0,
        userBuildingId,
        userFloorId,
      ]
    );

    const user = userRes.rows[0];

    // ─────────────────────────────────────────────────────────
    // Step 2 — UPSERT into role-specific profile table
    //
    // ON CONFLICT (user_id) DO UPDATE is required because the DB
    // has a trigger that auto-inserts a blank row into supervisors
    // or cleaners the moment the users row is created.
    // The UPSERT overwrites that blank row with real data.
    // ─────────────────────────────────────────────────────────

    if (data.role === 'supervisor') {
      await client.query(
        `INSERT INTO supervisors (user_id, building_id, full_name, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (user_id) DO UPDATE
           SET building_id = EXCLUDED.building_id,
               full_name   = EXCLUDED.full_name,
               is_active   = true,
               updated_at  = now()`,
        [user.id, data.building_id, data.full_name]
      );
    }

    if (data.role === 'cleaner') {
      await client.query(
        `INSERT INTO cleaners (
       user_id,
       supervisor_id,
       building_id,
       floor_id
     ) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
       SET supervisor_id = EXCLUDED.supervisor_id,
           building_id   = EXCLUDED.building_id,
           floor_id      = EXCLUDED.floor_id`,
        [user.id, data.supervisor_id ?? null, data.building_id ?? null, data.floor_id ?? null]
      );
    }

    await client.query('COMMIT');
    return user;
  } catch (err: unknown) {
    await client.query('ROLLBACK');

    if (typeof err === 'object' && err !== null && 'code' in err && 'constraint' in err) {
      const dbErr = err as { code?: string; constraint?: string };
      if (dbErr.code === '23505') {
        if (dbErr.constraint === 'users_email_key') {
          throw new AppError('User already exists', 409, 'USER_ALREADY_EXISTS');
        }
        if (dbErr.constraint === 'cleaners_user_id_key') {
          throw new AppError('Cleaner record already exists', 409, 'CLEANER_RECORD_ALREADY_EXISTS');
        }
      }
    }

    throw err;
  } finally {
    client.release();
  }
};
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

// ─────────────────────────────────────────────────────────────────────────────
// src/modules/auth/auth_service.ts  — add this snippet to your loginUserService
// RIGHT AFTER the password validation check (bcrypt.compare).
//
// The query below only hits if the user's role is 'supervisor'.
// For all other roles it short-circuits and skips.
// ─────────────────────────────────────────────────────────────────────────────

export const checkSupervisorNotBlocked = async (userId: string, role: string): Promise<void> => {
  if (role !== 'supervisor') return; // only supervisors have is_active flag

  const result = await pool.query(`SELECT is_active FROM supervisors WHERE user_id = $1`, [userId]);

  // No row means the supervisor record was removed — deny access
  if (!result.rows.length) {
    throw new AppError(
      'Your account has been temporarily blocked. Please contact the administrator.',
      403,
      'ACCOUNT_BLOCKED'
    );
  }

  const row = result.rows[0] as { is_active: boolean };
  if (row.is_active === false) {
    throw new AppError(
      'Your account has been temporarily blocked. Please contact the administrator.',
      403,
      'ACCOUNT_BLOCKED'
    );
  }
};

// ── helpers ───────────────────────────────────────────────────────────────────

const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

// OTP → SHA-256 (deterministic, needed for WHERE otp_hash = $2 in SQL).
// bcrypt can't be used here because its random salt means every hash differs —
// you can't filter in a WHERE clause. SHA-256 is safe for OTPs because they
// are already protected by short expiry + single-use.
const hashOTP = (otp: string): string => crypto.createHash('sha256').update(otp).digest('hex');

// resetToken → bcrypt (fetched by user_id first, then bcrypt.compare).
// Non-determinism is fine here because we never use it in a WHERE clause.
// bcrypt adds defence-in-depth if the DB is ever breached.
const hashResetToken = (token: string): Promise<string> => bcrypt.hash(token, SALT_ROUNDS);

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Request OTP
// ─────────────────────────────────────────────────────────────────────────────
export const requestPasswordResetService = async (email: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  const { rows } = await pool.query(`SELECT id, full_name, email FROM users WHERE email = $1`, [
    normalizedEmail,
  ]);

  if (!rows.length) return; // silent — no email enumeration

  const user = rows[0] as { id: string; full_name: string; email: string };
  const otp = generateOTP();
  const otpHash = hashOTP(otp); // SHA-256 for DB lookup

  await pool.query(
    `INSERT INTO password_resets (user_id, otp_hash, expires_at, used)
     VALUES ($1, $2, NOW() + INTERVAL '${OTP_EXPIRY_MINUTES} minutes', false)
     ON CONFLICT (user_id)
     DO UPDATE SET otp_hash   = EXCLUDED.otp_hash,
                   expires_at = EXCLUDED.expires_at,
                   used       = false,
                   created_at = NOW()`,
    [user.id, otpHash]
  );

  await sendMail({
    type: 'password_reset',
    to: user.email,
    full_name: user.full_name,
    otp,
    expiryMinutes: OTP_EXPIRY_MINUTES,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Verify OTP
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOTPService = async (
  email: string,
  otp: string
): Promise<{ resetToken: string }> => {
  const normalizedEmail = email.toLowerCase().trim();
  const otpHash = hashOTP(otp); // SHA-256 — used directly in WHERE clause

  const { rows } = await pool.query(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used
     FROM password_resets pr
     JOIN users u ON u.id = pr.user_id
     WHERE u.email = $1 AND pr.otp_hash = $2`,
    [normalizedEmail, otpHash]
  );

  if (!rows.length) throw new Error('Invalid OTP');

  const reset = rows[0] as { id: string; user_id: string; expires_at: Date; used: boolean };

  if (reset.used) throw new Error('OTP has already been used');
  if (new Date() > reset.expires_at) throw new Error('OTP has expired');

  // Generate reset token → hash with bcrypt before storing
  // Fetched by reset.id later (not by token), so random salt is fine
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = await hashResetToken(resetToken); // bcrypt ✓

  await pool.query(
    `UPDATE password_resets
     SET reset_token_hash = $1,
         token_expires_at = NOW() + INTERVAL '10 minutes'
     WHERE id = $2`,
    [resetTokenHash, reset.id]
  );

  return { resetToken };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Reset Password
// ─────────────────────────────────────────────────────────────────────────────
export const resetPasswordService = async (
  email: string,
  resetToken: string,
  newPassword: string
): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Fetch by email (not by token hash — bcrypt is non-deterministic)
    const { rows } = await client.query(
      `SELECT pr.id, pr.user_id, pr.reset_token_hash, pr.token_expires_at, pr.used
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE u.email = $1 AND pr.reset_token_hash IS NOT NULL`,
      [normalizedEmail]
    );

    if (!rows.length) throw new Error('Invalid or expired reset token');

    const reset = rows[0] as {
      id: string;
      user_id: string;
      reset_token_hash: string;
      token_expires_at: Date;
      used: boolean;
    };

    // bcrypt.compare — works correctly regardless of random salt
    const tokenValid = await bcrypt.compare(resetToken, reset.reset_token_hash);
    if (!tokenValid) throw new Error('Invalid or expired reset token');

    if (reset.used) throw new Error('Reset token already used');
    if (!reset.token_expires_at || new Date() > reset.token_expires_at)
      throw new Error('Reset token has expired');

    if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');

    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password + bump token_version → invalidates ALL existing JWTs
    await client.query(
      `UPDATE users
       SET password      = $1,
           token_version = token_version + 1,
           updated_at    = NOW()
       WHERE id = $2`,
      [hashed, reset.user_id]
    );

    // Revoke all refresh tokens for this user
    await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [reset.user_id]);

    // Mark reset record as used — can never be replayed
    await client.query(`UPDATE password_resets SET used = true WHERE id = $1`, [reset.id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
