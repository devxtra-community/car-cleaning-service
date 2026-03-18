"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicleService = exports.updateVehicleService = exports.getVehicleByIdService = exports.getAllVehiclesService = exports.createVehicleService = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
/* CREATE */
const createVehicleService = async (data) => {
    const status = data.status || 'Active';
    const result = await connectDatabase_1.pool.query(`
    INSERT INTO vehicles (type, category, size, base_price, premium_price, wash_time, status, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `, [data.type, data.category, data.size, data.base_price, data.premium_price, data.wash_time, status, data.created_by]);
    return result.rows[0];
};
exports.createVehicleService = createVehicleService;
/* GET ALL */
const getAllVehiclesService = async () => {
    const result = await connectDatabase_1.pool.query(`
    SELECT *
    FROM vehicles
    ORDER BY created_at DESC
    `);
    return result.rows;
};
exports.getAllVehiclesService = getAllVehiclesService;
/* GET ONE */
const getVehicleByIdService = async (id) => {
    const result = await connectDatabase_1.pool.query(`SELECT * FROM vehicles WHERE id=$1`, [id]);
    return result.rows[0];
};
exports.getVehicleByIdService = getVehicleByIdService;
/* UPDATE */
const updateVehicleService = async (id, data) => {
    const result = await connectDatabase_1.pool.query(`
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
    `, [data.type, data.category, data.size, data.base_price, data.premium_price, data.wash_time, data.status, id]);
    return result.rows[0];
};
exports.updateVehicleService = updateVehicleService;
/* DELETE */
const deleteVehicleService = async (id) => {
    await connectDatabase_1.pool.query(`DELETE FROM vehicles WHERE id=$1`, [id]);
};
exports.deleteVehicleService = deleteVehicleService;
