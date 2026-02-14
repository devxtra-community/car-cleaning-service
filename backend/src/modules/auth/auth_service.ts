import bcrypt from 'bcrypt';
import { pool } from '../../database/connectDatabase';

const SALT_ROUNDS = 12;

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
  supervisor: {
    building_id: string;
  };
};

type CleanerInput = BaseUserInput & {
  role: 'cleaner';
  cleaner: {
    supervisor_id: string;
    floor_id?: string;
  };
};

type StaffInput = BaseUserInput & {
  role: 'super_admin' | 'admin' | 'accountant';
};

export type CreateUserInput = SupervisorInput | CleanerInput | StaffInput;

export const createUser = async (data: CreateUserInput) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validation
    if (!data.email) throw new Error('EMAIL_REQUIRED');
    if (!data.password) throw new Error('PASSWORD_REQUIRED');
    if (!data.full_name) throw new Error('FULL_NAME_REQUIRED');
    if (!data.document) throw new Error('DOCUMENT_REQUIRED');
    if (!data.document_id) throw new Error('DOCUMENT_ID_REQUIRED');
    if (!data.age) throw new Error('AGE_REQUIRED');
    if (!data.nationality) throw new Error('NATIONALITY_REQUIRED');

    const email = data.email.toLowerCase().trim();

    // Check if user already exists
    const exists = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);

    if (exists.rows.length) throw new Error('USER_ALREADY_EXISTS');

    // Hash password
    const hashed = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Role-specific validation BEFORE creating user
    if (data.role === 'supervisor') {
      if (!data.supervisor.building_id) {
        throw new Error('BUILDING_ID_REQUIRED_FOR_SUPERVISOR');
      }

      // Verify building exists
      const buildingExists = await client.query(`SELECT id FROM buildings WHERE id = $1`, [
        data.supervisor.building_id,
      ]);

      if (!buildingExists.rows.length) {
        throw new Error('BUILDING_NOT_FOUND');
      }
    }

    if (data.role === 'cleaner') {
      if (!data.cleaner.supervisor_id) {
        throw new Error('SUPERVISOR_ID_REQUIRED_FOR_CLEANER');
      }

      // Verify supervisor exists and get building info
      const supervisorData = await client.query(
        `SELECT s.building_id, u.full_name 
         FROM supervisors s 
         JOIN users u ON s.user_id = u.id
         WHERE s.id = $1`,
        [data.cleaner.supervisor_id]
      );

      if (!supervisorData.rows.length) {
        throw new Error('SUPERVISOR_NOT_FOUND');
      }

      if (!supervisorData.rows[0].building_id) {
        throw new Error('SUPERVISOR_NOT_ASSIGNED_TO_BUILDING');
      }
    }

    // 1️⃣ INSERT INTO USERS TABLE
    const userRes = await client.query(
      `
      INSERT INTO users (
        email, 
        password, 
        role, 
        full_name, 
        document,
        document_id, 
        age, 
        nationality,
        profile_image,
        phone,
        base_salary
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
        data.profile_image || null,
        data.phone || null,
        data.base_salary || 0,
      ]
    );

    const user = userRes.rows[0];

    // 2️⃣ ROLE-SPECIFIC UPDATES

    // SUPERVISOR
    if (data.role === 'supervisor') {
      console.log('Updating supervisor with building_id:', data.supervisor.building_id);

      const supervisorResult = await client.query(
        `
        UPDATE supervisors 
        SET building_id = $1
        WHERE user_id = $2
        RETURNING *
        `,
        [data.supervisor.building_id, user.id]
      );

      if (supervisorResult.rows.length === 0) {
        throw new Error('FAILED_TO_UPDATE_SUPERVISOR');
      }

      console.log('Supervisor updated:', supervisorResult.rows[0]);
    }

    // CLEANER
    if (data.role === 'cleaner') {
      // Get supervisor's building and full_name (already validated above)
      const supervisorData = await client.query(
        `SELECT s.building_id, u.full_name 
         FROM supervisors s 
         JOIN users u ON s.user_id = u.id
         WHERE s.id = $1`,
        [data.cleaner.supervisor_id]
      );

      const building_id = supervisorData.rows[0].building_id;
      const supervisor_full_name = supervisorData.rows[0].full_name;

      // Verify floor belongs to the building if floor_id is provided
      if (data.cleaner.floor_id) {
        const floorCheck = await client.query(
          `SELECT id FROM floors WHERE id = $1 AND building_id = $2`,
          [data.cleaner.floor_id, building_id]
        );

        if (floorCheck.rows.length === 0) {
          throw new Error('FLOOR_NOT_FOUND_IN_BUILDING');
        }
      }

      const cleanerResult = await client.query(
        `
        UPDATE cleaners
        SET 
          supervisor_id = $1,
          building_id = $2,
          floor_id = $3,
          supervisor_full_name = $4
        WHERE user_id = $5
        RETURNING *
        `,
        [
          data.cleaner.supervisor_id,
          building_id,
          data.cleaner.floor_id || null,
          supervisor_full_name,
          user.id,
        ]
      );

      if (cleanerResult.rows.length === 0) {
        throw new Error('FAILED_TO_UPDATE_CLEANER');
      }
    }

    await client.query('COMMIT');

    // Remove password from returned user object
    delete user.password;

    return user;
  } catch (err: unknown) {
    await client.query('ROLLBACK');

    console.error('Create user error:', err);

    if (typeof err === 'object' && err !== null && 'code' in err && 'constraint' in err) {
      const dbErr = err as { code?: string; constraint?: string };

      if (dbErr.code === '23505') {
        if (dbErr.constraint === 'cleaners_user_id_key') {
          throw new Error('CLEANER_RECORD_ALREADY_EXISTS');
        }

        if (dbErr.constraint === 'supervisors_user_id_key') {
          throw new Error('SUPERVISOR_RECORD_ALREADY_EXISTS');
        }
      }
    }

    throw err;
  } finally {
    client.release();
  }
};
