import { pool } from '../../database/connectDatabase';

interface VehicleInput {
  type: string;
  category: string;
  size: string;
  base_price: number;
  premium_price: number;
  wash_time: number;
  status?: string;
  created_by: string;
}

/* CREATE */

export const createVehicleService = async (data: VehicleInput) => {
  const status = data.status || 'Active';
  const result = await pool.query(
    `
    INSERT INTO vehicles (type, category, size, base_price, premium_price, wash_time, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [data.type, data.category, data.size, data.base_price, data.premium_price, data.wash_time, status, data.created_by]
  );

  return result.rows[0];
};

/* GET ALL */

export const getAllVehiclesService = async () => {
  const result = await pool.query(
    `
    SELECT *
    FROM vehicles
    ORDER BY created_at DESC
    `
  );

  return result.rows;
};

/* GET ONE */

export const getVehicleByIdService = async (id: string) => {
  const result = await pool.query(`SELECT * FROM vehicles WHERE id=$1`, [id]);

  return result.rows[0];
};

/* UPDATE */

export const updateVehicleService = async (id: string, data: Partial<VehicleInput>) => {
  const result = await pool.query(
    `
    UPDATE vehicles
    SET type=$1,
        category=$2,
        size=$3,
        base_price=$4,
        premium_price=$5,
        wash_time=$6,
        status=$7,
        updated_at=NOW()
    WHERE id=$8
    RETURNING *
    `,
    [data.type, data.category, data.size, data.base_price, data.premium_price, data.wash_time, data.status, id]
  );

  return result.rows[0];
};

/* DELETE */

export const deleteVehicleService = async (id: string) => {
  await pool.query(`DELETE FROM vehicles WHERE id=$1`, [id]);
};
