"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMilestoneIncentives = exports.updateDailyWorkRecord = exports.createTaskService = void 0;
// src/services/tasks/tasks_service.ts
const connectDatabase_1 = require("../../database/connectDatabase");
// Calculate distance between two GPS coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};
const createTaskService = async (data) => {
    // GPS validation if coordinates provided
    if (data.latitude !== undefined && data.longitude !== undefined) {
        // Get worker's building location
        const buildingQuery = `
      SELECT b.latitude, b.longitude, b.radius, b.building_name
      FROM cleaners c
      JOIN buildings b ON c.building_id = b.id
      WHERE c.id = $1
    `;
        const buildingResult = await connectDatabase_1.pool.query(buildingQuery, [data.cleaner_id]);
        if (buildingResult.rows.length === 0) {
            throw new Error('No building assigned to worker');
        }
        const building = buildingResult.rows[0];
        if (!building.latitude || !building.longitude) {
            throw new Error('Building does not have GPS coordinates set');
        }
        // Calculate distance
        const distance = calculateDistance(building.latitude, building.longitude, data.latitude, data.longitude);
        // Check if within radius (default 100m)
        const allowedRadius = building.radius || 100;
        if (distance > allowedRadius) {
            throw new Error();
            // You must be within ${allowedRadius}m of ${building.building_name} to create tasks. Current distance: ${Math.round(distance)}m
        }
    }
    const result = await connectDatabase_1.pool.query(`
    INSERT INTO tasks (
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url,
      cleaner_id,
      task_amount
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `, [
        data.owner_name,
        data.owner_phone,
        data.car_number,
        data.car_model,
        data.car_type,
        data.car_color,
        data.car_image_url,
        data.cleaner_id,
        data.task_amount,
    ]);
    return result.rows[0];
};
exports.createTaskService = createTaskService;
// src/modules/tasks/tasks_service.ts
// Find this function and replace it:
const calculatePerformanceIncentive = (tasksCompleted, rule
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) => {
    // Parse criteria values as numbers to avoid string concatenation
    const targetTasks = Number(rule.criteria.target_tasks);
    const bonusPerExtra = Number(rule.criteria.bonus_per_extra);
    const baseAmount = Number(rule.base_amount);
    if (tasksCompleted < targetTasks) {
        return null; // Didn't meet target
    }
    const extraTasks = tasksCompleted - targetTasks;
    const bonusAmount = extraTasks > 0 ? extraTasks * bonusPerExtra : 0;
    const totalAmount = baseAmount + bonusAmount; // This will now correctly add numbers
    return {
        amount: totalAmount,
        details: {
            target_tasks: targetTasks,
            tasks_completed: tasksCompleted,
            base_incentive: baseAmount, // Now a number
            bonus_incentive: bonusAmount, // Now a number
            extra_tasks: extraTasks,
        },
    };
};
// Calculate milestone incentive
const calculateMilestoneIncentive = (totalTasks, rule
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) => {
    const { total_tasks } = rule.criteria;
    if (total_tasks && totalTasks === total_tasks) {
        return {
            amount: rule.base_amount,
            details: {
                milestone: `${total_tasks} tasks completed`,
                total_tasks: totalTasks,
            },
        };
    }
    return null;
};
const updateDailyWorkRecord = async (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
client, cleanerId, tasksCompletedToday, todayDate) => {
    // Get all active performance rules
    const rulesRes = await client.query(`
    SELECT 
      ir.id,
      ir.incentive_type_id,
      ir.rule_name,
      ir.base_amount,
      ir.criteria,
      ir.priority,
      it.category
    FROM incentive_rules ir
    JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE ir.active = true 
      AND it.active = true
      AND it.category = 'performance'
    ORDER BY ir.priority
    `);
    let totalIncentive = 0;
    const incentivesEarned = [];
    // Check if daily work record exists
    const existingRecord = await client.query(`
    SELECT id FROM daily_work_records
    WHERE cleaner_id = $1 AND date = $2
    `, [cleanerId, todayDate]);
    let workRecordId;
    if (existingRecord.rows.length > 0) {
        // Update existing record
        workRecordId = existingRecord.rows[0].id;
        await client.query(`
      UPDATE daily_work_records
      SET tasks_completed = $1,
          updated_at = NOW()
      WHERE id = $2
      `, [tasksCompletedToday, workRecordId]);
        // Delete old incentive breakdown
        await client.query(`
      DELETE FROM daily_incentive_breakdown
      WHERE daily_work_record_id = $1
      `, [workRecordId]);
    }
    else {
        // Create new record
        const newRecord = await client.query(`
      INSERT INTO daily_work_records (cleaner_id, date, tasks_completed)
      VALUES ($1, $2, $3)
      RETURNING id
      `, [cleanerId, todayDate, tasksCompletedToday]);
        workRecordId = newRecord.rows[0].id;
    }
    // Calculate incentives for each rule
    for (const rule of rulesRes.rows) {
        const calculation = calculatePerformanceIncentive(tasksCompletedToday, rule);
        if (calculation) {
            // Record in daily_incentive_breakdown
            await client.query(`
        INSERT INTO daily_incentive_breakdown (
          daily_work_record_id,
          incentive_rule_id,
          amount,
          calculation_details
        )
        VALUES ($1, $2, $3, $4)
        `, [workRecordId, rule.id, calculation.amount, JSON.stringify(calculation.details)]);
            totalIncentive += calculation.amount;
            incentivesEarned.push({
                rule_name: rule.rule_name,
                category: rule.category,
                amount: calculation.amount,
                details: calculation.details,
            });
        }
    }
    return {
        incentivesEarned,
        totalIncentive,
    };
};
exports.updateDailyWorkRecord = updateDailyWorkRecord;
const checkMilestoneIncentives = async (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
client, cleanerId, totalTasks) => {
    // Get all active milestone rules
    const rulesRes = await client.query(`
    SELECT 
      ir.id,
      ir.rule_name,
      ir.base_amount,
      ir.criteria
    FROM incentive_rules ir
    JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE ir.active = true 
      AND it.active = true
      AND it.category = 'milestone'
    ORDER BY ir.priority
    `);
    const milestonesEarned = [];
    for (const rule of rulesRes.rows) {
        const calculation = calculateMilestoneIncentive(totalTasks, rule);
        if (calculation) {
            // Check if milestone already awarded
            const existing = await client.query(`
        SELECT id FROM milestone_achievements
        WHERE cleaner_id = $1 AND incentive_rule_id = $2
        `, [cleanerId, rule.id]);
            if (existing.rows.length === 0) {
                // Award milestone
                await client.query(`
          INSERT INTO milestone_achievements (
            cleaner_id,
            incentive_rule_id,
            amount,
            achievement_details,
            achieved_at
          )
          VALUES ($1, $2, $3, $4, NOW())
          `, [cleanerId, rule.id, calculation.amount, JSON.stringify(calculation.details)]);
                milestonesEarned.push({
                    rule_name: rule.rule_name,
                    amount: calculation.amount,
                    details: calculation.details,
                });
            }
        }
    }
    return milestonesEarned;
};
exports.checkMilestoneIncentives = checkMilestoneIncentives;
