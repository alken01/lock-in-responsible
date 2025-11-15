import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { ValidationError, NotFoundError } from '../utils/errors';
import prisma from '../utils/db';
import { LLMService } from '../services/llm.service';

const llmService = new LLMService();

export class GoalController {
  static async listGoals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, date } = req.query;

      const where: any = { userId: req.user!.id };

      if (status) {
        where.status = status;
      }

      if (date) {
        const targetDate = new Date(date as string);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        where.dueDate = {
          gte: targetDate,
          lt: nextDay,
        };
      }

      const goals = await prisma.goal.findMany({
        where,
        include: {
          verifications: {
            select: {
              id: true,
              status: true,
              confidence: true,
              feedback: true,
              verifiedAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, { goals });
    } catch (error) {
      next(error);
    }
  }

  static async createGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        title,
        description,
        type,
        target,
        dueDate,
        verificationType,
        verificationConfig,
      } = req.body;

      // Validation
      if (!title || !type) {
        throw new ValidationError('Title and type are required');
      }

      const goal = await prisma.goal.create({
        data: {
          title,
          description,
          type,
          target: target || 1,
          dueDate: dueDate ? new Date(dueDate) : null,
          verificationType: verificationType || 'manual',
          verificationConfig: verificationConfig || {},
          userId: req.user!.id,
        },
      });

      return sendSuccess(res, goal, 'Goal created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params;

      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: {
          verifications: {
            select: {
              id: true,
              status: true,
              proofType: true,
              proofUrl: true,
              proofText: true,
              confidence: true,
              feedback: true,
              verifiedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!goal) {
        throw new NotFoundError('Goal not found');
      }

      return sendSuccess(res, goal);
    } catch (error) {
      next(error);
    }
  }

  static async updateGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params;
      const { title, description, target, dueDate } = req.body;

      // Check if goal exists and is not completed
      const existingGoal = await prisma.goal.findUnique({
        where: { id: goalId },
      });

      if (!existingGoal) {
        throw new NotFoundError('Goal not found');
      }

      if (existingGoal.status === 'completed') {
        throw new ValidationError('Cannot update completed goal');
      }

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (target) updateData.target = target;
      if (dueDate) updateData.dueDate = new Date(dueDate);

      const goal = await prisma.goal.update({
        where: { id: goalId },
        data: updateData,
      });

      return sendSuccess(res, goal, 'Goal updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params;

      await prisma.goal.delete({
        where: { id: goalId },
      });

      return sendSuccess(res, {}, 'Goal deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async verifyGoal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { goalId } = req.params;
      const { proofType, proofText, proofUrl } = req.body;

      // Get goal
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
      });

      if (!goal) {
        throw new NotFoundError('Goal not found');
      }

      if (goal.status === 'completed') {
        throw new ValidationError('Goal already completed');
      }

      // For GitHub goals, use direct API verification
      if (goal.type.startsWith('github_')) {
        return this.verifyGitHubGoal(req, res, next);
      }

      // For other goals, use LLM verification
      const result = await llmService.verifyGoal({
        goalTitle: goal.title,
        goalDescription: goal.description || '',
        goalType: goal.type,
        target: goal.target,
        proofType,
        proofText,
        proofImageUrl: proofUrl,
      });

      // Create verification record
      const verification = await prisma.verification.create({
        data: {
          goalId,
          userId: req.user!.id,
          status: result.verified && result.confidence >= 0.8 ? 'verified' : 'rejected',
          proofType,
          proofText,
          proofUrl,
          confidence: result.confidence,
          feedback: result.feedback,
          llmProvider: result.llmProvider,
          llmModel: result.llmModel,
          llmResponse: result.llmResponse,
          verifiedAt: result.verified && result.confidence >= 0.8 ? new Date() : null,
        },
      });

      // Update goal if verified
      if (result.verified && result.confidence >= 0.8) {
        await prisma.goal.update({
          where: { id: goalId },
          data: {
            status: 'completed',
            progress: goal.target,
            completedAt: new Date(),
          },
        });

        // Update user stats
        await prisma.user.update({
          where: { id: req.user!.id },
          data: {
            totalGoalsCompleted: {
              increment: 1,
            },
          },
        });
      }

      return sendSuccess(res, {
        verification: {
          id: verification.id,
          status: verification.status,
          confidence: verification.confidence,
          feedback: verification.feedback,
          verifiedAt: verification.verifiedAt,
        },
        goal: {
          id: goal.id,
          status: result.verified && result.confidence >= 0.8 ? 'completed' : 'pending',
          completedAt: result.verified && result.confidence >= 0.8 ? new Date() : null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private static async verifyGitHubGoal(req: AuthRequest, res: Response, next: NextFunction) {
    // Placeholder for GitHub API verification
    // This would check GitHub API for commits, PRs, etc.
    return sendSuccess(res, {
      message: 'GitHub verification not yet implemented',
    });
  }
}
