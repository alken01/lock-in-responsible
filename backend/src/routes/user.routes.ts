import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, UserController.getProfile);
router.patch('/me', authenticate, UserController.updateProfile);

export default router;
