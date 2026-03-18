import bcrypt from 'bcrypt';
import { pool } from '../../database/connectDatabase';

const SALT_ROUNDS = 12;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const getAllAdminsService = async () => {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, phone, age, nationality, document_id,
            base_salary, profile_image, building_id, floor_id,
            joining_date, last_login, created_at, updated_at
     FROM users
     WHERE role = 'admin'
     ORDER BY created_at DESC`
  );
  return rows;
};

export const getAdminByIdService = async (id: string) => {
  const { rows } = await pool.query(
    `SELECT id, full_name, email, phone, age, nationality, document_id,
            base_salary, profile_image, building_id, floor_id,
            joining_date, last_login, created_at, updated_at
     FROM users
     WHERE id = $1 AND role = 'admin'`,
    [id]
  );
  return rows[0] ?? null;
};

export const updateAdminService = async (
  id: string,
  data: {
    full_name?: string;
    email?: string;
    phone?: string;
    age?: number;
    nationality?: string;
    document_id?: string;
    base_salary?: number;
    profile_image?: string;
    joining_date?: string;
    password?: string;
  }
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed = [
    'full_name',
    'email',
    'phone',
    'age',
    'nationality',
    'document_id',
    'base_salary',
    'profile_image',
    'joining_date',
  ] as const;

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (data.password) {
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    fields.push(`password = $${idx++}`);
    values.push(hashed);
    // Bump token_version to invalidate existing sessions
    fields.push(`token_version = token_version + 1`);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE id = $${idx} AND role = 'admin'
     RETURNING id, full_name, email, phone, age, nationality, document_id,
               base_salary, profile_image, joining_date, updated_at`,
    values
  );
  return rows[0] ?? null;
};

export const deleteAdminService = async (id: string) => {
  const { rows } = await pool.query(
    `DELETE FROM users WHERE id = $1 AND role = 'admin' RETURNING id`,
    [id]
  );
  return rows[0] ?? null;
};

// Admins live in the users table — we use a pseudo is_active via a convention:
// we store active state by checking token_version >= 0 (always true) so we
// add an is_active column query via last_login NULL check, OR you can add a
// real boolean column. Here we use a simple approach: toggle via token_version
// (set to -1 = inactive, >=0 = active). Adjust if you have a real is_active col.
// For clarity, the frontend will derive is_active = (token_version >= 0).

export const toggleAdminStatusService = async (id: string, isActive: boolean) => {
  // If active → set token_version to a normal value (bump); inactive → set to -1
  const { rows } = await pool.query(
    `UPDATE users
     SET token_version = CASE WHEN $1 THEN GREATEST(token_version + 1, 0) ELSE -1 END,
         updated_at    = NOW()
     WHERE id = $2 AND role = 'admin'
     RETURNING id, token_version`,
    [isActive, id]
  );
  if (!rows[0]) return null;
  return { id: rows[0].id, is_active: rows[0].token_version >= 0 };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNTANT SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const getAllAccountantsService = async () => {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.age, u.nationality,
            u.document_id, u.base_salary, u.profile_image,
            u.building_id, u.floor_id,
            u.joining_date, u.last_login, u.created_at, u.updated_at, u.token_version,
            b.building_name,
            f.floor_name, f.floor_number
     FROM users u
     LEFT JOIN buildings b ON u.building_id = b.id
     LEFT JOIN floors    f ON u.floor_id    = f.id
     WHERE u.role = 'accountant'
     ORDER BY u.created_at DESC`
  );
  return rows;
};

export const getAccountantByIdService = async (id: string) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.age, u.nationality,
            u.document_id, u.base_salary, u.profile_image,
            u.building_id, u.floor_id,
            u.joining_date, u.last_login, u.created_at, u.updated_at, u.token_version,
            b.building_name,
            f.floor_name, f.floor_number
     FROM users u
     LEFT JOIN buildings b ON u.building_id = b.id
     LEFT JOIN floors    f ON u.floor_id    = f.id
     WHERE u.id = $1 AND u.role = 'accountant'`,
    [id]
  );
  return rows[0] ?? null;
};

export const updateAccountantService = async (
  id: string,
  data: {
    full_name?: string;
    email?: string;
    phone?: string;
    age?: number;
    nationality?: string;
    document_id?: string;
    base_salary?: number;
    profile_image?: string;
    joining_date?: string;
    building_id?: string | null;
    floor_id?: string | null;
    password?: string;
  }
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed = [
    'full_name',
    'email',
    'phone',
    'age',
    'nationality',
    'document_id',
    'base_salary',
    'profile_image',
    'joining_date',
    'building_id',
    'floor_id',
  ] as const;

  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key]);
    }
  }

  if (data.password) {
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);
    fields.push(`password = $${idx++}`);
    values.push(hashed);
    fields.push(`token_version = token_version + 1`);
  }

  if (fields.length === 0) return null;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE users
     SET ${fields.join(', ')}
     WHERE id = $${idx} AND role = 'accountant'
     RETURNING id, full_name, email, phone, age, nationality, document_id,
               base_salary, profile_image, building_id, floor_id, joining_date, updated_at`,
    values
  );
  return rows[0] ?? null;
};

export const deleteAccountantService = async (id: string) => {
  const { rows } = await pool.query(
    `DELETE FROM users WHERE id = $1 AND role = 'accountant' RETURNING id`,
    [id]
  );
  return rows[0] ?? null;
};

export const toggleAccountantStatusService = async (id: string, isActive: boolean) => {
  const { rows } = await pool.query(
    `UPDATE users
     SET token_version = CASE WHEN $1 THEN GREATEST(token_version + 1, 0) ELSE -1 END,
         updated_at    = NOW()
     WHERE id = $2 AND role = 'accountant'
     RETURNING id, token_version`,
    [isActive, id]
  );
  if (!rows[0]) return null;
  return { id: rows[0].id, is_active: rows[0].token_version >= 0 };
};
