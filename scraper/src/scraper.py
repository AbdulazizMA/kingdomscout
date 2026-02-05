import re
import time
import random
import logging
import json
from typing import Optional, List, Dict, Any
from decimal import Decimal, InvalidOperation
from datetime import datetime
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, quote

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BaseScraper:
    """Base scraper with common utilities"""

    def __init__(self):
        self.session = requests.Session()
        self.source_name = "unknown"

    def _get_random_user_agent(self) -> str:
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        ]
        return random.choice(user_agents)

    def _parse_arabic_number(self, text: str) -> Optional[str]:
        if not text:
            return None
        arabic_to_english = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
        return text.translate(arabic_to_english)

    def _parse_price(self, price_text: str) -> Optional[Decimal]:
        try:
            if not price_text:
                return None
            price_text = self._parse_arabic_number(price_text)
            numbers = re.findall(r'[\d,]+(?:\.\d+)?', price_text)
            if not numbers:
                return None
            price_str = numbers[0].replace(',', '')
            if 'مليون' in price_text or 'million' in price_text.lower():
                return Decimal(price_str) * 1000000
            elif 'ألف' in price_text or 'الف' in price_text or 'thousand' in price_text.lower():
                return Decimal(price_str) * 1000
            return Decimal(price_str)
        except (InvalidOperation, ValueError) as e:
            logger.warning(f"Failed to parse price: {price_text} - {e}")
            return None

    def _safe_request(self, url: str, method: str = 'GET', retries: int = 3,
                      headers: Dict = None, json_data: Dict = None,
                      timeout: int = 30) -> Optional[requests.Response]:
        for attempt in range(retries):
            try:
                req_headers = {
                    'User-Agent': self._get_random_user_agent(),
                    'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8',
                }
                if headers:
                    req_headers.update(headers)
                if method == 'POST':
                    response = self.session.post(url, headers=req_headers, json=json_data, timeout=timeout)
                else:
                    response = self.session.get(url, headers=req_headers, timeout=timeout)
                response.raise_for_status()
                return response
            except requests.exceptions.RequestException as e:
                wait_time = (attempt + 1) * 2 + random.uniform(0, 2)
                logger.warning(f"Request failed (attempt {attempt + 1}/{retries}): {url} - {e}")
                if attempt < retries - 1:
                    time.sleep(wait_time)
        logger.error(f"All {retries} attempts failed for: {url}")
        return None


class AqarScraper(BaseScraper):
    """Scraper for sa.aqar.fm - uses Apollo GraphQL state extraction"""

    def __init__(self):
        super().__init__()
        self.source_name = "aqar.fm"
        self.base_url = "https://sa.aqar.fm"
        self.session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8',
            'Connection': 'keep-alive',
        })

    def _extract_page_data(self, html: str) -> Optional[Dict]:
        """Extract structured data from page HTML (__APOLLO_STATE__ or __NEXT_DATA__)"""
        try:
            # Pattern 1: __APOLLO_STATE__
            match = re.search(r'__APOLLO_STATE__\s*=\s*({.*?});?\s*</script>', html, re.DOTALL)
            if match:
                return json.loads(match.group(1))

            # Pattern 2: __NEXT_DATA__ inline
            match2 = re.search(r'__NEXT_DATA__\s*=\s*({.*?})\s*</script>', html, re.DOTALL)
            if match2:
                next_data = json.loads(match2.group(1))
                apollo = next_data.get('props', {}).get('apolloState', {})
                if apollo:
                    return apollo
                return next_data.get('props', {}).get('pageProps', {})

            # Pattern 3: script tag with id
            soup = BeautifulSoup(html, 'html.parser')
            script = soup.find('script', id='__NEXT_DATA__')
            if script and script.string:
                next_data = json.loads(script.string)
                apollo = next_data.get('props', {}).get('apolloState', {})
                if apollo:
                    return apollo
                return next_data.get('props', {}).get('pageProps', {})

            return None
        except (json.JSONDecodeError, AttributeError) as e:
            logger.warning(f"Failed to extract page data: {e}")
            return None

    def _parse_listing(self, data: Dict, city: str) -> Optional[Dict[str, Any]]:
        """Parse a single listing from Apollo/page data"""
        try:
            if not isinstance(data, dict):
                return None

            listing_id = str(data.get('id', ''))
            if not listing_id:
                return None

            price = data.get('price')
            if not price or price <= 0:
                return None

            imgs = data.get('imgs', [])
            image_urls = []
            for img in (imgs or []):
                if isinstance(img, str):
                    image_urls.append(f"https://images.aqar.fm/webp/listing/{img}")
                elif isinstance(img, dict) and img.get('url'):
                    image_urls.append(img['url'])

            user_data = data.get('user', {})
            contact_name = user_data.get('name', '') if isinstance(user_data, dict) else ''
            contact_phone = user_data.get('phone', '') if isinstance(user_data, dict) else ''

            location = data.get('location', {})
            lat = location.get('lat') if isinstance(location, dict) else None
            lng = location.get('lng') if isinstance(location, dict) else None

            slug = data.get('slug', '')
            source_url = f"{self.base_url}/{slug}" if slug else f"{self.base_url}/listing/{listing_id}"

            title = data.get('title', 'No Title')

            return {
                'external_id': f"aqar-{listing_id}",
                'source': 'aqar.fm',
                'source_url': source_url,
                'title': title,
                'price': Decimal(str(price)),
                'size_sqm': Decimal(str(data['area'])) if data.get('area') and data['area'] > 0 else None,
                'bedrooms': int(data['beds']) if data.get('beds') else None,
                'bathrooms': int(data.get('livings') or data.get('baths', 0)) if data.get('livings') or data.get('baths') else None,
                'city': city,
                'district': data.get('district', data.get('direction', '')),
                'full_address': data.get('address', ''),
                'latitude': Decimal(str(lat)) if lat else None,
                'longitude': Decimal(str(lng)) if lng else None,
                'description': data.get('content', data.get('description', '')),
                'main_image_url': image_urls[0] if image_urls else None,
                'image_urls': image_urls,
                'contact_name': contact_name,
                'contact_phone': contact_phone,
                'property_type': self._detect_property_type(title),
                'floor': data.get('floor'),
                'building_age_years': data.get('age'),
                'furnished': data.get('furnished', False),
                'scraped_at': datetime.now(),
            }
        except Exception as e:
            logger.warning(f"Error parsing aqar listing: {e}")
            return None

    def _detect_property_type(self, title: str) -> str:
        type_map = {
            'شقة': 'apartment', 'شقق': 'apartment',
            'فيلا': 'villa', 'فلل': 'villa',
            'أرض': 'land', 'أراضي': 'land',
            'عمارة': 'building', 'عماير': 'building',
            'مكتب': 'office', 'مكاتب': 'office',
            'محل': 'shop', 'محلات': 'shop',
            'مستودع': 'warehouse', 'مستودعات': 'warehouse',
            'استراحة': 'chalet', 'استراحات': 'chalet',
            'مزرعة': 'farm', 'مزارع': 'farm',
            'دور': 'apartment', 'دوبلكس': 'villa',
        }
        for ar, en in type_map.items():
            if ar in title:
                return en
        return 'apartment'

    def scrape_listings_page(self, city: str, page: int = 1) -> List[Dict[str, Any]]:
        listings = []
        try:
            url = f"{self.base_url}/%D8%B9%D9%82%D8%A7%D8%B1%D8%A7%D8%AA/{quote(city, safe='')}"
            if page > 1:
                url += f"/{page}"

            logger.info(f"Scraping aqar.fm: {url}")
            response = self._safe_request(url)
            if not response:
                return listings

            page_data = self._extract_page_data(response.text)
            if page_data:
                # Check for Apollo-style cache entries
                for key, value in page_data.items():
                    if isinstance(value, dict) and value.get('__typename') == 'ElasticWebListing':
                        listing = self._parse_listing(value, city)
                        if listing:
                            listings.append(listing)

                # Check for listings array in page props
                if not listings:
                    for key in ['listings', 'data']:
                        items = page_data.get(key, [])
                        if isinstance(items, dict):
                            items = items.get('listings', [])
                        if isinstance(items, list):
                            for item in items:
                                if isinstance(item, dict):
                                    listing = self._parse_listing(item, city)
                                    if listing:
                                        listings.append(listing)
                            if listings:
                                break

            # Fallback: JSON-LD + link parsing
            if not listings:
                listings = self._fallback_parse(response.text, city)

            logger.info(f"aqar.fm: {len(listings)} listings from page {page}")
            time.sleep(random.uniform(1.5, 3))
        except Exception as e:
            logger.error(f"Error scraping aqar.fm page: {e}")
        return listings

    def _fallback_parse(self, html: str, city: str) -> List[Dict[str, Any]]:
        listings = []
        try:
            soup = BeautifulSoup(html, 'html.parser')

            # JSON-LD
            for script in soup.find_all('script', type='application/ld+json'):
                try:
                    data = json.loads(script.string)
                    if isinstance(data, dict) and data.get('@type') == 'ItemList':
                        for item in data.get('itemListElement', []):
                            url = item.get('url', '')
                            name = item.get('name', '')
                            if url and name:
                                id_match = re.search(r'-(\d+)$', url.rstrip('/'))
                                ext_id = id_match.group(1) if id_match else url.rstrip('/').split('/')[-1]
                                listings.append({
                                    'external_id': f"aqar-{ext_id}",
                                    'source': 'aqar.fm',
                                    'source_url': url if url.startswith('http') else f"{self.base_url}{url}",
                                    'title': name,
                                    'price': None,
                                    'city': city,
                                    'district': '',
                                    'scraped_at': datetime.now(),
                                    'property_type': self._detect_property_type(name),
                                })
                except json.JSONDecodeError:
                    continue

            # Link parsing
            if not listings:
                for link in soup.find_all('a', href=True):
                    href = link.get('href', '')
                    id_match = re.search(r'-(\d{5,})$', href.rstrip('/'))
                    if not id_match:
                        continue
                    text = link.get_text(strip=True)
                    if len(text) < 10:
                        continue
                    listings.append({
                        'external_id': f"aqar-{id_match.group(1)}",
                        'source': 'aqar.fm',
                        'source_url': href if href.startswith('http') else f"{self.base_url}{href}",
                        'title': text[:200],
                        'price': None,
                        'city': city,
                        'district': '',
                        'scraped_at': datetime.now(),
                        'property_type': self._detect_property_type(text),
                    })
        except Exception as e:
            logger.warning(f"Fallback parse failed: {e}")
        return listings

    def scrape_city(self, city: str, max_pages: int = 3, scrape_details: bool = False) -> List[Dict[str, Any]]:
        all_listings = []
        seen_ids = set()

        logger.info(f"aqar.fm: Starting scrape for: {city}")
        for page in range(1, max_pages + 1):
            page_listings = self.scrape_listings_page(city, page=page)
            if not page_listings:
                break
            for listing in page_listings:
                if listing['external_id'] not in seen_ids:
                    seen_ids.add(listing['external_id'])
                    all_listings.append(listing)

        logger.info(f"aqar.fm: Total for {city}: {len(all_listings)}")
        return all_listings


class BayutScraper(BaseScraper):
    """Scraper for bayut.sa"""

    def __init__(self):
        super().__init__()
        self.source_name = "bayut.sa"
        self.base_url = "https://www.bayut.sa"

    CITY_SLUGS = {
        'الرياض': 'riyadh', 'جدة': 'jeddah', 'مكة': 'makkah',
        'المدينة': 'madinah', 'الدمام': 'dammam', 'الخبر': 'khobar',
        'تبوك': 'tabuk', 'أبها': 'abha', 'طائف': 'taif',
        'بريدة': 'buraidah', 'حائل': 'hail', 'نجران': 'najran',
        'الجبيل': 'jubail', 'القطيف': 'qatif', 'خميس-مشيط': 'khamis-mushait',
    }

    def scrape_listings_page(self, city: str, page: int = 1) -> List[Dict[str, Any]]:
        listings = []
        city_slug = self.CITY_SLUGS.get(city, city.lower())

        try:
            url = f"{self.base_url}/for-sale/property/{city_slug}/"
            if page > 1:
                url += f"page-{page}/"

            logger.info(f"Scraping bayut.sa: {url}")
            response = self._safe_request(url, headers={
                'Accept': 'text/html,application/xhtml+xml',
                'Referer': self.base_url,
            })
            if not response:
                return listings

            soup = BeautifulSoup(response.text, 'html.parser')

            # __NEXT_DATA__
            script = soup.find('script', id='__NEXT_DATA__')
            if script and script.string:
                try:
                    next_data = json.loads(script.string)
                    hits = next_data.get('props', {}).get('pageProps', {}).get('hits', [])
                    for hit in hits:
                        listing = self._parse_hit(hit, city)
                        if listing:
                            listings.append(listing)
                except json.JSONDecodeError as e:
                    logger.warning(f"bayut.sa: JSON parse error: {e}")

            # Fallback: JSON-LD
            if not listings:
                for s in soup.find_all('script', type='application/ld+json'):
                    try:
                        data = json.loads(s.string)
                        items = data if isinstance(data, list) else [data]
                        for item in items:
                            if isinstance(item, dict) and item.get('@type') in ['Product', 'RealEstateListing', 'Residence']:
                                listing = self._parse_jsonld(item, city)
                                if listing:
                                    listings.append(listing)
                    except json.JSONDecodeError:
                        continue

            logger.info(f"bayut.sa: {len(listings)} listings from page {page}")
            time.sleep(random.uniform(2, 4))
        except Exception as e:
            logger.error(f"Error scraping bayut.sa: {e}")
        return listings

    def _parse_hit(self, hit: Dict, city: str) -> Optional[Dict[str, Any]]:
        try:
            ext_id = str(hit.get('id', hit.get('externalID', '')))
            if not ext_id:
                return None
            price = hit.get('price')
            if not price or price <= 0:
                return None

            title = hit.get('title', hit.get('title_l1', 'No Title'))
            cover = hit.get('coverPhoto', {})
            main_image = cover.get('url', '') if isinstance(cover, dict) else ''
            image_urls = []
            if main_image:
                image_urls.append(main_image)
            for photo in hit.get('photos', []):
                if isinstance(photo, dict) and photo.get('url'):
                    image_urls.append(photo['url'])

            location = hit.get('geography', {})
            lat = location.get('lat') if isinstance(location, dict) else None
            lng = location.get('lng') if isinstance(location, dict) else None
            district = ''
            loc_list = hit.get('location', [])
            if isinstance(loc_list, list) and len(loc_list) > 1:
                last = loc_list[-1]
                district = last.get('name', '') if isinstance(last, dict) else str(last)

            slug = hit.get('slug', '')
            source_url = f"{self.base_url}/{slug}" if slug else f"{self.base_url}/property/details-{ext_id}.html"

            return {
                'external_id': f"bayut-{ext_id}",
                'source': 'bayut.sa',
                'source_url': source_url,
                'title': title,
                'price': Decimal(str(price)),
                'size_sqm': Decimal(str(hit['area'])) if hit.get('area') and hit['area'] > 0 else None,
                'bedrooms': int(hit['bedrooms']) if hit.get('bedrooms') else None,
                'bathrooms': int(hit['bathrooms']) if hit.get('bathrooms') else None,
                'city': city,
                'district': district,
                'latitude': Decimal(str(lat)) if lat else None,
                'longitude': Decimal(str(lng)) if lng else None,
                'description': hit.get('description', hit.get('description_l1', '')),
                'main_image_url': main_image or None,
                'image_urls': image_urls[:10],
                'contact_name': hit.get('contactName', ''),
                'contact_phone': '',
                'property_type': self._detect_type(title),
                'furnished': hit.get('furnishingStatus') == 'furnished',
                'scraped_at': datetime.now(),
            }
        except Exception as e:
            logger.warning(f"bayut.sa: parse error: {e}")
            return None

    def _parse_jsonld(self, data: Dict, city: str) -> Optional[Dict[str, Any]]:
        try:
            name = data.get('name', 'No Title')
            url = data.get('url', '')
            price_data = data.get('offers', {})
            price = price_data.get('price') if isinstance(price_data, dict) else None
            if not price:
                return None
            ext_id = url.rstrip('/').split('-')[-1].split('.')[0] if url else str(abs(hash(name)))[:10]
            return {
                'external_id': f"bayut-{ext_id}",
                'source': 'bayut.sa',
                'source_url': url if url.startswith('http') else f"{self.base_url}{url}",
                'title': name,
                'price': Decimal(str(price)),
                'city': city,
                'district': '',
                'description': data.get('description', ''),
                'main_image_url': data.get('image', ''),
                'property_type': self._detect_type(name),
                'scraped_at': datetime.now(),
            }
        except Exception as e:
            logger.warning(f"bayut.sa: JSON-LD error: {e}")
            return None

    def _detect_type(self, title: str) -> str:
        text = title.lower()
        for keyword, ptype in {
            'apartment': 'apartment', 'شقة': 'apartment', 'شقق': 'apartment',
            'villa': 'villa', 'فيلا': 'villa', 'فلل': 'villa',
            'land': 'land', 'أرض': 'land', 'أراضي': 'land',
            'building': 'building', 'عمارة': 'building',
            'office': 'office', 'مكتب': 'office',
            'shop': 'shop', 'محل': 'shop',
            'townhouse': 'villa', 'penthouse': 'apartment',
        }.items():
            if keyword in text:
                return ptype
        return 'apartment'

    def scrape_city(self, city: str, max_pages: int = 3, scrape_details: bool = False) -> List[Dict[str, Any]]:
        all_listings = []
        seen_ids = set()
        logger.info(f"bayut.sa: Starting scrape for: {city}")
        for page in range(1, max_pages + 1):
            page_listings = self.scrape_listings_page(city, page=page)
            if not page_listings:
                break
            for listing in page_listings:
                if listing['external_id'] not in seen_ids:
                    seen_ids.add(listing['external_id'])
                    all_listings.append(listing)
        logger.info(f"bayut.sa: Total for {city}: {len(all_listings)}")
        return all_listings


class HarajScraper(BaseScraper):
    """Scraper for haraj.com.sa"""

    def __init__(self):
        super().__init__()
        self.source_name = "haraj.com.sa"
        self.base_url = "https://haraj.com.sa"

    def scrape_listings_page(self, city: str, page: int = 1) -> List[Dict[str, Any]]:
        listings = []
        try:
            url = f"{self.base_url}/tags/%D8%B9%D9%82%D8%A7%D8%B1%D8%A7%D8%AA"
            if page > 1:
                url += f"?page={page}"

            logger.info(f"Scraping haraj.com.sa: {url}")
            response = self._safe_request(url, headers={
                'Accept': 'text/html,application/xhtml+xml',
                'Referer': self.base_url,
            })
            if not response:
                return listings

            soup = BeautifulSoup(response.text, 'html.parser')

            # __NEXT_DATA__
            script = soup.find('script', id='__NEXT_DATA__')
            if script and script.string:
                try:
                    next_data = json.loads(script.string)
                    page_props = next_data.get('props', {}).get('pageProps', {})
                    posts = page_props.get('posts', page_props.get('data', {}).get('posts', []))
                    if isinstance(posts, list):
                        for post in posts:
                            listing = self._parse_post(post, city)
                            if listing:
                                listings.append(listing)
                except json.JSONDecodeError:
                    pass

            # Fallback: HTML
            if not listings:
                for card in soup.find_all(['div', 'article'], class_=re.compile('post|item|card'))[:30]:
                    link = card.find('a', href=True)
                    if not link:
                        continue
                    href = link.get('href', '')
                    title = link.get_text(strip=True)
                    re_keywords = ['شقة', 'فيلا', 'أرض', 'عمارة', 'بيت', 'دور', 'عقار', 'للبيع']
                    if not any(kw in title for kw in re_keywords):
                        continue
                    price = None
                    pm = re.search(r'([\d,]+)\s*(ريال|SAR)', card.get_text())
                    if pm:
                        price = self._parse_price(pm.group(1))
                    ext_id = href.rstrip('/').split('/')[-1]
                    listings.append({
                        'external_id': f"haraj-{ext_id}",
                        'source': 'haraj.com.sa',
                        'source_url': href if href.startswith('http') else f"{self.base_url}{href}",
                        'title': title[:200],
                        'price': price,
                        'city': city,
                        'district': '',
                        'property_type': self._detect_type(title),
                        'scraped_at': datetime.now(),
                    })

            logger.info(f"haraj.com.sa: {len(listings)} listings from page {page}")
            time.sleep(random.uniform(2, 4))
        except Exception as e:
            logger.error(f"Error scraping haraj.com.sa: {e}")
        return listings

    def _parse_post(self, post: Dict, city: str) -> Optional[Dict[str, Any]]:
        try:
            post_id = str(post.get('id', post.get('postId', '')))
            if not post_id:
                return None
            title = post.get('title', post.get('postTitle', ''))
            body = post.get('body', post.get('postText', ''))
            text = f"{title} {body}"

            re_keywords = ['شقة', 'فيلا', 'أرض', 'عمارة', 'بيت', 'دور', 'عقار', 'للبيع']
            if not any(kw in text for kw in re_keywords):
                return None

            price = None
            for pattern in [r'([\d,]+(?:\.\d+)?)\s*(?:ريال|SAR|ر\.س)', r'السعر\s*:?\s*([\d,]+)', r'بسعر\s*([\d,]+)']:
                match = re.search(pattern, text)
                if match:
                    price = self._parse_price(match.group(1))
                    if price:
                        break

            images = post.get('images', post.get('imgs', []))
            image_urls = []
            if isinstance(images, list):
                for img in images:
                    if isinstance(img, str):
                        image_urls.append(img)
                    elif isinstance(img, dict) and img.get('url'):
                        image_urls.append(img['url'])

            slug = post.get('slug', '')
            source_url = f"{self.base_url}/{slug}" if slug else f"{self.base_url}/post/{post_id}"

            return {
                'external_id': f"haraj-{post_id}",
                'source': 'haraj.com.sa',
                'source_url': source_url,
                'title': title[:200] if title else 'No Title',
                'price': price,
                'description': body[:500] if body else '',
                'city': city,
                'district': '',
                'main_image_url': image_urls[0] if image_urls else None,
                'image_urls': image_urls[:10],
                'property_type': self._detect_type(text),
                'scraped_at': datetime.now(),
            }
        except Exception as e:
            logger.warning(f"haraj.com.sa: parse error: {e}")
            return None

    def _detect_type(self, text: str) -> str:
        for ar, en in {
            'شقة': 'apartment', 'فيلا': 'villa', 'أرض': 'land',
            'عمارة': 'building', 'مكتب': 'office', 'محل': 'shop',
            'بيت': 'villa', 'دور': 'apartment',
        }.items():
            if ar in text:
                return en
        return 'apartment'

    def scrape_city(self, city: str, max_pages: int = 2, scrape_details: bool = False) -> List[Dict[str, Any]]:
        all_listings = []
        seen_ids = set()
        logger.info(f"haraj.com.sa: Starting scrape for: {city}")
        for page in range(1, max_pages + 1):
            page_listings = self.scrape_listings_page(city, page=page)
            if not page_listings:
                break
            for listing in page_listings:
                if listing['external_id'] not in seen_ids:
                    seen_ids.add(listing['external_id'])
                    all_listings.append(listing)
        logger.info(f"haraj.com.sa: Total for {city}: {len(all_listings)}")
        return all_listings


class MultiSourceScraper:
    """Orchestrates scraping from multiple sources"""

    def __init__(self, sources: List[str] = None):
        self.scrapers = {}
        enabled = sources or ['aqar.fm', 'bayut.sa', 'haraj.com.sa']
        if 'aqar.fm' in enabled:
            self.scrapers['aqar.fm'] = AqarScraper()
        if 'bayut.sa' in enabled:
            self.scrapers['bayut.sa'] = BayutScraper()
        if 'haraj.com.sa' in enabled:
            self.scrapers['haraj.com.sa'] = HarajScraper()
        logger.info(f"MultiSourceScraper: {list(self.scrapers.keys())}")

    def scrape_city(self, city: str, max_pages: int = 3) -> List[Dict[str, Any]]:
        all_listings = []
        seen_ids = set()
        for name, scraper in self.scrapers.items():
            try:
                listings = scraper.scrape_city(city, max_pages=max_pages)
                for listing in listings:
                    if listing['external_id'] not in seen_ids:
                        seen_ids.add(listing['external_id'])
                        all_listings.append(listing)
                logger.info(f"{name}: {len(listings)} for {city}")
                time.sleep(random.uniform(2, 4))
            except Exception as e:
                logger.error(f"Error scraping {name} for {city}: {e}")
        logger.info(f"All sources: {len(all_listings)} total for {city}")
        return all_listings

    def scrape_multiple_cities(self, cities: List[str], max_pages: int = 2) -> Dict[str, List[Dict[str, Any]]]:
        results = {}
        for city in cities:
            try:
                results[city] = self.scrape_city(city, max_pages=max_pages)
            except Exception as e:
                logger.error(f"Error scraping city {city}: {e}")
                results[city] = []
            time.sleep(random.uniform(3, 5))
        return results


if __name__ == '__main__':
    scraper = MultiSourceScraper()
    results = scraper.scrape_multiple_cities(['الرياض', 'جدة'], max_pages=1)
    for city, listings in results.items():
        print(f"\n{city}: {len(listings)} total")
        for listing in listings[:5]:
            print(f"  [{listing.get('source')}] {listing.get('title', '')[:50]}: {listing.get('price', 'N/A')} SAR")
