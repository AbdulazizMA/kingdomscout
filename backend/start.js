const { execSync } = require('child_process');
const path = require('path');

console.log('===================================');
console.log('KingdomScout Startup');
console.log('===================================');

// Run Prisma generate
console.log('\n[1/3] Generating Prisma client...');
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

// Run db push
console.log('\n[2/3] Pushing database schema...');
try {
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    cwd: path.join(__dirname)
  });
  console.log('✓ Database schema pushed');
} catch (e) {
  console.error('✗ Database push failed:', e.message);
  console.log('Continuing anyway...');
}

// Start the server
console.log('\n[3/3] Starting server...');
console.log('===================================\n');
require('./dist/index.js');
