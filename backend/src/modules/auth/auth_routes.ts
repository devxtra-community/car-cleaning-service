import { Router, Request, Response } from 'express';
import {
  registerUser,
  login,
  logout,
  getCleanersBySupervisor,
  getAllSupervisors,
  getAllAccountantsController,
  getAllAdminsController,
  getCleaners,
} from './auth_controller';
import { uploadDocumentToS3, handleMulterError } from '../../middlewares/uploadMiddleware';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';
import { refresh } from './refresh';
import {
  requestPasswordResetService,
  verifyOTPService,
  resetPasswordService,
} from './auth_service';

const router = Router();

router.post(
  '/register',
  uploadDocumentToS3,
  handleMulterError,
  protect,
  allowRoles('admin', 'super_admin'),
  registerUser
);

router.post('/login', login);

router.post('/logout', protect, logout);

router.get('/supervisors', protect, allowRoles('admin'), getAllSupervisors);
router.get(
  '/accountants',
  protect,
  allowRoles('admin', 'super_admin'),
  getAllAccountantsController
);
router.get('/admins', protect, allowRoles('super_admin'), getAllAdminsController);
router.get('/cleaners', protect, allowRoles('admin', 'super_admin'), getCleaners);

router.post('/refresh', refresh);

router.get('/supervisor/:supervisorId', protect, allowRoles('admin'), getCleanersBySupervisor);

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
// Body: { email }
// Sends OTP to email. Always returns 200 (no email enumeration).
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) return res.status(400).json({ message: 'Email is required' });

    await requestPasswordResetService(email);

    res.json({
      message: 'If that email exists, a reset code has been sent.',
    });
  } catch (err) {
    console.error('forgot-password error:', err);
    // Still return 200 to avoid enumeration
    res.json({ message: 'If that email exists, a reset code has been sent.' });
  }
});

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
// Body: { email, otp }
// Returns { resetToken } on success.
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body as { email?: string; otp?: string };
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const result = await verifyOTPService(email, otp);
    res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Verification failed';
    res.status(400).json({ message: msg });
  }
});

// ── POST /api/auth/reset-password ────────────────────────────────────────────
// Body: { email, resetToken, newPassword }
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, resetToken, newPassword } = req.body as {
      email?: string;
      resetToken?: string;
      newPassword?: string;
    };
    if (!email || !resetToken || !newPassword)
      return res.status(400).json({ message: 'All fields are required' });

    await resetPasswordService(email, resetToken, newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Reset failed';
    res.status(400).json({ message: msg });
  }
});

export default router;
