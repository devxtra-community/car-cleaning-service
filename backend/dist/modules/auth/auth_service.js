"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUserPasswordService = exports.toggleUserStatusService = exports.resetPasswordService = exports.verifyOTPService = exports.requestPasswordResetService = exports.checkSupervisorNotBlocked = exports.getAllAdminsService = exports.getAllAccountantsService = exports.getSupervisorsByBuildingService = exports.getAllSupervisorsService = exports.getCleanersBySupervisorService = exports.getAllCleanersService = exports.logoutService = exports.loginService = exports.createUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const connectDatabase_1 = require("../../database/connectDatabase");
const error_handler_1 = require("src/middlewares/error-handler");
const jwt_1 = require("../../config/jwt");
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const sendWelcomeMail_1 = require("src/config/sendWelcomeMail");
const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 15;
const createUser = async (data) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        // ── Base validation ───────────────────────────────────────
        if (!data.email)
            throw new error_handler_1.AppError('Email is required', 400, 'EMAIL_REQUIRED');
        if (!data.password)
            throw new error_handler_1.AppError('Password is required', 400, 'PASSWORD_REQUIRED');
        if (!data.full_name)
            throw new error_handler_1.AppError('Full name is required', 400, 'FULL_NAME_REQUIRED');
        if (!data.document)
            throw new error_handler_1.AppError('Document is required', 400, 'DOCUMENT_REQUIRED');
        if (!data.document_id)
            throw new error_handler_1.AppError('Document ID is required', 400, 'DOCUMENT_ID_REQUIRED');
        if (!data.age)
            throw new error_handler_1.AppError('Age is required', 400, 'AGE_REQUIRED');
        if (!data.nationality)
            throw new error_handler_1.AppError('Nationality is required', 400, 'NATIONALITY_REQUIRED');
        const email = data.email.toLowerCase().trim();
        // ── Duplicate email check ─────────────────────────────────
        const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
        if (existing.rows.length) {
            throw new error_handler_1.AppError('User already exists', 409, 'USER_ALREADY_EXISTS');
        }
        const hashed = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        // ─────────────────────────────────────────────────────────
        // SUPERVISOR pre-checks
        // Multiple supervisors allowed per building — no uniqueness
        // constraint on supervisors.building_id.
        // ─────────────────────────────────────────────────────────
        if (data.role === 'supervisor') {
            if (!data.building_id) {
                throw new error_handler_1.AppError('Building ID is required for supervisor', 400, 'BUILDING_ID_REQUIRED_FOR_SUPERVISOR');
            }
            const building = await client.query(`SELECT id FROM buildings WHERE id = $1`, [
                data.building_id,
            ]);
            if (!building.rows.length) {
                throw new error_handler_1.AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
            }
        }
        // ─────────────────────────────────────────────────────────
        // CLEANER pre-checks
        //
        // 1. building_id must exist
        // 2. floor_id must belong to that building
        // 3. supervisor_id (optional): must exist, be active,
        //    and belong to the same building
        //    — queried by supervisors.id (PK), not user_id
        // ─────────────────────────────────────────────────────────
        if (data.role === 'cleaner') {
            if (!data.building_id) {
                throw new error_handler_1.AppError('Building ID is required for cleaner', 400, 'BUILDING_ID_REQUIRED_FOR_CLEANER');
            }
            if (!data.floor_id) {
                throw new error_handler_1.AppError('Floor ID is required for cleaner', 400, 'FLOOR_ID_REQUIRED_FOR_CLEANER');
            }
            // 1. Building must exist
            const building = await client.query(`SELECT id FROM buildings WHERE id = $1`, [
                data.building_id,
            ]);
            if (!building.rows.length) {
                throw new error_handler_1.AppError('Building not found', 404, 'BUILDING_NOT_FOUND');
            }
            // 2. Floor must belong to this building
            const floor = await client.query(`SELECT id FROM floors WHERE id = $1 AND building_id = $2`, [
                data.floor_id,
                data.building_id,
            ]);
            if (!floor.rows.length) {
                throw new error_handler_1.AppError('Floor not found or does not belong to the selected building', 404, 'FLOOR_NOT_FOUND_IN_BUILDING');
            }
            // 3. Supervisor (optional)
            //    supervisor_id = supervisors.id (PK), not user_id
            if (data.supervisor_id) {
                const supervisor = await client.query(`SELECT id, building_id, is_active
           FROM supervisors
           WHERE id = $1`, [data.supervisor_id]);
                if (!supervisor.rows.length) {
                    throw new error_handler_1.AppError('Supervisor not found', 404, 'SUPERVISOR_NOT_FOUND');
                }
                if (!supervisor.rows[0].is_active) {
                    throw new error_handler_1.AppError('Supervisor is not active', 400, 'SUPERVISOR_NOT_ACTIVE');
                }
                if (supervisor.rows[0].building_id !== data.building_id) {
                    throw new error_handler_1.AppError('Supervisor does not belong to the selected building', 400, 'SUPERVISOR_BUILDING_MISMATCH');
                }
            }
        }
        // ─────────────────────────────────────────────────────────
        // Step 1 — INSERT into users
        // ─────────────────────────────────────────────────────────
        const userBuildingId = data.role === 'supervisor' || data.role === 'cleaner' ? data.building_id : null;
        const userFloorId = data.role === 'cleaner' ? data.floor_id : null;
        const userRes = await client.query(`INSERT INTO users (
         email, password, role, full_name, document, document_id,
         age, nationality, profile_image, phone, base_salary,
         building_id, floor_id
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, email, role, full_name, document, document_id,
                 age, nationality, profile_image, phone, base_salary,
                 building_id, floor_id, created_at, updated_at`, [
            email,
            hashed,
            data.role,
            data.full_name,
            data.document,
            data.document_id,
            data.age,
            data.nationality,
            data.profile_image ?? null,
            data.phone ?? null,
            data.base_salary ?? 0,
            userBuildingId,
            userFloorId,
        ]);
        const user = userRes.rows[0];
        // ─────────────────────────────────────────────────────────
        // Step 2 — UPSERT into role-specific profile table
        //
        // ON CONFLICT (user_id) DO UPDATE is required because the DB
        // has a trigger that auto-inserts a blank row into supervisors
        // or cleaners the moment the users row is created.
        // The UPSERT overwrites that blank row with real data.
        // ─────────────────────────────────────────────────────────
        if (data.role === 'supervisor') {
            await client.query(`INSERT INTO supervisors (user_id, building_id, full_name, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (user_id) DO UPDATE
           SET building_id = EXCLUDED.building_id,
               full_name   = EXCLUDED.full_name,
               is_active   = true,
               updated_at  = now()`, [user.id, data.building_id, data.full_name]);
        }
        if (data.role === 'cleaner') {
            await client.query(`INSERT INTO cleaners (
       user_id,
       supervisor_id,
       building_id,
       floor_id
     ) VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
       SET supervisor_id = EXCLUDED.supervisor_id,
           building_id   = EXCLUDED.building_id,
           floor_id      = EXCLUDED.floor_id`, [user.id, data.supervisor_id ?? null, data.building_id ?? null, data.floor_id ?? null]);
        }
        await client.query('COMMIT');
        return user;
    }
    catch (err) {
        await client.query('ROLLBACK');
        if (typeof err === 'object' && err !== null && 'code' in err && 'constraint' in err) {
            const dbErr = err;
            if (dbErr.code === '23505') {
                if (dbErr.constraint === 'users_email_key') {
                    throw new error_handler_1.AppError('User already exists', 409, 'USER_ALREADY_EXISTS');
                }
                if (dbErr.constraint === 'cleaners_user_id_key') {
                    throw new error_handler_1.AppError('Cleaner record already exists', 409, 'CLEANER_RECORD_ALREADY_EXISTS');
                }
            }
        }
        throw err;
    }
    finally {
        client.release();
    }
};
exports.createUser = createUser;
const loginService = async (email, password, clientType) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query(`SELECT * FROM users WHERE email = $1`, [
            email.toLowerCase().trim(),
        ]);
        if (!result.rows.length) {
            throw new error_handler_1.AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
        const user = result.rows[0];
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            throw new error_handler_1.AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
        }
        const tokenVersion = user.token_version || 0;
        const tokenId = (0, uuid_1.v4)();
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, role: user.role, tokenVersion }, clientType);
        const refreshToken = (0, jwt_1.generateRefreshToken)({ userId: user.id, tokenId, tokenVersion, clientType }, clientType);
        const expiresSeconds = clientType === 'web' ? 7 * 86400 : 90 * 86400;
        await client.query(`INSERT INTO refresh_tokens (user_id, token_id, token_hash, client_type, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + ($5 * INTERVAL '1 second'))`, [user.id, tokenId, (0, jwt_1.hashToken)(refreshToken), clientType, expiresSeconds]);
        await client.query(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);
        await client.query('COMMIT');
        delete user.password;
        return { user, accessToken, refreshToken };
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
};
exports.loginService = loginService;
const logoutService = async (userId, tokenId) => {
    const client = await connectDatabase_1.pool.connect();
    try {
        if (tokenId) {
            // Logout current session only
            await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1 AND token_id = $2`, [
                userId,
                tokenId,
            ]);
        }
        else {
            // Logout all sessions
            await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
            await client.query(`UPDATE users SET token_version = token_version + 1 WHERE id = $1`, [
                userId,
            ]);
        }
    }
    finally {
        client.release();
    }
};
exports.logoutService = logoutService;
const getAllCleanersService = async () => {
    const { rows } = await connectDatabase_1.pool.query(`SELECT
      c.id AS cleaner_id, c.user_id, c.building_id, c.floor_id,
      c.supervisor_id, c.total_tasks, c.total_earning, c.created_at,
      u.full_name, u.email, u.phone, u.age, u.nationality,
      u.document, u.document_id, u.profile_image, u.base_salary,
      b.building_name,
      s_u.full_name AS supervisor_name
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN buildings b ON c.building_id = b.id
     LEFT JOIN supervisors s ON c.supervisor_id = s.id
     LEFT JOIN users s_u ON s.user_id = s_u.id
     WHERE u.role = 'cleaner'
     ORDER BY u.full_name ASC`);
    return rows;
};
exports.getAllCleanersService = getAllCleanersService;
const getCleanersBySupervisorService = async (supervisorId) => {
    const { rows } = await connectDatabase_1.pool.query(`SELECT
      c.id AS cleaner_id, u.id AS user_id, u.full_name, u.email,
      u.document_id, u.age, u.nationality, u.document, u.profile_image,
      u.phone, c.floor_id, c.total_tasks, c.total_earning,
      b.building_name, b.id AS building_id,
      s.id AS supervisor_id, s_u.full_name AS supervisor_name
     FROM cleaners c
     JOIN users u ON c.user_id = u.id
     LEFT JOIN buildings b ON c.building_id = b.id
     LEFT JOIN supervisors s ON c.supervisor_id = s.id
     LEFT JOIN users s_u ON s.user_id = s_u.id
     WHERE c.supervisor_id = $1
     ORDER BY u.full_name ASC`, [supervisorId]);
    return rows;
};
exports.getCleanersBySupervisorService = getCleanersBySupervisorService;
// ============================================================
// SUPERVISORS
// ============================================================
const getAllSupervisorsService = async () => {
    const { rows } = await connectDatabase_1.pool.query(`SELECT
      s.id AS supervisor_id, s.user_id, s.building_id, s.location_id, s.created_at,
      u.full_name, u.email, u.phone, u.age, u.nationality,
      u.document, u.document_id, u.profile_image, u.base_salary,
      b.building_name
     FROM supervisors s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN buildings b ON s.building_id = b.id
     WHERE u.role = 'supervisor'
     ORDER BY u.full_name ASC`);
    return rows;
};
exports.getAllSupervisorsService = getAllSupervisorsService;
const getSupervisorsByBuildingService = async (buildingId) => {
    const { rows } = await connectDatabase_1.pool.query(`SELECT
      s.id, s.user_id, s.building_id, s.full_name,
      u.email, u.phone
     FROM supervisors s
     JOIN users u ON s.user_id = u.id
     WHERE s.building_id = $1 AND u.role = 'supervisor'
     ORDER BY s.full_name ASC`, [buildingId]);
    return rows;
};
exports.getSupervisorsByBuildingService = getSupervisorsByBuildingService;
// ============================================================
// ACCOUNTANTS & ADMINS
// ============================================================
const getAllAccountantsService = async () => {
    const { rows } = await connectDatabase_1.pool.query(`SELECT id, full_name, email, phone, age, nationality, document_id,
            base_salary, profile_image, building_id, floor_id,
            joining_date, last_login, created_at
     FROM users WHERE role = 'accountant' ORDER BY created_at DESC`);
    return rows;
};
exports.getAllAccountantsService = getAllAccountantsService;
const getAllAdminsService = async () => {
    const { rows } = await connectDatabase_1.pool.query(`SELECT id, full_name, email, phone, age, nationality, document_id,
            base_salary, profile_image, joining_date, last_login, created_at
     FROM users WHERE role = 'admin' ORDER BY created_at DESC`);
    return rows;
};
exports.getAllAdminsService = getAllAdminsService;
// ─────────────────────────────────────────────────────────────────────────────
// src/modules/auth/auth_service.ts  — add this snippet to your loginUserService
// RIGHT AFTER the password validation check (bcrypt.compare).
//
// The query below only hits if the user's role is 'supervisor'.
// For all other roles it short-circuits and skips.
// ─────────────────────────────────────────────────────────────────────────────
const checkSupervisorNotBlocked = async (userId, role) => {
    if (role !== 'supervisor')
        return; // only supervisors have is_active flag
    const result = await connectDatabase_1.pool.query(`SELECT is_active FROM supervisors WHERE user_id = $1`, [userId]);
    // No row means the supervisor record was removed — deny access
    if (!result.rows.length) {
        throw new error_handler_1.AppError('Your account has been temporarily blocked. Please contact the administrator.', 403, 'ACCOUNT_BLOCKED');
    }
    const row = result.rows[0];
    if (row.is_active === false) {
        throw new error_handler_1.AppError('Your account has been temporarily blocked. Please contact the administrator.', 403, 'ACCOUNT_BLOCKED');
    }
};
exports.checkSupervisorNotBlocked = checkSupervisorNotBlocked;
// ── helpers ───────────────────────────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
// OTP → SHA-256 (deterministic, needed for WHERE otp_hash = $2 in SQL).
// bcrypt can't be used here because its random salt means every hash differs —
// you can't filter in a WHERE clause. SHA-256 is safe for OTPs because they
// are already protected by short expiry + single-use.
const hashOTP = (otp) => crypto_1.default.createHash('sha256').update(otp).digest('hex');
// resetToken → bcrypt (fetched by user_id first, then bcrypt.compare).
// Non-determinism is fine here because we never use it in a WHERE clause.
// bcrypt adds defence-in-depth if the DB is ever breached.
const hashResetToken = (token) => bcrypt_1.default.hash(token, SALT_ROUNDS);
// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Request OTP
// ─────────────────────────────────────────────────────────────────────────────
const requestPasswordResetService = async (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const { rows } = await connectDatabase_1.pool.query(`SELECT id, full_name, email FROM users WHERE email = $1`, [
        normalizedEmail,
    ]);
    if (!rows.length)
        return; // silent — no email enumeration
    const user = rows[0];
    const otp = generateOTP();
    const otpHash = hashOTP(otp); // SHA-256 for DB lookup
    await connectDatabase_1.pool.query(`INSERT INTO password_resets (user_id, otp_hash, expires_at, used)
     VALUES ($1, $2, NOW() + INTERVAL '${OTP_EXPIRY_MINUTES} minutes', false)
     ON CONFLICT (user_id)
     DO UPDATE SET otp_hash   = EXCLUDED.otp_hash,
                   expires_at = EXCLUDED.expires_at,
                   used       = false,
                   created_at = NOW()`, [user.id, otpHash]);
    await (0, sendWelcomeMail_1.sendMail)({
        type: 'password_reset',
        to: user.email,
        full_name: user.full_name,
        otp,
        expiryMinutes: OTP_EXPIRY_MINUTES,
    });
};
exports.requestPasswordResetService = requestPasswordResetService;
// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Verify OTP
// ─────────────────────────────────────────────────────────────────────────────
const verifyOTPService = async (email, otp) => {
    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = hashOTP(otp); // SHA-256 — used directly in WHERE clause
    const { rows } = await connectDatabase_1.pool.query(`SELECT pr.id, pr.user_id, pr.expires_at, pr.used
     FROM password_resets pr
     JOIN users u ON u.id = pr.user_id
     WHERE u.email = $1 AND pr.otp_hash = $2`, [normalizedEmail, otpHash]);
    if (!rows.length)
        throw new Error('Invalid OTP');
    const reset = rows[0];
    if (reset.used)
        throw new Error('OTP has already been used');
    if (new Date() > reset.expires_at)
        throw new Error('OTP has expired');
    // Generate reset token → hash with bcrypt before storing
    // Fetched by reset.id later (not by token), so random salt is fine
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const resetTokenHash = await hashResetToken(resetToken); // bcrypt ✓
    await connectDatabase_1.pool.query(`UPDATE password_resets
     SET reset_token_hash = $1,
         token_expires_at = NOW() + INTERVAL '10 minutes'
     WHERE id = $2`, [resetTokenHash, reset.id]);
    return { resetToken };
};
exports.verifyOTPService = verifyOTPService;
// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Reset Password
// ─────────────────────────────────────────────────────────────────────────────
const resetPasswordService = async (email, resetToken, newPassword) => {
    const normalizedEmail = email.toLowerCase().trim();
    const client = await connectDatabase_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Fetch by email (not by token hash — bcrypt is non-deterministic)
        const { rows } = await client.query(`SELECT pr.id, pr.user_id, pr.reset_token_hash, pr.token_expires_at, pr.used
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE u.email = $1 AND pr.reset_token_hash IS NOT NULL`, [normalizedEmail]);
        if (!rows.length)
            throw new Error('Invalid or expired reset token');
        const reset = rows[0];
        // bcrypt.compare — works correctly regardless of random salt
        const tokenValid = await bcrypt_1.default.compare(resetToken, reset.reset_token_hash);
        if (!tokenValid)
            throw new Error('Invalid or expired reset token');
        if (reset.used)
            throw new Error('Reset token already used');
        if (!reset.token_expires_at || new Date() > reset.token_expires_at)
            throw new Error('Reset token has expired');
        if (newPassword.length < 8)
            throw new Error('Password must be at least 8 characters');
        const hashed = await bcrypt_1.default.hash(newPassword, SALT_ROUNDS);
        // Update password + bump token_version → invalidates ALL existing JWTs
        await client.query(`UPDATE users
       SET password      = $1,
           token_version = token_version + 1,
           updated_at    = NOW()
       WHERE id = $2`, [hashed, reset.user_id]);
        // Revoke all refresh tokens for this user
        await client.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [reset.user_id]);
        // Mark reset record as used — can never be replayed
        await client.query(`UPDATE password_resets SET used = true WHERE id = $1`, [reset.id]);
        await client.query('COMMIT');
    }
    catch (err) {
        await client.query('ROLLBACK');
        throw err;
    }
    finally {
        client.release();
    }
};
exports.resetPasswordService = resetPasswordService;
const toggleUserStatusService = async (userId, is_active) => {
    const result = await connectDatabase_1.pool.query(`UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id`, [
        is_active,
        userId,
    ]);
    if (!result.rows.length) {
        throw new error_handler_1.AppError('User not found', 404, 'USER_NOT_FOUND');
    }
};
exports.toggleUserStatusService = toggleUserStatusService;
const resetUserPasswordService = async (userId, new_password) => {
    const hashed = await bcrypt_1.default.hash(new_password, SALT_ROUNDS);
    const result = await connectDatabase_1.pool.query(`UPDATE users SET password = $1 WHERE id = $2 RETURNING id`, [
        hashed,
        userId,
    ]);
    if (!result.rows.length) {
        throw new error_handler_1.AppError('User not found', 404, 'USER_NOT_FOUND');
    }
};
exports.resetUserPasswordService = resetUserPasswordService;
