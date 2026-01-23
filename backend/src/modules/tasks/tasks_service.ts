import { pool } from '../../database/connectDatabase';

/** ✅ Task Insert Payload Type */
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

/** ✅ Task Row Type (matches DB result) */
export interface TaskRow {
  id: string;
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_type: string;
  car_color: string;
  car_image_url: string | null;
  car_image_key: string | null;
  worker_id: string;
  status: string;
  created_at: Date;
  completed_at: Date | null;
}

export const createTaskService = async (data: CreateTaskPayload): Promise<TaskRow> => {
  const result = await pool.query<TaskRow>(
    `
    INSERT INTO tasks
    (owner_name, owner_phone, car_number, car_model, car_type, car_color, car_image_url, car_image_key, worker_id)
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      data.owner_name,
      data.owner_phone,
      data.car_number,
      data.car_model,
      data.car_type,
      data.car_color,
      data.car_image_url ?? null,
      data.car_image_key ?? null,
      data.worker_id,
    ]
  );

  return result.rows[0];
};

export const completeTaskService = async (
  taskId: string,
  workerId: string
): Promise<TaskRow | undefined> => {
  const result = await pool.query<TaskRow>(
    `
    UPDATE tasks
    SET status='completed',
        completed_at = NOW()
    WHERE id=$1 AND worker_id=$2
    RETURNING *
    `,
    [taskId, workerId]
  );

  return result.rows[0];
};

export const getMyTasksService = async (workerId: string): Promise<TaskRow[]> => {
  const result = await pool.query<TaskRow>(
    `SELECT * FROM tasks WHERE worker_id=$1 ORDER BY created_at DESC`,
    [workerId]
  );

  return result.rows;
};
