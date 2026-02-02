# Saudi Deal Finder - Scraper Documentation

## Overview

The scraper is a Python-based system that monitors sa.aqar.fm for property listings across all major Saudi cities. It runs automatically every 4 hours and performs the following tasks:

1. Scrape new property listings
2. Extract detailed property information
3. Analyze pricing against market averages
4. Calculate investment scores
5. Store data in PostgreSQL
6. Send notifications for hot deals

## Architecture

```
scraper/
├── src/
│   ├── main.py           # Entry point and scheduler
│   ├── scraper.py        # Web scraping logic
│   ├── analyzer.py       # Deal analysis and scoring
│   ├── database.py       # Database operations
│   ├── notifications.py  # Alert system
│   ├── models.py         # Data models
│   └── config.py         # Configuration
├── Dockerfile
└── requirements.txt
```

## Running the Scraper

### Development

```bash
cd scraper
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run once
python src/main.py --once

# Run with scheduler
python src/main.py
```

### Docker

```bash
docker-compose up -d scraper
```

## Scraper Configuration

Environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `SCRAPE_INTERVAL_HOURS` | Hours between scrapes | `4` |
| `REQUEST_DELAY_SECONDS` | Delay between requests | `1.5` |
| `MAX_RETRIES` | Retry attempts for failed requests | `3` |
| `TELEGRAM_BOT_TOKEN` | For Telegram alerts | Optional |
| `SENDGRID_API_KEY` | For email notifications | Optional |

## Cities Covered

The scraper covers 15+ Saudi cities:

1. Riyadh (الرياض)
2. Jeddah (جدة)
3. Makkah (مكة المكرمة)
4. Madinah (المدينة المنورة)
5. Dammam (الدمام)
6. Khobar (الخبر)
7. Taif (الطائف)
8. Abha (أبها)
9. Khamis Mushait (خميس مشيط)
10. Buraidah (بريدة)
11. Tabuk (تبوك)
12. Ha'il (حائل)
13. Najran (نجران)
14. Jubail (الجبيل)
15. Yanbu (ينبع)

## Deal Analysis Algorithm

### Investment Score (0-100)

The score is calculated using weighted factors:

- **Price vs Market (40%)**: How much below market average
  - 20%+ below: +40 points
  - 15-20% below: +30 points
  - 10-15% below: +20 points
  - 5-10% below: +10 points
  - Above market: -10 to -20 points

- **Location Quality (30%)**: District desirability index

- **Rental Yield (20%)**: Estimated annual return
  - 10%+ yield: +20 points
  - 8-10% yield: +15 points
  - 6-8% yield: +10 points

- **Market Velocity (10%)**: Days on market
  - Fresh listings often indicate motivated sellers

### Deal Classification

- **Hot Deal**: 15%+ below market (Score 70+)
- **Good Deal**: 10-15% below market (Score 50-69)
- **Fair Price**: Within 10% of market (Score 30-49)
- **Overpriced**: 10%+ above market (Score <30)

## Database Schema

Key tables for scraped data:

### properties
- Primary storage for all listings
- Tracks status (active, sold, expired, hidden)
- Stores analysis results (score, deal_type, etc.)
- Links to cities, districts, property_types

### price_history
- Tracks price changes over time
- Enables trend analysis
- Used for price drop alerts

### scraper_jobs
- Logs each scraping run
- Tracks performance metrics
- Used for monitoring and debugging

## Extending the Scraper

### Adding a New City

1. Add city configuration to `models.py`:
```python
CityConfig(
    name="New City",
    name_ar="المدينة الجديدة",
    slug="new-city",
    aqar_path="new-city-arabic"
)
```

2. The scraper will automatically include it in the next run.

### Adding New Property Types

1. Add to `PropertyType` enum in `models.py`
2. Add mapping in `PROPERTY_TYPE_MAPPING`
3. Update yield calculation multipliers in `analyzer.py`

## Monitoring

The scraper logs to both:
- Console (stdout)
- `scraper.log` file
- Database (scraper_jobs table)

### Health Checks

Check scraper status:
```bash
# View recent jobs
curl http://localhost:3001/api/admin/scraper-jobs

# Check logs
docker logs saudi-deals-scraper
```

### Common Issues

**Rate limiting**: If receiving 429 errors, increase `REQUEST_DELAY_SECONDS`.

**Blocked requests**: Consider using proxies by setting `USE_PROXIES=true` and `PROXY_LIST`.

**Missing data**: The scraper gracefully handles partial data - check logs for specific errors.

## Legal Considerations

- Respect robots.txt
- Implement reasonable rate limiting
- Don't overwhelm the source server
- Use data in compliance with terms of service
