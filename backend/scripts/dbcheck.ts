import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const propertyCount = await prisma.property.count();
  const cityCount = await prisma.city.count();
  console.log('Properties:', propertyCount);
  console.log('Cities:', cityCount);
  const cities = await prisma.city.findMany({ take: 5 });
  console.log('Sample cities:', cities.map(c => c.nameAr));
  await prisma.$disconnect();
}
main().catch(console.error);
