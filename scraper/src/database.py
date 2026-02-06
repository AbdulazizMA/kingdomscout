import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
import json

import psycopg2
from psycopg2.extras import RealDictCursor

from config import settings, logger


class DatabaseManager:
    def __init__(self):
        self.database_url = settings.DATABASE_URL

    def get_connection(self):
        return psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)

    def save_property(self, listing: Dict[str, Any]) -> tuple:
        """Save or update a property. Returns (success, action)"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()

            cursor.execute(
                "SELECT id, price FROM properties WHERE external_id = %s",
                (listing.get('external_id'),)
            )
            existing = cursor.fetchone()

            if existing:
                update_fields = []
                values = []

                updatable = [
                    'title', 'description', 'price', 'size_sqm', 'bedrooms', 'bathrooms',
                    'floor', 'building_age_years', 'furnished', 'full_address', 'latitude', 'longitude',
                    'price_per_sqm', 'district_avg_price_per_sqm', 'price_vs_market_percent',
                    'investment_score', 'deal_type', 'estimated_monthly_rent', 'estimated_annual_yield_percent',
                    'main_image_url', 'image_urls', 'contact_name', 'contact_phone',
                    'city_id', 'district_id', 'property_type_id', 'status'
                ]

                for field in updatable:
                    if field in listing and listing[field] is not None:
                        update_fields.append(f"{field} = %s")
                        val = listing[field]
                        if isinstance(val, list):
                            val = val
                        values.append(val)

                update_fields.append("last_seen_at = NOW()")
                update_fields.append("updated_at = NOW()")

                values.append(listing.get('external_id'))

                sql = f"""
                    UPDATE properties
                    SET {', '.join(update_fields)}
                    WHERE external_id = %s
                    RETURNING id
                """
                cursor.execute(sql, values)
                result = cursor.fetchone()

                old_price = existing.get('price')
                new_price = listing.get('price')
                if old_price and new_price and result and old_price != new_price:
                    cursor.execute(
                        "INSERT INTO price_history (id, property_id, price, price_per_sqm, source) VALUES (gen_random_uuid(), %s, %s, %s, 'scraper_update')",
                        (result['id'], new_price, listing.get('price_per_sqm'))
                    )

                conn.commit()
                return True, 'updated'
            else:
                fields = [
                    'external_id', 'source_url', 'title', 'description', 'price', 'size_sqm',
                    'bedrooms', 'bathrooms', 'floor', 'building_age_years', 'furnished',
                    'full_address', 'latitude', 'longitude', 'price_per_sqm',
                    'district_avg_price_per_sqm', 'price_vs_market_percent', 'investment_score',
                    'deal_type', 'estimated_monthly_rent', 'estimated_annual_yield_percent',
                    'main_image_url', 'image_urls', 'contact_name', 'contact_phone',
                    'city_id', 'district_id', 'property_type_id', 'status', 'scraped_at'
                ]

                present_fields = ['id'] + [f for f in fields if f in listing and listing[f] is not None]
                present_fields.append('updated_at')

                placeholders = ['gen_random_uuid()'] + ['%s'] * (len(present_fields) - 2) + ['NOW()']
                raw_values = [listing[f] for f in present_fields if f not in ('id', 'updated_at')]

                # Coerce types for PostgreSQL compatibility
                bool_fields = {'furnished'}
                values = []
                for f, v in zip([f for f in present_fields if f not in ('id', 'updated_at')], raw_values):
                    if f in bool_fields and not isinstance(v, bool):
                        v = bool(v)
                    values.append(v)

                sql = f"""
                    INSERT INTO properties ({', '.join(present_fields)})
                    VALUES ({', '.join(placeholders)})
                    RETURNING id
                """
                cursor.execute(sql, values)
                result = cursor.fetchone()

                if result and listing.get('price'):
                    cursor.execute(
                        "INSERT INTO price_history (id, property_id, price, price_per_sqm, source) VALUES (gen_random_uuid(), %s, %s, %s, 'initial_scrape')",
                        (result['id'], listing.get('price'), listing.get('price_per_sqm'))
                    )

                conn.commit()
                return True, 'created'

        except Exception as e:
            conn.rollback()
            logger.error(f"Error saving property {listing.get('external_id')}: {e}")
            return False, 'error'
        finally:
            conn.close()

    def get_or_create_city(self, city_name: str, city_slug: str = None,
                           name_en: str = None, region: str = None,
                           priority: int = 0) -> Optional[str]:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()

            slug = city_slug or city_name.lower().replace(' ', '-')

            cursor.execute(
                "SELECT id FROM cities WHERE slug = %s OR name_ar = %s",
                (slug, city_name)
            )
            result = cursor.fetchone()

            if result:
                return result['id']

            cursor.execute(
                """
                INSERT INTO cities (id, name_ar, name_en, slug, region, priority)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s)
                ON CONFLICT (slug) DO UPDATE SET name_en = EXCLUDED.name_en, region = EXCLUDED.region
                RETURNING id
                """,
                (city_name, name_en or city_name, slug, region, priority)
            )
            result = cursor.fetchone()
            conn.commit()

            if result:
                return result['id']

            cursor.execute("SELECT id FROM cities WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            return result['id'] if result else None

        except Exception as e:
            conn.rollback()
            logger.error(f"Error getting/creating city {city_name}: {e}")
            return None
        finally:
            conn.close()

    def get_or_create_district(self, city_id: str, district_name: str, district_slug: str = None) -> Optional[str]:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()

            slug = district_slug or district_name.lower().replace(' ', '-')

            cursor.execute(
                "SELECT id FROM districts WHERE city_id = %s AND (slug = %s OR name_ar = %s)",
                (city_id, slug, district_name)
            )
            result = cursor.fetchone()

            if result:
                return result['id']

            cursor.execute(
                """
                INSERT INTO districts (id, city_id, name_ar, name_en, slug)
                VALUES (gen_random_uuid(), %s, %s, %s, %s)
                ON CONFLICT (city_id, slug) DO NOTHING
                RETURNING id
                """,
                (city_id, district_name, district_name, slug)
            )
            result = cursor.fetchone()
            conn.commit()

            if result:
                return result['id']

            cursor.execute(
                "SELECT id FROM districts WHERE city_id = %s AND slug = %s",
                (city_id, slug)
            )
            result = cursor.fetchone()
            return result['id'] if result else None

        except Exception as e:
            conn.rollback()
            logger.error(f"Error getting/creating district {district_name}: {e}")
            return None
        finally:
            conn.close()

    def get_or_create_property_type(self, type_name: str, type_slug: str = None) -> Optional[str]:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            slug = type_slug or type_name.lower().replace(' ', '-')

            cursor.execute("SELECT id FROM property_types WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            if result:
                return result['id']

            cursor.execute(
                """
                INSERT INTO property_types (id, name_ar, name_en, slug)
                VALUES (gen_random_uuid(), %s, %s, %s)
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
                """,
                (type_name, type_name, slug)
            )
            result = cursor.fetchone()
            conn.commit()

            if result:
                return result['id']

            cursor.execute("SELECT id FROM property_types WHERE slug = %s", (slug,))
            result = cursor.fetchone()
            return result['id'] if result else None

        except Exception as e:
            conn.rollback()
            logger.error(f"Error getting/creating property type {type_name}: {e}")
            return None
        finally:
            conn.close()

    def log_scraper_job(self, city_id: str, status: str, properties_found: int = 0,
                        properties_new: int = 0, properties_updated: int = 0,
                        error_message: str = None) -> None:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO scraper_jobs (id, city_id, status, properties_found, properties_new, properties_updated, error_message, completed_at)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, NOW())
                """,
                (city_id, status, properties_found, properties_new, properties_updated, error_message)
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Error logging scraper job: {e}")
        finally:
            conn.close()

    def get_city_avg_price(self, city_id: str) -> Optional[float]:
        """Get the average price per sqm for a city from existing data"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT AVG(price_per_sqm) as avg_price
                FROM properties
                WHERE city_id = %s AND price_per_sqm > 0 AND status = 'active'
                """,
                (city_id,)
            )
            result = cursor.fetchone()
            if result and result['avg_price']:
                return float(result['avg_price'])
            return None
        except Exception as e:
            logger.error(f"Error getting city avg price: {e}")
            return None
        finally:
            conn.close()

    def update_district_averages(self) -> None:
        """Update average price per sqm for all districts"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE districts d
                SET avg_price_per_sqm = sub.avg_price,
                    price_data_updated_at = NOW()
                FROM (
                    SELECT district_id, AVG(price_per_sqm) as avg_price
                    FROM properties
                    WHERE district_id IS NOT NULL AND price_per_sqm > 0 AND status = 'active'
                    GROUP BY district_id
                    HAVING COUNT(*) >= 3
                ) sub
                WHERE d.id = sub.district_id
                """
            )
            conn.commit()
            logger.info(f"Updated district averages ({cursor.rowcount} districts)")
        except Exception as e:
            conn.rollback()
            logger.error(f"Error updating district averages: {e}")
        finally:
            conn.close()

    def get_properties_for_alerts(self, since: datetime) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT p.*, c.name_ar as city_name, c.name_en as city_name_en,
                       d.name_ar as district_name, d.name_en as district_name_en
                FROM properties p
                LEFT JOIN cities c ON p.city_id = c.id
                LEFT JOIN districts d ON p.district_id = d.id
                WHERE p.scraped_at >= %s AND p.status = 'active'
                ORDER BY p.investment_score DESC NULLS LAST
                """,
                (since,)
            )
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting properties for alerts: {e}")
            return []
        finally:
            conn.close()

    def get_active_saved_searches(self) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT ss.*, u.email, u.telegram_notifications, u.telegram_chat_id, u.email_notifications
                FROM saved_searches ss
                JOIN users u ON ss.user_id = u.id
                WHERE ss.is_active = true
                """
            )
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting saved searches: {e}")
            return []
        finally:
            conn.close()


db_manager = DatabaseManager()
