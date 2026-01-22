import { Router } from 'express';
import { login, registerUser } from './auth_controller';

const router = Router();

router.post('/register', registerUser);
router.post('/login', login);

export default router;
