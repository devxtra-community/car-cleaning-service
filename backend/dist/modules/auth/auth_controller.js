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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getCleanersBySupervisor = exports.login = exports.getSupervisorsByBuilding = exports.getAllSupervisors = exports.getCleaners = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = require("../../config/logger");
const connectDatabase_1 = require("../../database/connectDatabase");
const auth_service_1 = require("./auth_service");
const uploadMiddleware_1 = require("src/middlewares/uploadMiddleware");
const registerUser = async (req, res) => {
    try {
        const files = req.files;
        const documentFile = files?.document?.[0];
        const profilePhotoFile = files?.profile_image?.[0];
        if (!documentFile) {
            return res.status(400).json({
                success: false,
                message: 'Document file is required',
            });
        }
        // Upload files
        const documentUrl = await (0, uploadMiddleware_1.uploadToS3)(documentFile);
        let profilePhotoUrl;
        if (profilePhotoFile) {
            profilePhotoUrl = await (0, uploadMiddleware_1.uploadToS3)(profilePhotoFile);
        }
        // Normalize role
        const role = req.body.role?.toLowerCase();
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is required',
            });
        }
        // Base payload - matching your table structure
        const base = {
            email: req.body.email?.trim(),
            password: req.body.password,
            full_name: req.body.full_name,
            document: documentUrl,
            document_id: req.body.document_id,
            age: Number(req.body.age),
            nationality: req.body.nationality,
            profile_image: profilePhotoUrl,
            phone: req.body.phone || null,
            base_salary: req.body.base_salary ? Number(req.body.base_salary) : 0,
        };
        let payload;
        switch (role) {
            case 'supervisor':
                payload = {
                    ...base,
                    role: 'supervisor',
                    supervisor: {
                        building_id: req.body.building_id,
                    },
                };
                break;
            case 'cleaner':
                payload = {
                    ...base,
                    role: 'cleaner',
                    cleaner: {
                        supervisor_id: req.body.supervisor_id,
                        floor_id: req.body.floor_id || undefined,
                    },
                };
                break;
            case 'admin':
            case 'super_admin':
            case 'accountant':
                payload = {
                    ...base,
                    role,
                };
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role provided',
                });
        }
        const user = await (0, auth_service_1.createUser)(payload);
        return res.status(201).json({
            success: true,
            message: `${role} registered successfully`,
            data: user,
        });
    }
    catch (error) {
        logger_1.logger.error('Registration failed', { err: error });
        let statusCode = 500;
        let message = 'Failed to register user';
        let errorMessage;
        if (error instanceof Error) {
            errorMessage = error.message;
            const errorMap = {
                USER_ALREADY_EXISTS: { code: 409, msg: 'User already exists' },
                EMAIL_REQUIRED: { code: 400, msg: 'Email is required' },
                PASSWORD_REQUIRED: { code: 400, msg: 'Password is required' },
                FULL_NAME_REQUIRED: { code: 400, msg: 'Full name is required' },
                DOCUMENT_REQUIRED: { code: 400, msg: 'Document is required' },
                DOCUMENT_ID_REQUIRED: { code: 400, msg: 'Document ID is required' },
                AGE_REQUIRED: { code: 400, msg: 'Age is required' },
                NATIONALITY_REQUIRED: { code: 400, msg: 'Nationality is required' },
                BUILDING_ID_REQUIRED_FOR_SUPERVISOR: {
                    code: 400,
                    msg: 'Building ID required for supervisor',
                },
                SUPERVISOR_ID_REQUIRED_FOR_CLEANER: {
                    code: 400,
                    msg: 'Supervisor ID required for cleaner',
                },
                BUILDING_NOT_FOUND: { code: 404, msg: 'Building not found' },
                SUPERVISOR_NOT_FOUND: { code: 404, msg: 'Supervisor not found' },
            };
            if (errorMap[error.message]) {
                statusCode = errorMap[error.message].code;
                message = errorMap[error.message].msg;
            }
        }
        return res.status(statusCode).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        });
    }
};
exports.registerUser = registerUser;
const getCleaners = async (req, res) => {
    try {
        const result = await connectDatabase_1.pool.query(`
      SELECT 
        c.id AS cleaner_id,
        c.user_id,
        c.building_id,
        c.floor_id,
        c.supervisor_id,
        c.total_tasks,
        c.total_earning,
        c.created_at,

        u.full_name,
        u.email,
        u.phone,
        u.age,
        u.nationality,
        u.document,
        u.document_id,
        u.profile_image,
        u.base_salary,

        b.building_name,

        s_u.full_name AS supervisor_name,

        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS total_reviews

      FROM cleaners c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN buildings b ON c.building_id = b.id
      LEFT JOIN supervisors s ON c.supervisor_id = s.id
      LEFT JOIN users s_u ON s.user_id = s_u.id
      LEFT JOIN reviews r ON c.id = r.cleaner_id

      WHERE u.role = 'cleaner'
      GROUP BY c.id, u.id, b.id, s.id, s_u.id
      ORDER BY u.full_name ASC
      `);
        return res.status(200).json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch cleaners', { err: error });
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch cleaners',
        });
    }
};
exports.getCleaners = getCleaners;
const getAllSupervisors = async (req, res) => {
    try {
        const result = await connectDatabase_1.pool.query(`
      SELECT 
        s.id AS supervisor_id,
        s.user_id,
        s.building_id,
        s.location_id,
        s.created_at,

        u.full_name,
        u.email,
        u.phone,
        u.age,
        u.nationality,
        u.document,
        u.document_id,
        u.profile_image,
        u.base_salary,

        b.building_name

      FROM supervisors s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN buildings b ON s.building_id = b.id
      WHERE u.role = 'supervisor'
      ORDER BY u.full_name ASC
      `);
        return res.status(200).json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        console.error('Error fetching supervisors:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch supervisors',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
};
exports.getAllSupervisors = getAllSupervisors;
const getSupervisorsByBuilding = async (req, res) => {
    try {
        const { buildingId } = req.params;
        const result = await connectDatabase_1.pool.query(`
      SELECT 
        s.id,
        s.user_id,
        s.building_id,
        s.full_name,
        u.email,
        u.phone
      FROM supervisors s
      JOIN users u ON s.user_id = u.id
      WHERE s.building_id = $1
      AND u.role = 'supervisor'
      ORDER BY s.full_name ASC
      `, [buildingId]);
        return res.status(200).json({
            success: true,
            data: result.rows,
            count: result.rows.length,
        });
    }
    catch (error) {
        console.error('Error fetching supervisors:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch supervisors',
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
};
exports.getSupervisorsByBuilding = getSupervisorsByBuilding;
const login = async (req, res) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        const { email, password, client_type = 'web' } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }
        await client.query('BEGIN');
        const result = await client.query('SELECT * FROM users WHERE email = $1', [
            email.toLowerCase().trim(),
        ]);
        if (!result.rows.length) {
            await client.query('ROLLBACK');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }
        const user = result.rows[0];
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            await client.query('ROLLBACK');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }
        // Import JWT utilities
        const { generateAccessToken, generateRefreshToken, hashToken } = await Promise.resolve().then(() => __importStar(require('../../config/jwt')));
        const { v4: uuidv4 } = await Promise.resolve().then(() => __importStar(require('uuid')));
        // Generate tokens
        const tokenId = uuidv4();
        const tokenVersion = user.token_version || 0;
        const accessToken = generateAccessToken({
            userId: user.id,
            role: user.role,
            tokenVersion,
        }, client_type);
        const refreshToken = generateRefreshToken({
            userId: user.id,
            tokenId,
            tokenVersion,
            clientType: client_type,
        }, client_type);
        // Store refresh token in database
        const expiresSeconds = client_type === 'web' ? 7 * 86400 : 90 * 86400;
        await client.query(`
      INSERT INTO refresh_tokens (
        user_id,
        token_id,
        token_hash,
        client_type,
        expires_at
      )
      VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 second'))
      `, [user.id, tokenId, hashToken(refreshToken), client_type, expiresSeconds]);
        await client.query('COMMIT');
        // Set httpOnly cookie for web clients
        if (client_type === 'web') {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/api/auth/refresh',
                maxAge: 7 * 86400000,
            });
        }
        // Remove password from response
        delete user.password;
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            ...(client_type === 'mobile' && { refreshToken }),
            data: user,
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.logger.error('Login failed', { err: error });
        return res.status(500).json({
            success: false,
            message: 'Login failed',
        });
    }
    finally {
        client.release();
    }
};
exports.login = login;
const getCleanersBySupervisor = async (req, res) => {
    try {
        const { supervisorId } = req.params;
        if (!supervisorId) {
            return res.status(400).json({
                success: false,
                message: 'Supervisor ID is required',
            });
        }
        const result = await connectDatabase_1.pool.query(`
      SELECT 
        c.id as cleaner_id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.document_id,
        u.age,
        u.nationality,
        u.document,
        u.profile_image,
        u.phone,
        c.floor_id,
        c.total_tasks,
        c.total_earning,
        b.building_name,
        b.id as building_id,
        s.id as supervisor_id,
        s_u.full_name as supervisor_name
      FROM cleaners c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN buildings b ON c.building_id = b.id
      LEFT JOIN supervisors s ON c.supervisor_id = s.id
      LEFT JOIN users s_u ON s.user_id = s_u.id
      WHERE c.supervisor_id = $1
      ORDER BY u.full_name ASC
      `, [supervisorId]);
        return res.status(200).json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch cleaners by supervisor', { err: error });
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch cleaners',
        });
    }
};
exports.getCleanersBySupervisor = getCleanersBySupervisor;
const logout = async (req, res) => {
    try {
        // Clear refresh token cookie
        res.clearCookie('refreshToken', {
            path: '/api/auth/refresh',
        });
        return res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    }
    catch (error) {
        logger_1.logger.error('Logout failed', { err: error });
        return res.status(500).json({
            success: false,
            message: 'Logout failed',
        });
    }
};
exports.logout = logout;
