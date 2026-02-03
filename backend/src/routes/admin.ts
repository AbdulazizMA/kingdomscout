import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const [
    totalUsers,
    usersByTier,
    totalProperties,
    propertiesByStatus,
    propertiesByDealType,
    todayScraped,
    recentUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['subscription_tier'],
      _count: { subscription_tier: true }
    }),
    prisma.property.count(),
    prisma.property.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.property.groupBy({
      by: ['dealType'],
      _count: { dealType: true }
    }),
    prisma.property.count({
      where: {
        scrapedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscription_tier: true,
        createdAt: true
      }
    })
  ]);

  const premiumCount = usersByTier.find(u => u.subscription_tier === 'premium')?._count?.subscription_tier || 0;
  const proCount = usersByTier.find(u => u.subscription_tier === 'pro')?._count?.subscription_tier || 0;
  const estimatedMRR = (premiumCount * 29) + (proCount * 99);

  res.json({
    users: {
      total: totalUsers,
      byTier: usersByTier,
      recent: recentUsers
    },
    properties: {
      total: totalProperties,
      byStatus: propertiesByStatus,
      byDealType: propertiesByDealType,
      todayScraped
    },
    revenue: {
      estimatedMRR,
      premiumSubscribers: premiumCount,
      proSubscribers: proCount
    }
  });
}));

// List all users
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const querySchema = z.object({
    page: z.string().default('1'),
    limit: z.string().default('50'),
    tier: z.enum(['free', 'premium', 'pro']).optional(),
    status: z.enum(['active', 'inactive', 'cancelled']).optional(),
    search: z.string().optional()
  });

  const { page, limit, tier, status, search } = querySchema.parse(req.query);
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (tier) where.subscription_tier = tier;
  if (status) where.subscriptionStatus = status;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        subscription_tier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        isActive: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true
      }
    }),
    prisma.user.count({ where })
  ]);

  res.json({
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// Get single user
router.get('/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      favorites: {
        include: {
          property: {
            select: { id: true, title: true, price: true, mainImageUrl: true }
          }
        }
      },
      savedSearches: true,
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50
      }
    }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
}));

// Update user
router.patch('/users/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const schema = z.object({
    subscription_tier: z.enum(['free', 'premium', 'pro']).optional(),
    subscriptionStatus: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
    subscriptionEndsAt: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    isAdmin: z.boolean().optional()
  });

  const data = schema.parse(req.body);

  const user = await prisma.user.update({
    where: { id },
    data: {
      subscription_tier: data.subscription_tier,
      subscriptionStatus: data.subscriptionStatus,
      subscriptionEndsAt: data.subscriptionEndsAt 
        ? new Date(data.subscriptionEndsAt) 
        : undefined,
      isActive: data.isActive,
      isAdmin: data.isAdmin
    },
    select: {
      id: true,
      email: true,
      subscription_tier: true,
      subscriptionStatus: true,
      isActive: true,
      isAdmin: true
    }
  });

  res.json({ user });
}));

// Properties management
router.get('/properties', asyncHandler(async (req: Request, res: Response) => {
  const querySchema = z.object({
    page: z.string().default('1'),
    limit: z.string().default('50'),
    status: z.string().optional(),
    dealType: z.string().optional(),
    city: z.string().optional(),
    verified: z.string().optional()
  });

  const { page, limit, status, dealType, city, verified } = querySchema.parse(req.query);
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (status) where.status = status;
  if (dealType) where.dealType = dealType;
  if (verified !== undefined) where.isVerified = verified === 'true';
  if (city) where.city = { slug: city };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { scrapedAt: 'desc' },
      include: {
        city: { select: { nameEn: true } },
        district: { select: { nameEn: true } },
        propertyType: { select: { nameEn: true } }
      }
    }),
    prisma.property.count({ where })
  ]);

  res.json({
    properties,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// Update property
router.patch('/properties/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const schema = z.object({
    status: z.enum(['active', 'sold', 'expired', 'hidden']).optional(),
    isVerified: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    adminNotes: z.string().optional(),
    investmentScore: z.number().min(0).max(100).optional(),
    dealType: z.enum(['hot_deal', 'good_deal', 'fair_price', 'overpriced']).optional()
  });

  const data = schema.parse(req.body);

  const property = await prisma.property.update({
    where: { id },
    data,
    include: {
      city: true,
      district: true,
      propertyType: true
    }
  });

  res.json({ property });
}));

// Add comment to property
router.post('/properties/:id/comments', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  const schema = z.object({
    comment: z.string().min(1),
    isInternal: z.boolean().default(true)
  });

  const { comment, isInternal } = schema.parse(req.body);

  const propertyComment = await prisma.propertyComment.create({
    data: {
      propertyId: id,
      userId: req.user!.id,
      comment,
      isInternal
    },
    include: {
      user: { select: { firstName: true, lastName: true } }
    }
  });

  res.status(201).json({ comment: propertyComment });
}));

// Scraper jobs
router.get('/scraper-jobs', asyncHandler(async (req: Request, res: Response) => {
  const jobs = await prisma.scraperJob.findMany({
    orderBy: { startedAt: 'desc' },
    take: 100,
    include: {
      city: { select: { nameEn: true } },
      propertyType: { select: { nameEn: true } }
    }
  });

  res.json({ jobs });
}));

// Trigger scraper (would connect to actual scraper service)
router.post('/scraper-jobs', asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    cityId: z.string().optional(),
    propertyTypeId: z.string().optional()
  });

  const { cityId, propertyTypeId } = schema.parse(req.body);

  const job = await prisma.scraperJob.create({
    data: {
      cityId,
      propertyTypeId,
      status: 'running'
    }
  });

  // In production, this would trigger the actual scraper
  res.status(201).json({ job, message: 'Scraper job started' });
}));

export { router as adminRouter };
