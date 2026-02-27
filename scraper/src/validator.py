"""
Property listing validation module.
Validates scraped data before database insertion to catch:
- Rental listings that leaked through keyword filters
- Apartments using land/building area instead of unit area
- Nonsensical price/size combinations
- Placeholder or garbage data
"""

from typing import Dict, Any, Tuple, List
from enum import Enum

from config import logger, settings


class ValidationResult(Enum):
    PASS = "pass"
    REJECT = "reject"
    FLAG = "flag"


# ── Price thresholds (SAR) ──
MIN_PRICE = {
    'apartment': 80_000,
    'villa': 200_000,
    'land': 20_000,
    'building': 300_000,
    'office': 50_000,
    'shop': 30_000,
    'chalet': 50_000,
    'farm': 30_000,
    'warehouse': 50_000,
}
MIN_PRICE_DEFAULT = 50_000
ABSOLUTE_MIN_PRICE = 10_000

MAX_PRICE = {
    'apartment': 10_000_000,
    'villa': 50_000_000,
    'land': 200_000_000,
    'building': 100_000_000,
}
MAX_PRICE_DEFAULT = 200_000_000

# ── Size bounds (sqm) ──
MAX_SIZE = {
    'apartment': 800,
    'villa': 3_000,
    'office': 2_000,
    'shop': 1_000,
}
MAX_SIZE_DEFAULT = 500_000

MIN_SIZE = {
    'apartment': 20,
    'villa': 80,
    'land': 50,
}
MIN_SIZE_DEFAULT = 10

# ── Price per sqm bounds (SAR/sqm) ──
PRICE_PER_SQM_MIN = {
    'apartment': 800,
    'villa': 500,
    'land': 30,
    'building': 300,
}
PRICE_PER_SQM_MIN_DEFAULT = 30

PRICE_PER_SQM_MAX = {
    'apartment': 25_000,
    'villa': 20_000,
    'land': 15_000,
    'building': 30_000,
}
PRICE_PER_SQM_MAX_DEFAULT = 30_000

# ── Cross-field rules ──
MAX_SQM_PER_BEDROOM_APARTMENT = 200


def validate_listing(listing: Dict[str, Any]) -> Tuple[ValidationResult, List[str]]:
    """
    Validate a listing before insertion.
    Returns (ValidationResult, list_of_reasons).
    """
    if not settings.VALIDATION_ENABLED:
        return ValidationResult.PASS, []

    reasons = []
    result = ValidationResult.PASS

    price = listing.get('price')
    size = listing.get('size_sqm')
    prop_type = listing.get('property_type', 'apartment')
    bedrooms = listing.get('bedrooms')

    # ── Rule 1: Price floor ──
    if price is not None:
        price_f = float(price)

        if price_f < ABSOLUTE_MIN_PRICE:
            return ValidationResult.REJECT, [
                f"Price {price_f:.0f} SAR below absolute minimum {ABSOLUTE_MIN_PRICE}"
            ]

        type_min = MIN_PRICE.get(prop_type, MIN_PRICE_DEFAULT)
        if price_f < type_min:
            return ValidationResult.REJECT, [
                f"Price {price_f:.0f} SAR below {prop_type} minimum {type_min} (likely rental)"
            ]

        type_max = MAX_PRICE.get(prop_type, MAX_PRICE_DEFAULT)
        if price_f > type_max:
            return ValidationResult.REJECT, [
                f"Price {price_f:.0f} SAR above {prop_type} maximum {type_max}"
            ]

    # ── Rule 2: Size bounds ──
    if size is not None:
        size_f = float(size)

        # Hard reject anything over 1800 sqm (except land)
        if size_f > 1800 and prop_type != 'land':
            return ValidationResult.REJECT, [
                f"Size {size_f:.0f} sqm exceeds 1800 sqm absolute limit"
            ]

        type_min_size = MIN_SIZE.get(prop_type, MIN_SIZE_DEFAULT)
        if size_f < type_min_size:
            reasons.append(f"Size {size_f:.0f} sqm below {prop_type} minimum {type_min_size}")
            result = ValidationResult.FLAG

        type_max_size = MAX_SIZE.get(prop_type, MAX_SIZE_DEFAULT)
        if size_f > type_max_size and prop_type in ('apartment', 'office', 'shop'):
            reasons.append(
                f"Size {size_f:.0f} sqm exceeds {prop_type} max {type_max_size} "
                f"(likely land area, not unit area)"
            )
            result = ValidationResult.FLAG

    # ── Rule 3: Price per sqm sanity ──
    if price is not None and size is not None:
        price_f = float(price)
        size_f = float(size)
        if size_f > 0:
            ppsqm = price_f / size_f

            ppsqm_min = PRICE_PER_SQM_MIN.get(prop_type, PRICE_PER_SQM_MIN_DEFAULT)
            ppsqm_max = PRICE_PER_SQM_MAX.get(prop_type, PRICE_PER_SQM_MAX_DEFAULT)

            if ppsqm < ppsqm_min:
                if ppsqm < ppsqm_min * 0.3:
                    return ValidationResult.REJECT, [
                        f"Price/sqm {ppsqm:.0f} drastically below {prop_type} minimum {ppsqm_min} (data error)"
                    ]
                reasons.append(f"Price/sqm {ppsqm:.0f} below {prop_type} floor {ppsqm_min}")
                result = ValidationResult.FLAG

            if ppsqm > ppsqm_max:
                reasons.append(f"Price/sqm {ppsqm:.0f} above {prop_type} ceiling {ppsqm_max}")
                result = ValidationResult.FLAG

    # ── Rule 4: Apartment land-area detection ──
    if prop_type == 'apartment' and size is not None and bedrooms is not None:
        size_f = float(size)
        if bedrooms > 0 and size_f / bedrooms > MAX_SQM_PER_BEDROOM_APARTMENT:
            reasons.append(
                f"Apartment {size_f:.0f} sqm / {bedrooms} beds = {size_f / bedrooms:.0f} sqm/bed "
                f"(max {MAX_SQM_PER_BEDROOM_APARTMENT}); likely using land area"
            )
            result = ValidationResult.FLAG

        if bedrooms <= 1 and size_f > 300:
            reasons.append(f"Studio/1-bed apartment claiming {size_f:.0f} sqm")
            result = ValidationResult.FLAG

    # ── Rule 5: Zero-bedroom residential with high price ──
    if prop_type in ('apartment', 'villa') and bedrooms == 0 and price is not None:
        if float(price) > 500_000:
            reasons.append(f"{prop_type} with 0 bedrooms and {float(price):.0f} SAR price")
            result = ValidationResult.FLAG

    # ── Rule 6: Villa priced like apartment ──
    if prop_type == 'villa' and price is not None and float(price) < 150_000:
        return ValidationResult.REJECT, [
            f"Villa priced at {float(price):.0f} SAR (unrealistically low)"
        ]

    # ── Rule 7: Bedroom count sanity ──
    if bedrooms is not None and bedrooms > 20:
        return ValidationResult.REJECT, [
            f"Unrealistic bedroom count: {bedrooms}"
        ]

    # ── Rule 8: Building age sanity ──
    building_age = listing.get('building_age_years')
    if building_age is not None and (building_age < 0 or building_age > 100):
        reasons.append(f"Unrealistic building age: {building_age} years")
        result = ValidationResult.FLAG

    return result, reasons


def apply_flag_penalty(listing: Dict[str, Any], reasons: List[str]) -> Dict[str, Any]:
    """
    For FLAG results: cap investment_score, downgrade deal_type, set admin_notes.
    """
    score_cap = settings.VALIDATION_FLAG_SCORE_CAP
    if listing.get('investment_score') and listing['investment_score'] > score_cap:
        listing['investment_score'] = score_cap

    if listing.get('deal_type') in ('hot_deal', 'good_deal'):
        listing['deal_type'] = 'fair_price'

    listing['admin_notes'] = f"DATA_QUALITY_FLAG: {'; '.join(reasons)}"

    return listing
