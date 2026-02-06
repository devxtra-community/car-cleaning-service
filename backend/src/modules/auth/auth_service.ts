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
