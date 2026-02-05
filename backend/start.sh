#!/bin/bash
set -e

echo "==================================="
echo "KingdomScout Startup Script"
echo "==================================="
echo ""
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"
echo "Contents: $(ls -la)"
echo ""

# Find the dist directory
if [ -d "dist" ]; then
    DIST_DIR="dist"
elif [ -d "backend/dist" ]; then
    DIST_DIR="backend/dist"
    cd backend
else
    echo "ERROR: Cannot find dist directory"
    ls -la
    exit 1
fi

echo "Using dist directory: $DIST_DIR"

echo ""
echo "Step 1: Generating Prisma Client..."
npx prisma generate || echo "Prisma generate failed, continuing..."

echo ""
echo "Step 2: Pushing database schema..."
npx prisma db push --skip-generate || {
    echo "WARNING: Database push failed, tables may already exist. Continuing..."
}

echo ""
echo "Step 3: Starting server..."
echo "==================================="
node dist/index.js
