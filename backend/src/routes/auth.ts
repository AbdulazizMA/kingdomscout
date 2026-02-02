import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
  preferredLanguage: z.string().default('ar')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });
  
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  const passwordHash = await bcrypt.hash(data.password, 12);
  
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      preferredLanguage: data.preferredLanguage
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      preferredLanguage: true,
      createdAt: true
    }
  });
  
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  res.status(201).json({
    message: 'Registration successful',
    user,
    token
  });
}));

// Login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  });
  
  if (!user || !await bcrypt.compare(data.password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  
  if (!user.isActive) {
    return res.status(401).json({ error: 'Account has been deactivated' });
  }
  
  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });
  
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      isAdmin: user.isAdmin
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      subscriptionStatus: 'active',
      preferredLanguage: user.preferredLanguage
    },
    token
  });
}));

// Forgot password
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  
  // In production, send actual email with reset link
  // For now, just acknowledge
  res.json({ 
    message: 'If an account exists with this email, password reset instructions have been sent.'
  });
}));

// Reset password
router.post('/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string(),
    password: z.string().min(8)
  });
  
  const { token, password } = schema.parse(req.body);
  
  // Verify token and update password
  // Implementation depends on your token storage strategy
  
  res.json({ message: 'Password has been reset successfully' });
}));

export { router as authRouter };
