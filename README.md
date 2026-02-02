# KingdomScout

AI-powered property deal discovery platform for Saudi Arabia. Find undervalued real estate before everyone else.

## Features

- **Real-time Property Scanning**: Monitors sa.aqar.fm every 4 hours across 15+ Saudi cities
- **AI Investment Scoring**: Automatic scoring (1-100) based on market comparison
- **Price History Tracking**: Track price changes over time
- **Instant Alerts**: Get notified via email and Telegram for new deals
- **Favorites System**: Save and track properties you're interested in
- **Advanced Filtering**: Filter by city, district, price, size, and more

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT Authentication
- Stripe Payments

### Frontend
- Next.js 14 + TypeScript
- Tailwind CSS
- React Query
- RTL (Arabic) support

### Scraper
- Python + BeautifulSoup
- PostgreSQL direct connection
- Telegram/Email notifications

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+

### 1. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 2. Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run db:seed
```

### 3. Start Backend

```bash
cd backend
npm install
npm run dev
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Setup Scraper

```bash
cd scraper
pip install -r requirements.txt
python src/main.py --once
```

### 6. Run Scraper Continuously (Optional)

```bash
python src/main.py --continuous --interval 4
```

## Subscription

Single tier: **$9.99/month** (~37 SAR)

Includes:
- Unlimited property access
- Real-time alerts (email + Telegram)
- Save favorites
- Price history charts
- Advanced filters
- New deal notifications

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT tokens |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PRICE_ID` | Stripe price ID for subscription |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional) |
| `SENDGRID_API_KEY` | SendGrid API key (optional) |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset

### Properties
- `GET /api/properties` - List properties (with filters)
- `GET /api/properties/:id` - Get single property
- `POST /api/properties/:id/favorite` - Toggle favorite
- `GET /api/properties/user/favorites` - Get user favorites

### Subscription
- `GET /api/subscription/plan` - Get subscription details
- `POST /api/subscription/checkout` - Create checkout session
- `POST /api/subscription/portal` - Access billing portal

### User
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update profile
- `GET /api/user/dashboard` - Get dashboard stats
- `GET /api/user/searches` - Get saved searches

## Development

### Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Generate Prisma Client

```bash
npx prisma generate
```

### View Database

```bash
npx prisma studio
```

## License

MIT
