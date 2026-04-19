import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ message: 'Email, password, and name are required' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
    const user = await User.create({ email, password, name });
    const token = generateToken(String(user._id));
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, streak: user.streak },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = generateToken(String(user._id));
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, streak: user.streak },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};

export const getMe = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user: { id: user._id, email: user.email, name: user.name, streak: user.streak, totalCardsReviewed: user.totalCardsReviewed } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: String(err) });
  }
};
