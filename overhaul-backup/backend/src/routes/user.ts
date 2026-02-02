import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireSubscription } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/profile', authenticate, asyncHandler(async (req: AuthRequest, res) => {
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
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
      emailNotifications: true,
      telegramNotifications: true,
      telegramChatId: true,
      whatsappNotifications: true,
      whatsappNumber: true,
      createdAt: true
    }
  });

  res.json({ user });
}));

// Update profile
router.patch('/profile', authenticate, asyncHandler(async (req: AuthRequest, res) => {
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
router.post('/change-password', authenticate, asyncHandler(async (req: AuthRequest, res) => {
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
router.patch('/notifications', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    emailNotifications: z.boolean().optional(),
    telegramNotifications: z.boolean().optional(),
    telegramChatId: z.string().optional(),
    whatsappNotifications: z.boolean().optional(),
    whatsappNumber: z.string().optional()
  });

  const data = schema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: {
      emailNotifications: true,
      telegramNotifications: true,
      telegramChatId: true,
      whatsappNotifications: true,
      whatsappNumber: true
    }
  });

  res.json({ preferences: user });
}));

// Saved searches CRUD
router.get('/searches', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const searches = await prisma.savedSearch.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ searches });
}));

router.post('/searches', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1),
    filters: z.object({
      cities: z.array(z.string()).optional(),
      districts: z.array(z.string()).optional(),
      propertyTypes: z.array(z.string()).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
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

router.delete('/searches/:id', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  await prisma.savedSearch.deleteMany({
    where: { id, userId: req.user!.id }
  });

  res.json({ message: 'Search deleted' });
}));

// API Tokens (Pro tier only)
router.get('/api-tokens', authenticate, requireSubscription('pro'), asyncHandler(async (req: AuthRequest, res) => {
  const tokens = await prisma.apiToken.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      name: true,
      lastUsedAt: true,
      requestCount: true,
      expiresAt: true,
      isActive: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ tokens });
}));

router.post('/api-tokens', authenticate, requireSubscription('pro'), asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    name: z.string().min(1),
    expiresInDays: z.number().min(1).max(365).optional()
  });

  const { name, expiresInDays } = schema.parse(req.body);

  // Generate token
  const token = require('crypto').randomBytes(32).toString('hex');
  const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');

  const apiToken = await prisma.apiToken.create({
    data: {
      userId: req.user!.id,
      tokenHash,
      name,
      expiresAt: expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null
    },
    select: {
      id: true,
      name: true,
      expiresAt: true,
      isActive: true,
      createdAt: true
    }
  });

  // Return the actual token only once
  res.status(201).json({
    token, // This is the only time user sees the full token
    apiToken
  });
}));

router.delete('/api-tokens/:id', authenticate, requireSubscription('pro'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  await prisma.apiToken.deleteMany({
    where: { id, userId: req.user!.id }
  });

  res.json({ message: 'Token revoked' });
}));

// Dashboard stats
router.get('/dashboard', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const tier = req.user!.subscriptionTier;

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

  // Get personalized stats based on saved searches
  let matchedDeals = 0;
  if (tier !== 'free') {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId, isActive: true }
    });
    // Calculate matched deals based on filters (simplified)
    matchedDeals = newDealsCount; // In real implementation, filter by search criteria
  }

  res.json({
    stats: {
      favoritesCount,
      searchesCount,
      newDealsCount,
      matchedDeals,
      subscriptionTier: tier,
      subscriptionStatus: req.user!.subscriptionStatus
    },
    recentActivity,
    savedSearches: await prisma.savedSearch.findMany({
      where: { userId, isActive: true },
      select: { id: true, name: true, newDealsCount: true }
    })
  });
}));

export { router as userRouter };
