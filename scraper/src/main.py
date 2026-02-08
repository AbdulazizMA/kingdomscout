#!/usr/bin/env python3
import os
import sys
import time
import argparse
from datetime import datetime
from typing import List, Dict, Any

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import settings, logger
from scraper import MultiSourceScraper
from database import db_manager
from notifications import NotificationManager
from validator import validate_listing, apply_flag_penalty, ValidationResult

SAUDI_CITIES = {
    'الرياض': {'en': 'Riyadh', 'slug': 'riyadh', 'region': 'Riyadh Region', 'priority': 1},
    'جدة': {'en': 'Jeddah', 'slug': 'jeddah', 'region': 'Makkah Region', 'priority': 2},
    'مكة': {'en': 'Makkah', 'slug': 'makkah', 'region': 'Makkah Region', 'priority': 3},
    'المدينة': {'en': 'Madinah', 'slug': 'madinah', 'region': 'Madinah Region', 'priority': 4},
    'الدمام': {'en': 'Dammam', 'slug': 'dammam', 'region': 'Eastern Province', 'priority': 5},
    'الخبر': {'en': 'Khobar', 'slug': 'khobar', 'region': 'Eastern Province', 'priority': 6},
    'تبوك': {'en': 'Tabuk', 'slug': 'tabuk', 'region': 'Tabuk Region', 'priority': 7},
    'بريدة': {'en': 'Buraidah', 'slug': 'buraidah', 'region': 'Qassim Region', 'priority': 8},
    'طائف': {'en': 'Taif', 'slug': 'taif', 'region': 'Makkah Region', 'priority': 9},
    'أبها': {'en': 'Abha', 'slug': 'abha', 'region': 'Asir Region', 'priority': 10},
    'نجران': {'en': 'Najran', 'slug': 'najran', 'region': 'Najran Region', 'priority': 11},
    'حائل': {'en': 'Hail', 'slug': 'hail', 'region': 'Hail Region', 'priority': 12},
    'الجبيل': {'en': 'Jubail', 'slug': 'jubail', 'region': 'Eastern Province', 'priority': 13},
    'القطيف': {'en': 'Qatif', 'slug': 'qatif', 'region': 'Eastern Province', 'priority': 14},
    'خميس-مشيط': {'en': 'Khamis Mushait', 'slug': 'khamis-mushait', 'region': 'Asir Region', 'priority': 15},
    'ينبع': {'en': 'Yanbu', 'slug': 'yanbu', 'region': 'Madinah Region', 'priority': 16},
    'الظهران': {'en': 'Dhahran', 'slug': 'dhahran', 'region': 'Eastern Province', 'priority': 17},
    'الأحساء': {'en': 'Al Ahsa', 'slug': 'al-ahsa', 'region': 'Eastern Province', 'priority': 18},
    'جازان': {'en': 'Jazan', 'slug': 'jazan', 'region': 'Jazan Region', 'priority': 19},
    'الباحة': {'en': 'Al Baha', 'slug': 'al-baha', 'region': 'Al Baha Region', 'priority': 20},
}


class ScraperRunner:
    def __init__(self):
        self.multi_scraper = MultiSourceScraper()
        self.notifier = NotificationManager()
        self.cities = SAUDI_CITIES

    def analyze_property(self, listing: Dict[str, Any], city_avg_price: float = None) -> Dict[str, Any]:
        """Analyze a property using real market data when available"""
        analysis = {}
        try:
            price = listing.get('price')
            size = listing.get('size_sqm')

            if price and size and float(size) > 0:
                price_per_sqm = float(price) / float(size)
                analysis['price_per_sqm'] = price_per_sqm

                avg = city_avg_price or 5000
                ratio = price_per_sqm / avg

                if ratio < 0.70:
                    analysis['deal_type'] = 'hot_deal'
                    analysis['investment_score'] = min(95, int(85 + (1 - ratio) * 30))
                elif ratio < 0.85:
                    analysis['deal_type'] = 'good_deal'
                    analysis['investment_score'] = min(84, int(65 + (1 - ratio) * 40))
                elif ratio < 1.0:
                    analysis['deal_type'] = 'fair_price'
                    analysis['investment_score'] = min(64, int(45 + (1 - ratio) * 80))
                else:
                    analysis['deal_type'] = 'overpriced'
                    analysis['investment_score'] = max(20, int(50 - (ratio - 1) * 40))

                analysis['price_vs_market_percent'] = round((ratio - 1) * 100, 1)
                analysis['district_avg_price_per_sqm'] = avg

                yield_rate = 0.055
                analysis['estimated_annual_yield_percent'] = yield_rate * 100
                analysis['estimated_monthly_rent'] = float(price) * yield_rate / 12
            else:
                analysis['deal_type'] = 'fair_price'
                analysis['investment_score'] = 50

        except Exception as e:
            logger.error(f"Error analyzing property: {e}")
            analysis['deal_type'] = 'fair_price'
            analysis['investment_score'] = 50

        return analysis

    def process_listing(self, listing: Dict[str, Any], city_id: str, city_avg_price: float = None) -> str:
        """Process a listing. Returns 'saved', 'rejected', 'flagged', or 'error'."""
        try:
            listing['city_id'] = city_id

            if not listing.get('price'):
                return 'rejected'

            # Validate before any DB work
            vresult, reasons = validate_listing(listing)
            if vresult == ValidationResult.REJECT:
                logger.info(f"REJECTED {listing.get('external_id')}: {'; '.join(reasons)}")
                return 'rejected'

            if listing.get('district'):
                district_id = db_manager.get_or_create_district(city_id, listing['district'])
                if district_id:
                    listing['district_id'] = district_id

            if listing.get('property_type'):
                type_id = db_manager.get_or_create_property_type(listing['property_type'], listing['property_type'])
                if type_id:
                    listing['property_type_id'] = type_id

            analysis = self.analyze_property(listing, city_avg_price)
            listing.update(analysis)

            # Apply flag penalty after scoring
            if vresult == ValidationResult.FLAG:
                listing = apply_flag_penalty(listing, reasons)
                logger.info(f"FLAGGED {listing.get('external_id')}: {'; '.join(reasons)}")

            success, action = db_manager.save_property(listing)
            if success:
                return 'flagged' if vresult == ValidationResult.FLAG else 'saved'
            return 'error'

        except Exception as e:
            logger.error(f"Error processing listing {listing.get('external_id')}: {e}")
            return 'error'

    def scrape_city(self, city_ar: str, city_info: Dict, max_pages: int = 3) -> Dict[str, Any]:
        result = {
            'city': city_ar, 'city_en': city_info['en'],
            'found': 0, 'created': 0, 'updated': 0,
            'rejected': 0, 'flagged': 0, 'errors': 0,
            'start_time': datetime.now(),
        }

        try:
            logger.info(f"=== Scraping {city_info['en']} ({city_ar}) ===")

            city_id = db_manager.get_or_create_city(
                city_ar, city_info['slug'],
                name_en=city_info['en'],
                region=city_info.get('region'),
                priority=city_info.get('priority', 0)
            )
            if not city_id:
                result['errors'] += 1
                return result

            city_avg = db_manager.get_city_avg_price(city_id)

            listings = self.multi_scraper.scrape_city(city_ar, max_pages=max_pages)
            result['found'] = len(listings)

            if not listings:
                db_manager.log_scraper_job(city_id, 'completed', 0, 0, 0)
                return result

            saved = 0
            for listing in listings:
                try:
                    outcome = self.process_listing(listing, city_id, city_avg)
                    if outcome == 'saved':
                        saved += 1
                    elif outcome == 'flagged':
                        saved += 1
                        result['flagged'] += 1
                    elif outcome == 'rejected':
                        result['rejected'] += 1
                    else:
                        result['errors'] += 1
                except Exception as e:
                    logger.error(f"Error processing: {e}")
                    result['errors'] += 1

            result['created'] = saved

            db_manager.log_scraper_job(
                city_id,
                'completed' if result['errors'] == 0 else 'partial',
                result['found'], saved, 0,
                f"{result['errors']} errors, {result['rejected']} rejected, {result['flagged']} flagged"
                if (result['errors'] + result['rejected'] + result['flagged']) > 0 else None
            )

            logger.info(
                f"Done {city_info['en']}: {result['found']} found, {saved} saved, "
                f"{result['rejected']} rejected, {result['flagged']} flagged, {result['errors']} errors"
            )

        except Exception as e:
            logger.error(f"Critical error scraping {city_ar}: {e}")
            result['errors'] += 1

        return result

    def run_all_cities(self, max_pages: int = 2, specific_cities: List[str] = None) -> List[Dict[str, Any]]:
        results = []

        cities_to_scrape = {}
        if specific_cities:
            for city in specific_cities:
                if city in self.cities:
                    cities_to_scrape[city] = self.cities[city]
        else:
            cities_to_scrape = self.cities

        logger.info(f"Scraping {len(cities_to_scrape)} cities from {len(self.multi_scraper.scrapers)} sources")

        for city_ar, city_info in cities_to_scrape.items():
            try:
                result = self.scrape_city(city_ar, city_info, max_pages=max_pages)
                results.append(result)
                time.sleep(5)
            except Exception as e:
                logger.error(f"Critical error for {city_ar}: {e}")
                results.append({'city': city_ar, 'city_en': city_info['en'], 'found': 0, 'errors': 1})

        try:
            db_manager.update_district_averages()
        except Exception as e:
            logger.error(f"Error updating averages: {e}")

        # Delete stale properties not seen for N days
        try:
            cycle_count = db_manager.get_completed_scrape_cycles()
            if cycle_count >= settings.STALE_MIN_SCRAPE_CYCLES:
                db_manager.delete_stale_properties(days=settings.STALE_DELETE_DAYS)
            else:
                logger.info(f"Skipping stale cleanup: {cycle_count} cycles completed (min: {settings.STALE_MIN_SCRAPE_CYCLES})")
        except Exception as e:
            logger.error(f"Error in stale cleanup: {e}")

        # Revalidate existing data (downgrade statistical outliers)
        try:
            revalidation = db_manager.revalidate_existing_properties()
            logger.info(f"Revalidation: {revalidation}")
        except Exception as e:
            logger.error(f"Error in revalidation: {e}")

        try:
            self.notifier.send_scrape_summary(results)
        except Exception as e:
            logger.error(f"Error sending summary: {e}")

        return results

    def run_continuous(self, interval_hours: int = 4):
        import schedule
        logger.info(f"Starting continuous scraper (interval: {interval_hours}h)")
        self.run_all_cities()
        schedule.every(interval_hours).hours.do(self.run_all_cities)
        while True:
            try:
                schedule.run_pending()
                time.sleep(60)
            except KeyboardInterrupt:
                logger.info("Scraper stopped")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(60)


def main():
    parser = argparse.ArgumentParser(description='KingdomScout Multi-Source Property Scraper')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    parser.add_argument('--city', type=str, help='Scrape specific city (Arabic name)')
    parser.add_argument('--pages', type=int, default=2, help='Max pages per city per source')
    parser.add_argument('--continuous', action='store_true', help='Run continuously')
    parser.add_argument('--interval', type=int, default=4, help='Hours between runs')
    parser.add_argument('--cleanup', action='store_true', help='Run data quality cleanup on existing records')

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("KingdomScout Multi-Source Property Scraper")
    logger.info(f"Sources: aqar.fm, bayut.sa, haraj.com.sa")
    logger.info(f"Cities: {len(SAUDI_CITIES)}")
    logger.info("=" * 60)

    if args.cleanup:
        logger.info("Running data quality cleanup...")
        results = db_manager.cleanup_bad_data()
        print("\n" + "=" * 60)
        print("CLEANUP RESULTS")
        print("=" * 60)
        for rule, count in results.items():
            print(f"  {rule}: {count} rows")
        print("=" * 60)
        return

    runner = ScraperRunner()

    if args.city:
        if args.city in SAUDI_CITIES:
            result = runner.scrape_city(args.city, SAUDI_CITIES[args.city], max_pages=args.pages)
            print(
                f"\nResults for {args.city}: {result['found']} found, "
                f"{result['created']} saved, {result['rejected']} rejected, "
                f"{result['flagged']} flagged, {result['errors']} errors"
            )
        else:
            print(f"Unknown city: {args.city}")
            print(f"Available: {', '.join(SAUDI_CITIES.keys())}")
    elif args.continuous:
        runner.run_continuous(interval_hours=args.interval)
    else:
        results = runner.run_all_cities(max_pages=args.pages)

        print("\n" + "=" * 60)
        print("SCRAPE SUMMARY")
        print("=" * 60)

        total_found = sum(r['found'] for r in results)
        total_saved = sum(r.get('created', 0) for r in results)
        total_rejected = sum(r.get('rejected', 0) for r in results)
        total_flagged = sum(r.get('flagged', 0) for r in results)
        total_errors = sum(r.get('errors', 0) for r in results)

        for r in results:
            status = "OK" if r.get('errors', 0) == 0 and r.get('rejected', 0) == 0 else "WARN"
            print(
                f"  [{status}] {r.get('city_en', r['city'])}: "
                f"{r['found']} found, {r.get('created', 0)} saved, "
                f"{r.get('rejected', 0)} rejected, {r.get('flagged', 0)} flagged"
            )

        print("-" * 60)
        print(
            f"  Total: {total_found} found, {total_saved} saved, "
            f"{total_rejected} rejected, {total_flagged} flagged, {total_errors} errors"
        )
        print("=" * 60)


if __name__ == '__main__':
    main()
