import os
import logging
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv('DATABASE_URL', "postgresql://postgres:postgres@localhost:5432/saudi_deals")
    
    # Scraping settings
    SCRAPE_INTERVAL_HOURS: int = int(os.getenv('SCRAPE_INTERVAL_HOURS', '4'))
    REQUEST_DELAY_SECONDS: float = 1.5
    MAX_RETRIES: int = 3
    TIMEOUT_SECONDS: int = 30
    
    # Target URL
    AQAR_BASE_URL: str = "https://sa.aqar.fm"
    
    # Deal scoring weights
    PRICE_WEIGHT: float = 0.4
    LOCATION_WEIGHT: float = 0.3
    PRICE_HISTORY_WEIGHT: float = 0.2
    DAYS_ON_MARKET_WEIGHT: float = 0.1
    
    # Deal thresholds
    HOT_DEAL_THRESHOLD: float = 15.0  # 15% below market
    GOOD_DEAL_THRESHOLD: float = 10.0  # 10% below market
    
    # Rental yield estimation
    AVG_RENTAL_YIELD_RIYADH: float = 6.5  # Percentage
    AVG_RENTAL_YIELD_JEDDAH: float = 7.0
    AVG_RENTAL_YIELD_OTHER: float = 7.5
    
    # Logging
    LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO')
    
    # Notifications
    TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv('TELEGRAM_BOT_TOKEN')
    SENDGRID_API_KEY: Optional[str] = os.getenv('SENDGRID_API_KEY')
    EMAIL_FROM: Optional[str] = os.getenv('EMAIL_FROM', 'alerts@propertyscout.sa')
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Configure logging
def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Create logger
    logger = logging.getLogger('aqar_scraper')
    logger.setLevel(log_level)
    
    # Remove existing handlers
    logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)
    
    # File handler
    try:
        file_handler = logging.FileHandler('scraper.log')
        file_handler.setLevel(log_level)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Warning: Could not create file handler: {e}")
    
    return logger

logger = setup_logging()
