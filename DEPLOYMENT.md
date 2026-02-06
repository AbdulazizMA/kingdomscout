# KingdomScout Deployment Guide

## Fly.io Deployment

### Prerequisites
1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Authenticate: `flyctl auth login`

### Step 1: Create PostgreSQL Database
```bash
flyctl postgres create --name kingdomscout-db --region iad --initial-cluster-size 1
```
Save the DATABASE_URL from the output.

### Step 2: Deploy Backend
```bash
cd backend
flyctl launch --no-deploy
flyctl secrets set DATABASE_URL="postgres://..." JWT_SECRET="random-32-char-string" FRONTEND_URL="https://kingdomscout-frontend.fly.dev"
flyctl deploy
```

### Step 3: Deploy Frontend
```bash
cd ../frontend
flyctl launch --no-deploy
flyctl secrets set NEXT_PUBLIC_API_URL="https://kingdomscout-backend.fly.dev"
flyctl deploy
```

### Step 4: Deploy Scraper
```bash
cd ../scraper
flyctl launch --no-deploy
flyctl secrets set DATABASE_URL="postgres://..."
flyctl deploy
```

### Step 5: Verify
```bash
curl https://kingdomscout-backend.fly.dev/health
flyctl logs -a kingdomscout-backend
```

### Useful Commands
```bash
flyctl status -a kingdomscout-backend    # Service status
flyctl logs -a kingdomscout-backend      # View logs
flyctl ssh console -a kingdomscout-backend  # SSH in
flyctl apps restart kingdomscout-backend    # Restart
```

## Alternative: Docker Compose (Local/VPS)
```bash
./deploy.sh
```
See `docker-compose.yml` for full configuration.
