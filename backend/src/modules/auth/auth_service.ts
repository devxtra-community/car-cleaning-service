import bcrypt from 'bcrypt';
import { pool } from '../../database/connectDatabase';
import { UserRole } from 'src/database/schema/usersSchema';

export type ClientType = "web" | "mobile";

export interface CreateUserInput {
  email: string;
  password: string;
  role: UserRole;
  client_type: ClientTypes;
  full_name: string;
  document?: string;
  age?: number;
  nationality?: string;
}

export const createUser = async (data: CreateUserInput) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const result = await pool.query(
    `
    INSERT INTO users
    (email, password, role, client_type, full_name, document, age, nationality)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id, email, role, client_type, created_at
    `,
    [
      data.email,
      hashedPassword,
      data.role,
      data.client_type,
      data.full_name,
      data.document,
      data.age,
      data.nationality,
    ]
  );

  return result.rows[0];
};
