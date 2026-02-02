import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest, requireSubscription } from '../middleware/auth';

const router = Router();

// Public: List properties (limited for free tier)
router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const querySchema = z.object({
    page: z.string().default('1'),
    limit: z.string().default('20'),
    city: z.string().optional(),
    district: z.string().optional(),
    type: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    minScore: z.string().optional(),
    dealType: z.enum(['hot_deal', 'good_deal', 'fair_price']).optional(),
    sortBy: z.enum(['price', 'score', 'date', 'price_per_sqm']).default('score'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  });

  const {
    page, limit, city, district, type,
    minPrice, maxPrice, minScore, dealType,
    sortBy, sortOrder
  } = querySchema.parse(req.query);

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = { status: 'active' };
  
  if (city) where.city = { slug: city };
  if (district) where.district = { slug: district };
  if (type) where.propertyType = { slug: type };
  if (dealType) where.dealType = dealType;
  if (minPrice) where.price = { gte: parseFloat(minPrice) };
  if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
  if (minScore) where.investmentScore = { gte: parseInt(minScore) };

  // Determine sort field
  const sortField: any = {};
  switch (sortBy) {
    case 'price': sortField.price = sortOrder;
    case 'score': sortField.investmentScore = sortOrder;
    case 'date': sortField.scrapedAt = sortOrder;
    case 'price_per_sqm': sortField.pricePerSqm = sortOrder;
    default: sortField.investmentScore = 'desc';
  }

  // For free tier, limit results
  const userTier = req.user?.subscriptionTier || 'free';
  const maxResults = userTier === 'free' ? 3 : limitNum;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      take: maxResults,
      skip: userTier === 'free' ? 0 : skip,
      orderBy: sortField,
      include: {
        city: { select: { nameEn: true, nameAr: true, slug: true } },
        district: { select: { nameEn: true, nameAr: true, slug: true } },
        propertyType: { select: { nameEn: true, nameAr: true, slug: true } }
      }
    }),
    prisma.property.count({ where })
  ]);

  // Mask sensitive data for free tier
  const maskedProperties = properties.map(p => ({
    ...p,
    contactPhone: userTier === 'free' ? null : p.contactPhone,
    description: userTier === 'free' 
      ? p.description?.substring(0, 150) + '...' 
      : p.description
  }));

  res.json({
    properties: maskedProperties,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: userTier === 'free' ? Math.min(total, 3) : total,
      pages: userTier === 'free' ? 1 : Math.ceil(total / limitNum)
    },
    tier: userTier,
    upgradePrompt: userTier === 'free' && total > 3 
      ? `Showing 3 of ${total} deals. Upgrade to see all.` 
      : null
  });
}));

// Public: Get single property
router.get('/:id', asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userTier = req.user?.subscriptionTier || 'free';

  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      city: true,
      district: true,
      propertyType: true,
      priceHistory: {
        orderBy: { recordedAt: 'asc' }
      }
    }
  });

  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  // Track view
  await prisma.property.update({
    where: { id },
    data: { viewCount: { increment: 1 } }
  });

  // Log activity for authenticated users
  if (req.user) {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'view_deal',
        entityType: 'property',
        entityId: property.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
  }

  // Mask data for free tier
  const response: any = {
    ...property,
    contactPhone: userTier === 'free' ? null : property.contactPhone,
    contactName: userTier === 'free' ? null : property.contactName,
    sourceUrl: userTier === 'free' ? null : property.sourceUrl,
    priceHistory: userTier === 'premium' || userTier === 'pro' 
      ? property.priceHistory 
      : [],
    _meta: {
      tier: userTier,
      lockedFields: userTier === 'free' 
        ? ['contactPhone', 'contactName', 'sourceUrl', 'priceHistory'] 
        : userTier === 'premium' 
          ? [] 
          : []
    }
  };

  res.json(response);
}));

// Protected: Toggle favorite
router.post('/:id/favorite', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const userId = req.user!.id;

  const existing = await prisma.userFavorite.findUnique({
    where: { userId_propertyId: { userId, propertyId: id } }
  });

  if (existing) {
    await prisma.userFavorite.delete({
      where: { id: existing.id }
    });
    return res.json({ favorited: false });
  }

  await prisma.userFavorite.create({
    data: { userId, propertyId: id }
  });

  res.json({ favorited: true });
}));

// Protected: Get user's favorites
router.get('/user/favorites', authenticate, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const favorites = await prisma.userFavorite.findMany({
    where: { userId },
    include: {
      property: {
        include: {
          city: { select: { nameEn: true, slug: true } },
          district: { select: { nameEn: true } },
          propertyType: { select: { nameEn: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ favorites });
}));

// Cities list
router.get('/meta/cities', asyncHandler(async (req, res) => {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      slug: true,
      region: true
    }
  });

  res.json({ cities });
}));

// Property types
router.get('/meta/types', asyncHandler(async (req, res) => {
  const types = await prisma.propertyType.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      slug: true
    }
  });

  res.json({ types });
}));

// Districts by city
router.get('/meta/districts/:citySlug', asyncHandler(async (req, res) => {
  const { citySlug } = req.params;

  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    include: {
      districts: {
        where: { isActive: true },
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          slug: true,
          avgPricePerSqm: true
        }
      }
    }
  });

  if (!city) {
    return res.status(404).json({ error: 'City not found' });
  }

  res.json({ districts: city.districts });
}));

// Export deals (Premium+)
router.get('/export/csv', authenticate, requireSubscription('premium'), asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const properties = await prisma.property.findMany({
    where: { status: 'active', investmentScore: { gte: 70 } },
    include: {
      city: true,
      district: true,
      propertyType: true
    }
  });

  // Log export activity
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'export_deals',
      metadata: { count: properties.length }
    }
  });

  // Set headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"');

  // CSV header
  const headers = ['Title', 'City', 'District', 'Type', 'Price', 'Size', 'Price/m²', 'Score', 'Deal Type', 'Contact', 'URL'];
  res.write(headers.join(',') + '\n');

  // CSV rows
  for (const p of properties) {
    const row = [
      `"${p.title.replace(/"/g, '""')}"`,
      p.city?.nameEn || '',
      p.district?.nameEn || '',
      p.propertyType?.nameEn || '',
      p.price.toString(),
      p.sizeSqm?.toString() || '',
      p.pricePerSqm?.toString() || '',
      p.investmentScore?.toString() || '',
      p.dealType || '',
      p.contactPhone || '',
      p.sourceUrl || ''
    ];
    res.write(row.join(',') + '\n');
  }

  res.end();
}));

export { router as propertiesRouter };
