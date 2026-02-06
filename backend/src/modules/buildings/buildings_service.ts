import { pool } from '../../database/connectDatabase';

export const getAllBuildings = async () => {
  const result = await pool.query('SELECT * FROM buildings ORDER BY building_name ASC');
  return result.rows;
};

export const getBuildingById = async (id: string) => {
  const result = await pool.query('SELECT * FROM buildings WHERE id = $1', [id]);
  return result.rows[0];
};

export const createBuilding = async (data: {
  building_id: string;
  building_name: string;
  location?: string;
}) => {
  const { building_id, building_name, location } = data;

  const result = await pool.query(
    `INSERT INTO buildings (building_id, building_name, location)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [building_id, building_name, location]
  );

  return result.rows[0];
};

export const updateBuilding = async (
  id: string,
  data: {
    building_id?: string;
    building_name?: string;
    location?: string;
  }
) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);

  const result = await pool.query(
    `UPDATE buildings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0];
};

export const deleteBuilding = async (id: string) => {
  const result = await pool.query('DELETE FROM buildings WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
