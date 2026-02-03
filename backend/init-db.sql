-- Create extension for UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    avatar_url VARCHAR(255),
    preferred_language VARCHAR(255) DEFAULT 'en',
    subscription_tier VARCHAR(255) DEFAULT 'free',
    subscription_status VARCHAR(255) DEFAULT 'inactive',
    subscription_started_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    email_notifications BOOLEAN DEFAULT true,
    telegram_notifications BOOLEAN DEFAULT false,
    telegram_chat_id VARCHAR(255),
    whatsapp_notifications BOOLEAN DEFAULT false,
    whatsapp_number VARCHAR(255),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    region VARCHAR(255),
    latitude DECIMAL,
    longitude DECIMAL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create districts table
CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    latitude DECIMAL,
    longitude DECIMAL,
    avg_price_per_sqm DECIMAL,
    price_data_updated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, slug)
);

-- Create property_types table
CREATE TABLE IF NOT EXISTS property_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255) UNIQUE,
    source_url VARCHAR(255) NOT NULL,
    city_id UUID REFERENCES cities(id),
    district_id UUID REFERENCES districts(id),
    full_address VARCHAR(255),
    latitude DECIMAL,
    longitude DECIMAL,
    property_type_id UUID REFERENCES property_types(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL NOT NULL,
    size_sqm DECIMAL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    floor INTEGER,
    building_age_years INTEGER,
    furnished BOOLEAN,
    price_per_sqm DECIMAL,
    district_avg_price_per_sqm DECIMAL,
    price_vs_market_percent DECIMAL,
    investment_score INTEGER,
    deal_type VARCHAR(255),
    estimated_monthly_rent DECIMAL,
    estimated_annual_yield_percent DECIMAL,
    main_image_url VARCHAR(255),
    image_urls TEXT[],
    contact_name VARCHAR(255),
    contact_phone VARCHAR(255),
    is_verified_contact BOOLEAN DEFAULT false,
    status VARCHAR(255) DEFAULT 'active',
    listed_at TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_notes TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_score ON properties(investment_score);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_deal ON properties(deal_type);
CREATE INDEX IF NOT EXISTS idx_properties_scraped ON properties(scraped_at);

-- Insert sample cities
INSERT INTO cities (name_en, name_ar, slug, region, priority) VALUES 
    ('Riyadh', 'الرياض', 'riyadh', 'Riyadh Region', 1),
    ('Jeddah', 'جدة', 'jeddah', 'Makkah Region', 2),
    ('Makkah', 'مكة المكرمة', 'makkah', 'Makkah Region', 3),
    ('Dammam', 'الدمام', 'dammam', 'Eastern Province', 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample property types
INSERT INTO property_types (name_en, name_ar, slug, display_order) VALUES 
    ('Apartment', 'شقة', 'apartment', 1),
    ('Villa', 'فيلا', 'villa', 2),
    ('Land', 'أرض', 'land', 3)
ON CONFLICT (slug) DO NOTHING;
