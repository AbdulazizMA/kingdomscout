import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Public: List properties (FREE - no subscription restrictions)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const querySchema = z.object({
    page: z.string().default('1'),
    limit: z.string().default('20'),
    city: z.string().optional(),
    district: z.string().optional(),
    type: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    minSize: z.string().optional(),
    maxSize: z.string().optional(),
    bedrooms: z.string().optional(),
    minScore: z.string().optional(),
    dealType: z.enum(['hot_deal', 'good_deal', 'fair_price']).optional(),
    sortBy: z.enum(['price', 'score', 'date', 'price_per_sqm']).default('score'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  });

  const {
    page, limit, city, district, type,
    minPrice, maxPrice, minSize, maxSize, bedrooms, minScore, dealType,
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
  if (bedrooms) where.bedrooms = parseInt(bedrooms);
  if (minPrice) where.price = { gte: parseFloat(minPrice) };
  if (maxPrice) where.price = { ...where.price, lte: parseFloat(maxPrice) };
  if (minSize) where.sizeSqm = { gte: parseFloat(minSize) };
  if (maxSize) where.sizeSqm = { ...where.sizeSqm, lte: parseFloat(maxSize) };
  if (minScore) where.investmentScore = { gte: parseInt(minScore) };

  // Determine sort field
  const sortField: any = {};
  switch (sortBy) {
    case 'price': sortField.price = sortOrder; break;
    case 'score': sortField.investmentScore = sortOrder; break;
    case 'date': sortField.scrapedAt = sortOrder; break;
    case 'price_per_sqm': sortField.pricePerSqm = sortOrder; break;
    default: sortField.investmentScore = 'desc';
  }

  // FREE: All users get full access - no subscription restrictions
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      take: limitNum,
      skip: skip,
      orderBy: sortField,
      include: {
        city: { select: { nameEn: true, nameAr: true, slug: true } },
        district: { select: { nameEn: true, nameAr: true, slug: true } },
        propertyType: { select: { nameEn: true, nameAr: true, slug: true } }
      }
    }),
    prisma.property.count({ where })
  ]);

  res.json({
    properties,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// Public: Get single property (FREE - no subscription restrictions)
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

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

  // FREE: All data is accessible
  res.json(property);
}));

// Protected: Toggle favorite
router.post('/:id/favorite', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
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
router.get('/user/favorites', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const favorites = await prisma.userFavorite.findMany({
    where: { userId },
    include: {
      property: {
        include: {
          city: { select: { nameEn: true, nameAr: true, slug: true } },
          district: { select: { nameEn: true, nameAr: true } },
          propertyType: { select: { nameEn: true, nameAr: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ favorites });
}));

// Protected: Update favorite note
router.patch('/:id/favorite', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = z.object({ notes: z.string() }).parse(req.body);
  const userId = req.user!.id;

  const favorite = await prisma.userFavorite.findUnique({
    where: { userId_propertyId: { userId, propertyId: id } }
  });

  if (!favorite) {
    return res.status(404).json({ error: 'Favorite not found' });
  }

  await prisma.userFavorite.update({
    where: { id: favorite.id },
    data: { notes }
  });

  res.json({ success: true });
}));

// Cities list
router.get('/meta/cities', asyncHandler(async (req: Request, res: Response) => {
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
router.get('/meta/types', asyncHandler(async (req: Request, res: Response) => {
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
router.get('/meta/districts/:citySlug', asyncHandler(async (req: Request, res: Response) => {
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

// Get price history for a property (FREE)
router.get('/:id/price-history', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const priceHistory = await prisma.priceHistory.findMany({
    where: { propertyId: id },
    orderBy: { recordedAt: 'asc' }
  });

  res.json({ priceHistory });
}));

// Public: Get stats for homepage
router.get('/meta/stats', asyncHandler(async (req: Request, res: Response) => {
  const [totalProperties, totalDeals, totalHotDeals] = await Promise.all([
    prisma.property.count({ where: { status: 'active' } }),
    prisma.property.count({ 
      where: { 
        status: 'active',
        dealType: { in: ['hot_deal', 'good_deal'] }
      } 
    }),
    prisma.property.count({
      where: {
        status: 'active',
        dealType: 'hot_deal'
      }
    })
  ]);

  res.json({
    totalProperties,
    totalDeals,
    totalHotDeals,
    citiesCount: 15,
    updateFrequency: '4 hours'
  });
}));

export { router as propertiesRouter };
