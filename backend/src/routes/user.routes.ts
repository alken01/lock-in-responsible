import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();

// No auth required for demo
router.get('/me', UserController.getProfile);
router.patch('/me', UserController.updateProfile);
router.get('/stats', UserController.getStats);

export default router;
