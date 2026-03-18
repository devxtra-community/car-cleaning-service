import { pool } from '../../database/connectDatabase';
import { AppError } from '../../middlewares/error-handler';

// ============================================================
// TYPES
// ============================================================

export interface CreateFloorData {
  floor_number: number;
  floor_name: string;
  notes?: string;
}

export interface UpdateFloorData {
  floor_number?: number;
  floor_name?: string;
  notes?: string;
}

// ============================================================
// CREATE — add a floor to an existing building
// ============================================================

export const createFloorService = async (buildingId: string, data: CreateFloorData) => {
  const building = await pool.query(`SELECT id FROM buildings WHERE id = $1`, [buildingId]);
  if (!building.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');

  // Guard: floor_number must be unique within the building
  const duplicate = await pool.query(
    `SELECT id FROM floors WHERE building_id = $1 AND floor_number = $2`,
    [buildingId, data.floor_number]
  );
  if (duplicate.rows.length) {
    throw new AppError(
      `Floor number ${data.floor_number} already exists in this building`,
      409,
      'FLOOR_NUMBER_DUPLICATE'
    );
  }

  const result = await pool.query(
    `INSERT INTO floors (building_id, floor_number, floor_name, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [buildingId, data.floor_number, data.floor_name, data.notes ?? null]
  );
  return result.rows[0];
};

// ============================================================
// READ — all floors for a building
// ============================================================

export const getFloorsByBuildingService = async (buildingId: string) => {
  const building = await pool.query(`SELECT id FROM buildings WHERE id = $1`, [buildingId]);
  if (!building.rows.length) throw new AppError('Building not found', 404, 'BUILDING_NOT_FOUND');

  const result = await pool.query(
    `SELECT id, building_id, floor_number, floor_name, notes, created_at
     FROM floors
     WHERE building_id = $1
     ORDER BY floor_number ASC`,
    [buildingId]
  );
  return result.rows;
};

// ============================================================
// UPDATE — edit a floor
// ============================================================

export const updateFloorService = async (
  buildingId: string,
  floorId: string,
  data: UpdateFloorData
) => {
  // Confirm floor belongs to this building
  const existing = await pool.query(
    `SELECT id, floor_number FROM floors WHERE id = $1 AND building_id = $2`,
    [floorId, buildingId]
  );
  if (!existing.rows.length) {
    throw new AppError(
      'Floor not found or does not belong to this building',
      404,
      'FLOOR_NOT_FOUND'
    );
  }

  // Guard: if floor_number is changing, make sure it's not taken
  if (data.floor_number !== undefined && data.floor_number !== existing.rows[0].floor_number) {
    const duplicate = await pool.query(
      `SELECT id FROM floors WHERE building_id = $1 AND floor_number = $2 AND id != $3`,
      [buildingId, data.floor_number, floorId]
    );
    if (duplicate.rows.length) {
      throw new AppError(
        `Floor number ${data.floor_number} already exists in this building`,
        409,
        'FLOOR_NUMBER_DUPLICATE'
      );
    }
  }

  const fields: string[] = [];
  const values: (string | number)[] = [];
  let p = 1;

  if (data.floor_number !== undefined) {
    fields.push(`floor_number = $${p++}`);
    values.push(data.floor_number);
  }
  if (data.floor_name !== undefined) {
    fields.push(`floor_name = $${p++}`);
    values.push(data.floor_name);
  }
  if (data.notes !== undefined) {
    fields.push(`notes = $${p++}`);
    values.push(data.notes);
  }

  if (!fields.length)
    throw new AppError('No fields provided to update', 400, 'NO_FIELDS_TO_UPDATE');

  values.push(floorId);
  const result = await pool.query(
    `UPDATE floors SET ${fields.join(', ')} WHERE id = $${p} RETURNING *`,
    values
  );
  return result.rows[0];
};

// ============================================================
// DELETE — remove a floor
// Guards: cannot delete if cleaners are assigned to this floor
// ============================================================

export const deleteFloorService = async (buildingId: string, floorId: string) => {
  // Confirm floor belongs to this building
  const existing = await pool.query(`SELECT id FROM floors WHERE id = $1 AND building_id = $2`, [
    floorId,
    buildingId,
  ]);
  if (!existing.rows.length) {
    throw new AppError(
      'Floor not found or does not belong to this building',
      404,
      'FLOOR_NOT_FOUND'
    );
  }

  // Block deletion if cleaners are still assigned to this floor
  const cleaners = await pool.query(`SELECT id FROM cleaners WHERE floor_id = $1 LIMIT 1`, [
    floorId,
  ]);
  if (cleaners.rows.length) {
    throw new AppError(
      'Cannot delete floor — cleaners are still assigned to it. Reassign them first.',
      409,
      'FLOOR_HAS_CLEANERS'
    );
  }

  const result = await pool.query(`DELETE FROM floors WHERE id = $1 RETURNING *`, [floorId]);
  return result.rows[0];
};
