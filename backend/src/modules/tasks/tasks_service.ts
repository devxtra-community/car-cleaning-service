import { pool } from '../../database/connectDatabase';

interface TaskInput {
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_type: string;
  car_color: string;
  car_image_url: string | null;
  cleaner_id: string;
  amount_charged: number;
}

export const createTaskService = async (data: TaskInput) => {
  const result = await pool.query(
    `
    INSERT INTO tasks (
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url,
      cleaner_id,
      amount_charged
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      data.owner_name,
      data.owner_phone,
      data.car_number,
      data.car_model,
      data.car_type,
      data.car_color,
      data.car_image_url,
      data.cleaner_id,
      data.amount_charged,
    ]
  );

  return result.rows[0];
};
