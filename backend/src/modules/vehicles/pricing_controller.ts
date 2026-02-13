import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';

/* ================= GET VEHICLE PRICING BY TYPE ================= */

export const getVehiclePricingByType = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.params;

    const result = await pool.query(
      `
      SELECT 
        type,
        base_price,
        premium_price,
        wash_time
      FROM vehicles
      WHERE type = $1 AND status = 'Active'
      LIMIT 1
      `,
      [type]
    );

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
  } catch (err) {
    console.error('GET VEHICLE PRICING ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle pricing',
    });
  }
};
