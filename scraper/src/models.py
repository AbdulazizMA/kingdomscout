from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class PropertyType(str, Enum):
    APARTMENT = "apartment"
    VILLA = "villa"
    BUILDING = "building"
    LAND = "land"
    COMMERCIAL = "commercial"
    FARM = "farm"
    CHALET = "chalet"
    OFFICE = "office"
    SHOP = "shop"
    WAREHOUSE = "warehouse"

class DealType(str, Enum):
    HOT_DEAL = "hot_deal"
    GOOD_DEAL = "good_deal"
    FAIR_PRICE = "fair_price"
    OVERPRICED = "overpriced"

class PropertyListing(BaseModel):
    external_id: str
    source_url: str
    title: str
    description: Optional[str] = None
    price: Decimal
    size_sqm: Optional[Decimal] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor: Optional[int] = None
    building_age_years: Optional[int] = None
    furnished: Optional[bool] = None
    
    city: str
    district: Optional[str] = None
    full_address: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    
    property_type: PropertyType
    
    main_image_url: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)
    
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    
    listed_at: Optional[datetime] = None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)

class PropertyAnalysis(BaseModel):
    property_id: str
    price_per_sqm: Optional[Decimal] = None
    district_avg_price_per_sqm: Optional[Decimal] = None
    price_vs_market_percent: Optional[Decimal] = None
    
    investment_score: int = Field(ge=0, le=100)
    deal_type: DealType
    
    estimated_monthly_rent: Optional[Decimal] = None
    estimated_annual_yield_percent: Optional[Decimal] = None
    
    price_trend: Optional[str] = None  # 'rising', 'falling', 'stable'
    days_on_market: Optional[int] = None
    
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)

class ScrapeResult(BaseModel):
    city: str
    property_type: Optional[str] = None
    properties_found: int = 0
    properties_new: int = 0
    properties_updated: int = 0
    errors: List[str] = Field(default_factory=list)
    duration_seconds: float = 0.0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class CityConfig(BaseModel):
    name: str
    name_ar: str
    slug: str
    aqar_path: str  # URL path segment for this city on aqar.fm
    districts: List[str] = Field(default_factory=list)
    is_active: bool = True

# Saudi cities configuration
SAUDI_CITIES = [
    CityConfig(name="Riyadh", name_ar="الرياض", slug="riyadh", aqar_path="الرياض"),
    CityConfig(name="Jeddah", name_ar="جدة", slug="jeddah", aqar_path="جدة"),
    CityConfig(name="Makkah", name_ar="مكة المكرمة", slug="makkah", aqar_path="مكة"),
    CityConfig(name="Madinah", name_ar="المدينة المنورة", slug="madinah", aqar_path="المدينة"),
    CityConfig(name="Dammam", name_ar="الدمام", slug="dammam", aqar_path="الدمام"),
    CityConfig(name="Khobar", name_ar="الخبر", slug="khobar", aqar_path="الخبر"),
    CityConfig(name="Taif", name_ar="الطائف", slug="taif", aqar_path="الطائف"),
    CityConfig(name="Abha", name_ar="أبها", slug="abha", aqar_path="أبها"),
    CityConfig(name="Khamis Mushait", name_ar="خميس مشيط", slug="khamis-mushait", aqar_path="خميس-مشيط"),
    CityConfig(name="Buraidah", name_ar="بريدة", slug="buraidah", aqar_path="بريدة"),
    CityConfig(name="Tabuk", name_ar="تبوك", slug="tabuk", aqar_path="تبوك"),
    CityConfig(name="Hail", name_ar="حائل", slug="hail", aqar_path="حائل"),
    CityConfig(name="Najran", name_ar="نجران", slug="najran", aqar_path="نجران"),
    CityConfig(name="Jubail", name_ar="الجبيل", slug="jubail", aqar_path="الجبيل"),
    CityConfig(name="Yanbu", name_ar="ينبع", slug="yanbu", aqar_path="ينبع"),
]

PROPERTY_TYPE_MAPPING = {
    "شقق": PropertyType.APARTMENT,
    "فلل": PropertyType.VILLA,
    "عماير": PropertyType.BUILDING,
    "أراضي": PropertyType.LAND,
    "تجاري": PropertyType.COMMERCIAL,
    "مزارع": PropertyType.FARM,
    "استراحات": PropertyType.CHALET,
    "مكاتب": PropertyType.OFFICE,
    "محلات": PropertyType.SHOP,
    "مستودعات": PropertyType.WAREHOUSE,
}
