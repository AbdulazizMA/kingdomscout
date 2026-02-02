#!/bin/bash
set -e

echo "=== KingdomScout Build ==="

# Install root dependencies
npm install

# Build backend
echo "Building backend..."
cd backend
npm install
npx prisma generate
echo "Running TypeScript compiler..."
npx tsc
echo "Backend built successfully!"
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
echo "Frontend built successfully!"
cd ..

echo "=== Build Complete ==="
