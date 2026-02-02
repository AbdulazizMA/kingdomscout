from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional, List, Dict
from dataclasses import dataclass
from statistics import mean

from config import settings, logger
from models import PropertyListing, PropertyAnalysis, DealType

@dataclass
class MarketMetrics:
    avg_price_per_sqm: Decimal
    median_price_per_sqm: Decimal
    min_price_per_sqm: Decimal
    max_price_per_sqm: Decimal
    sample_size: int

class DealAnalyzer:
    def __init__(self, db_connection=None):
        self.db = db_connection
        self.market_data_cache: Dict[str, MarketMetrics] = {}
    
    def calculate_market_metrics(self, city: str, district: Optional[str], 
                                  property_type: str, 
                                  exclude_property_id: Optional[str] = None) -> MarketMetrics:
        """Calculate market averages for a specific area and property type"""
        cache_key = f"{city}:{district}:{property_type}"
        
        if cache_key in self.market_data_cache:
            return self.market_data_cache[cache_key]
        
        # In production, query database for recent sales/listings
        # For now, return placeholder metrics
        # This would be populated from historical data
        
        metrics = MarketMetrics(
            avg_price_per_sqm=Decimal('4500'),  # Placeholder
            median_price_per_sqm=Decimal('4200'),
            min_price_per_sqm=Decimal('3000'),
            max_price_per_sqm=Decimal('8000'),
            sample_size=100
        )
        
        self.market_data_cache[cache_key] = metrics
        return metrics
    
    def calculate_price_per_sqm(self, price: Decimal, size_sqm: Optional[Decimal]) -> Optional[Decimal]:
        """Calculate price per square meter"""
        if size_sqm and size_sqm > 0:
            return round(price / size_sqm, 2)
        return None
    
    def calculate_price_vs_market(self, price_per_sqm: Optional[Decimal], 
                                   market_avg: Decimal) -> Optional[Decimal]:
        """Calculate percentage difference from market average"""
        if not price_per_sqm or market_avg == 0:
            return None
        return round(((price_per_sqm - market_avg) / market_avg) * 100, 2)
    
    def estimate_rental_yield(self, property_type: str, city: str, 
                              price: Decimal, size_sqm: Optional[Decimal]) -> tuple[Optional[Decimal], Optional[Decimal]]:
        """Estimate monthly rent and annual yield based on property characteristics"""
        
        # Get base yield for city
        if city == "Riyadh":
            base_yield = settings.AVG_RENTAL_YIELD_RIYADH
        elif city == "Jeddah":
            base_yield = settings.AVG_RENTAL_YIELD_JEDDAH
        else:
            base_yield = settings.AVG_RENTAL_YIELD_OTHER
        
        # Adjust for property type
        type_multipliers = {
            "apartment": 1.0,
            "villa": 0.9,
            "building": 1.2,
            "commercial": 1.3,
            "office": 1.1,
            "shop": 1.25,
        }
        multiplier = type_multipliers.get(property_type, 1.0)
        adjusted_yield = base_yield * multiplier
        
        # Calculate annual rent and monthly rent
        annual_yield_decimal = Decimal(str(adjusted_yield / 100))
        annual_rent = price * annual_yield_decimal
        monthly_rent = annual_rent / 12
        
        return round(monthly_rent, 2), round(adjusted_yield, 2)
    
    def calculate_investment_score(self, listing: PropertyListing, 
                                   market_metrics: MarketMetrics) -> int:
        """Calculate investment score (0-100) based on multiple factors"""
        
        score = 50  # Base score
        
        # Price factor (40% weight)
        if listing.price:
            price_per_sqm = self.calculate_price_per_sqm(listing.price, listing.size_sqm)
            if price_per_sqm and market_metrics.avg_price_per_sqm:
                discount = (market_metrics.avg_price_per_sqm - price_per_sqm) / market_metrics.avg_price_per_sqm
                discount_percent = float(discount) * 100
                
                # Score based on discount
                if discount_percent >= 20:
                    score += 40
                elif discount_percent >= 15:
                    score += 30
                elif discount_percent >= 10:
                    score += 20
                elif discount_percent >= 5:
                    score += 10
                elif discount_percent < -10:  # Overpriced
                    score -= 20
                elif discount_percent < 0:
                    score -= 10
        
        # Location factor (30% weight) - based on district desirability
        # In production, this would use actual market data
        score += 15  # Placeholder
        
        # Yield factor (20% weight)
        monthly_rent, yield_percent = self.estimate_rental_yield(
            listing.property_type.value, listing.city, listing.price, listing.size_sqm
        )
        if yield_percent:
            if yield_percent >= 10:
                score += 20
            elif yield_percent >= 8:
                score += 15
            elif yield_percent >= 6:
                score += 10
            elif yield_percent >= 4:
                score += 5
        
        # Days on market factor (10% weight)
        # Fresh listings often mean better deals (seller motivated)
        # In production, calculate from listing date
        score += 5  # Placeholder
        
        # Cap score between 0-100
        return max(0, min(100, score))
    
    def classify_deal(self, price_vs_market_percent: Optional[Decimal]) -> DealType:
        """Classify deal based on price difference from market"""
        if not price_vs_market_percent:
            return DealType.FAIR_PRICE
        
        price_diff = float(price_vs_market_percent)
        
        if price_diff <= -settings.HOT_DEAL_THRESHOLD:
            return DealType.HOT_DEAL
        elif price_diff <= -settings.GOOD_DEAL_THRESHOLD:
            return DealType.GOOD_DEAL
        elif price_diff > 10:
            return DealType.OVERPRICED
        else:
            return DealType.FAIR_PRICE
    
    def analyze_property(self, listing: PropertyListing) -> PropertyAnalysis:
        """Perform full analysis on a property listing"""
        
        # Get market metrics
        market_metrics = self.calculate_market_metrics(
            listing.city,
            listing.district,
            listing.property_type.value
        )
        
        # Calculate price metrics
        price_per_sqm = self.calculate_price_per_sqm(listing.price, listing.size_sqm)
        price_vs_market = self.calculate_price_vs_market(price_per_sqm, market_metrics.avg_price_per_sqm)
        
        # Classify deal
        deal_type = self.classify_deal(price_vs_market)
        
        # Calculate investment score
        investment_score = self.calculate_investment_score(listing, market_metrics)
        
        # Estimate rental yield
        monthly_rent, yield_percent = self.estimate_rental_yield(
            listing.property_type.value,
            listing.city,
            listing.price,
            listing.size_sqm
        )
        
        analysis = PropertyAnalysis(
            property_id=listing.external_id,
            price_per_sqm=price_per_sqm,
            district_avg_price_per_sqm=market_metrics.avg_price_per_sqm,
            price_vs_market_percent=price_vs_market,
            investment_score=investment_score,
            deal_type=deal_type,
            estimated_monthly_rent=monthly_rent,
            estimated_annual_yield_percent=Decimal(str(yield_percent)) if yield_percent else None,
        )
        
        logger.info(
            f"Analysis for {listing.title[:50]}: "
            f"Score={investment_score}, Type={deal_type.value}, "
            f"Discount={price_vs_market}%"
        )
        
        return analysis
    
    def analyze_batch(self, listings: List[PropertyListing]) -> List[PropertyAnalysis]:
        """Analyze multiple properties"""
        analyses = []
        for listing in listings:
            try:
                analysis = self.analyze_property(listing)
                analyses.append(analysis)
            except Exception as e:
                logger.error(f"Error analyzing property {listing.external_id}: {e}")
        return analyses
