import { pool } from '../../database/connectDatabase';

type UserRole = 'admin' | 'accountant' | 'supervisor' | 'worker';

export class AttendanceService {
  static async markOnLogin(data: { user_id: string; role: UserRole }) {
    const now = new Date();

    const lateTime = new Date();
    lateTime.setHours(9, 30, 0);

    const status = now > lateTime ? 'late' : 'present';

    const result = await pool.query(
      `
      INSERT INTO attendance(user_id, check_in, status)
      VALUES ($1,NOW(),$2)
      ON CONFLICT (user_id, date)
      DO NOTHING
      RETURNING *
      `,
      [data.user_id, status]
    );

    return result.rows[0];
  }

  static async clockOut(user_id: string) {
    const attendance = await pool.query(
      `
      SELECT check_in
      FROM attendance
      WHERE user_id=$1 AND date=CURRENT_DATE
      `,
      [user_id]
    );

    if (!attendance.rows.length) return null;

    const checkIn = attendance.rows[0].check_in;

    await pool.query(
      `
      UPDATE attendance
      SET check_out=NOW()
      WHERE user_id=$1 AND date=CURRENT_DATE
      `,
      [user_id]
    );

    const hours = (Date.now() - new Date(checkIn).getTime()) / 3600000;

    return hours.toFixed(2);
  }

  static async today() {
    const result = await pool.query(`
      SELECT u.full_name,a.*
      FROM attendance a
      JOIN users u ON u.id=a.user_id
      WHERE date=CURRENT_DATE
    `);

    return result.rows;
  }

  static async alreadyMarked(user_id: string): Promise<boolean> {
    const result = await pool.query(
      `
      SELECT id FROM attendance
      WHERE user_id=$1 AND date=CURRENT_DATE
      `,
      [user_id]
    );

    return result.rows.length > 0;
  }
}
