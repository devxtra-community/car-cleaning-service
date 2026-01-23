import { Router } from 'express';
import { login, logout, registerUser } from './auth_controller';

const router = Router();

router.post('/register', registerUser);
router.post('/login', login);
router.post('/logout', logout);

export default router;
