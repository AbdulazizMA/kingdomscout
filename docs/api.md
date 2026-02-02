# Saudi Deal Finder - API Documentation

## Base URL
- Development: `http://localhost:3001`
- Production: `https://api.saudidealfinder.com`

## Authentication
Most endpoints require authentication via Bearer token:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+966501234567"
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Properties/Deals

#### GET /api/properties
List properties with optional filters.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20, max: 50)
- `city` (string): City slug (e.g., 'riyadh', 'jeddah')
- `type` (string): Property type slug
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `dealType` (string): 'hot_deal', 'good_deal', or 'fair_price'
- `sortBy` (string): 'price', 'score', 'date', or 'price_per_sqm'

**Response:**
```json
{
  "properties": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "tier": "free",
  "upgradePrompt": null
}
```

#### GET /api/properties/:id
Get detailed property information.

#### POST /api/properties/:id/favorite
Toggle favorite status (auth required).

### User

#### GET /api/user/profile
Get current user profile (auth required).

#### PATCH /api/user/profile
Update profile (auth required).

#### GET /api/user/dashboard
Get dashboard statistics (auth required).

#### GET /api/user/searches
List saved searches (auth required).

#### POST /api/user/searches
Create new saved search (auth required).

**Body:**
```json
{
  "name": "Riyadh Villas under 2M",
  "filters": {
    "cities": ["riyadh"],
    "propertyTypes": ["villa"],
    "maxPrice": 2000000
  },
  "emailAlerts": true
}
```

### Subscription

#### GET /api/subscription/plans
Get available subscription plans.

#### GET /api/subscription/current
Get current user subscription (auth required).

#### POST /api/subscription/checkout
Create checkout session for upgrade (auth required).

**Body:**
```json
{
  "tier": "premium",
  "successUrl": "https://app.saudidealfinder.com/success",
  "cancelUrl": "https://app.saudidealfinder.com/cancel"
}
```

#### POST /api/subscription/cancel
Cancel subscription (auth required).

### Admin (Admin role required)

#### GET /api/admin/stats
Get platform statistics.

#### GET /api/admin/users
List all users with pagination.

#### GET /api/admin/properties
List all properties for management.

#### PATCH /api/admin/properties/:id
Update property status/details.

## Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., duplicate email)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## Rate Limits

- General: 100 requests per 15 minutes per IP
- Authentication: 10 requests per hour per IP
- API (Pro tier): 1,000 requests per day
