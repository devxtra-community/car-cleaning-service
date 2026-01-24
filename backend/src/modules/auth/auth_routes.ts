import { Router } from 'express';
import { login, logout, registerUser } from './auth_controller';
import { upload } from '../../middlewares/multer';
const router = Router();

router.post('/register', upload.single('document'), registerUser);
router.post('/login', login);
router.post('/logout', logout);

export default router;
