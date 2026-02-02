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
        """Get database connection"""
        return psycopg2.connect(self.database_url, cursor_factory=RealDictCursor)
    
    def save_property(self, listing: Dict[str, Any]) -> tuple[bool, str]:
        """Save or update a property in the database. Returns (success, action)"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            
            # Check if property exists
            cursor.execute(
                "SELECT id FROM properties WHERE external_id = %s",
                (listing.get('external_id'),)
            )
            existing = cursor.fetchone()
            
            if existing:
                # Get current price to track history
                cursor.execute(
                    "SELECT price FROM properties WHERE external_id = %s",
                    (listing.get('external_id'),)
                )
                old_price_row = cursor.fetchone()
                old_price = old_price_row['price'] if old_price_row else None
                
                # Update existing property
                update_fields = []
                values = []
                
                updatable_fields = [
                    'title', 'description', 'price', 'size_sqm', 'bedrooms', 'bathrooms',
                    'floor', 'building_age_years', 'furnished', 'full_address', 'latitude', 'longitude',
                    'price_per_sqm', 'district_avg_price_per_sqm', 'price_vs_market_percent',
                    'investment_score', 'deal_type', 'estimated_monthly_rent', 'estimated_annual_yield_percent',
                    'main_image_url', 'image_urls', 'contact_name', 'contact_phone',
                    'city_id', 'district_id', 'property_type_id', 'status'
                ]
                
                for field in updatable_fields:
                    if field in listing:
                        update_fields.append(f"{field} = %s")
                        values.append(listing[field])
                
                # Always update last_seen_at
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
                
                # Add price history if price changed
                if old_price and listing.get('price') and old_price != listing['price']:
                    cursor.execute(
                        """
                        INSERT INTO price_history (property_id, price, price_per_sqm, source)
                        VALUES (%s, %s, %s, 'scraper_update')
                        """,
                        (result['id'], listing['price'], listing.get('price_per_sqm'))
                    )
                
                conn.commit()
                logger.info(f"Updated property: {listing.get('external_id')}")
                return True, 'updated'
            else:
                # Create new property
                fields = [
                    'external_id', 'source_url', 'title', 'description', 'price', 'size_sqm',
                    'bedrooms', 'bathrooms', 'floor', 'building_age_years', 'furnished',
                    'full_address', 'latitude', 'longitude', 'price_per_sqm',
                    'district_avg_price_per_sqm', 'price_vs_market_percent', 'investment_score',
                    'deal_type', 'estimated_monthly_rent', 'estimated_annual_yield_percent',
                    'main_image_url', 'image_urls', 'contact_name', 'contact_phone',
                    'city_id', 'district_id', 'property_type_id', 'status', 'scraped_at', 'updated_at'
                ]
                
                present_fields = [f for f in fields if f in listing or f == 'updated_at']
                placeholders = [f"%s" for _ in present_fields]
                values = [listing[f] if f in listing else datetime.now() for f in present_fields]
                
                sql = f"""
                    INSERT INTO properties ({', '.join(present_fields)})
                    VALUES ({', '.join(placeholders)})
                    RETURNING id
                """
                cursor.execute(sql, values)
                result = cursor.fetchone()
                
                # Add initial price history
                cursor.execute(
                    """
                    INSERT INTO price_history (property_id, price, price_per_sqm, source)
                    VALUES (%s, %s, %s, 'initial_scrape')
                    """,
                    (result['id'], listing.get('price'), listing.get('price_per_sqm'))
                )
                
                conn.commit()
                logger.info(f"Created new property: {listing.get('external_id')}")
                return True, 'created'
                
        except Exception as e:
            conn.rollback()
            logger.error(f"Error saving property {listing.get('external_id')}: {e}")
            return False, 'error'
        finally:
            conn.close()
    
    def save_properties_batch(self, listings: List[Dict[str, Any]]) -> Dict[str, int]:
        """Save multiple properties, return stats"""
        stats = {'created': 0, 'updated': 0, 'error': 0}
        
        for listing in listings:
            success, action = self.save_property(listing)
            if success:
                stats[action] += 1
            else:
                stats['error'] += 1
        
        return stats
    
    def get_or_create_city(self, city_name: str, city_slug: str = None) -> Optional[str]:
        """Get city ID or create if not exists"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            
            # Try to find existing city
            cursor.execute(
                "SELECT id FROM cities WHERE slug = %s OR name_ar = %s OR name_en = %s",
                (city_slug or city_name, city_name, city_name)
            )
            result = cursor.fetchone()
            
            if result:
                return result['id']
            
            # Create new city
            slug = city_slug or city_name.lower().replace(' ', '-')
            cursor.execute(
                """
                INSERT INTO cities (name_ar, name_en, slug)
                VALUES (%s, %s, %s)
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
                """,
                (city_name, city_name, slug)
            )
            result = cursor.fetchone()
            conn.commit()
            
            if result:
                return result['id']
            else:
                # City was created by another process, fetch it
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
        """Get district ID or create if not exists"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            
            # Try to find existing district
            cursor.execute(
                """
                SELECT id FROM districts 
                WHERE city_id = %s AND (slug = %s OR name_ar = %s OR name_en = %s)
                """,
                (city_id, district_slug or district_name, district_name, district_name)
            )
            result = cursor.fetchone()
            
            if result:
                return result['id']
            
            # Create new district
            slug = district_slug or district_name.lower().replace(' ', '-')
            cursor.execute(
                """
                INSERT INTO districts (city_id, name_ar, name_en, slug)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (city_id, slug) DO NOTHING
                RETURNING id
                """,
                (city_id, district_name, district_name, slug)
            )
            result = cursor.fetchone()
            conn.commit()
            
            if result:
                return result['id']
            else:
                # District was created by another process
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
        """Get property type ID or create if not exists"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            
            slug = type_slug or type_name.lower().replace(' ', '-')
            
            # Try to find existing type
            cursor.execute(
                "SELECT id FROM property_types WHERE slug = %s",
                (slug,)
            )
            result = cursor.fetchone()
            
            if result:
                return result['id']
            
            # Create new property type
            cursor.execute(
                """
                INSERT INTO property_types (name_ar, name_en, slug)
                VALUES (%s, %s, %s)
                ON CONFLICT (slug) DO NOTHING
                RETURNING id
                """,
                (type_name, type_name, slug)
            )
            result = cursor.fetchone()
            conn.commit()
            
            if result:
                return result['id']
            else:
                # Type was created by another process
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
        """Log scraper job completion"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO scraper_jobs (city_id, status, properties_found, properties_new, properties_updated, error_message, completed_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """,
                (city_id, status, properties_found, properties_new, properties_updated, error_message)
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Error logging scraper job: {e}")
        finally:
            conn.close()
    
    def get_properties_for_alerts(self, since: datetime) -> List[Dict[str, Any]]:
        """Get properties created since timestamp for sending alerts"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT p.*, c.name_ar as city_name, c.name_en as city_name_en,
                       d.name_ar as district_name, d.name_en as district_name_en,
                       pt.name_ar as property_type_name
                FROM properties p
                LEFT JOIN cities c ON p.city_id = c.id
                LEFT JOIN districts d ON p.district_id = d.id
                LEFT JOIN property_types pt ON p.property_type_id = pt.id
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
        """Get all active saved searches with user notification preferences"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT ss.*, u.email, u.telegram_notifications, u.telegram_chat_id, u.email_notifications
                FROM saved_searches ss
                JOIN users u ON ss.user_id = u.id
                WHERE ss.is_active = true AND u.is_subscribed = true
                """
            )
            return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error getting saved searches: {e}")
            return []
        finally:
            conn.close()
    
    def mark_property_as_sold(self, external_id: str) -> bool:
        """Mark a property as sold/expired"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE properties 
                SET status = 'sold', updated_at = NOW()
                WHERE external_id = %s
                """,
                (external_id,)
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            logger.error(f"Error marking property as sold: {e}")
            return False
        finally:
            conn.close()

# Global instance
db_manager = DatabaseManager()
