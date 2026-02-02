# Saudi Deal Finder - Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Domain name (for production)
- SSL certificate (Let's Encrypt recommended)
- Stripe account (for payments)

## Quick Start (Development)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/saudi-property-deals.git
cd saudi-property-deals
```

2. Copy environment file:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Start services:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
docker-compose exec backend npx prisma migrate dev
```

5. Seed the database:
```bash
docker-compose exec backend npx prisma db seed
```

6. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Admin Panel: http://localhost:3002

## Production Deployment

### 1. Server Setup

Recommended: Ubuntu 22.04 LTS with at least:
- 2 CPU cores
- 4GB RAM
- 50GB SSD storage

### 2. Install Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone and Configure

```bash
git clone https://github.com/yourusername/saudi-property-deals.git
cd saudi-property-deals
cp .env.example .env
```

Edit `.env` with production values:
- Use strong JWT_SECRET
- Set production Stripe keys
- Update FRONTEND_URL with your domain

### 4. Configure Nginx (Reverse Proxy)

Create `/etc/nginx/sites-available/saudidealfinder`:

```nginx
server {
    listen 80;
    server_name saudidealfinder.com www.saudidealfinder.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name saudidealfinder.com www.saudidealfinder.com;
    
    ssl_certificate /etc/letsencrypt/live/saudidealfinder.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saudidealfinder.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Webhooks
    location /webhooks {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/saudidealfinder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d saudidealfinder.com -d www.saudidealfinder.com
```

### 6. Deploy Application

```bash
# Pull latest changes
git pull origin main

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### 7. Setup Automated Backups

Create backup script `/opt/backup/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
docker exec saudi-deals-db pg_dump -U postgres saudi_deals > $BACKUP_DIR/db_$TIMESTAMP.sql

# Backup uploads (if any)
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz /path/to/uploads

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /opt/backup/backup.sh
```

## Stripe Configuration

1. Create products and prices in Stripe Dashboard:
   - Premium: $29/month
   - Pro: $99/month

2. Get API keys and add to `.env`:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`

3. Configure webhook endpoint:
   - URL: `https://yourdomain.com/webhooks/stripe`
   - Events: `checkout.session.completed`, `invoice.payment_succeeded`, etc.

4. Copy webhook secret to `.env`:
   - `STRIPE_WEBHOOK_SECRET`

## Monitoring

### Health Checks

Add to your monitoring system:
```bash
# API health
curl -f https://api.saudidealfinder.com/health || alert

# Frontend
curl -f https://saudidealfinder.com || alert
```

### Logs

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f scraper
```

### Performance Monitoring

Recommended tools:
- New Relic or Datadog for APM
- LogRocket or Sentry for error tracking
- Uptime Robot for uptime monitoring

## Updates

### Rolling Update Process

```bash
# 1. Pull latest code
git pull origin main

# 2. Build new images
docker-compose build

# 3. Run migrations
docker-compose exec backend npx prisma migrate deploy

# 4. Rolling restart
docker-compose up -d --no-deps --build frontend
docker-compose up -d --no-deps --build backend
```

### Database Migrations

Always backup before migrations:
```bash
docker exec saudi-deals-db pg_dump -U postgres saudi_deals > backup_pre_migration.sql
docker-compose exec backend npx prisma migrate deploy
```

## Troubleshooting

### High Memory Usage

If scraper uses too much memory:
```yaml
# In docker-compose.yml
scraper:
  deploy:
    resources:
      limits:
        memory: 512M
```

### Database Connection Issues

Check PostgreSQL logs:
```bash
docker-compose logs postgres
```

Verify connection string in `.env`

### Stripe Webhook Failures

1. Check webhook endpoint is accessible:
```bash
curl -X POST https://yourdomain.com/webhooks/stripe -v
```

2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

## Scaling

### Horizontal Scaling

For high traffic:

1. Use external PostgreSQL (AWS RDS, etc.)
2. Use external Redis (ElastiCache)
3. Deploy multiple backend instances behind load balancer
4. Use CDN for static assets (CloudFlare)

### Database Scaling

When database grows:
- Add read replicas for queries
- Partition large tables (properties, activity_logs)
- Archive old data

## Security Checklist

- [ ] Strong JWT_SECRET in production
- [ ] HTTPS only (no HTTP)
- [ ] Stripe webhook signature verification
- [ ] Rate limiting enabled
- [ ] Database not exposed publicly
- [ ] Regular security updates
- [ ] Backups encrypted
- [ ] Admin panel IP-restricted
