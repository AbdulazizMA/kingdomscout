import re
import time
import random
import logging
from typing import Optional, List, Dict, Any
from decimal import Decimal, InvalidOperation
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AqarScraper:
    def __init__(self):
        self.session = requests.Session()
        self.base_url = "https://sa.aqar.fm"
        
        # Setup session headers
        # Note: Don't set Accept-Encoding - requests handles compression automatically
        self.session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8',
            'Connection': 'keep-alive',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
    
    def _get_headers(self) -> Dict[str, str]:
        """Get randomized headers for each request"""
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ]
        return {
            'User-Agent': random.choice(user_agents),
            'Referer': self.base_url,
        }
    
    def _make_request(self, url: str, retries: int = 0, max_retries: int = 3) -> Optional[BeautifulSoup]:
        """Make HTTP request with retry logic"""
        try:
            headers = self._get_headers()
            response = self.session.get(
                url, 
                headers=headers, 
                timeout=30
            )
            response.raise_for_status()
            response.encoding = 'utf-8'
            return BeautifulSoup(response.text, 'html.parser')
        except requests.exceptions.RequestException as e:
            if retries < max_retries:
                wait_time = (retries + 1) * 2 + random.uniform(0, 2)
                logger.warning(f"Request failed, retrying in {wait_time:.1f}s: {url}")
                time.sleep(wait_time)
                return self._make_request(url, retries + 1, max_retries)
            else:
                logger.error(f"Request failed after {max_retries} retries: {url} - {e}")
                return None
    
    def _parse_price(self, price_text: str) -> Optional[Decimal]:
        """Extract numeric price from Arabic text"""
        try:
            if not price_text:
                return None
            
            # Convert Arabic numerals to English
            arabic_to_english = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
            price_text = price_text.translate(arabic_to_english)
            
            # Remove non-numeric characters except decimal point and commas
            # Look for numbers with optional commas/thousands separators
            numbers = re.findall(r'[\d,]+(?:\.\d+)?', price_text)
            if not numbers:
                return None
            
            # Clean and convert - take the first number found
            price_str = numbers[0].replace(',', '')
            
            # Handle "million" and "thousand" in Arabic
            price_lower = price_text.lower()
            if 'مليون' in price_text or 'million' in price_lower:
                return Decimal(price_str) * 1000000
            elif 'ألف' in price_text or 'الف' in price_text or 'thousand' in price_lower:
                return Decimal(price_str) * 1000
            
            return Decimal(price_str)
        except (InvalidOperation, ValueError) as e:
            logger.warning(f"Failed to parse price: {price_text} - {e}")
            return None
    
    def _parse_size(self, size_text: str) -> Optional[Decimal]:
        """Extract size in square meters"""
        try:
            if not size_text:
                return None
            
            # Convert Arabic numerals
            arabic_to_english = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
            size_text = size_text.translate(arabic_to_english)
            
            # Extract number
            match = re.search(r'(\d+(?:\.\d+)?)', size_text)
            if match:
                return Decimal(match.group(1))
            return None
        except (InvalidOperation, ValueError) as e:
            logger.warning(f"Failed to parse size: {size_text} - {e}")
            return None
    
    def _extract_id_from_url(self, url: str) -> Optional[str]:
        """Extract property ID from URL"""
        # Try to get the ID from the end of the URL path
        # URL format: /.../property-name-city-district-ID
        parsed = urlparse(url)
        path = parsed.path
        
        # Get the last part of the path
        last_part = path.split('/')[-1]
        
        # Extract ID from the end (after the last hyphen)
        # Format is typically: some-name-1234567
        match = re.search(r'-([\d]+)$', last_part)
        if match:
            return match.group(1)
        
        # Fallback: if the last part is just digits
        if last_part.isdigit():
            return last_part
            
        return None
    
    def _extract_listing_data(self, card, city: str) -> Optional[Dict[str, Any]]:
        """Extract data from a single listing card"""
        try:
            # Get the link element (parent 'a' tag)
            link_elem = card.find_parent('a')
            if not link_elem:
                link_elem = card.find('a')
            
            if not link_elem or not link_elem.get('href'):
                return None
            
            listing_url = link_elem['href']
            if not listing_url.startswith('http'):
                listing_url = urljoin(self.base_url, listing_url)
            
            # Extract external ID from URL
            external_id = self._extract_id_from_url(listing_url)
            if not external_id:
                return None
            
            # Title - from h4 in titleRow
            title = "No Title"
            title_elem = card.select_one('._titleRow__1AWv1 h4')
            if title_elem:
                title = title_elem.get_text(strip=True)
            
            # Price - from price div
            price = None
            price_elem = card.select_one('._price__X51mi')
            if price_elem:
                price_text = price_elem.get_text(strip=True)
                price = self._parse_price(price_text)
            
            # Size - from specs div with area icon (المساحة)
            size_sqm = None
            specs_container = card.select_one('._specs__nbsgm')
            if specs_container:
                spec_items = specs_container.select('._spec__SIJiK')
                for spec in spec_items:
                    spec_text = spec.get_text(strip=True)
                    # Check if this is the area spec (contains م² or area icon alt text)
                    if 'م²' in spec_text or ('area' in str(spec).lower() and 'المساحة' in str(spec)):
                        size_sqm = self._parse_size(spec_text)
                        break
            
            # Location - from footer
            district = None
            footer = card.select_one('._footer__CnldH p')
            if footer:
                location_spans = footer.find_all('span')
                if len(location_spans) >= 2:
                    # Format is: <span>City</span><span>-District</span>
                    district_text = location_spans[1].get_text(strip=True)
                    district = district_text.lstrip('-')  # Remove leading dash
            
            # Description
            description = None
            desc_elem = card.select_one('._description__zVaD6 p')
            if desc_elem:
                description = desc_elem.get_text(strip=True)
            
            # Image URL
            image_url = None
            img_elem = card.select_one('._imageWrapper__ZiYzs img')
            if img_elem:
                image_url = img_elem.get('src')
            
            # Bedrooms - look for bed-king icon
            bedrooms = None
            if specs_container:
                spec_items = specs_container.select('._spec__SIJiK')
                for spec in spec_items:
                    spec_html = str(spec)
                    if 'bed-king' in spec_html or 'غرف' in spec.get_text():
                        match = re.search(r'(\d+)', spec.get_text())
                        if match:
                            bedrooms = int(match.group(1))
                            break
            
            listing = {
                'external_id': external_id,
                'source_url': listing_url,
                'title': title,
                'price': price,
                'size_sqm': size_sqm,
                'bedrooms': bedrooms,
                'city': city,
                'district': district,
                'description': description,
                'main_image_url': image_url,
                'scraped_at': datetime.now()
            }
            
            return listing
            
        except Exception as e:
            logger.warning(f"Error extracting listing data: {e}")
            return None
    
    def scrape_listings_page(self, city: str, property_type: Optional[str] = None, page: int = 1) -> List[Dict[str, Any]]:
        """Scrape a single page of property listings"""
        listings = []
        
        try:
            # Construct URL - use /عقارات/{city} format
            url = f"{self.base_url}/عقارات/{city}"
            if page > 1:
                url += f"/{page}"
            
            logger.info(f"Scraping listings page: {url}")
            
            soup = self._make_request(url)
            if not soup:
                return listings
            
            # Find listing cards using the class selector
            listing_cards = soup.select('._listingCard__PoR_B')
            logger.info(f"Found {len(listing_cards)} listing cards")
            
            if not listing_cards:
                # Fallback: try to find any div that contains listing-like content
                listing_cards = soup.find_all('div', class_=re.compile('listing'))
                logger.info(f"Fallback found {len(listing_cards)} listings")
            
            for card in listing_cards:
                listing = self._extract_listing_data(card, city)
                if listing:
                    listings.append(listing)
            
            logger.info(f"Successfully extracted {len(listings)} listings from page")
            
            # Respect rate limits
            time.sleep(random.uniform(1, 3))
            
        except Exception as e:
            logger.error(f"Error scraping listings page: {e}")
        
        return listings
    
    def scrape_property_details(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        """Scrape detailed information for a single property"""
        try:
            logger.info(f"Scraping details: {listing['source_url']}")
            soup = self._make_request(listing['source_url'])
            if not soup:
                return listing
            
            # Try to extract more details from the detail page if available
            # The detail page might have more complete information
            
            # Full description
            desc_selectors = ['._description__zVaD6 p', '.description', '[data-testid="description"]']
            for selector in desc_selectors:
                desc_elem = soup.select_one(selector)
                if desc_elem:
                    listing['description'] = desc_elem.get_text(strip=True)
                    break
            
            # More images
            image_urls = []
            img_selectors = ['._imageWrapper__ZiYzs img', '.gallery img', '[data-testid="image"]']
            for selector in img_selectors:
                imgs = soup.select(selector)
                for img in imgs:
                    src = img.get('src')
                    if src:
                        image_urls.append(src)
                if image_urls:
                    break
            
            if image_urls:
                listing['image_urls'] = list(set(image_urls))
                if not listing.get('main_image_url'):
                    listing['main_image_url'] = image_urls[0]
            
            time.sleep(random.uniform(1, 2))
            
        except Exception as e:
            logger.error(f"Error scraping property details: {e}")
        
        return listing
    
    def scrape_city(self, city: str, max_pages: int = 3, scrape_details: bool = True) -> List[Dict[str, Any]]:
        """Scrape all listings for a city"""
        all_listings = []
        
        logger.info(f"Starting scrape for city: {city}")
        
        for page in range(1, max_pages + 1):
            listings = self.scrape_listings_page(city, page=page)
            
            if not listings:
                logger.info(f"No listings found on page {page}, stopping")
                break
            
            if scrape_details:
                for i, listing in enumerate(listings):
                    logger.info(f"Scraping details for listing {i+1}/{len(listings)} on page {page}")
                    self.scrape_property_details(listing)
            
            all_listings.extend(listings)
            logger.info(f"Scraped page {page}: {len(listings)} listings")
        
        logger.info(f"Total listings scraped for {city}: {len(all_listings)}")
        return all_listings
    
    def scrape_multiple_cities(self, cities: List[str], max_pages: int = 2) -> Dict[str, List[Dict[str, Any]]]:
        """Scrape listings from multiple cities"""
        results = {}
        
        for city in cities:
            try:
                listings = self.scrape_city(city, max_pages=max_pages)
                results[city] = listings
            except Exception as e:
                logger.error(f"Error scraping city {city}: {e}")
                results[city] = []
        
        return results


if __name__ == '__main__':
    scraper = AqarScraper()
    
    # Test scraping Riyadh
    results = scraper.scrape_multiple_cities(['الرياض', 'جدة', 'الدمام'], max_pages=1)
    
    for city, listings in results.items():
        print(f"\n{city}: {len(listings)} listings")
        for listing in listings[:3]:
            print(f"  - {listing.get('title', 'No title')}: {listing.get('price', 'No price')} SAR")
