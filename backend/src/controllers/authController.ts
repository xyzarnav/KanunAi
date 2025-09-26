import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/authService.js';

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await AuthService.signup(req.body);
      
      res.status(201).json({
        message: 'User created successfully',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Signup failed'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { emailOrMobile, password } = req.body;
      const result = await AuthService.login(emailOrMobile, password);
      
      res.status(200).json({
        message: 'Login successful',
        data: result
      });
    } catch (error: any) {
      res.status(401).json({
        message: error.message || 'Login failed'
      });
    }
  }

  static async getProfile(req: any, res: Response) {
    try {
      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: {
          user: req.user
        }
      });
    } catch (error: any) {
      res.status(500).json({
        message: 'Failed to retrieve profile'
      });
    }
  }
}
