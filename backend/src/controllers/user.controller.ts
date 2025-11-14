import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import prisma from '../utils/db';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          email: true,
          name: true,
          preferences: true,
          totalGoalsCompleted: true,
          currentStreak: true,
          longestStreak: true,
          createdAt: true,
          _count: {
            select: {
              devices: true,
            },
          },
        },
      });

      return sendSuccess(res, {
        ...user,
        stats: {
          totalGoalsCompleted: user!.totalGoalsCompleted,
          currentStreak: user!.currentStreak,
          longestStreak: user!.longestStreak,
          devicesOwned: user!._count.devices,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, preferences } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (preferences) updateData.preferences = preferences;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          preferences: true,
          updatedAt: true,
        },
      });

      return sendSuccess(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { period = 'week' } = req.query;

      // Calculate date range
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'all':
          startDate = new Date(0);
          break;
      }

      // Get goals in period
      const goals = await prisma.goal.findMany({
        where: {
          userId: req.user!.id,
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          status: true,
          type: true,
          completedAt: true,
        },
      });

      const goalsCreated = goals.length;
      const goalsCompleted = goals.filter((g) => g.status === 'completed').length;
      const completionRate = goalsCreated > 0 ? goalsCompleted / goalsCreated : 0;

      // Get unlock events
      const unlockLogs = await prisma.deviceLog.findMany({
        where: {
          device: {
            userId: req.user!.id,
          },
          eventType: 'unlock_success',
          timestamp: {
            gte: startDate,
          },
        },
        select: {
          timestamp: true,
        },
      });

      // Calculate average unlock time
      let averageUnlockTime = '00:00:00';
      if (unlockLogs.length > 0) {
        const totalMinutes = unlockLogs.reduce((sum, log) => {
          const hours = log.timestamp.getHours();
          const minutes = log.timestamp.getMinutes();
          return sum + hours * 60 + minutes;
        }, 0);

        const avgMinutes = Math.floor(totalMinutes / unlockLogs.length);
        const hours = Math.floor(avgMinutes / 60);
        const minutes = avgMinutes % 60;
        averageUnlockTime = `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:00`;
      }

      // Top goal types
      const goalTypeCounts = goals.reduce((acc: any, goal) => {
        acc[goal.type] = (acc[goal.type] || 0) + 1;
        return acc;
      }, {});

      const topGoalTypes = Object.entries(goalTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      return sendSuccess(res, {
        period,
        stats: {
          goalsCreated,
          goalsCompleted,
          completionRate,
          currentStreak: (await prisma.user.findUnique({ where: { id: req.user!.id } }))!
            .currentStreak,
          totalUnlocks: unlockLogs.length,
          averageUnlockTime,
          topGoalTypes,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
