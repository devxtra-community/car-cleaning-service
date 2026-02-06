import { pool } from '../../database/connectDatabase';

interface VehicleInput {
  type: string;
  brand: string;
  model: string;
  base_price: number;
  created_by: string;
}

/* CREATE */

export const createVehicleService = async (data: VehicleInput) => {
  const result = await pool.query(
    `
    INSERT INTO vehicles (type,brand,model,base_price,created_by)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [data.type, data.brand, data.model, data.base_price, data.created_by]
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
        brand=$2,
        model=$3,
        base_price=$4,
        updated_at=NOW()
    WHERE id=$5
    RETURNING *
    `,
    [data.type, data.brand, data.model, data.base_price, id]
  );

  return result.rows[0];
};

/* DELETE */

export const deleteVehicleService = async (id: string) => {
  await pool.query(`DELETE FROM vehicles WHERE id=$1`, [id]);
};
