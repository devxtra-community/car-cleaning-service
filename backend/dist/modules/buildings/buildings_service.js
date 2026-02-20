"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBuilding = exports.getBuildingById = exports.getAllBuildings = exports.createBuilding = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const createBuilding = async (data) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        const buildingQuery = `
  INSERT INTO buildings 
  (building_name, location, latitude, longitude, radius)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *;
`;
        const buildingResult = await client.query(buildingQuery, [
            data.building_name,
            data.location, // Human readable address
            data.latitude,
            data.longitude,
            data.radius || 100,
        ]);
        const building = buildingResult.rows[0];
        const floors = [];
        if (data.floors?.length) {
            for (const floor of data.floors) {
                const floorQuery = `
          INSERT INTO floors (
            building_id,
            floor_number,
            floor_name,
            notes
          )
          VALUES ($1, $2, $3, $4)
          RETURNING *;
        `;
                const floorResult = await client.query(floorQuery, [
                    building.id,
                    floor.floor_number,
                    floor.floor_name,
                    floor.notes || null,
                ]);
                floors.push(floorResult.rows[0]);
            }
        }
        await client.query('COMMIT');
        return {
            ...building,
            floors,
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.createBuilding = createBuilding;
// Get all buildings with their floors
const getAllBuildings = async () => {
    const query = `
    SELECT 
      b.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', f.id,
            'floor_number', f.floor_number,
            'floor_name', f.floor_name,
            'notes', f.notes,
            'created_at', f.created_at
          )
          ORDER BY f.floor_number
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) AS floors
    FROM buildings b
    LEFT JOIN floors f ON b.id = f.building_id
    GROUP BY b.id
    ORDER BY b.created_at DESC;
  `;
    const { rows } = await connectDatabase_1.pool.query(query);
    return rows;
};
exports.getAllBuildings = getAllBuildings;
// Get building by ID with floors
const getBuildingById = async (id) => {
    const query = `
    SELECT 
      b.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', f.id,
            'floor_number', f.floor_number,
            'floor_name', f.floor_name,
            'notes', f.notes,
            'created_at', f.created_at
          )
          ORDER BY f.floor_number
        ) FILTER (WHERE f.id IS NOT NULL),
        '[]'
      ) AS floors
    FROM buildings b
    LEFT JOIN floors f ON b.id = f.building_id
    WHERE b.id = $1
    GROUP BY b.id;
  `;
    const { rows } = await connectDatabase_1.pool.query(query, [id]);
    return rows[0];
};
exports.getBuildingById = getBuildingById;
// Delete building (cascades to floors with ON DELETE CASCADE)
const deleteBuilding = async (id) => {
    const query = `
    DELETE FROM buildings
    WHERE id = $1
    RETURNING *;
  `;
    const { rows } = await connectDatabase_1.pool.query(query, [id]);
    return rows[0];
};
exports.deleteBuilding = deleteBuilding;
