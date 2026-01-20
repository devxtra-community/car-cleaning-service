import bcrypt from "bcrypt";
import { pool } from "../../database/connectDatabase";
import { logger } from "../../config/logger";

// ✅ Make sure you have "export" here
export const createUser = async (data: any) => {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (email, password, role, app_type, full_name)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, role, app_type, full_name, created_at
      `,
      [
        data.email,
        hashedPassword,
        data.role,
        data.app_type,
        data.full_name,
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Error creating user in database', { error });
    throw error;
  }
};