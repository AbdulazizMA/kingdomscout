import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@saudidealfinder.com' },
    update: {},
    create: {
      email: 'admin@saudidealfinder.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create sample user
  const userPassword = await hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: userPassword,
      firstName: 'Demo',
      lastName: 'User',
      subscriptionTier: 'premium',
      subscriptionStatus: 'active',
    },
  });
  console.log('Created demo user:', user.email);

  // Seed cities
  const cities = [
    { nameEn: 'Riyadh', nameAr: 'الرياض', slug: 'riyadh', region: 'Riyadh Region', priority: 1 },
    { nameEn: 'Jeddah', nameAr: 'جدة', slug: 'jeddah', region: 'Makkah Region', priority: 2 },
    { nameEn: 'Makkah', nameAr: 'مكة المكرمة', slug: 'makkah', region: 'Makkah Region', priority: 3 },
    { nameEn: 'Madinah', nameAr: 'المدينة المنورة', slug: 'madinah', region: 'Madinah Region', priority: 4 },
    { nameEn: 'Dammam', nameAr: 'الدمام', slug: 'dammam', region: 'Eastern Province', priority: 5 },
    { nameEn: 'Khobar', nameAr: 'الخبر', slug: 'khobar', region: 'Eastern Province', priority: 6 },
  ];

  for (const cityData of cities) {
    await prisma.city.upsert({
      where: { slug: cityData.slug },
      update: {},
      create: cityData,
    });
  }
  console.log(`Created ${cities.length} cities`);

  // Seed property types
  const propertyTypes = [
    { nameEn: 'Apartment', nameAr: 'شقة', slug: 'apartment', displayOrder: 1 },
    { nameEn: 'Villa', nameAr: 'فيلا', slug: 'villa', displayOrder: 2 },
    { nameEn: 'Building', nameAr: 'عمارة', slug: 'building', displayOrder: 3 },
    { nameEn: 'Land', nameAr: 'أرض', slug: 'land', displayOrder: 4 },
    { nameEn: 'Commercial', nameAr: 'تجاري', slug: 'commercial', displayOrder: 5 },
  ];

  for (const typeData of propertyTypes) {
    await prisma.propertyType.upsert({
      where: { slug: typeData.slug },
      update: {},
      create: typeData,
    });
  }
  console.log(`Created ${propertyTypes.length} property types`);

  // Create sample properties
  const riyadh = await prisma.city.findUnique({ where: { slug: 'riyadh' } });
  const villaType = await prisma.propertyType.findUnique({ where: { slug: 'villa' } });
  const apartmentType = await prisma.propertyType.findUnique({ where: { slug: 'apartment' } });

  if (riyadh && villaType) {
    // Sample hot deal
    await prisma.property.create({
      data: {
        externalId: 'sample-001',
        sourceUrl: 'https://sa.aqar.fm/sample-001',
        title: 'Luxury Villa in Al Yasmin - Below Market!',
        description: 'Beautiful 5-bedroom villa in prime location. Spacious living areas, modern kitchen, private garden.',
        price: 1200000,
        sizeSqm: 450,
        bedrooms: 5,
        bathrooms: 4,
        buildingAgeYears: 3,
        cityId: riyadh.id,
        propertyTypeId: villaType.id,
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
    });

    // Sample good deal
    await prisma.property.create({
      data: {
        externalId: 'sample-002',
        sourceUrl: 'https://sa.aqar.fm/sample-002',
        title: 'Modern Apartment in Al Olaya',
        description: '3-bedroom apartment in central Riyadh. Close to business district.',
        price: 650000,
        sizeSqm: 150,
        bedrooms: 3,
        bathrooms: 2,
        buildingAgeYears: 5,
        cityId: riyadh.id,
        propertyTypeId: apartmentType?.id,
        pricePerSqm: 4333,
        districtAvgPricePerSqm: 4800,
        priceVsMarketPercent: -9.73,
        investmentScore: 68,
        dealType: 'good_deal',
        estimatedMonthlyRent: 3500,
        estimatedAnnualYieldPercent: 6.46,
        status: 'active',
        contactName: 'Mohammed Khan',
        contactPhone: '+966502345678',
        isVerified: true,
      },
    });

    console.log('Created sample properties');
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
