"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanySummaryController = exports.getReconciliationController = void 0;
const reconciliation_service_1 = require("./reconciliation_service");
const getReconciliationController = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const result = await (0, reconciliation_service_1.getBuildingReconciliation)(cycleId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};
exports.getReconciliationController = getReconciliationController;
const getCompanySummaryController = async (req, res) => {
    try {
        const { cycleId } = req.params;
        const result = await (0, reconciliation_service_1.getCompanyReconciliationSummary)(cycleId);
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Something went wrong',
        });
    }
};
exports.getCompanySummaryController = getCompanySummaryController;
