import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Debug endpoint to check database connection
router.get('/debug/db-status', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get counts
    const [propertyCount, cityCount] = await Promise.all([
      prisma.property.count(),
      prisma.city.count()
    ]);
    
    res.json({
      status: 'connected',
      counts: {
        properties: propertyCount,
        cities: cityCount
      }
    });
  } catch (error: any) {
    console.error('Database debug error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: error.code
    });
  }
}));

// Seed endpoint for initial setup (no auth required for demo)
router.post('/debug/seed', asyncHandler(async (req: Request, res: Response) => {
  const { hash } = await import('bcryptjs');
  
  try {
    // Seed cities
    const cities = [
      { nameEn: 'Riyadh', nameAr: 'الرياض', slug: 'riyadh', region: 'Riyadh Region', priority: 1 },
      { nameEn: 'Jeddah', nameAr: 'جدة', slug: 'jeddah', region: 'Makkah Region', priority: 2 },
      { nameEn: 'Makkah', nameAr: 'مكة المكرمة', slug: 'makkah', region: 'Makkah Region', priority: 3 },
      { nameEn: 'Dammam', nameAr: 'الدمام', slug: 'dammam', region: 'Eastern Province', priority: 4 },
    ];

    for (const cityData of cities) {
      await prisma.city.upsert({
        where: { slug: cityData.slug },
        update: {},
        create: cityData,
      });
    }

    // Seed property types
    const propertyTypes = [
      { nameEn: 'Apartment', nameAr: 'شقة', slug: 'apartment', displayOrder: 1 },
      { nameEn: 'Villa', nameAr: 'فيلا', slug: 'villa', displayOrder: 2 },
      { nameEn: 'Land', nameAr: 'أرض', slug: 'land', displayOrder: 3 },
    ];

    for (const typeData of propertyTypes) {
      await prisma.propertyType.upsert({
        where: { slug: typeData.slug },
        update: {},
        create: typeData,
      });
    }

    // Get IDs
    const riyadh = await prisma.city.findUnique({ where: { slug: 'riyadh' } });
    const jeddah = await prisma.city.findUnique({ where: { slug: 'jeddah' } });
    const villaType = await prisma.propertyType.findUnique({ where: { slug: 'villa' } });
    const apartmentType = await prisma.propertyType.findUnique({ where: { slug: 'apartment' } });

    // Create sample properties
    const sampleProperties = [
      {
        externalId: 'sample-001',
        sourceUrl: 'https://sa.aqar.fm/sample-001',
        title: 'Luxury Villa in Al Yasmin - Below Market!',
        description: 'Beautiful 5-bedroom villa in prime location. Spacious living areas, modern kitchen, private garden.',
        price: 1200000,
        sizeSqm: 450,
        bedrooms: 5,
        bathrooms: 4,
        buildingAgeYears: 3,
        cityId: riyadh?.id,
        propertyTypeId: villaType?.id,
        pricePerSqm: 2667,
        districtAvgPricePerSqm: 3200,
        priceVsMarketPercent: -16.67,
        investmentScore: 85,
        dealType: 'hot_deal',
        estimatedMonthlyRent: 5500,
        estimatedAnnualYieldPercent: 5.5,
        status: 'active',
        contactName: 'Ahmed Al-Saud',
        contactPhone: '+966501234567',
        isVerified: true,
      },
      {
        externalId: 'sample-002',
        sourceUrl: 'https://sa.aqar.fm/sample-002',
        title: 'Modern Apartment in Al Olaya',
        description: '3-bedroom apartment in central Riyadh. Close to business district.',
        price: 650000,
        sizeSqm: 150,
        bedrooms: 3,
        bathrooms: 2,
        buildingAgeYears: 5,
        cityId: riyadh?.id,
        propertyTypeId: apartmentType?.id,
        pricePerSqm: 4333,
        districtAvgPricePerSqm: 4800,
        priceVsMarketPercent: -9.73,
        investmentScore: 72,
        dealType: 'good_deal',
        estimatedMonthlyRent: 3500,
        estimatedAnnualYieldPercent: 6.46,
        status: 'active',
        contactName: 'Mohammed Khan',
        contactPhone: '+966502345678',
        isVerified: true,
      },
      {
        externalId: 'sample-003',
        sourceUrl: 'https://sa.aqar.fm/sample-003',
        title: 'Villa in Jeddah Al-Shati',
        description: 'Amazing sea view villa with 4 bedrooms and private pool.',
        price: 2500000,
        sizeSqm: 600,
        bedrooms: 4,
        bathrooms: 5,
        buildingAgeYears: 2,
        cityId: jeddah?.id,
        propertyTypeId: villaType?.id,
        pricePerSqm: 4167,
        districtAvgPricePerSqm: 5000,
        priceVsMarketPercent: -16.66,
        investmentScore: 78,
        dealType: 'hot_deal',
        estimatedMonthlyRent: 10000,
        estimatedAnnualYieldPercent: 4.8,
        status: 'active',
        contactName: 'Sami Al-Otaibi',
        contactPhone: '+966503456789',
        isVerified: true,
      },
    ];

    for (const prop of sampleProperties) {
      if (prop.cityId && prop.propertyTypeId) {
        await prisma.property.upsert({
          where: { externalId: prop.externalId },
          update: {},
          create: prop as any,
        });
      }
    }

    res.json({ success: true, message: 'Database seeded with sample data' });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seed failed', message: error.message });
  }
}));

// ==========================================
// IMPORTANT: Static/meta routes MUST come before /:id
// ==========================================

// Cities list
router.get('/meta/cities', asyncHandler(async (req: Request, res: Response) => {
  const cities = await prisma.city.findMany({
    where: { isActive: true },
    orderBy: { priority: 'asc' },
    select: { id: true, nameEn: true, nameAr: true, slug: true, region: true }
  });
  res.json({ cities });
}));

// Property types
router.get('/meta/types', asyncHandler(async (req: Request, res: Response) => {
  const types = await prisma.propertyType.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, nameEn: true, nameAr: true, slug: true }
  });
  res.json({ types });
}));

// Stats for homepage
router.get('/meta/stats', asyncHandler(async (req: Request, res: Response) => {
  const [totalProperties, totalDeals, totalHotDeals, cityCount] = await Promise.all([
    prisma.property.count({ where: { status: 'active' } }),
    prisma.property.count({
      where: { status: 'active', dealType: { in: ['hot_deal', 'good_deal'] } }
    }),
    prisma.property.count({
      where: { status: 'active', dealType: 'hot_deal' }
    }),
    prisma.city.count({ where: { isActive: true } })
  ]);

  res.json({
    totalProperties,
    totalDeals,
    totalHotDeals,
    citiesCount: cityCount,
    sources: ['aqar.fm', 'bayut.sa', 'haraj.com.sa'],
    updateFrequency: '4 hours'
  });
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
        select: { id: true, nameEn: true, nameAr: true, slug: true, avgPricePerSqm: true }
      }
    }
  });
  if (!city) return res.status(404).json({ error: 'City not found' });
  res.json({ districts: city.districts });
}));

// User favorites (must come before /:id)
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

// ==========================================
// Dynamic routes (/:id patterns) below
// ==========================================

// Public: List properties
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  console.log('GET /api/properties - received request');
  
  try {
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

    console.log('Querying database with where:', JSON.stringify(where));
    
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

    console.log(`Found ${properties.length} properties (total: ${total})`);

    res.json({
      properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/properties:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
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

// (favorites route moved above /:id to prevent route conflict)

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

// Price history for a property
router.get('/:id/price-history', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const priceHistory = await prisma.priceHistory.findMany({
    where: { propertyId: id },
    orderBy: { recordedAt: 'asc' }
  });
  res.json({ priceHistory });
}));

export { router as propertiesRouter };
