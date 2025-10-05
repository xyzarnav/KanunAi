// backend/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import User from '../models/user.model';

export const createUser = async (req: Request, res: Response) => {
  try {
    const { authId, name, email, mobile, role } = req.body;
    
    const user = new User({
      authId,
      name,
      email,
      mobile,
      role
    });
    
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error creating user', error });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
  const { authId } = req.params;
  const user = await User.findOne({ authId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};