"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAdminsController = exports.getAllAccountantsController = exports.getSupervisorsByBuilding = exports.getAllSupervisors = exports.getCleanersBySupervisor = exports.getCleaners = exports.logout = exports.login = exports.registerUser = void 0;
const logger_1 = require("../../config/logger");
const error_handler_1 = require("src/middlewares/error-handler");
const jwt_1 = require("../../config/jwt");
const uploadMiddleware_1 = require("../../middlewares/uploadMiddleware");
const auth_service_1 = require("./auth_service");
const VALID_CLIENT_TYPES = ['web', 'mobile'];
// ============================================================
// REGISTER
// ============================================================
const registerUser = async (req, res, next) => {
    try {
        const files = req.files;
        const documentFile = files?.document?.[0];
        const profilePhotoFile = files?.profile_image?.[0];
        if (!documentFile) {
            throw new error_handler_1.AppError('Document file is required', 400, 'DOCUMENT_FILE_REQUIRED');
        }
        const documentUrl = await (0, uploadMiddleware_1.uploadToS3)(documentFile);
        const profilePhotoUrl = profilePhotoFile ? await (0, uploadMiddleware_1.uploadToS3)(profilePhotoFile) : undefined;
        const role = req.body.role?.toLowerCase();
        if (!role)
            throw new error_handler_1.AppError('Role is required', 400, 'ROLE_REQUIRED');
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
                    supervisor: { building_id: req.body.building_id },
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
                payload = { ...base, role };
                break;
            default:
                throw new error_handler_1.AppError('Invalid role provided', 400, 'INVALID_ROLE');
        }
        const user = await (0, auth_service_1.createUser)(payload);
        return res.status(201).json({
            success: true,
            message: `${role} registered successfully`,
            data: user,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.registerUser = registerUser;
// ============================================================
// LOGIN
// client_type sent in request body — 'web' or 'mobile'
// web   → refresh token in httpOnly cookie, access token in body
// mobile → both tokens in body (untouched for teammates)
// ============================================================
const login = async (req, res, next) => {
    try {
        const { email, password, client_type = 'web' } = req.body;
        if (!email || !password) {
            throw new error_handler_1.AppError('Email and password are required', 400, 'CREDENTIALS_REQUIRED');
        }
        if (!client_type || !VALID_CLIENT_TYPES.includes(client_type)) {
            throw new error_handler_1.AppError(`client_type is required and must be one of: ${VALID_CLIENT_TYPES.join(', ')}`, 400, 'INVALID_CLIENT_TYPE');
        }
        const clientType = client_type;
        const { user, accessToken, refreshToken } = await (0, auth_service_1.loginService)(email, password, clientType);
        // Web — set refresh token in httpOnly cookie
        if (clientType === 'web') {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', // kept same as your original
                path: '/api/auth/refresh',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            // mobile gets refresh token in body — web does not
            ...(clientType === 'mobile' && { refreshToken }),
            data: user,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
// ============================================================
// LOGOUT
// Reads refresh token from cookie to delete that specific session
// logoutAll=true in body deletes all sessions for the user
// ============================================================
const logout = async (req, res, next) => {
    try {
        const rawRefreshToken = req.cookies?.refreshToken;
        const logoutAll = req.body?.logoutAll === true;
        // Get userId from auth middleware (your existing middleware sets req.user)
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_handler_1.AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        let tokenId;
        // Extract tokenId from cookie to delete only this session
        if (rawRefreshToken && !logoutAll) {
            try {
                const payload = (0, jwt_1.verifyRefreshToken)(rawRefreshToken);
                tokenId = payload.tokenId;
            }
            catch {
                // Token already invalid or expired — still proceed with logout
                logger_1.logger.warn('Could not verify refresh token during logout, clearing cookie anyway');
            }
        }
        await (0, auth_service_1.logoutService)(userId, logoutAll ? undefined : tokenId);
        // Always clear the cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/api/auth/refresh',
        });
        return res.status(200).json({
            success: true,
            message: logoutAll ? 'Logged out from all devices' : 'Logout successful',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.logout = logout;
// ============================================================
// CLEANERS
// ============================================================
const getCleaners = async (req, res, next) => {
    try {
        const data = await (0, auth_service_1.getAllCleanersService)();
        return res.status(200).json({ success: true, count: data.length, data });
    }
    catch (err) {
        next(err);
    }
};
exports.getCleaners = getCleaners;
const getCleanersBySupervisor = async (req, res, next) => {
    try {
        const supervisorId = req.params.supervisorId;
        if (!supervisorId) {
            throw new error_handler_1.AppError('Supervisor ID is required', 400, 'SUPERVISOR_ID_REQUIRED');
        }
        const data = await (0, auth_service_1.getCleanersBySupervisorService)(supervisorId);
        return res.status(200).json({ success: true, data });
    }
    catch (err) {
        next(err);
    }
};
exports.getCleanersBySupervisor = getCleanersBySupervisor;
// ============================================================
// SUPERVISORS
// ============================================================
const getAllSupervisors = async (req, res, next) => {
    try {
        const data = await (0, auth_service_1.getAllSupervisorsService)();
        return res.status(200).json({ success: true, count: data.length, data });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllSupervisors = getAllSupervisors;
const getSupervisorsByBuilding = async (req, res, next) => {
    try {
        const buildingId = req.params.buildingId;
        if (!buildingId) {
            throw new error_handler_1.AppError('Building ID is required', 400, 'BUILDING_ID_REQUIRED');
        }
        const data = await (0, auth_service_1.getSupervisorsByBuildingService)(buildingId);
        return res.status(200).json({ success: true, count: data.length, data });
    }
    catch (err) {
        next(err);
    }
};
exports.getSupervisorsByBuilding = getSupervisorsByBuilding;
// ============================================================
// ACCOUNTANTS & ADMINS
// ============================================================
const getAllAccountantsController = async (req, res, next) => {
    try {
        const data = await (0, auth_service_1.getAllAccountantsService)();
        return res.status(200).json({ success: true, count: data.length, data });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllAccountantsController = getAllAccountantsController;
const getAllAdminsController = async (req, res, next) => {
    try {
        const data = await (0, auth_service_1.getAllAdminsService)();
        return res.status(200).json({ success: true, count: data.length, data });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllAdminsController = getAllAdminsController;
