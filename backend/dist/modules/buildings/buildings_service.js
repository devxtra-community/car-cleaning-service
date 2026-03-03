"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBuildingsWithStats = exports.deleteBuilding = exports.updateBuilding = exports.getBuildingDetails = exports.getBuildingById = exports.getAllBuildings = exports.createBuilding = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
const createBuilding = async (data) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        const buildingQuery = `
      INSERT INTO buildings
      (building_name, location, latitude, longitude, radius)
    VALUES($1, $2, $3, $4, $5)
    RETURNING *;
    `;
        const buildingResult = await client.query(buildingQuery, [
            data.building_name,
            data.location,
            data.latitude,
            data.longitude,
            data.radius || 100,
        ]);
        const building = buildingResult.rows[0];
        const floors = [];
        if (data.floors?.length) {
            for (const floor of data.floors) {
                const floorQuery = `
          INSERT INTO floors(
      building_id,
      floor_number,
      floor_name,
      notes
    )
    VALUES($1, $2, $3, $4)
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
        ) FILTER(WHERE f.id IS NOT NULL),
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
        ) FILTER(WHERE f.id IS NOT NULL),
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
// Get building details with comprehensive statistics
const getBuildingDetails = async (id) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        // Get building basic info with floors
        const buildingQuery = `
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
        ) FILTER(WHERE f.id IS NOT NULL),
        '[]'
      ) AS floors
      FROM buildings b
      LEFT JOIN floors f ON b.id = f.building_id
      WHERE b.id = $1
      GROUP BY b.id;
    `;
        const buildingResult = await client.query(buildingQuery, [id]);
        if (buildingResult.rows.length === 0) {
            return null;
        }
        const building = buildingResult.rows[0];
        // Get supervisor information
        const supervisorQuery = `
    SELECT
    s.id,
      u.full_name,
      u.email,
      u.phone,
      u.profile_image
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
      WHERE s.building_id = $1
      LIMIT 1;
    `;
        const supervisorResult = await client.query(supervisorQuery, [id]);
        // Get total employees (cleaners + supervisors)
        const employeesQuery = `
    SELECT
    COUNT(DISTINCT c.id) as cleaner_count,
      COUNT(DISTINCT s.id) as supervisor_count
      FROM buildings b
      LEFT JOIN cleaners c ON c.building_id = b.id
      LEFT JOIN supervisors s ON s.building_id = b.id
      WHERE b.id = $1;
    `;
        const employeesResult = await client.query(employeesQuery, [id]);
        // Get revenue statistics (from completed tasks)
        const revenueQuery = `
    SELECT
    COUNT(t.id) as total_tasks,
      COALESCE(SUM(t.final_price), 0) as total_revenue,
      COALESCE(SUM(t.task_amount), 0) as total_task_amount
      FROM tasks t
      WHERE t.building_id = $1 AND t.status = 'completed';
    `;
        const revenueResult = await client.query(revenueQuery, [id]);
        // Get cleaners list for this building
        const cleanersQuery = `
    SELECT
    c.id,
      u.full_name,
      u.email,
      u.phone,
      u.profile_image,
      f.floor_name,
      COUNT(t.id) as total_tasks
      FROM cleaners c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN floors f ON c.floor_id = f.id
      LEFT JOIN tasks t ON t.cleaner_id = c.id AND t.status = 'completed'
      WHERE c.building_id = $1
      GROUP BY c.id, u.full_name, u.email, u.phone, u.profile_image, f.floor_name
      ORDER BY u.full_name;
    `;
        const cleanersResult = await client.query(cleanersQuery, [id]);
        // Get monthly revenue trend (last 6 months)
        const trendQuery = `
    SELECT
    TO_CHAR(DATE_TRUNC('month', t.completed_at), 'Mon YYYY') as month,
      COALESCE(SUM(t.final_price), 0) as revenue
      FROM tasks t
      WHERE t.building_id = $1 
        AND t.status = 'completed'
        AND t.completed_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', t.completed_at)
      ORDER BY DATE_TRUNC('month', t.completed_at) DESC;
    `;
        const trendResult = await client.query(trendQuery, [id]);
        const employees = employeesResult.rows[0];
        const revenue = revenueResult.rows[0];
        return {
            ...building,
            supervisor: supervisorResult.rows[0] || null,
            statistics: {
                totalEmployees: parseInt(employees.cleaner_count) + parseInt(employees.supervisor_count),
                totalCleaners: parseInt(employees.cleaner_count),
                totalSupervisors: parseInt(employees.supervisor_count),
                totalTasks: parseInt(revenue.total_tasks),
                totalRevenue: parseFloat(revenue.total_revenue),
                totalTaskAmount: parseFloat(revenue.total_task_amount),
            },
            cleaners: cleanersResult.rows,
            revenueTrend: trendResult.rows,
        };
    }
    finally {
        client.release();
    }
};
exports.getBuildingDetails = getBuildingDetails;
// Update building
const updateBuilding = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;
    if (data.building_name !== undefined) {
        fields.push(`building_name = $${paramCount++} `);
        values.push(data.building_name);
    }
    if (data.location !== undefined) {
        fields.push(`location = $${paramCount++} `);
        values.push(data.location);
    }
    if (data.latitude !== undefined) {
        fields.push(`latitude = $${paramCount++} `);
        values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
        fields.push(`longitude = $${paramCount++} `);
        values.push(data.longitude);
    }
    if (data.radius !== undefined) {
        fields.push(`radius = $${paramCount++} `);
        values.push(data.radius);
    }
    if (fields.length === 0) {
        throw new Error('No fields to update');
    }
    values.push(id);
    const query = `
    UPDATE buildings
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *;
    `;
    const { rows } = await connectDatabase_1.pool.query(query, values);
    return rows[0];
};
exports.updateBuilding = updateBuilding;
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
// Get all buildings with revenue statistics
const getAllBuildingsWithStats = async () => {
    const query = `
    SELECT
    b.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', f.id,
            'floor_number', f.floor_number,
            'floor_name', f.floor_name
          )
          ORDER BY f.floor_number
        ) FILTER(WHERE f.id IS NOT NULL),
        '[]'
      ) AS floors,
        COUNT(DISTINCT c.id) as total_cleaners,
        COUNT(DISTINCT s.id) as total_supervisors,
        COALESCE(SUM(t.final_price), 0) as total_revenue
    FROM buildings b
    LEFT JOIN floors f ON b.id = f.building_id
    LEFT JOIN cleaners c ON c.building_id = b.id
    LEFT JOIN supervisors s ON s.building_id = b.id
    LEFT JOIN tasks t ON t.building_id = b.id AND t.status = 'completed'
    GROUP BY b.id
    ORDER BY b.created_at DESC;
    `;
    const { rows } = await connectDatabase_1.pool.query(query);
    return rows;
};
exports.getAllBuildingsWithStats = getAllBuildingsWithStats;
