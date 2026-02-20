"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVehicle = exports.updateVehicle = exports.getVehicleById = exports.getVehicles = exports.createVehicle = void 0;
const vehicles_service_1 = require("./vehicles_service");
/* CREATE */
const createVehicle = async (req, res) => {
    try {
        const { type, category, size, base_price, premium_price, wash_time, status } = req.body;
        // Validation
        if (!type || !category || !size || !base_price || !premium_price || !wash_time) {
            return res.status(400).json({
                message: 'Missing required fields: type, category, size, base_price, premium_price, wash_time'
            });
        }
        const vehicle = await (0, vehicles_service_1.createVehicleService)({
            type,
            category,
            size,
            base_price: Number(base_price),
            premium_price: Number(premium_price),
            wash_time: Number(wash_time),
            status: status || 'Active',
            created_by: req.user?.userId || '',
        });
        res.status(201).json(vehicle);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Create vehicle failed' });
    }
};
exports.createVehicle = createVehicle;
/* GET ALL */
const getVehicles = async (_req, res) => {
    try {
        const vehicles = await (0, vehicles_service_1.getAllVehiclesService)();
        res.json(vehicles);
    }
    catch {
        res.status(500).json({ message: 'Fetch failed' });
    }
};
exports.getVehicles = getVehicles;
/* GET ONE */
const getVehicleById = async (req, res) => {
    try {
        const vehicle = await (0, vehicles_service_1.getVehicleByIdService)(req.params.id);
        res.json(vehicle);
    }
    catch {
        res.status(500).json({ message: 'Fetch failed' });
    }
};
exports.getVehicleById = getVehicleById;
/* UPDATE */
const updateVehicle = async (req, res) => {
    try {
        const vehicle = await (0, vehicles_service_1.updateVehicleService)(req.params.id, req.body);
        res.json(vehicle);
    }
    catch {
        res.status(500).json({ message: 'Update failed' });
    }
};
exports.updateVehicle = updateVehicle;
/* DELETE */
const deleteVehicle = async (req, res) => {
    try {
        await (0, vehicles_service_1.deleteVehicleService)(req.params.id);
        res.json({ success: true });
    }
    catch {
        res.status(500).json({ message: 'Delete failed' });
    }
};
exports.deleteVehicle = deleteVehicle;
