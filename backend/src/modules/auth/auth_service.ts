import bcrypt from 'bcrypt';
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
  };

  // cleaner
  cleaner?: {
    supervisor_id?: string | null;
    total_work?: number;
    incentives?: number;
    work_location_id?: string | null;
  };
}

type CreatedUser = {
  id: string;
  email: string;
  role: UserRole;
  client_type: ClientType;
  full_name: string;
  document: string;
  document_id: string;
  age: number;
  nationality: string;
  is_active: boolean;
  created_at: string;
  profile?: unknown;
};

export const createUser = async (data: CreateUserInput): Promise<CreatedUser> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const email = data.email.toLowerCase().trim();

    const exists = await client.query(`SELECT id FROM users WHERE email=$1`, [email]);
    if (exists.rows.length) throw new Error('USER_ALREADY_EXISTS');

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const userRes = await client.query(
      `
      INSERT INTO users (
        email, password, role, full_name, verification_doc_url
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        email,
        hashedPassword,
        data.role,
        data.full_name,
        data.document, // Maps to verification_doc_url
      ]
    );

    const user = userRes.rows[0] as CreatedUser;
    const userId = user.id;

    // super_admin / admin / accountant → staff_profiles
    if (data.role === 'super_admin' || data.role === 'admin' || data.role === 'accountant') {
      if (!data.staff) throw new Error('MISSING_STAFF_FIELDS');

      const staffRes = await client.query(
        `
        INSERT INTO staff_profiles (user_id, employee_id, salary)
        VALUES ($1,$2,$3)
        RETURNING *
        `,
        [userId, data.staff.employee_id, data.staff.salary]
      );

      user.profile = staffRes.rows[0];
    }

    // supervisor
    if (data.role === 'supervisor') {
      const sup = data.supervisor ?? {};

      const supRes = await client.query(
        `
        INSERT INTO supervisors (user_id,total_work_done,work_location_id)
        VALUES ($1,$2,$3)
        RETURNING *
        `,
        [userId, sup.total_work_done ?? 0, sup.work_location_id ?? null]
      );

      user.profile = supRes.rows[0];
    }

    // cleaner
    if (data.role === 'cleaner') {
      if (!data.cleaner) throw new Error('MISSING_CLEANER_FIELDS');

      if (data.cleaner.supervisor_id) {
        const chk = await client.query(`SELECT id FROM supervisors WHERE id=$1`, [
          data.cleaner.supervisor_id,
        ]);
        if (!chk.rows.length) throw new Error('SUPERVISOR_NOT_FOUND');
      }

      const workerRes = await client.query(
        `
        INSERT INTO workers (user_id,supervisor_id,total_work,incentives,work_location_id)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *
        `,
        [
          userId,
          data.cleaner.supervisor_id ?? null,
          data.cleaner.total_work ?? 0,
          data.cleaner.incentives ?? 0,
          data.cleaner.work_location_id ?? null,
        ]
      );

      user.profile = workerRes.rows[0];
    }

    await client.query('COMMIT');
    return user;
  } catch (err: unknown) {
    await client.query('ROLLBACK');

    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: string }).code === '23505'
    ) {
      throw new Error('DUPLICATE_ENTRY');
    }

    throw err;
  } finally {
    client.release();
  }
};
