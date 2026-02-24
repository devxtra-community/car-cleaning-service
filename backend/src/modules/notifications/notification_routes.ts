import express, { Response } from 'express';
import { protect } from '../../middlewares/authMiddleware';
import { registerPushToken, removePushToken, sendNotificationToUser } from './notification_service';

// Define AuthRequest type
interface AuthRequest extends express.Request {
  user?: {
    userId: string;
    role: string;
  };
}

const router = express.Router();

router.post('/register-token', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token required' });
    }

    const success = await registerPushToken(userId, token);

    if (success) {
      return res.json({ success: true, message: 'Token registered' });
    } else {
      return res.status(400).json({ success: false, message: 'Failed to register token' });
    }
  } catch (error) {
    console.error('Error in register-token:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/token', protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const success = await removePushToken(userId);

    if (success) {
      return res.json({ success: true, message: 'Token removed' });
    } else {
      return res.status(500).json({ success: false, message: 'Failed to remove token' });
    }
  } catch (error) {
    console.error('Error in remove-token:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/test', protect, async (req: AuthRequest, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not available in production' });
  }

  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const success = await sendNotificationToUser(
      userId,
      '🧪 Test Notification',
      'This is a test push notification',
      { test: true }
    );

    return res.json({ success, message: success ? 'Sent' : 'Failed' });
  } catch (error) {
    console.error('Error in test:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
