# KingdomScout Deployment Guide

## Railway Deployment (Recommended)

### Step 1: Push to GitHub
```bash
cd "/Volumes/Extreme SSD/saudi-property-deals"
git remote add origin https://github.com/abdulazizma/kingdomscout.git
git push -u origin main
```

### Step 2: Deploy to Railway
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `abdulazizma/kingdomscout`
6. Add PostgreSQL database (Railway provides this)
7. Set environment variables:
   - `DATABASE_URL` (Railway will provide this)
   - `JWT_SECRET` (generate a random string)
   - `NEXT_PUBLIC_API_URL` (Railway will provide this)
8. Deploy!

### Environment Variables for Railway:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-super-secret-jwt-key-here
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app
FRONTEND_URL=https://your-app-name.railway.app
```

### Pricing:
- Free tier: $5/month credit (enough for small app)
- Starter: $5/month (after free credit)
- Pro: $20/month (for scaling)

Your app will be live at: `https://kingdomscout-production.up.railway.app`

## Alternative: Render.com
- Free tier available
- Automatic deployments
- PostgreSQL included

## Alternative: DigitalOcean
- $6/month droplet
- Full control
- Manual setup required
