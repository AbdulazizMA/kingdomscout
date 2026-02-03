# KingdomScout Render Deployment Fixes

## Summary of Changes Made

### 1. Fixed Prisma Schema (backend/prisma/schema.prisma)
- Changed all `@default(dbgenerated("uuid_generate_v4()"))` to `@default(uuid())`
- This avoids dependency on PostgreSQL's `uuid-ossp` extension which may not be enabled on Render

### 2. Updated Render Configuration (render.yaml)
- Added `NEXT_PUBLIC_API_URL` environment variable pointing to the Render URL
- Added `FRONTEND_URL` for CORS configuration
- Updated build command to run `npx prisma db push` to sync schema

### 3. Improved Error Handling (backend/src/middleware/errorHandler.ts)
- Added detailed error logging to help diagnose issues
- Error messages now include more context in development mode

### 4. Added Debug Endpoints (backend/src/routes/properties.ts)
- `GET /api/properties/debug/db-status` - Check database connection and counts
- `POST /api/properties/debug/seed` - Seed database with sample data

### 5. Enhanced Health Check (backend/src/index.ts)
- Health endpoint now tests database connectivity
- Returns database status along with timestamp

## Next Steps to Complete Setup

### 1. Wait for Render Deployment
The code has been pushed to GitHub. Render should auto-deploy within 2-3 minutes.
Check deployment status at: https://dashboard.render.com

### 2. Verify Database Connection
After deployment, check:
```
https://kingdomscout.onrender.com/health
```
Should return: `{"status":"ok","database":"connected",...}`

### 3. Seed the Database (if empty)
Once deployed, seed the database with sample properties:
```bash
curl -X POST https://kingdomscout.onrender.com/api/properties/debug/seed
```

### 4. Verify Properties API
Check that properties are showing:
```
https://kingdomscout.onrender.com/api/properties
```

### 5. Check Frontend
Visit the homepage and verify deals are displaying:
```
https://kingdomscout.onrender.com
```

## Environment Variables on Render

Ensure these are set in the Render dashboard:
- `DATABASE_URL` - Automatically set from Render PostgreSQL
- `JWT_SECRET` - Generate a random secure string
- `NEXT_PUBLIC_API_URL` - `https://kingdomscout.onrender.com`
- `FRONTEND_URL` - `https://kingdomscout.onrender.com`
- `NODE_ENV` - `production`
- `PORT` - `10000`

## Troubleshooting

If still getting errors:
1. Check Render logs: https://dashboard.render.com → Select service → Logs
2. Verify database is connected: Check the health endpoint
3. Run manual seed if needed using the debug endpoint
4. Check that all environment variables are correctly set

## Manual Database Migration (if needed)

If the automatic `prisma db push` fails, you can run manually:
```bash
# Connect to Render shell
cd backend
npx prisma db push --accept-data-loss
npx prisma db seed
```
