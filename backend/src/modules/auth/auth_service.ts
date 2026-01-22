import { logger } from 'src/config/logger';
import bcrypt from 'bcrypt';
import { pool } from 'src/database/connectDatabase';

export type ClientType = "web" | "mobile";

export interface CreateUserInput {
  email: string;
  password: string;
  role: string; // or UserRole
  full_name: string;
  document?: string;
  age?: number;
  nationality?: string;
  allowed_clients: ClientType[];
}

export const createUser = async (data: CreateUserInput) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (
        email, password, role, full_name, document, age, nationality, allowed_clients
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id,email,role,full_name,document,age,nationality,allowed_clients,created_at
      `,
      [
        data.email,
        hashedPassword,
        data.role,
        data.full_name,
        data.document || null,
        data.age || null,
        data.nationality || null,
        data.allowed_clients
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error("Error creating user in database", { error });
    throw error;
  }
};