import { Router } from 'express';
import { login, logout, registerUser } from './auth_controller';
import { protect } from 'src/middlewares/authMiddleware';
import { allowRoles } from 'src/middlewares/roleMiddleware';
import { uploadTaskImageToS3 } from 'src/middlewares/uploadToS3';
const router = Router();

router.post(
  '/register',
  protect,
  allowRoles('admin', 'super_admin'),
  uploadTaskImageToS3.single('document'),
  registerUser
);
router.post('/login', login);
router.post('/logout', logout);
export default router;
