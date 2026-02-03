const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('===================================');
console.log('KingdomScout Startup');
console.log('===================================');

// Check environment
console.log('\n[0/6] Environment check...');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  PORT:', process.env.PORT || 'not set');

// Run Prisma generate
console.log('\n[1/6] Generating Prisma client...');
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

// Check if tables exist, if not run SQL init
console.log('\n[2/6] Checking database tables...');
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
    
    console.log('  Tables found:', tables.length > 0 ? tables.map(r => r.table_name).join(', ') : 'None');
    
    if (tables.length === 0) {
      console.log('\n[3/6] No tables found! Running SQL init...');
      try {
        const sql = fs.readFileSync(path.join(__dirname, 'init-db.sql'), 'utf8');
        // Split and execute statements
        const statements = sql.split(';').filter(s => s.trim());
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await prisma.$executeRawUnsafe(statement + ';');
            } catch (e) {
              // Ignore errors for existing objects
              console.log('  Note:', e.message.substring(0, 100));
            }
          }
        }
        console.log('✓ SQL init completed');
      } catch (e) {
        console.error('✗ SQL init failed:', e.message);
      }
    } else {
      console.log('\n[3/6] Tables already exist, skipping SQL init');
    }
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('  Could not check tables:', e.message);
  }
  
  // Run db push as backup
  console.log('\n[4/6] Running Prisma db push...');
  try {
    execSync('npx prisma db push --accept-data-loss --skip-generate', { 
      stdio: 'inherit',
      cwd: path.join(__dirname),
      env: { ...process.env }
    });
    console.log('✓ Database schema synced');
  } catch (e) {
    console.error('✗ Db push failed:', e.message);
  }
  
  // Final table check
  console.log('\n[5/6] Final table verification...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    console.log('  Tables:', tables.map(r => r.table_name).join(', ') || 'None');
    
    // Try to get counts
    try {
      const propertyCount = await prisma.property.count();
      const cityCount = await prisma.city.count();
      console.log(`  Properties: ${propertyCount}, Cities: ${cityCount}`);
    } catch (e) {
      console.log('  Could not get counts:', e.message);
    }
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('  Verification failed:', e.message);
  }
  
  // Start the server
  console.log('\n[6/6] Starting server...');
  console.log('===================================\n');
  require('./dist/index.js');
})();
