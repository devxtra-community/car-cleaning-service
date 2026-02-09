import { pool } from '../../database/connectDatabase';

export interface CreateTaskPayload {
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_type: string;
  car_color: string;
  car_image_url?: string | null;
  car_image_key?: string | null;
  worker_id: string;
}

export interface TaskRow {
  id: string;
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_type: string;
  car_color: string;
  car_image_url?: string | null;
  car_image_key?: string | null;
  worker_id: string;
  created_at?: string;
  completed_at?: string;
}

interface TaskInput {
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_type: string;
  car_color: string;
  car_location?: string | null;
  car_image_url: string | null;
  cleaner_id: string;
  task_amount: number;
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
      car_location,
      car_image_url,
      cleaner_id,
      task_amount
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
    `,
    [
      data.owner_name,
      data.owner_phone,
      data.car_number,
      data.car_model,
      data.car_type,
      data.car_color,
      data.car_location || null,
      data.car_image_url,
      data.cleaner_id,
      data.task_amount,
    ]
  );

  return result.rows[0];
};
