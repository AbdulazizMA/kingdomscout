import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
      preferredLanguage: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      emailNotifications: true,
      telegramNotifications: true,
      telegramChatId: true,
      createdAt: true
    }
  });

  res.json({ user });
}));

// Update profile
router.patch('/profile', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
    preferredLanguage: z.enum(['en', 'ar']).optional()
  });

  const data = schema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      preferredLanguage: true
    }
  });

  res.json({ user });
}));

// Change password
router.post('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8)
  });

  const { currentPassword, newPassword } = schema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id }
  });

  if (!user || !await bcrypt.compare(currentPassword, user.passwordHash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { passwordHash: newHash }
  });

  res.json({ message: 'Password updated successfully' });
}));

// Update notification preferences
router.patch('/notifications', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    emailNotifications: z.boolean().optional(),
    telegramNotifications: z.boolean().optional(),
    telegramChatId: z.string().optional()
  });

  const data = schema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      emailNotifications: true,
      telegramNotifications: true,
      telegramChatId: true
    }
  });

  res.json({ preferences: user });
}));

// Saved searches CRUD - FREE (no subscription required)
router.get('/searches', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const searches = await prisma.savedSearch.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ searches });
}));

router.post('/searches', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    name: z.string().min(1),
    filters: z.object({
      cities: z.array(z.string()).optional(),
      districts: z.array(z.string()).optional(),
      propertyTypes: z.array(z.string()).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      minSize: z.number().optional(),
      maxSize: z.number().optional(),
      bedrooms: z.number().optional(),
      minScore: z.number().optional(),
      dealTypes: z.array(z.string()).optional()
    }),
    emailAlerts: z.boolean().default(true),
    telegramAlerts: z.boolean().default(false)
  });

  const data = schema.parse(req.body);

  const search = await prisma.savedSearch.create({
    data: {
      userId: req.user!.id,
      name: data.name,
      filters: data.filters,
      emailAlerts: data.emailAlerts,
      telegramAlerts: data.telegramAlerts
    }
  });

  res.status(201).json({ search });
}));

router.patch('/searches/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const schema = z.object({
    name: z.string().min(1).optional(),
    filters: z.object({
      cities: z.array(z.string()).optional(),
      districts: z.array(z.string()).optional(),
      propertyTypes: z.array(z.string()).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      minSize: z.number().optional(),
      maxSize: z.number().optional(),
      bedrooms: z.number().optional(),
      minScore: z.number().optional(),
      dealTypes: z.array(z.string()).optional()
    }).optional(),
    emailAlerts: z.boolean().optional(),
    telegramAlerts: z.boolean().optional(),
    isActive: z.boolean().optional()
  });

  const data = schema.parse(req.body);

  const search = await prisma.savedSearch.updateMany({
    where: { id, userId: req.user!.id },
    data
  });

  res.json({ search });
}));

router.delete('/searches/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await prisma.savedSearch.deleteMany({
    where: { id, userId: req.user!.id }
  });

  res.json({ message: 'Search deleted' });
}));

// Dashboard stats
router.get('/dashboard', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [
    favoritesCount,
    searchesCount,
    recentActivity,
    newDealsCount
  ] = await Promise.all([
    prisma.userFavorite.count({ where: { userId } }),
    prisma.savedSearch.count({ where: { userId } }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.property.count({
      where: {
        status: 'active',
        scrapedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    })
  ]);

  res.json({
    stats: {
      favoritesCount,
      searchesCount,
      newDealsCount,
      matchedDeals: newDealsCount,
      subscriptionStatus: 'active'
    },
    recentActivity,
    savedSearches: await prisma.savedSearch.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, newDealsCount: true }
    })
  });
}));

export { router as userRouter };
