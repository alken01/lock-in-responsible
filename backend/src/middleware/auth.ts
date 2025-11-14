import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import config from '../config';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
  device?: {
    id: string;
    userId: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        userId: string;
        email: string;
        name: string;
      };

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      req.user = user;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const authenticateDevice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-device-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedError('Missing device API key');
    }

    const device = await prisma.device.findUnique({
      where: { apiKey },
      select: { id: true, userId: true },
    });

    if (!device) {
      throw new UnauthorizedError('Invalid device API key');
    }

    req.device = device;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireOwnership = (resourceType: 'device' | 'goal') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const resourceId = req.params[`${resourceType}Id`];

      if (!resourceId) {
        throw new ForbiddenError('Resource ID not provided');
      }

      let resource;

      if (resourceType === 'device') {
        resource = await prisma.device.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
      } else if (resourceType === 'goal') {
        resource = await prisma.goal.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
      }

      if (!resource) {
        throw new ForbiddenError('Resource not found');
      }

      if (resource.userId !== req.user.id) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
