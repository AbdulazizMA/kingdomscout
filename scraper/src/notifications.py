import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

import requests

from config import settings, logger

class NotificationManager:
    def __init__(self):
        self.telegram_token = settings.TELEGRAM_BOT_TOKEN
        self.sendgrid_key = settings.SENDGRID_API_KEY
        self.email_from = settings.EMAIL_FROM
        
    def send_telegram_message(self, chat_id: str, message: str) -> bool:
        """Send a message via Telegram bot"""
        if not self.telegram_token:
            logger.warning("Telegram token not configured")
            return False
        
        try:
            url = f"https://api.telegram.org/bot{self.telegram_token}/sendMessage"
            payload = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'HTML',
                'disable_web_page_preview': False
            }
            
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending Telegram message: {e}")
            return False
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None) -> bool:
        """Send an email via SendGrid"""
        if not self.sendgrid_key:
            logger.warning("SendGrid API key not configured")
            return False
        
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_key)
            
            from_email = Email(self.email_from or 'alerts@propertyscout.sa')
            to_email = To(to_email)
            
            message = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            response = sg.client.mail.send.post(request_body=message.get())
            
            if response.status_code in [200, 201, 202]:
                return True
            else:
                logger.error(f"SendGrid error: {response.status_code} - {response.body}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False
    
    def format_property_message(self, property_data: Dict[str, Any], is_telegram: bool = True) -> str:
        """Format property data for notification"""
        title = property_data.get('title', 'Property Listing')
        price = property_data.get('price', 0)
        price_vs_market = property_data.get('price_vs_market_percent', 0)
        score = property_data.get('investment_score', 0)
        deal_type = property_data.get('deal_type', 'unknown')
        city = property_data.get('city_name', property_data.get('city', 'Unknown'))
        district = property_data.get('district_name', property_data.get('district', ''))
        source_url = property_data.get('source_url', '')
        size = property_data.get('size_sqm', 0)
        bedrooms = property_data.get('bedrooms', 0)
        image_url = property_data.get('main_image_url', '')
        
        # Determine emoji based on deal type
        emoji = '🏠'
        if deal_type == 'hot_deal':
            emoji = '🔥'
        elif deal_type == 'good_deal':
            emoji = '✅'
        
        price_formatted = f"{price:,.0f}" if price else "N/A"
        
        if is_telegram:
            message = f"""
{emoji} <b>{title}</b>

📍 <b>{city}</b>{f' - {district}' if district else ''}
💰 <b>{price_formatted} SAR</b>
"""
            if size:
                message += f"📐 {size:,.0f} m²\n"
            if bedrooms:
                message += f"🛏 {bedrooms} bedrooms\n"
            
            if price_vs_market and price_vs_market < 0:
                message += f"📉 {abs(price_vs_market)}% below market\n"
            
            if score:
                message += f"⭐ Score: {score}/100\n"
            
            if source_url:
                message += f"\n🔗 <a href='{source_url}'>View on Aqar</a>"
            
        else:
            # Email format
            message = f"""
<h2>{emoji} {title}</h2>
<p><strong>Location:</strong> {city}{f' - {district}' if district else ''}</p>
<p><strong>Price:</strong> {price_formatted} SAR</p>
"""
            if size:
                message += f"<p><strong>Size:</strong> {size:,.0f} m²</p>\n"
            if bedrooms:
                message += f"<p><strong>Bedrooms:</strong> {bedrooms}</p>\n"
            
            if price_vs_market and price_vs_market < 0:
                message += f"<p><strong>Market Discount:</strong> {abs(price_vs_market)}%</p>\n"
            
            if score:
                message += f"<p><strong>Investment Score:</strong> {score}/100</p>\n"
            
            if source_url:
                message += f"<p><a href='{source_url}' style='background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;'>View Property</a></p>\n"
        
        return message.strip()
    
    def send_property_alert(self, user: Dict[str, Any], property_data: Dict[str, Any]) -> bool:
        """Send property alert to user via their preferred channels"""
        success = True
        
        # Send Telegram notification if enabled
        if user.get('telegram_notifications') and user.get('telegram_chat_id'):
            message = self.format_property_message(property_data, is_telegram=True)
            if not self.send_telegram_message(user['telegram_chat_id'], message):
                success = False
        
        # Send email notification if enabled
        if user.get('email_notifications'):
            subject = f"New Property Alert: {property_data.get('title', 'Property Listing')[:50]}"
            html_content = self.format_property_message(property_data, is_telegram=False)
            
            if not self.send_email(user['email'], subject, html_content):
                success = False
        
        return success
    
    def send_new_deals_digest(self, user: Dict[str, Any], properties: List[Dict[str, Any]]) -> bool:
        """Send a digest of new deals to a user"""
        if not properties:
            return True
        
        success = True
        
        # Email digest
        if user.get('email_notifications') and user.get('email'):
            subject = f"KingdomScout: {len(properties)} New Deals Found!"
            
            html_parts = [
                "<h1>🏠 New Property Deals</h1>",
                f"<p>We found <strong>{len(properties)}</strong> new properties matching your criteria.</p>",
                "<hr>"
            ]
            
            for prop in properties[:10]:  # Limit to 10 in digest
                html_parts.append(self.format_property_message(prop, is_telegram=False))
                html_parts.append("<hr>")
            
            if len(properties) > 10:
                html_parts.append(f"<p>...and {len(properties) - 10} more deals. <a href='https://propertyscout.sa/deals'>View all →</a></p>")
            
            html_content = "\n".join(html_parts)
            
            if not self.send_email(user['email'], subject, html_content):
                success = False
        
        # Telegram digest
        if user.get('telegram_notifications') and user.get('telegram_chat_id'):
            message_parts = [f"🔔 <b>{len(properties)} New Deals Found!</b>\n\n"]
            
            for prop in properties[:5]:  # Limit to 5 in Telegram digest
                title = prop.get('title', 'Property')[:40]
                price = prop.get('price', 0)
                deal_type = prop.get('deal_type', '')
                
                emoji = '🏠'
                if deal_type == 'hot_deal':
                    emoji = '🔥'
                elif deal_type == 'good_deal':
                    emoji = '✅'
                
                message_parts.append(f"{emoji} {title}...\n💰 {price:,.0f} SAR\n\n")
            
            if len(properties) > 5:
                message_parts.append(f"...and {len(properties) - 5} more deals on the website!")
            
            message = "".join(message_parts)
            
            if not self.send_telegram_message(user['telegram_chat_id'], message):
                success = False
        
        return success
    
    def send_scrape_summary(self, results: List[Dict[str, Any]]) -> bool:
        """Send summary of scrape job to admin"""
        total_found = sum(r.get('found', 0) for r in results)
        total_errors = sum(r.get('errors', 0) for r in results)
        
        message = f"""
📊 <b>Scrape Complete</b>

Cities scraped: {len(results)}
Total properties found: {total_found}
Errors: {total_errors}
Completed at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}

Details:
"""
        
        for r in results:
            emoji = '✅' if r.get('errors', 0) == 0 else '⚠️'
            message += f"{emoji} {r.get('city', 'Unknown')}: {r.get('found', 0)} found\n"
        
        logger.info(message)
        
        # Optionally send to admin Telegram
        admin_chat_id = os.getenv('ADMIN_TELEGRAM_CHAT_ID')
        if admin_chat_id and self.telegram_token:
            return self.send_telegram_message(admin_chat_id, message)
        
        return True
    
    def send_price_drop_alert(self, user: Dict[str, Any], property_data: Dict[str, Any], 
                              old_price: float, new_price: float) -> bool:
        """Send alert about price drop"""
        drop_percent = ((old_price - new_price) / old_price) * 100
        
        if user.get('telegram_notifications') and user.get('telegram_chat_id'):
            message = f"""
📉 <b>PRICE DROP!</b>

{property_data.get('title', 'Property')[:60]}

Old price: {old_price:,.0f} SAR
New price: {new_price:,.0f} SAR
Drop: {drop_percent:.1f}%

{property_data.get('source_url', '')}
"""
            self.send_telegram_message(user['telegram_chat_id'], message)
        
        if user.get('email_notifications') and user.get('email'):
            subject = f"📉 Price Drop Alert: {drop_percent:.1f}% off!"
            html_content = f"""
<h2>📉 Price Drop Alert!</h2>
<p><strong>{property_data.get('title', 'Property')}</strong></p>
<p>Old price: <s>{old_price:,.0f} SAR</s></p>
<p>New price: <strong style='color:green;'>{new_price:,.0f} SAR</strong></p>
<p>You save: <strong>{drop_percent:.1f}%</strong></p>
<p><a href='{property_data.get('source_url', '')}'>View Property →</a></p>
"""
            self.send_email(user['email'], subject, html_content)
        
        return True


# Global instance
notification_manager = NotificationManager()
