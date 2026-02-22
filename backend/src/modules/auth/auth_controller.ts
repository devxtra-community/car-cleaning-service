import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';
import { AppError } from 'src/middlewares/error-handler';
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
} from './auth_service';
import { sendWelcomeMail } from 'src/config/sendWelcomeMail';

const VALID_CLIENT_TYPES: ClientType[] = ['web', 'mobile'];

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documentFile = files?.document?.[0];
    const profilePhotoFile = files?.profile_image?.[0];

    if (!documentFile) {
      throw new AppError('Document file is required', 400, 'DOCUMENT_FILE_REQUIRED');
    }

    const documentUrl = await uploadToS3(documentFile);
    const profilePhotoUrl = profilePhotoFile ? await uploadToS3(profilePhotoFile) : undefined;

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

    // ── Send welcome email (fire-and-forget) ──────────────────
    // Using void intentionally: mail errors are logged but do NOT
    // cause the registration to fail. Switch to await if you need
    // guaranteed delivery before responding.
    void sendWelcomeMail({
      to: base.email,
      full_name: base.full_name,
      password: base.password, // plain-text password, before hashing
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

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, client_type } = req.body;

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
  } catch (err) {
    next(err);
  }
};

// ============================================================
// LOGOUT
// Reads refresh token from cookie to delete that specific session
// logoutAll=true in body deletes all sessions for the user
// ============================================================

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawRefreshToken = req.cookies?.refreshToken;
    const logoutAll = req.body?.logoutAll === true;

    // Get userId from auth middleware (your existing middleware sets req.user)
    const userId = (req as Request & { user?: { userId: string } }).user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    let tokenId: string | undefined;

    // Extract tokenId from cookie to delete only this session
    if (rawRefreshToken && !logoutAll) {
      try {
        const payload = verifyRefreshToken(rawRefreshToken);
        tokenId = payload.tokenId;
      } catch {
        // Token already invalid or expired — still proceed with logout
        logger.warn('Could not verify refresh token during logout, clearing cookie anyway');
      }
    }

    await logoutService(userId, logoutAll ? undefined : tokenId);

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
