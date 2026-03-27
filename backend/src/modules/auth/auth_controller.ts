import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { logAuditAction } from '../../utils/auditLogger';
import { logger } from '../../config/logger';
import { AppError } from '../../middlewares/error-handler';
import { ClientType, verifyRefreshToken } from '../../config/jwt';
import { uploadToS3 } from '../../middlewares/uploadMiddleware';
import {
  createUser,
  CreateUserInput,
  loginService,
  logoutService,
  getAllCleanersService,
  getCleanersBySupervisorService,
  getAllSupervisorsService,
  getSupervisorsByBuildingService,
  getAllAccountantsService,
  getAllAdminsService,
  toggleUserStatusService,
  resetUserPasswordService,
  requestPasswordResetService,
  verifyOTPService,
  resetPasswordService,
} from './auth_service';
import { sendWelcomeMail } from '../../config/sendWelcomeMail';

const VALID_CLIENT_TYPES: ClientType[] = ['web', 'mobile'];

// ============================================================
// REGISTER
// ============================================================

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // eslint-disable-next-line no-undef
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documentFile = files?.document?.[0];
    const profilePhotoFile = files?.profile_image?.[0];

    if (!documentFile) {
      throw new AppError('Document file is required', 400, 'DOCUMENT_FILE_REQUIRED');
    }

    let documentUrl: string;
    let profilePhotoUrl: string | undefined;

    try {
      documentUrl = await uploadToS3(documentFile);
      profilePhotoUrl = profilePhotoFile ? await uploadToS3(profilePhotoFile) : undefined;
    } catch (s3Err) {
      logger.error('S3 Upload Failed during registration', { error: s3Err });
      throw new AppError(
        'Failed to upload registration documents. Please check infrastructure configuration.',
        500,
        'S3_UPLOAD_FAILED'
      );
    }

    const role = req.body.role?.toLowerCase();
    if (!role) throw new AppError('Role is required', 400, 'ROLE_REQUIRED');

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

    let payload: CreateUserInput;

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
        throw new AppError('Invalid role provided', 400, 'INVALID_ROLE');
    }

    const user = await createUser(payload);

    // Send welcome email (fire-and-forget — errors are logged but don't fail registration)
    void sendWelcomeMail({
      to: base.email,
      full_name: base.full_name,
      password: base.password,
      role,
    }).catch((mailErr: unknown) => {
      console.error('[sendWelcomeMail] Failed to send welcome email:', mailErr);
    });

    return res.status(201).json({
      success: true,
      message: `${role} registered successfully`,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LOGIN
// client_type sent in request body — 'web' or 'mobile'
// web   → refresh token in httpOnly cookie, access token in body
// mobile → both tokens in body
// ============================================================

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, client_type = 'web' } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'CREDENTIALS_REQUIRED');
    }

    if (!client_type || !VALID_CLIENT_TYPES.includes(client_type)) {
      throw new AppError(
        `client_type is required and must be one of: ${VALID_CLIENT_TYPES.join(', ')}`,
        400,
        'INVALID_CLIENT_TYPE'
      );
    }

    const clientType = client_type as ClientType;

    const { user, accessToken, refreshToken } = await loginService(email, password, clientType);

    if (clientType === 'web') {
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
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
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LOGOUT
// ============================================================

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    const logoutAll = req.body?.logoutAll === true;

    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    let tokenId: string | undefined;

    if (rawRefreshToken && !logoutAll) {
      try {
        const payload = verifyRefreshToken(rawRefreshToken);
        tokenId = payload.tokenId;
      } catch {
        logger.warn('Could not verify refresh token during logout, clearing cookie anyway');
      }
    }

    await logoutService(userId, logoutAll ? undefined : tokenId);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: logoutAll ? 'Logged out from all devices' : 'Logout successful',
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// CLEANERS
// ============================================================

export const getCleaners = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAllCleanersService();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const getCleanersBySupervisor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supervisorId = req.params.supervisorId as string;
    if (!supervisorId) {
      throw new AppError('Supervisor ID is required', 400, 'SUPERVISOR_ID_REQUIRED');
    }
    const data = await getCleanersBySupervisorService(supervisorId);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// SUPERVISORS
// ============================================================

export const getAllSupervisors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAllSupervisorsService();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const getSupervisorsByBuilding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const buildingId = req.params.buildingId as string;
    if (!buildingId) {
      throw new AppError('Building ID is required', 400, 'BUILDING_ID_REQUIRED');
    }
    const data = await getSupervisorsByBuildingService(buildingId);
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ACCOUNTANTS & ADMINS
// ============================================================

export const getAllAccountantsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getAllAccountantsService();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const getAllAdminsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAllAdminsService();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN MANAGEMENT
// ============================================================

export const toggleUserStatusController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminId = req.user?.userId;

    if (is_active === undefined) {
      throw new AppError('is_active is required', 400, 'IS_ACTIVE_REQUIRED');
    }

    const data = await toggleUserStatusService(id as string, is_active);

    if (adminId) {
      await logAuditAction(adminId, 'TOGGLE_USER_STATUS', { target_user_id: id, is_active });
    }

    return res.status(200).json({
      success: true,
      message: `User status updated to ${is_active ? 'active' : 'inactive'}`,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const resetUserPasswordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const adminId = req.user?.userId;

    if (!new_password) {
      throw new AppError('new_password is required', 400, 'PASSWORD_REQUIRED');
    }

    await resetUserPasswordService(id as string, new_password);

    if (adminId) {
      await logAuditAction(adminId, 'RESET_USER_PASSWORD', { target_user_id: id });
    }

    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400, 'EMAIL_REQUIRED');

    await requestPasswordResetService(email);

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a reset code has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOTPController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new AppError('Email and OTP are required', 400, 'FIELDS_REQUIRED');

    const { resetToken } = await verifyOTPService(email, otp);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      resetToken,
    });
  } catch (err) {
    next(err);
  }
};

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      throw new AppError('Email, resetToken and newPassword are required', 400, 'FIELDS_REQUIRED');
    }

    await resetPasswordService(email, resetToken, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in.',
    });
  } catch (err) {
    next(err);
  }
};
