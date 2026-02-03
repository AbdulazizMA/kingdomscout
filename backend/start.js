const { execSync } = require('child_process');
const path = require('path');

console.log('===================================');
console.log('KingdomScout Startup');
console.log('===================================');

// Check environment
console.log('\n[0/4] Environment check...');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  PORT:', process.env.PORT || 'not set');

// Run Prisma generate
console.log('\n[1/4] Generating Prisma client...');
try {
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname)
  });
  console.log('✓ Prisma client generated');
} catch (e) {
  console.error('✗ Prisma generate failed:', e.message);
  process.exit(1);
}

// Run db push with schema
console.log('\n[2/4] Pushing database schema...');
try {
  execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', { 
    stdio: 'inherit',
    cwd: path.join(__dirname),
    env: { ...process.env }
  });
  console.log('✓ Database schema pushed');
} catch (e) {
  console.error('✗ Database push failed:', e.message);
  console.log('Continuing anyway...');
}

// Verify tables exist
console.log('\n[3/4] Verifying database tables...');
(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('  Tables found:', result.map(r => r.table_name).join(', '));
    await prisma.$disconnect();
  } catch (e) {
    console.error('  Could not verify tables:', e.message);
  }
})();

// Start the server
console.log('\n[4/4] Starting server...');
console.log('===================================\n');
require('./dist/index.js');
