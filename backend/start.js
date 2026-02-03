const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('===================================');
console.log('KingdomScout Startup');
console.log('===================================');

// Check environment
console.log('\n[0/5] Environment check...');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  PORT:', process.env.PORT || 'not set');

// Run Prisma generate
console.log('\n[1/5] Generating Prisma client...');
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
console.log('\n[2/5] Pushing database schema...');
try {
  execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate', { 
    stdio: 'inherit',
    cwd: path.join(__dirname),
    env: { ...process.env }
  });
  console.log('✓ Database schema pushed');
} catch (e) {
  console.error('✗ Database push failed:', e.message);
}

// Alternative: Run migrations if available
console.log('\n[3/5] Checking for migrations...');
const migrationsPath = path.join(__dirname, 'prisma', 'migrations');
if (fs.existsSync(migrationsPath)) {
  console.log('  Found migrations folder, trying migrate deploy...');
  try {
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: path.join(__dirname)
    });
    console.log('✓ Migrations deployed');
  } catch (e) {
    console.error('  Migrate deploy failed:', e.message);
  }
} else {
  console.log('  No migrations folder found');
}

// Verify tables exist
console.log('\n[4/5] Verifying database tables...');
(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    if (tables.length === 0) {
      console.log('  WARNING: No tables found in database!');
      console.log('  Tables found:', 'None');
    } else {
      console.log('  Tables found:', tables.map(r => r.table_name).join(', '));
    }
    
    // Try to get counts
    try {
      const propertyCount = await prisma.property.count();
      const cityCount = await prisma.city.count();
      console.log(`  Properties: ${propertyCount}, Cities: ${cityCount}`);
    } catch (e) {
      console.log('  Could not get table counts:', e.message);
    }
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('  Could not verify tables:', e.message);
  }
  
  // Start the server
  console.log('\n[5/5] Starting server...');
  console.log('===================================\n');
  require('./dist/index.js');
})();
