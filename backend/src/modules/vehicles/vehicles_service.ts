import { pool } from '../../database/connectDatabase';

interface VehicleInput {
  type: string;
  brand: string;
  model: string;
  price_min: number;
  price_max: number;
  created_by: string;
}

export const createVehicleService = async (data: VehicleInput) => {
  const result = await pool.query(
    `
    INSERT INTO vehicles (
      type,
      brand,
      model,
      price_min,
      price_max,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [data.type, data.brand, data.model, data.price_min, data.price_max, data.created_by]
  );

  return result.rows[0];
};

export const getAllVehiclesService = async () => {
  const result = await pool.query(
    `
    SELECT id, type, price_min, price_max
    FROM vehicles
    
    `
  );

  return result.rows;
};
