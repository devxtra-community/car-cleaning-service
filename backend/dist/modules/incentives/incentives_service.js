"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyIncentiveSummary = exports.getDailyWorkRecordsWithIncentives = exports.recordDailyWork = exports.deleteIncentiveRule = exports.updateIncentiveRule = exports.getActiveIncentiveRules = exports.getIncentiveRulesByType = exports.getAllIncentiveRules = exports.createIncentiveRule = exports.deleteIncentiveType = exports.updateIncentiveType = exports.getActiveIncentiveTypes = exports.getAllIncentiveTypes = exports.createIncentiveType = void 0;
// src/services/incentives_service.ts
const connectDatabase_1 = require("../../database/connectDatabase");
/* ===================== INCENTIVE TYPES ===================== */
const createIncentiveType = async (data) => {
    const result = await connectDatabase_1.pool.query(`
    INSERT INTO incentive_types (name, category, calculation_type, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `, [data.name, data.category, data.calculation_type, data.description || null]);
    return result.rows[0];
};
exports.createIncentiveType = createIncentiveType;
const getAllIncentiveTypes = async () => {
    const result = await connectDatabase_1.pool.query(`
    SELECT * FROM incentive_types
    ORDER BY category, name
    `);
    return result.rows;
};
exports.getAllIncentiveTypes = getAllIncentiveTypes;
const getActiveIncentiveTypes = async () => {
    const result = await connectDatabase_1.pool.query(`
    SELECT * FROM incentive_types
    WHERE active = true
    ORDER BY category, name
    `);
    return result.rows;
};
exports.getActiveIncentiveTypes = getActiveIncentiveTypes;
const updateIncentiveType = async (id, data) => {
    const result = await connectDatabase_1.pool.query(`
    UPDATE incentive_types
    SET 
      name = COALESCE($2, name),
      category = COALESCE($3, category),
      calculation_type = COALESCE($4, calculation_type),
      description = COALESCE($5, description),
      active = COALESCE($6, active),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `, [
        id,
        data.name ?? null,
        data.category ?? null,
        data.calculation_type ?? null,
        data.description ?? null,
        data.active ?? null,
    ]);
    if (!result.rows.length) {
        throw new Error('INCENTIVE_TYPE_NOT_FOUND');
    }
    return result.rows[0];
};
exports.updateIncentiveType = updateIncentiveType;
const deleteIncentiveType = async (id) => {
    const result = await connectDatabase_1.pool.query(`DELETE FROM incentive_types WHERE id = $1`, [id]);
    if (!result.rowCount) {
        throw new Error('INCENTIVE_TYPE_NOT_FOUND');
    }
};
exports.deleteIncentiveType = deleteIncentiveType;
/* ===================== INCENTIVE RULES ===================== */
const createIncentiveRule = async (data) => {
    // Ensure criteria values are numbers
    const sanitizedCriteria = { ...data.criteria };
    // Convert string numbers to actual numbers in criteria
    Object.keys(sanitizedCriteria).forEach((key) => {
        const value = sanitizedCriteria[key];
        if (typeof value === 'string' && !isNaN(Number(value))) {
            sanitizedCriteria[key] = Number(value);
        }
    });
    const result = await connectDatabase_1.pool.query(`
    INSERT INTO incentive_rules 
    (incentive_type_id, rule_name, base_amount, criteria, priority)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `, [
        data.incentive_type_id,
        data.rule_name,
        Number(data.base_amount),
        JSON.stringify(sanitizedCriteria),
        data.priority || 0,
    ]);
    return result.rows[0];
};
exports.createIncentiveRule = createIncentiveRule;
const getAllIncentiveRules = async () => {
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      ir.*,
      it.name as incentive_type_name,
      it.category as incentive_category,
      it.calculation_type
    FROM incentive_rules ir
    JOIN incentive_types it ON ir.incentive_type_id = it.id
    ORDER BY it.category, ir.priority, ir.rule_name
    `);
    return result.rows;
};
exports.getAllIncentiveRules = getAllIncentiveRules;
const getIncentiveRulesByType = async (incentive_type_id) => {
    const result = await connectDatabase_1.pool.query(`
    SELECT * FROM incentive_rules
    WHERE incentive_type_id = $1 AND active = true
    ORDER BY priority, rule_name
    `, [incentive_type_id]);
    return result.rows;
};
exports.getIncentiveRulesByType = getIncentiveRulesByType;
const getActiveIncentiveRules = async () => {
    const result = await connectDatabase_1.pool.query(`
    SELECT 
      ir.*,
      it.name as incentive_type_name,
      it.category as incentive_category,
      it.calculation_type
    FROM incentive_rules ir
    JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE ir.active = true AND it.active = true
    ORDER BY it.category, ir.priority, ir.rule_name
    `);
    return result.rows;
};
exports.getActiveIncentiveRules = getActiveIncentiveRules;
const updateIncentiveRule = async (id, data) => {
    const result = await connectDatabase_1.pool.query(`
    UPDATE incentive_rules
    SET 
      rule_name = COALESCE($2, rule_name),
      base_amount = COALESCE($3, base_amount),
      criteria = COALESCE($4, criteria),
      priority = COALESCE($5, priority),
      active = COALESCE($6, active),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `, [
        id,
        data.rule_name ?? null,
        data.base_amount ?? null,
        data.criteria ? JSON.stringify(data.criteria) : null,
        data.priority ?? null,
        data.active ?? null,
    ]);
    if (!result.rows.length) {
        throw new Error('INCENTIVE_RULE_NOT_FOUND');
    }
    return result.rows[0];
};
exports.updateIncentiveRule = updateIncentiveRule;
const deleteIncentiveRule = async (id) => {
    const result = await connectDatabase_1.pool.query(`DELETE FROM incentive_rules WHERE id = $1`, [id]);
    if (!result.rowCount) {
        throw new Error('INCENTIVE_RULE_NOT_FOUND');
    }
};
exports.deleteIncentiveRule = deleteIncentiveRule;
/* ===================== INCENTIVE CALCULATION ===================== */
const calculatePerformanceIncentive = (tasksCompleted, rule) => {
    const target_tasks = rule.criteria['target_tasks'];
    const bonus_per_extra = rule.criteria['bonus_per_extra'];
    if (tasksCompleted < target_tasks) {
        return null;
    }
    const baseAmount = Number(rule.base_amount);
    const extraTasks = tasksCompleted - target_tasks;
    const bonusAmount = extraTasks > 0 ? extraTasks * bonus_per_extra : 0;
    return {
        amount: baseAmount + bonusAmount,
        details: {
            target_tasks,
            tasks_completed: tasksCompleted,
            base_incentive: baseAmount,
            bonus_incentive: bonusAmount,
            extra_tasks: extraTasks,
        },
    };
};
const calculateOvertimeIncentive = (hoursWorked, hourlyRate, rule) => {
    const multiplier = rule.criteria['multiplier'];
    const amount = hoursWorked * hourlyRate * multiplier;
    return {
        amount,
        details: {
            hours_worked: hoursWorked,
            hourly_rate: hourlyRate,
            multiplier,
            type: rule.criteria['applies_to'],
        },
    };
};
const calculateQualityIncentive = (rating, rules) => {
    for (const rule of rules) {
        const min_rating = rule.criteria['min_rating'];
        const max_rating = rule.criteria['max_rating'];
        if (rating >= min_rating && (!max_rating || rating <= max_rating)) {
            return {
                amount: rule.base_amount,
                details: {
                    rating,
                    min_rating,
                    max_rating: max_rating ?? 5.0,
                },
                rule_id: rule.id,
            };
        }
    }
    return null;
};
/* ===================== DAILY WORK ===================== */
const recordDailyWork = async (data) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        const workResult = await client.query(`
      INSERT INTO daily_work_records (
        cleaner_id, date, tasks_completed, hours_worked, 
        is_overtime, is_weekend, customer_rating, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (cleaner_id, date)
      DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        hours_worked = EXCLUDED.hours_worked,
        is_overtime = EXCLUDED.is_overtime,
        is_weekend = EXCLUDED.is_weekend,
        customer_rating = EXCLUDED.customer_rating,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
      `, [
            data.cleaner_id,
            data.date,
            data.tasks_completed,
            data.hours_worked || null,
            data.is_overtime || false,
            data.is_weekend || false,
            data.customer_rating || null,
            data.notes || null,
        ]);
        const workRecord = workResult.rows[0];
        await client.query(`DELETE FROM daily_incentive_breakdown WHERE daily_work_record_id = $1`, [
            workRecord.id,
        ]);
        const rulesResult = await client.query(`
      SELECT ir.*, it.category, it.calculation_type
      FROM incentive_rules ir
      JOIN incentive_types it ON ir.incentive_type_id = it.id
      WHERE ir.active = true AND it.active = true
      ORDER BY it.category, ir.priority
      `);
        const incentives = [];
        let totalIncentive = 0;
        for (const rule of rulesResult.rows) {
            let calculation = null;
            switch (rule.category) {
                case 'performance':
                    calculation = calculatePerformanceIncentive(data.tasks_completed, rule);
                    break;
                case 'overtime':
                    if (data.is_overtime && data.hours_worked && data.hourly_rate) {
                        const isWeekend = data.is_weekend || false;
                        const ruleAppliesTo = rule.criteria.applies_to;
                        if ((ruleAppliesTo === 'weekend' && isWeekend) ||
                            (ruleAppliesTo === 'weekday' && !isWeekend)) {
                            calculation = calculateOvertimeIncentive(data.hours_worked, data.hourly_rate, rule);
                        }
                    }
                    break;
                case 'quality':
                    if (data.customer_rating) {
                        const qualityRules = rulesResult.rows.filter((r) => r.incentive_category === 'quality' && r.incentive_type_id === rule.incentive_type_id);
                        const qualityCalc = calculateQualityIncentive(data.customer_rating, qualityRules);
                        if (qualityCalc && qualityCalc.rule_id === rule.id) {
                            calculation = {
                                amount: qualityCalc.amount,
                                details: qualityCalc.details,
                            };
                        }
                    }
                    break;
            }
            if (calculation && calculation.amount > 0) {
                await client.query(`
          INSERT INTO daily_incentive_breakdown 
          (daily_work_record_id, incentive_rule_id, amount, calculation_details)
          VALUES ($1, $2, $3, $4)
          `, [workRecord.id, rule.id, calculation.amount, JSON.stringify(calculation.details)]);
                incentives.push({
                    rule_name: rule.rule_name,
                    category: rule.category,
                    amount: calculation.amount,
                    calculation_details: calculation.details,
                });
                totalIncentive += calculation.amount;
            }
        }
        await client.query('COMMIT');
        return {
            work_record: workRecord,
            incentives,
            total_incentive: totalIncentive,
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
exports.recordDailyWork = recordDailyWork;
/* ===================== FETCH RECORDS ===================== */
const getDailyWorkRecordsWithIncentives = async (cleanerId, filters) => {
    let query = `
    SELECT 
      dwr.*,
      COALESCE(
        json_agg(
          json_build_object(
            'rule_name', ir.rule_name,
            'category', it.category,
            'amount', dib.amount,
            'details', dib.calculation_details
          )
        ) FILTER (WHERE dib.id IS NOT NULL),
        '[]'
      ) as incentives,
      COALESCE(SUM(dib.amount), 0)::float as total_incentive
    FROM daily_work_records dwr
    LEFT JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id
    LEFT JOIN incentive_rules ir ON dib.incentive_rule_id = ir.id
    LEFT JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE dwr.cleaner_id = $1
  `;
    const params = [cleanerId];
    let index = 2;
    if (filters?.startDate && filters?.endDate) {
        query += ` AND dwr.date BETWEEN $${index} AND $${index + 1}`;
        params.push(filters.startDate, filters.endDate);
        index += 2;
    }
    if (filters?.month) {
        const [year, month] = filters.month.split('-');
        query += ` AND EXTRACT(YEAR FROM dwr.date) = $${index}
               AND EXTRACT(MONTH FROM dwr.date) = $${index + 1}`;
        params.push(Number(year), Number(month));
    }
    query += `
    GROUP BY dwr.id
    ORDER BY dwr.date DESC
  `;
    const result = await connectDatabase_1.pool.query(query, params);
    return result.rows;
};
exports.getDailyWorkRecordsWithIncentives = getDailyWorkRecordsWithIncentives;
const getMonthlyIncentiveSummary = async (cleanerId, month) => {
    const [year, monthNum] = month.split('-');
    const result = await connectDatabase_1.pool.query(`
    SELECT
      dwr.cleaner_id,
      COUNT(DISTINCT dwr.id)::int AS total_days_worked,
      COALESCE(SUM(dwr.tasks_completed), 0)::int AS total_tasks_completed,
      COALESCE(SUM(dib.amount), 0)::float AS total_incentive_earned,
      ROUND(AVG(dwr.tasks_completed), 2)::float AS average_tasks_per_day,
      json_agg(
        DISTINCT jsonb_build_object(
          'category', it.category,
          'total', (
            SELECT COALESCE(SUM(dib2.amount), 0)
            FROM daily_incentive_breakdown dib2
            JOIN incentive_rules ir2 ON dib2.incentive_rule_id = ir2.id
            JOIN incentive_types it2 ON ir2.incentive_type_id = it2.id
            WHERE dib2.daily_work_record_id IN (
              SELECT id FROM daily_work_records
              WHERE cleaner_id = $1
                AND EXTRACT(YEAR FROM date) = $2
                AND EXTRACT(MONTH FROM date) = $3
            )
            AND it2.category = it.category
          )
        )
      ) FILTER (WHERE it.category IS NOT NULL) as incentive_by_category
    FROM daily_work_records dwr
    LEFT JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id
    LEFT JOIN incentive_rules ir ON dib.incentive_rule_id = ir.id
    LEFT JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE dwr.cleaner_id = $1
      AND EXTRACT(YEAR FROM dwr.date) = $2
      AND EXTRACT(MONTH FROM dwr.date) = $3
    GROUP BY dwr.cleaner_id
    `, [cleanerId, Number(year), Number(monthNum)]);
    return (result.rows[0] || {
        cleaner_id: cleanerId,
        month,
        total_days_worked: 0,
        total_tasks_completed: 0,
        total_incentive_earned: 0,
        average_tasks_per_day: 0,
        incentive_by_category: [],
    });
};
exports.getMonthlyIncentiveSummary = getMonthlyIncentiveSummary;
