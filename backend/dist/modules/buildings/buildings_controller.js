"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBuilding = exports.getBuildingById = exports.getAllBuildings = exports.createBuilding = void 0;
const buildingService = __importStar(require("./buildings_service"));
const createBuilding = async (req, res) => {
    try {
        const { building_name, latitude, longitude, radius, floors } = req.body;
        if (!building_name) {
            return res.status(400).json({
                success: false,
                message: 'Building name is required',
            });
        }
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: 'Building GPS location is required',
            });
        }
        if (!floors || !Array.isArray(floors) || floors.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one floor is required',
            });
        }
        const building = await buildingService.createBuilding({
            building_name,
            latitude,
            longitude,
            radius,
            floors,
        });
        return res.status(201).json({
            success: true,
            message: 'Building and floors created successfully',
            data: building,
        });
    }
    catch (error) {
        console.error('Error creating building:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create building',
        });
    }
};
exports.createBuilding = createBuilding;
// Get all buildings with their floors
const getAllBuildings = async (req, res) => {
    try {
        const buildings = await buildingService.getAllBuildings();
        return res.status(200).json({
            success: true,
            data: buildings,
        });
    }
    catch (error) {
        console.error('Error fetching buildings:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch buildings',
        });
    }
};
exports.getAllBuildings = getAllBuildings;
// Get building by ID with floors
const getBuildingById = async (req, res) => {
    try {
        const { id } = req.params;
        const building = await buildingService.getBuildingById(id);
        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Building not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: building,
        });
    }
    catch (error) {
        console.error('Error fetching building:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch building',
        });
    }
};
exports.getBuildingById = getBuildingById;
// Delete building (cascades to floors in database)
const deleteBuilding = async (req, res) => {
    try {
        const { id } = req.params;
        const building = await buildingService.deleteBuilding(id);
        if (!building) {
            return res.status(404).json({
                success: false,
                message: 'Building not found',
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Building deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting building:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete building',
        });
    }
};
exports.deleteBuilding = deleteBuilding;
