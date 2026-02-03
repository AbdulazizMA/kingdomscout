#!/bin/bash
set -e

echo "==================================="
echo "KingdomScout Startup Script"
echo "==================================="
echo ""
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"
echo ""

# Install prisma CLI if not available
if ! command -v npx &> /dev/null; then
    echo "ERROR: npx not found"
    exit 1
fi

echo "Step 1: Generating Prisma Client..."
npx prisma generate

echo ""
echo "Step 2: Pushing database schema..."
npx prisma db push --accept-data-loss || {
    echo "WARNING: Database push failed, but continuing..."
}

echo ""
echo "Step 3: Checking database connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => {
    console.log('Database connection: OK');
    process.exit(0);
}).catch((e) => {
    console.error('Database connection failed:', e.message);
    process.exit(1);
});
"

echo ""
echo "Step 4: Starting server..."
echo "==================================="
node dist/index.js
