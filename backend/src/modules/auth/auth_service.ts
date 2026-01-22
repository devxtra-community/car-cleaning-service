import { logger } from 'src/config/logger';
import bcrypt from 'bcrypt';
import { pool } from 'src/database/connectDatabase';

interface CreateUserInput {
  email: string;
  password: string;
  role: string;
  app_type: string;
  full_name: string;
}

export const createUser = async (data: CreateUserInput) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (email, password, role, app_type, full_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, role, app_type, full_name, created_at
      `,
      [data.email, hashedPassword, data.role, data.app_type, data.full_name]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating user in database', { error });
    throw error;
  }
};
