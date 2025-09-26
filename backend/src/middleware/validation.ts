import { body, ValidationChain } from 'express-validator';

export const validateSignup: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('mobile')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid mobile number'),
  
  body('role')
    .isIn(['user', 'lawyer'])
    .withMessage('Role must be either user or lawyer'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

export const validateLogin: ValidationChain[] = [
  body('emailOrMobile')
    .notEmpty()
    .withMessage('Email or mobile is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];
