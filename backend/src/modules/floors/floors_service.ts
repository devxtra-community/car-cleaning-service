import { pool } from '../../database/connectDatabase';

export interface Floor {
  id: string;
  building_id: string;
  floor_name: string;
  created_at: Date;
}

export const getFloorsByBuilding = async (buildingId: string) => {
  const result = await pool.query(
    'SELECT * FROM floors WHERE building_id = $1 ORDER BY floor_name ASC',
    [buildingId]
  );
  return result.rows;
};

export const createFloor = async (buildingId: string, floorName: string) => {
  const result = await pool.query(
    'INSERT INTO floors (building_id, floor_name) VALUES ($1, $2) RETURNING *',
    [buildingId, floorName]
  );
  return result.rows[0];
};

export const updateFloor = async (id: string, floorName: string) => {
  const result = await pool.query('UPDATE floors SET floor_name = $1 WHERE id = $2 RETURNING *', [
    floorName,
    id,
  ]);
  return result.rows[0];
};

export const deleteFloor = async (id: string) => {
  const result = await pool.query('DELETE FROM floors WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
};
