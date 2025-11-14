import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authenticate, requireOwnership } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, GoalController.listGoals);
router.post('/', authenticate, GoalController.createGoal);
router.get('/:goalId', authenticate, requireOwnership('goal'), GoalController.getGoal);
router.patch('/:goalId', authenticate, requireOwnership('goal'), GoalController.updateGoal);
router.delete('/:goalId', authenticate, requireOwnership('goal'), GoalController.deleteGoal);
router.post('/:goalId/verify', authenticate, requireOwnership('goal'), GoalController.verifyGoal);

export default router;
