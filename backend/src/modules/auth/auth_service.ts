import bcrypt from 'bcrypt';
import { pool } from '../../database/connectDatabase';
import { UserRole } from 'src/database/schema/usersSchema';

type ClientType = 'web' | 'mobile';

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
}

const SALT_ROUNDS = 12;

export const createUser = async (data: CreateUserInput) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const email = data.email.toLowerCase().trim();

    const existingUser = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);

    if (existingUser.rows.length > 0) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const result = await client.query(
      `
      INSERT INTO users (
        email,
        password,
        role,
        client_type,
        full_name,
        document,
        document_id,
        age,
        nationality
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING
        id,
        email,
        role,
        client_type,
        full_name,
        document,
        document_id,
        age,
        nationality,
        is_active,
        created_at
      `,
      [
        email,
        hashedPassword,
        data.role,
        data.client_type,
        data.full_name,
        data.document,
        data.document_id,
        data.age,
        data.nationality,
      ]
    );

    await client.query('COMMIT');

    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');

    if (err instanceof Error && err.message === 'USER_ALREADY_EXISTS') {
      throw err;
    }

    throw new Error('CREATE_USER_FAILED');
  } finally {
    client.release();
  }
};
