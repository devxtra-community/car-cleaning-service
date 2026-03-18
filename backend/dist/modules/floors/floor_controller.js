"use strict";
// ============================================
// FLOORS CONTROLLER
// Add this to your floors controller or create a new one
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFloors = exports.getFloorsByBuilding = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
/**
 * Get all floors for a specific building
 * Route: GET /api/buildings/:buildingId/floors
 */
const getFloorsByBuilding = async (req, res) => {
    try {
        const { buildingId } = req.params;
        if (!buildingId) {
            return res.status(400).json({
                success: false,
                message: 'Building ID is required',
            });
        }
        const result = await connectDatabase_1.pool.query(`
      SELECT 
        id,
        floor_number,
        building_id,
        created_at
      FROM floors
      WHERE building_id = $1
      ORDER BY floor_number ASC
      `, [buildingId]);
        return res.status(200).json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        console.error('Error fetching floors:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch floors',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
};
exports.getFloorsByBuilding = getFloorsByBuilding;
/**
 * Alternative: Get all floors with optional building filter
 * Route: GET /api/floors?building_id=xxx
 */
const getAllFloors = async (req, res) => {
    try {
        const { building_id } = req.query;
        let query = `
      SELECT 
        f.id,
        f.floor_number,
        f.building_id,
        f.created_at,
        b.building_name
      FROM floors f
      LEFT JOIN buildings b ON f.building_id = b.id
    `;
        const params = [];
        const buildingIdValue = typeof building_id === 'string'
            ? building_id
            : Array.isArray(building_id)
                ? building_id[0]
                : null;
        if (typeof buildingIdValue === 'string') {
            query += ` WHERE f.building_id = $1`;
            params.push(buildingIdValue);
        }
        query += ` ORDER BY b.building_name, f.floor_number ASC`;
        const result = await connectDatabase_1.pool.query(query, params);
        return res.status(200).json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        console.error('Error fetching floors:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch floors',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
};
exports.getAllFloors = getAllFloors;
