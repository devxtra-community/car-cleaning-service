import bcrypt from 'bcrypt';
import { pool } from '../../database/connectDatabase';

type ClientType = 'web' | 'mobile';

const SALT_ROUNDS = 12;

type BaseUserInput = {
  email: string;
  password: string;
  client_type: ClientType;
  full_name: string;
  document: string;
  document_id: string;
  age: number;
  nationality: string;
  profile_image?: string;
  phone?: string;
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
        phone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      ]
    );

    const user = userRes.rows[0];

    // 2️⃣ ROLE-SPECIFIC INSERTS

    // SUPERVISOR
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

      await client.query(
        `
        INSERT INTO supervisors (user_id, building_id)
        VALUES ($1, $2)
        `,
        [user.id, data.supervisor.building_id]
      );
    }

    // CLEANER
    if (data.role === 'cleaner') {
      if (!data.cleaner.supervisor_id) {
        throw new Error('SUPERVISOR_ID_REQUIRED_FOR_CLEANER');
      }

      // Get supervisor's building
      const supervisorData = await client.query(
        `SELECT building_id FROM supervisors WHERE id = $1`,
        [data.cleaner.supervisor_id]
      );

      if (!supervisorData.rows.length) {
        throw new Error('SUPERVISOR_NOT_FOUND');
      }

      const building_id = supervisorData.rows[0].building_id;

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
        VALUES ($1, $2, $3, $4, 0, 0, 0)
        `,
        [user.id, data.cleaner.supervisor_id, building_id, data.cleaner.floor_id || null]
      );
    }

    // STAFF ROLES (admin, super_admin, accountant)
    // No additional table entries needed for these roles

    await client.query('COMMIT');

    // Remove password from returned user object
    delete user.password;

    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
