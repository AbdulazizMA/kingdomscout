"""
Fake/spam listing detection module.

Catches listings that don't seem real:
- Duplicate phone numbers posting excessive listings (spam brokers)
- Suspiciously round or placeholder prices
- Missing critical data (no images, no description, no contact)
- Repetitive/template titles from same poster
- Too-good-to-be-true pricing relative to market
- Listings with hallmarks of click-bait or scam patterns
- Cross-source duplicate detection (same property, different IDs)
"""

import re
import hashlib
from collections import defaultdict
from typing import Dict, Any, List, Tuple, Optional
from enum import Enum

from config import logger


class FakeScore(Enum):
    """Higher score = more likely fake."""
    CLEAN = 0
    LOW_RISK = 1
    MEDIUM_RISK = 2
    HIGH_RISK = 3
    REJECT = 4


# ── Thresholds ──
MAX_LISTINGS_PER_PHONE = 15          # Same phone posting 15+ listings in one scrape = spam broker
MAX_LISTINGS_PER_PHONE_CITY = 8      # Same phone in same city
SUSPICIOUSLY_ROUND_PRICES = {1, 10, 100, 1000, 10000, 100000, 1000000, 10000000}
MIN_DESCRIPTION_LENGTH = 15          # Listings with very short descriptions are suspicious
MIN_IMAGES_FOR_RESIDENTIAL = 1       # At least 1 image for apartments/villas
TITLE_SIMILARITY_THRESHOLD = 0.85    # Same poster with 85%+ similar titles = template spam

# ── Spam phone patterns ──
KNOWN_SPAM_PATTERNS = [
    r'^0{5,}',              # 00000...
    r'^1{5,}',              # 11111...
    r'^(\d)\1{6,}$',        # Any digit repeated 7+ times
    r'^0500000',            # Generic placeholder
    r'^123456',             # Sequential
]

# ── Scam text patterns ──
SCAM_KEYWORDS_AR = [
    'تواصل واتساب فقط',     # WhatsApp only (common scam pattern)
    'حصري جدا',             # Extremely exclusive
    'فرصة لن تتكرر',        # Opportunity that won't repeat
    'آخر يوم',              # Last day
    'عرض محدود جدا',        # Very limited offer
    'بدون عمولة مجانا',     # Free no commission (bait)
    'سعر رمزي',             # Symbolic price
]

SCAM_KEYWORDS_EN = [
    'whatsapp only',
    'last chance',
    'act now',
    'limited time only',
    'below market guaranteed',
]


class FakeListingDetector:
    """Stateful detector that accumulates data across a scrape batch to detect patterns."""

    def __init__(self):
        # Track phone -> listing count per batch
        self._phone_listings: Dict[str, List[str]] = defaultdict(list)
        # Track phone -> city -> listing count
        self._phone_city_listings: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        # Track title hashes per poster (phone/name)
        self._poster_titles: Dict[str, List[str]] = defaultdict(list)
        # Track content hashes for cross-source dedup
        self._content_hashes: Dict[str, str] = {}
        # Batch-level stats
        self.stats = {
            'total_checked': 0,
            'clean': 0,
            'low_risk': 0,
            'medium_risk': 0,
            'high_risk': 0,
            'rejected': 0,
        }

    def reset(self):
        """Reset state for a new batch."""
        self._phone_listings.clear()
        self._phone_city_listings.clear()
        self._poster_titles.clear()
        self._content_hashes.clear()
        self.stats = {k: 0 for k in self.stats}

    def _normalize_phone(self, phone: str) -> Optional[str]:
        """Normalize Saudi phone number for comparison."""
        if not phone:
            return None
        # Strip non-digits
        digits = re.sub(r'\D', '', str(phone))
        if not digits:
            return None
        # Normalize +966 / 00966 / 0 prefix to standard form
        if digits.startswith('966'):
            digits = '0' + digits[3:]
        elif digits.startswith('00966'):
            digits = '0' + digits[5:]
        if len(digits) < 9:
            return None
        return digits

    def _normalize_text(self, text: str) -> str:
        """Normalize Arabic text for comparison (remove diacritics, normalize alef/taa)."""
        if not text:
            return ''
        # Remove Arabic diacritics
        text = re.sub(r'[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]', '', text)
        # Normalize alef variants
        text = re.sub(r'[أإآٱ]', 'ا', text)
        # Normalize taa marbuta
        text = text.replace('ة', 'ه')
        # Normalize yaa
        text = text.replace('ى', 'ي')
        # Collapse whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _content_hash(self, listing: Dict[str, Any]) -> str:
        """Create a fuzzy content hash to detect same property across sources."""
        # Use normalized: city + district + price_range + size_range + bedrooms
        city = self._normalize_text(str(listing.get('city', '')))
        district = self._normalize_text(str(listing.get('district', '')))
        price = listing.get('price')
        size = listing.get('size_sqm')
        beds = listing.get('bedrooms', 0)

        # Round price to nearest 10K and size to nearest 10 for fuzzy matching
        price_bucket = str(int(float(price) / 10000) * 10000) if price else '0'
        size_bucket = str(int(float(size) / 10) * 10) if size else '0'

        raw = f"{city}|{district}|{price_bucket}|{size_bucket}|{beds}"
        return hashlib.md5(raw.encode()).hexdigest()

    def _title_hash(self, title: str) -> str:
        """Create normalized title hash for similarity detection."""
        normalized = self._normalize_text(title)
        # Remove numbers (prices, sizes change)
        normalized = re.sub(r'\d+', '', normalized)
        # Remove common filler words
        for word in ['في', 'من', 'الى', 'على', 'عن', 'مع', 'بدون', 'شارع', 'حي']:
            normalized = normalized.replace(word, '')
        normalized = re.sub(r'\s+', '', normalized)
        return hashlib.md5(normalized.encode()).hexdigest()

    def _check_spam_phone(self, phone: str) -> Tuple[FakeScore, Optional[str]]:
        """Check if phone number matches known spam patterns."""
        if not phone:
            return FakeScore.CLEAN, None
        for pattern in KNOWN_SPAM_PATTERNS:
            if re.search(pattern, phone):
                return FakeScore.HIGH_RISK, f"Phone matches spam pattern: {pattern}"
        return FakeScore.CLEAN, None

    def _check_scam_text(self, text: str) -> Tuple[FakeScore, Optional[str]]:
        """Check if listing text contains scam indicators."""
        if not text:
            return FakeScore.CLEAN, None
        text_lower = text.lower()
        normalized = self._normalize_text(text)

        hits = []
        for kw in SCAM_KEYWORDS_AR:
            if self._normalize_text(kw) in normalized:
                hits.append(kw)
        for kw in SCAM_KEYWORDS_EN:
            if kw in text_lower:
                hits.append(kw)

        if len(hits) >= 3:
            return FakeScore.HIGH_RISK, f"Multiple scam keywords: {', '.join(hits[:3])}"
        elif len(hits) >= 1:
            return FakeScore.LOW_RISK, f"Scam keyword: {hits[0]}"
        return FakeScore.CLEAN, None

    def _check_price_sanity(self, listing: Dict[str, Any]) -> Tuple[FakeScore, Optional[str]]:
        """Check for suspiciously round or placeholder prices."""
        price = listing.get('price')
        if not price:
            return FakeScore.CLEAN, None

        price_f = float(price)

        # Exact round number (1,000,000 exactly, 500,000 exactly)
        if price_f in SUSPICIOUSLY_ROUND_PRICES:
            return FakeScore.MEDIUM_RISK, f"Suspiciously exact round price: {price_f}"

        # Price is exactly 1 SAR (placeholder)
        if price_f <= 1:
            return FakeScore.REJECT, f"Placeholder price: {price_f} SAR"

        # Price is a number like 1111111 or 9999999 (placeholder patterns)
        price_str = str(int(price_f))
        if len(price_str) >= 5 and len(set(price_str)) == 1:
            return FakeScore.HIGH_RISK, f"Repeated-digit price: {price_str}"

        return FakeScore.CLEAN, None

    def _check_data_completeness(self, listing: Dict[str, Any]) -> Tuple[FakeScore, Optional[str]]:
        """Check if listing has minimum required data for a real listing."""
        issues = []
        prop_type = listing.get('property_type', 'apartment')

        # No images for residential
        if prop_type in ('apartment', 'villa', 'building') and not listing.get('image_urls'):
            issues.append("No images for residential property")

        # Very short or missing description
        desc = listing.get('description', '')
        if len(desc) < MIN_DESCRIPTION_LENGTH:
            issues.append(f"Description too short ({len(desc)} chars)")

        # No title or generic title
        title = listing.get('title', '')
        if len(title) < 5:
            issues.append(f"Title too short ({len(title)} chars)")

        if len(issues) >= 2:
            return FakeScore.MEDIUM_RISK, "; ".join(issues)
        elif issues:
            return FakeScore.LOW_RISK, issues[0]
        return FakeScore.CLEAN, None

    def register_listing(self, listing: Dict[str, Any]):
        """Register a listing in batch tracking (call before check_listing for best results)."""
        phone = self._normalize_phone(listing.get('contact_phone', ''))
        if phone:
            ext_id = listing.get('external_id', '')
            self._phone_listings[phone].append(ext_id)
            city = listing.get('city', 'unknown')
            self._phone_city_listings[phone][city] += 1

        # Track title patterns per poster
        poster_key = phone or listing.get('contact_name', '')
        if poster_key:
            title_h = self._title_hash(listing.get('title', ''))
            self._poster_titles[poster_key].append(title_h)

        # Track content hash for dedup
        c_hash = self._content_hash(listing)
        ext_id = listing.get('external_id', '')
        if c_hash in self._content_hashes:
            # Mark as potential duplicate
            listing['_duplicate_of'] = self._content_hashes[c_hash]
        else:
            self._content_hashes[c_hash] = ext_id

    def check_listing(self, listing: Dict[str, Any]) -> Tuple[FakeScore, List[str]]:
        """
        Run all fake/spam checks on a listing.
        Returns (overall_score, list_of_reasons).
        Call register_listing first for batch-level checks.
        """
        self.stats['total_checked'] += 1
        reasons = []
        max_score = FakeScore.CLEAN

        def update(score: FakeScore, reason: Optional[str]):
            nonlocal max_score
            if reason:
                reasons.append(reason)
            if score.value > max_score.value:
                max_score = score

        # 1. Spam phone check
        phone = self._normalize_phone(listing.get('contact_phone', ''))
        score, reason = self._check_spam_phone(phone or '')
        update(score, reason)

        # 2. Phone volume check (batch-level)
        if phone:
            total_from_phone = len(self._phone_listings.get(phone, []))
            if total_from_phone > MAX_LISTINGS_PER_PHONE:
                update(FakeScore.HIGH_RISK, f"Phone {phone[-4:]}... has {total_from_phone} listings (spam broker)")

            city = listing.get('city', 'unknown')
            city_count = self._phone_city_listings.get(phone, {}).get(city, 0)
            if city_count > MAX_LISTINGS_PER_PHONE_CITY:
                update(FakeScore.MEDIUM_RISK, f"Phone has {city_count} listings in {city}")

        # 3. Template title detection
        poster_key = phone or listing.get('contact_name', '')
        if poster_key:
            poster_titles = self._poster_titles.get(poster_key, [])
            if len(poster_titles) >= 5:
                title_h = self._title_hash(listing.get('title', ''))
                same_title_count = poster_titles.count(title_h)
                if same_title_count >= 3:
                    update(FakeScore.MEDIUM_RISK,
                           f"Poster reuses same title template {same_title_count} times")

        # 4. Scam text check
        combined_text = f"{listing.get('title', '')} {listing.get('description', '')}"
        score, reason = self._check_scam_text(combined_text)
        update(score, reason)

        # 5. Price sanity
        score, reason = self._check_price_sanity(listing)
        update(score, reason)

        # 6. Data completeness
        score, reason = self._check_data_completeness(listing)
        update(score, reason)

        # 7. Cross-source duplicate check
        if listing.get('_duplicate_of'):
            update(FakeScore.LOW_RISK,
                   f"Potential duplicate of {listing['_duplicate_of']}")

        # 8. Suspicious contact info patterns
        contact_name = listing.get('contact_name', '')
        if contact_name and re.match(r'^[0-9\s\+]+$', contact_name):
            update(FakeScore.LOW_RISK, "Contact name is just numbers (likely phone)")

        # Update stats
        stat_key = max_score.name.lower()
        if stat_key in self.stats:
            self.stats[stat_key] += 1

        if max_score.value >= FakeScore.HIGH_RISK.value:
            logger.info(
                f"FAKE_DETECT [{max_score.name}] {listing.get('external_id')}: "
                f"{'; '.join(reasons[:3])}"
            )

        return max_score, reasons

    def should_reject(self, score: FakeScore) -> bool:
        """Whether a listing with this score should be rejected entirely."""
        return score == FakeScore.REJECT

    def should_flag(self, score: FakeScore) -> bool:
        """Whether a listing with this score should be flagged (saved but penalized)."""
        return score.value >= FakeScore.MEDIUM_RISK.value

    def get_batch_summary(self) -> str:
        """Return a summary of detection stats for the batch."""
        total = self.stats['total_checked']
        if total == 0:
            return "No listings checked"
        return (
            f"Fake detection: {total} checked, "
            f"{self.stats['rejected']} rejected, "
            f"{self.stats['high_risk']} high-risk, "
            f"{self.stats['medium_risk']} medium-risk, "
            f"{self.stats['low_risk']} low-risk, "
            f"{self.stats['clean']} clean"
        )


# Global instance
fake_detector = FakeListingDetector()
