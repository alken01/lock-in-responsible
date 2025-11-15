import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';

const router = Router();

// No auth required for demo
router.get('/', GoalController.listGoals);
router.post('/', GoalController.createGoal);
router.get('/:goalId', GoalController.getGoal);
router.patch('/:goalId', GoalController.updateGoal);
router.delete('/:goalId', GoalController.deleteGoal);
router.post('/:goalId/verify', GoalController.verifyGoal);

export default router;
