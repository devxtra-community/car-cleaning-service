"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordController = exports.verifyOTPController = exports.forgotPasswordController = exports.resetUserPasswordController = exports.toggleUserStatusController = exports.getAllAdminsController = exports.getAllAccountantsController = exports.getSupervisorsByBuilding = exports.getAllSupervisors = exports.getCleanersBySupervisor = exports.getCleaners = exports.logout = exports.login = exports.registerUser = void 0;
const auditLogger_1 = require("../../utils/auditLogger");
const logger_1 = require("../../config/logger");
const error_handler_1 = require("../../middlewares/error-handler");
const jwt_1 = require("../../config/jwt");
const uploadMiddleware_1 = require("../../middlewares/uploadMiddleware");
const auth_service_1 = require("./auth_service");
const sendWelcomeMail_1 = require("../../config/sendWelcomeMail");
const VALID_CLIENT_TYPES = ['web', 'mobile'];
// ============================================================
// REGISTER
// ============================================================
const registerUser = async (req, res, next) => {
    try {
        // eslint-disable-next-line no-undef
        const files = req.files;
        const documentFile = files?.document?.[0];
        const profilePhotoFile = files?.profile_image?.[0];
        if (!documentFile) {
            throw new error_handler_1.AppError('Document file is required', 400, 'DOCUMENT_FILE_REQUIRED');
        }
        let documentUrl;
        let profilePhotoUrl;
        try {
            documentUrl = await (0, uploadMiddleware_1.uploadToS3)(documentFile);
            profilePhotoUrl = profilePhotoFile ? await (0, uploadMiddleware_1.uploadToS3)(profilePhotoFile) : undefined;
        }
        catch (s3Err) {
            logger_1.logger.error('S3 Upload Failed during registration', { error: s3Err });
            throw new error_handler_1.AppError('Failed to upload registration documents. Please check infrastructure configuration.', 500, 'S3_UPLOAD_FAILED');
        }
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
                    building_id: req.body.building_id,
                };
                break;
            case 'cleaner':
                payload = {
                    ...base,
                    role: 'cleaner',
                    building_id: req.body.building_id,
                    floor_id: req.body.floor_id,
                    supervisor_id: req.body.supervisor_id || undefined,
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
        // Send welcome email (fire-and-forget — errors are logged but don't fail registration)
        void (0, sendWelcomeMail_1.sendWelcomeMail)({
            to: base.email,
            full_name: base.full_name,
            password: base.password,
            role,
        }).catch((mailErr) => {
            console.error('[sendWelcomeMail] Failed to send welcome email:', mailErr);
        });
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
// mobile → both tokens in body
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
        if (clientType === 'web') {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
                domain: process.env.COOKIE_DOMAIN || undefined,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
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
// ============================================================
const logout = async (req, res, next) => {
    try {
        const rawRefreshToken = req.cookies?.refreshToken;
        const logoutAll = req.body?.logoutAll === true;
        const userId = req.user?.userId;
        if (!userId) {
            throw new error_handler_1.AppError('Unauthorized', 401, 'UNAUTHORIZED');
        }
        let tokenId;
        if (rawRefreshToken && !logoutAll) {
            try {
                const payload = (0, jwt_1.verifyRefreshToken)(rawRefreshToken);
                tokenId = payload.tokenId;
            }
            catch {
                logger_1.logger.warn('Could not verify refresh token during logout, clearing cookie anyway');
            }
        }
        await (0, auth_service_1.logoutService)(userId, logoutAll ? undefined : tokenId);
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/',
            domain: process.env.COOKIE_DOMAIN || undefined,
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
// ============================================================
// ADMIN MANAGEMENT
// ============================================================
const toggleUserStatusController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const adminId = req.user?.userId;
        if (is_active === undefined) {
            throw new error_handler_1.AppError('is_active is required', 400, 'IS_ACTIVE_REQUIRED');
        }
        const data = await (0, auth_service_1.toggleUserStatusService)(id, is_active);
        if (adminId) {
            await (0, auditLogger_1.logAuditAction)(adminId, 'TOGGLE_USER_STATUS', { target_user_id: id, is_active });
        }
        return res.status(200).json({
            success: true,
            message: `User status updated to ${is_active ? 'active' : 'inactive'}`,
            data,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.toggleUserStatusController = toggleUserStatusController;
const resetUserPasswordController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { new_password } = req.body;
        const adminId = req.user?.userId;
        if (!new_password) {
            throw new error_handler_1.AppError('new_password is required', 400, 'PASSWORD_REQUIRED');
        }
        await (0, auth_service_1.resetUserPasswordService)(id, new_password);
        if (adminId) {
            await (0, auditLogger_1.logAuditAction)(adminId, 'RESET_USER_PASSWORD', { target_user_id: id });
        }
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
    }
    catch (err) {
        next(err);
    }
};
exports.resetUserPasswordController = resetUserPasswordController;
// ============================================================
// FORGOT PASSWORD
// ============================================================
const forgotPasswordController = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email)
            throw new error_handler_1.AppError('Email is required', 400, 'EMAIL_REQUIRED');
        await (0, auth_service_1.requestPasswordResetService)(email);
        return res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a reset code has been sent.',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.forgotPasswordController = forgotPasswordController;
const verifyOTPController = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            throw new error_handler_1.AppError('Email and OTP are required', 400, 'FIELDS_REQUIRED');
        const { resetToken } = await (0, auth_service_1.verifyOTPService)(email, otp);
        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            resetToken,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.verifyOTPController = verifyOTPController;
const resetPasswordController = async (req, res, next) => {
    try {
        const { email, resetToken, newPassword } = req.body;
        if (!email || !resetToken || !newPassword) {
            throw new error_handler_1.AppError('Email, resetToken and newPassword are required', 400, 'FIELDS_REQUIRED');
        }
        await (0, auth_service_1.resetPasswordService)(email, resetToken, newPassword);
        return res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now log in.',
        });
    }
    catch (err) {
        next(err);
    }
};
exports.resetPasswordController = resetPasswordController;
