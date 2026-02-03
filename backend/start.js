#!/usr/bin/env node

console.log('===================================');
console.log('KingdomScout Startup Script v2');
console.log('===================================');
console.log('Timestamp:', new Date().toISOString());

// Check environment
console.log('\n[ENV] Checking environment variables...');
const requiredEnv = ['DATABASE_URL', 'PORT'];
for (const env of requiredEnv) {
  if (process.env[env]) {
    console.log(`  ✓ ${env}: Set`);
  } else {
    console.log(`  ✗ ${env}: NOT SET`);
  }
}

// Generate Prisma Client
console.log('\n[1/4] Generating Prisma Client...');
try {
  const { execSync } = require('child_process');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('  ✓ Prisma Client generated successfully');
} catch (e) {
  console.error('  ✗ Failed to generate Prisma Client:', e.message);
  process.exit(1);
}

// Create tables if they don't exist
console.log('\n[2/4] Setting up database tables...');
(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Check existing tables
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`  Found ${existingTables.length} existing tables`);
    
    if (existingTables.length === 0) {
      console.log('  No tables found. Creating schema...');
      
      // Create tables using raw SQL
      const createTablesSQL = `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS cities (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name_en VARCHAR(255) NOT NULL,
          name_ar VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          region VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          priority INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS property_types (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name_en VARCHAR(255) NOT NULL,
          name_ar VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true
        );
        
        CREATE TABLE IF NOT EXISTS properties (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          external_id VARCHAR(255) UNIQUE,
          source_url VARCHAR(255) NOT NULL,
          city_id UUID REFERENCES cities(id),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL NOT NULL,
          size_sqm DECIMAL,
          bedrooms INTEGER,
          bathrooms INTEGER,
          price_per_sqm DECIMAL,
          district_avg_price_per_sqm DECIMAL,
          price_vs_market_percent DECIMAL,
          investment_score INTEGER,
          deal_type VARCHAR(255),
          status VARCHAR(255) DEFAULT 'active',
          scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          contact_name VARCHAR(255),
          contact_phone VARCHAR(255),
          is_verified BOOLEAN DEFAULT false,
          view_count INTEGER DEFAULT 0
        );
        
        CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city_id);
        CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
        CREATE INDEX IF NOT EXISTS idx_properties_deal ON properties(deal_type);
      `;
      
      const statements = createTablesSQL.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        try {
          await prisma.$executeRawUnsafe(stmt + ';');
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists')) {
            console.log('  Warning:', err.message.substring(0, 80));
          }
        }
      }
      
      // Insert sample data
      console.log('  Inserting sample data...');
      await prisma.$executeRaw`
        INSERT INTO cities (name_en, name_ar, slug, region, priority) 
        VALUES 
          ('Riyadh', 'الرياض', 'riyadh', 'Riyadh Region', 1),
          ('Jeddah', 'جدة', 'jeddah', 'Makkah Region', 2),
          ('Makkah', 'مكة المكرمة', 'makkah', 'Makkah Region', 3)
        ON CONFLICT (slug) DO NOTHING
      `;
      
      await prisma.$executeRaw`
        INSERT INTO property_types (name_en, name_ar, slug, display_order) 
        VALUES 
          ('Apartment', 'شقة', 'apartment', 1),
          ('Villa', 'فيلا', 'villa', 2),
          ('Land', 'أرض', 'land', 3)
        ON CONFLICT (slug) DO NOTHING
      `;
      
      console.log('  ✓ Tables and sample data created');
    } else {
      console.log('  ✓ Tables already exist');
    }
    
    // Sync with Prisma schema (add any missing columns)
    console.log('\n[3/4] Syncing with Prisma schema...');
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma db push --accept-data-loss --skip-generate', { 
        stdio: 'inherit',
        timeout: 120000
      });
      console.log('  ✓ Schema synced');
    } catch (e) {
      console.log('  Note: Schema sync had issues, continuing...');
    }
    
    // Verify final state
    console.log('\n[4/4] Verifying database...');
    const finalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    console.log('  Tables:', finalTables.map(t => t.table_name).join(', '));
    
    try {
      const propCount = await prisma.property.count();
      const cityCount = await prisma.city.count();
      console.log(`  Data: ${propCount} properties, ${cityCount} cities`);
    } catch (e) {
      console.log('  Could not count records:', e.message);
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('  ✗ Database setup failed:', error.message);
    console.error(error.stack);
  }
  
  // Start the server
  console.log('\n===================================');
  console.log('Starting KingdomScout Server...');
  console.log('===================================\n');
  
  try {
    require('./dist/index.js');
  } catch (e) {
    console.error('Failed to start server:', e.message);
    process.exit(1);
  }
})();
