import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/signup', validateSignup, AuthController.signup);
router.post('/login', validateLogin, AuthController.login);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);

export default router;
