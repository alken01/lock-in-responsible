import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { OAuth2Client } from 'google-auth-library';

export class AuthController {
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password || !name) {
        throw new ValidationError('Email, password, and name are required');
      }

      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
      }

      const result = await AuthService.register({ email, password, name });

      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      const result = await AuthService.login({ email, password });

      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      return sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { credential } = req.body;

      if (!credential) {
        throw new ValidationError('Google credential is required');
      }

      const result = await AuthService.googleLogin(credential);

      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      return sendSuccess(res, {}, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }
}
