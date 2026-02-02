#!/usr/bin/env python3
import os
import sys
import time
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings, logger
from scraper import AqarScraper
from database import db_manager
from notifications import NotificationManager

# Major Saudi cities with their aqar.fm slugs
SAUDI_CITIES = {
    'الرياض': 'الرياض',
    'جدة': 'جدة', 
    'مكة': 'مكة',
    'المدينة': 'المدينة',
    'الدمام': 'الدمام',
    'الخبر': 'الخبر',
    'تبوك': 'تبوك',
    'بريدة': 'بريدة',
    'طائف': 'طائف',
    'أبها': 'أبها',
    'نجران': 'نجران',
    'حائل': 'حائل',
    'الجبيل': 'الجبيل',
    'القطيف': 'القطيف',
    'خميس-مشيط': 'خميس-مشيط'
}

class ScraperRunner:
    def __init__(self):
        self.scraper = AqarScraper()
        self.notifier = NotificationManager()
        self.cities = SAUDI_CITIES
    
    def analyze_property(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a property to determine deal quality"""
        analysis = {}
        
        try:
            price = listing.get('price')
            size = listing.get('size_sqm')
            
            if price and size and size > 0:
                price_per_sqm = price / size
                analysis['price_per_sqm'] = price_per_sqm
                
                # Simple scoring based on price per sqm
                # Lower price per sqm = better deal
                # This is a simplified scoring - real implementation would use market data
                
                # Assume average market price is around 5000 SAR/sqm for apartments
                # and 3500 SAR/sqm for villas (very rough estimates)
                assumed_avg = 5000
                
                if price_per_sqm < assumed_avg * 0.7:
                    analysis['deal_type'] = 'hot_deal'
                    analysis['investment_score'] = min(95, int(90 + (assumed_avg - price_per_sqm) / assumed_avg * 20))
                    analysis['price_vs_market_percent'] = -int((assumed_avg - price_per_sqm) / assumed_avg * 100)
                elif price_per_sqm < assumed_avg * 0.85:
                    analysis['deal_type'] = 'good_deal'
                    analysis['investment_score'] = min(84, int(75 + (assumed_avg - price_per_sqm) / assumed_avg * 30))
                    analysis['price_vs_market_percent'] = -int((assumed_avg - price_per_sqm) / assumed_avg * 100)
                elif price_per_sqm < assumed_avg * 1.0:
                    analysis['deal_type'] = 'fair_price'
                    analysis['investment_score'] = min(74, int(60 + (assumed_avg - price_per_sqm) / assumed_avg * 50))
                    analysis['price_vs_market_percent'] = -int((assumed_avg - price_per_sqm) / assumed_avg * 100)
                else:
                    analysis['deal_type'] = 'overpriced'
                    analysis['investment_score'] = max(40, int(60 - (price_per_sqm - assumed_avg) / assumed_avg * 30))
                    analysis['price_vs_market_percent'] = int((price_per_sqm - assumed_avg) / assumed_avg * 100)
                
                # Estimate monthly rent (very rough estimate - 4-6% annual yield)
                annual_yield_rate = 0.05  # 5%
                analysis['estimated_annual_yield_percent'] = annual_yield_rate * 100
                analysis['estimated_monthly_rent'] = price * annual_yield_rate / 12
                
            else:
                analysis['deal_type'] = 'unknown'
                analysis['investment_score'] = 50
                
        except Exception as e:
            logger.error(f"Error analyzing property: {e}")
            analysis['deal_type'] = 'unknown'
            analysis['investment_score'] = 50
        
        return analysis
    
    def process_listing(self, listing: Dict[str, Any], city_id: str) -> bool:
        """Process a single listing - analyze and save to database"""
        try:
            # Add city_id
            listing['city_id'] = city_id
            
            # Try to get district_id if we have district info
            if listing.get('district'):
                district_id = db_manager.get_or_create_district(city_id, listing['district'])
                if district_id:
                    listing['district_id'] = district_id
            
            # Analyze the property
            analysis = self.analyze_property(listing)
            listing.update(analysis)
            
            # Save to database
            success, action = db_manager.save_property(listing)
            
            if success:
                logger.info(f"Property {listing.get('external_id')}: {action}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error processing listing {listing.get('external_id')}: {e}")
            return False
    
    def scrape_city(self, city_name: str, city_slug: str, max_pages: int = 3) -> Dict[str, Any]:
        """Scrape all listings for a city and save to database"""
        result = {
            'city': city_name,
            'found': 0,
            'created': 0,
            'updated': 0,
            'errors': 0,
            'start_time': datetime.now(),
            'end_time': None
        }
        
        try:
            logger.info(f"Starting scrape for {city_name}")
            
            # Get or create city
            city_id = db_manager.get_or_create_city(city_name, city_slug)
            if not city_id:
                logger.error(f"Failed to get/create city: {city_name}")
                result['errors'] += 1
                return result
            
            # Scrape listings
            listings = self.scraper.scrape_city(city_slug, max_pages=max_pages, scrape_details=True)
            result['found'] = len(listings)
            
            if not listings:
                logger.warning(f"No listings found for {city_name}")
                db_manager.log_scraper_job(city_id, 'completed', 0, 0, 0)
                return result
            
            # Process each listing
            for listing in listings:
                try:
                    success = self.process_listing(listing, city_id)
                    if success:
                        # Will be counted properly by save_property returning action
                        pass
                except Exception as e:
                    logger.error(f"Error processing listing: {e}")
                    result['errors'] += 1
            
            # Get actual stats from database
            result['end_time'] = datetime.now()
            
            # Log the job
            db_manager.log_scraper_job(
                city_id, 
                'completed' if result['errors'] == 0 else 'partial',
                result['found'],
                result['created'],
                result['updated'],
                None if result['errors'] == 0 else f"{result['errors']} errors occurred"
            )
            
            logger.info(
                f"Completed scrape for {city_name}: "
                f"{result['found']} found, {result['errors']} errors"
            )
            
        except Exception as e:
            logger.error(f"Critical error scraping {city_name}: {e}")
            result['errors'] += 1
            
            # Try to log the error
            try:
                city_id = db_manager.get_or_create_city(city_name, city_slug)
                if city_id:
                    db_manager.log_scraper_job(city_id, 'failed', 0, 0, 0, str(e))
            except:
                pass
        
        return result
    
    def run_all_cities(self, max_pages: int = 2, specific_cities: List[str] = None) -> List[Dict[str, Any]]:
        """Run scrape jobs for all cities or specific cities"""
        results = []
        
        cities_to_scrape = {}
        if specific_cities:
            for city in specific_cities:
                if city in self.cities:
                    cities_to_scrape[city] = self.cities[city]
                else:
                    logger.warning(f"Unknown city: {city}")
        else:
            cities_to_scrape = self.cities
        
        logger.info(f"Starting scrape for {len(cities_to_scrape)} cities")
        
        for city_name, city_slug in cities_to_scrape.items():
            try:
                result = self.scrape_city(city_name, city_slug, max_pages=max_pages)
                results.append(result)
                
                # Wait between cities to be respectful
                time.sleep(5)
                
            except Exception as e:
                logger.error(f"Critical error in scraper for {city_name}: {e}")
                results.append({
                    'city': city_name,
                    'found': 0,
                    'created': 0,
                    'updated': 0,
                    'errors': 1,
                    'error_message': str(e)
                })
        
        # Send summary notification
        try:
            self.notifier.send_scrape_summary(results)
        except Exception as e:
            logger.error(f"Error sending scrape summary: {e}")
        
        return results
    
    def run_continuous(self, interval_hours: int = 4):
        """Run scraper continuously at specified intervals"""
        import schedule
        
        logger.info(f"Starting continuous scraper (interval: {interval_hours} hours)")
        
        # Run immediately on startup
        self.run_all_cities()
        
        # Schedule regular runs
        schedule.every(interval_hours).hours.do(self.run_all_cities)
        
        logger.info("Scraper scheduler started")
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("Scraper stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in scheduler: {e}")
                time.sleep(60)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Saudi Property Scraper')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    parser.add_argument('--city', type=str, help='Scrape specific city')
    parser.add_argument('--pages', type=int, default=2, help='Max pages per city')
    parser.add_argument('--continuous', action='store_true', help='Run continuously')
    parser.add_argument('--interval', type=int, default=4, help='Interval in hours for continuous mode')
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("KingdomScout Saudi Property Scraper Starting")
    logger.info("=" * 60)
    
    runner = ScraperRunner()
    
    if args.city:
        # Scrape specific city
        result = runner.scrape_city(args.city, args.city, max_pages=args.pages)
        print(f"\nResults for {args.city}:")
        print(f"  Found: {result['found']}")
        print(f"  Errors: {result['errors']}")
    elif args.continuous:
        # Run continuously
        runner.run_continuous(interval_hours=args.interval)
    else:
        # Run once for all cities (or specific if provided)
        cities = [args.city] if args.city else None
        results = runner.run_all_cities(max_pages=args.pages, specific_cities=cities)
        
        # Print summary
        print("\n" + "=" * 60)
        print("SCRAPE SUMMARY")
        print("=" * 60)
        
        total_found = sum(r['found'] for r in results)
        total_errors = sum(r['errors'] for r in results)
        
        for r in results:
            print(f"{r['city']}: {r['found']} found, {r['errors']} errors")
        
        print("-" * 60)
        print(f"Total: {total_found} found, {total_errors} errors")
        print("=" * 60)


if __name__ == '__main__':
    main()
