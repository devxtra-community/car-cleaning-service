"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehiclePricingByType = void 0;
const connectDatabase_1 = require("../../database/connectDatabase");
/* ================= GET VEHICLE PRICING BY TYPE ================= */
const getVehiclePricingByType = async (req, res) => {
    try {
        const { type } = req.params;
        const result = await connectDatabase_1.pool.query(`
      SELECT 
        type,
        base_price,
        premium_price,
        wash_time
      FROM vehicles
      WHERE type = $1 AND status = 'Active'
      LIMIT 1
      `, [type]);
        if (!result.rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle type not found or inactive',
            });
        }
        return res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (err) {
        console.error('GET VEHICLE PRICING ERROR:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch vehicle pricing',
        });
    }
};
exports.getVehiclePricingByType = getVehiclePricingByType;
