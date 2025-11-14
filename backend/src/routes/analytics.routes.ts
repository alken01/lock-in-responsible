import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, UserController.getStats);

export default router;
