import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { ValidationError, NotFoundError, GoalNotCompleteError } from '../utils/errors';
import prisma from '../utils/db';
import crypto from 'crypto';
import config from '../config';

export class DeviceController {
  static async listDevices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const devices = await prisma.device.findMany({
        where: { userId: req.user!.id },
        select: {
          id: true,
          name: true,
          macAddress: true,
          status: true,
          lastSeen: true,
          firmwareVersion: true,
          batteryLevel: true,
          lockState: true,
          settings: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, { devices });
    } catch (error) {
      next(error);
    }
  }

  static async getDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceId } = req.params;

      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        select: {
          id: true,
          name: true,
          macAddress: true,
          status: true,
          lastSeen: true,
          firmwareVersion: true,
          batteryLevel: true,
          wifiRssi: true,
          lockState: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!device) {
        throw new NotFoundError('Device not found');
      }

      return sendSuccess(res, device);
    } catch (error) {
      next(error);
    }
  }

  static async pairDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceMac, deviceName } = req.body;

      if (!deviceMac || !deviceName) {
        throw new ValidationError('Device MAC address and name are required');
      }

      // Check if device already exists
      const existing = await prisma.device.findUnique({
        where: { macAddress: deviceMac },
      });

      if (existing) {
        throw new ValidationError('Device already paired');
      }

      // Generate API key for device
      const apiKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;

      const device = await prisma.device.create({
        data: {
          name: deviceName,
          macAddress: deviceMac,
          apiKey,
          userId: req.user!.id,
          status: 'online',
          lastSeen: new Date(),
        },
        select: {
          id: true,
          name: true,
          macAddress: true,
          apiKey: true,
          createdAt: true,
        },
      });

      return sendSuccess(res, { device }, 'Device paired successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceId } = req.params;
      const { name, settings } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (settings) updateData.settings = settings;

      const device = await prisma.device.update({
        where: { id: deviceId },
        data: updateData,
        select: {
          id: true,
          name: true,
          settings: true,
          updatedAt: true,
        },
      });

      return sendSuccess(res, device, 'Device updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceId } = req.params;

      await prisma.device.delete({
        where: { id: deviceId },
      });

      return sendSuccess(res, {}, 'Device deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async requestUnlock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceId } = req.params;

      // Check if all goals for today are completed
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const pendingGoals = await prisma.goal.findMany({
        where: {
          deviceId,
          status: 'pending',
          dueDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: {
          id: true,
          title: true,
          progress: true,
          target: true,
        },
      });

      if (pendingGoals.length > 0) {
        throw new GoalNotCompleteError('Complete your daily goals first', {
          pendingGoals,
        });
      }

      // Generate unlock code
      const codeLength = config.device.defaultCodeLength;
      const code = this.generateCode(codeLength);

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + config.device.defaultCodeExpirySeconds);

      await prisma.unlockCode.create({
        data: {
          code,
          deviceId,
          expiresAt,
        },
      });

      return sendSuccess(res, {
        unlockCode: code,
        expiresAt,
        expiresIn: config.device.defaultCodeExpirySeconds,
      });
    } catch (error) {
      next(error);
    }
  }

  // Device API endpoints (called by ESP32)
  static async heartbeat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { macAddress, firmwareVersion, lockState, batteryLevel, wifiRssi, uptime } = req.body;

      await prisma.device.update({
        where: { id: req.device!.id },
        data: {
          status: 'online',
          lastSeen: new Date(),
          firmwareVersion,
          lockState,
          batteryLevel,
          wifiRssi,
        },
      });

      // Log heartbeat
      await prisma.deviceLog.create({
        data: {
          deviceId: req.device!.id,
          eventType: 'heartbeat',
          metadata: { uptime, wifiRssi, batteryLevel },
        },
      });

      return sendSuccess(res, {
        deviceId: req.device!.id,
        serverTime: new Date().toISOString(),
        pendingCommands: [],
      });
    } catch (error) {
      next(error);
    }
  }

  static async validateCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;

      if (!code) {
        throw new ValidationError('Code is required');
      }

      // Find valid code
      const unlockCode = await prisma.unlockCode.findFirst({
        where: {
          deviceId: req.device!.id,
          code,
          usedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!unlockCode) {
        // Log failed attempt
        await prisma.deviceLog.create({
          data: {
            deviceId: req.device!.id,
            eventType: 'unlock_fail',
            metadata: { code, reason: 'invalid_or_expired' },
          },
        });

        return sendSuccess(res, {
          valid: false,
          action: 'deny',
        });
      }

      // Mark code as used
      await prisma.unlockCode.update({
        where: { id: unlockCode.id },
        data: { usedAt: new Date() },
      });

      // Update lock state
      await prisma.device.update({
        where: { id: req.device!.id },
        data: { lockState: 'unlocked' },
      });

      // Log successful unlock
      await prisma.deviceLog.create({
        data: {
          deviceId: req.device!.id,
          eventType: 'unlock_success',
          metadata: { code },
        },
      });

      return sendSuccess(res, {
        valid: true,
        action: 'unlock',
        duration: 5,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logEvent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { eventType, metadata } = req.body;

      if (!eventType) {
        throw new ValidationError('Event type is required');
      }

      await prisma.deviceLog.create({
        data: {
          deviceId: req.device!.id,
          eventType,
          metadata: metadata || {},
        },
      });

      return sendSuccess(res, {}, 'Event logged successfully');
    } catch (error) {
      next(error);
    }
  }

  private static generateCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }
}
