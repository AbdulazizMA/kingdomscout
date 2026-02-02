-- Database Schema for Saudi Property Deals Platform
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en', -- en, ar
    
    -- Subscription info
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, premium, pro
    subscription_status VARCHAR(20) DEFAULT 'inactive', -- active, inactive, cancelled, past_due
    subscription_started_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Notification preferences
    email_notifications BOOLEAN DEFAULT true,
    telegram_notifications BOOLEAN DEFAULT false,
    telegram_chat_id VARCHAR(100),
    whatsapp_notifications BOOLEAN DEFAULT false,
    whatsapp_number VARCHAR(20),
    
    -- Meta
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true
);

-- Cities table
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Districts/Neighborhoods table
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    avg_price_per_sqm DECIMAL(12, 2),
    price_data_updated_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city_id, slug)
);

-- Property types
CREATE TABLE property_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(50) NOT NULL,
    name_ar VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Properties/Deals table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) UNIQUE, -- ID from sa.aqar.fm
    source_url TEXT NOT NULL,
    
    -- Location
    city_id UUID REFERENCES cities(id),
    district_id UUID REFERENCES districts(id),
    full_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Property details
    property_type_id UUID REFERENCES property_types(id),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) NOT NULL,
    size_sqm DECIMAL(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    floor INTEGER,
    building_age_years INTEGER,
    furnished BOOLEAN,
    
    -- Pricing analysis
    price_per_sqm DECIMAL(12, 2),
    district_avg_price_per_sqm DECIMAL(12, 2),
    price_vs_market_percent DECIMAL(5, 2), -- negative means below market
    
    -- Deal scoring
    investment_score INTEGER CHECK (investment_score >= 0 AND investment_score <= 100),
    deal_type VARCHAR(20), -- hot_deal, good_deal, fair_price, overpriced
    
    -- Rental yield estimation
    estimated_monthly_rent DECIMAL(12, 2),
    estimated_annual_yield_percent DECIMAL(5, 2),
    
    -- Images
    main_image_url TEXT,
    image_urls TEXT[], -- array of image URLs
    
    -- Contact info
    contact_name VARCHAR(200),
    contact_phone VARCHAR(20),
    is_verified_contact BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, sold, expired, hidden
    listed_at TIMESTAMP,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Admin
    admin_notes TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0
);

-- Price history tracking
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    price DECIMAL(15, 2) NOT NULL,
    price_per_sqm DECIMAL(12, 2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) -- scraper, manual, api
);

-- User favorites
CREATE TABLE user_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id)
);

-- Saved searches
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    
    -- Filters stored as JSON
    filters JSONB NOT NULL,
    
    -- Notification settings
    email_alerts BOOLEAN DEFAULT true,
    telegram_alerts BOOLEAN DEFAULT false,
    last_alert_sent_at TIMESTAMP,
    new_deals_count INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search alerts log
CREATE TABLE search_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    saved_search_id UUID REFERENCES saved_searches(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP
);

-- API access tokens (for Pro users)
CREATE TABLE api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    request_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API request logs
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_token_id UUID REFERENCES api_tokens(id),
    user_id UUID REFERENCES users(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address INET,
    response_status INTEGER,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User activity log
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- view_deal, save_deal, search, export, etc.
    entity_type VARCHAR(50), -- property, search, etc.
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scraper jobs log
CREATE TABLE scraper_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id),
    property_type_id UUID REFERENCES property_types(id),
    status VARCHAR(20) NOT NULL, -- running, completed, failed
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    properties_found INTEGER DEFAULT 0,
    properties_new INTEGER DEFAULT 0,
    properties_updated INTEGER DEFAULT 0,
    properties_sold INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB
);

-- Admin notes/comments on properties
CREATE TABLE property_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT true, -- true = admin only, false = public
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog/Content table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    author_id UUID REFERENCES users(id),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_properties_city ON properties(city_id);
CREATE INDEX idx_properties_district ON properties(district_id);
CREATE INDEX idx_properties_type ON properties(property_type_id);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_score ON properties(investment_score DESC);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_deal_type ON properties(deal_type);
CREATE INDEX idx_properties_listed_at ON properties(listed_at DESC);
CREATE INDEX idx_properties_scraped_at ON properties(scraped_at DESC);

CREATE INDEX idx_price_history_property ON price_history(property_id);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- Full-text search index
CREATE INDEX idx_properties_search ON properties USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Initial data

-- Cities
INSERT INTO cities (name_en, name_ar, slug, region, priority) VALUES
('Riyadh', 'الرياض', 'riyadh', 'Riyadh Region', 1),
('Jeddah', 'جدة', 'jeddah', 'Makkah Region', 2),
('Makkah', 'مكة المكرمة', 'makkah', 'Makkah Region', 3),
('Madinah', 'المدينة المنورة', 'madinah', 'Madinah Region', 4),
('Dammam', 'الدمام', 'dammam', 'Eastern Province', 5),
('Khobar', 'الخبر', 'khobar', 'Eastern Province', 6),
('Taif', 'الطائف', 'taif', 'Makkah Region', 7),
('Abha', 'أبها', 'abha', 'Asir Region', 8),
('Khamis Mushait', 'خميس مشيط', 'khamis-mushait', 'Asir Region', 9),
('Buraidah', 'بريدة', 'buraidah', 'Qassim Region', 10),
('Tabuk', 'تبوك', 'tabuk', 'Tabuk Region', 11),
('Ha''il', 'حائل', 'hail', 'Ha''il Region', 12),
('Najran', 'نجران', 'najran', 'Najran Region', 13),
('Jubail', 'الجبيل', 'jubail', 'Eastern Province', 14),
('Yanbu', 'ينبع', 'yanbu', 'Madinah Region', 15);

-- Property types
INSERT INTO property_types (name_en, name_ar, slug, display_order) VALUES
('Apartment', 'شقة', 'apartment', 1),
('Villa', 'فيلا', 'villa', 2),
('Building', 'عمارة', 'building', 3),
('Land', 'أرض', 'land', 4),
('Commercial', 'تجاري', 'commercial', 5),
('Farm', 'مزرعة', 'farm', 6),
('Chalet', 'استراحة', 'chalet', 7),
('Office', 'مكتب', 'office', 8),
('Shop', 'محل', 'shop', 9),
('Warehouse', 'مستودع', 'warehouse', 10);
