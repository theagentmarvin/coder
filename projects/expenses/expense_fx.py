"""Expense FX Module - Currency conversion utilities."""
import os
import json
from typing import Tuple, Optional, Dict
from datetime import datetime
from urllib import request, error

# Fixed rates (updateable)
FIXED_RATES: Dict[str, float] = {
    "CLP": 1076.47,
    "DKK": 7.46,
    "BRL": 6.43,
    "EUR": 1.0,
}

# Cache for USD rate
_usd_rate_cache: Dict[str, Tuple[float, str]] = {}


def get_usd_rate(date: Optional[str] = None) -> float:
    """Fetch USD to EUR rate from frankfurter.app API.
    
    Args:
        date: Date string in YYYY-MM-DD format, or None for latest
        
    Returns:
        USD to EUR exchange rate
    """
    global _usd_rate_cache
    
    date_str = date or "latest"
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Check cache for today's rate
    if date_str in _usd_rate_cache:
        cached_rate, cached_date = _usd_rate_cache[date_str]
        if cached_date == today:
            return cached_rate
    
    try:
        url = f"https://api.frankfurter.app/{date_str}?from=USD&to=EUR"
        
        req = request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; ExpenseBot/1.0)"
            }
        )
        
        with request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
            rate = data.get("rates", {}).get("EUR", 0.85)
            
            # Cache the result
            _usd_rate_cache[date_str] = (rate, today)
            return rate
            
    except error.HTTPError as e:
        # If date not found, try latest
        if date and date != "latest":
            return get_usd_rate("latest")
        # Fallback rate
        return 0.85
    except Exception:
        # Return fallback rate on any error
        return 0.85


def set_fixed_rate(currency: str, rate: float) -> None:
    """Update a fixed exchange rate.
    
    Args:
        currency: Currency code (CLP, DKK, BRL)
        rate: New rate (amount of currency per 1 EUR)
    """
    global FIXED_RATES
    
    currency = currency.upper()
    if currency in FIXED_RATES and currency != "EUR":
        FIXED_RATES[currency] = rate


def get_rate(currency: str, date: Optional[str] = None) -> float:
    """Get exchange rate for currency to EUR.
    
    Args:
        currency: Currency code
        date: Date for historical rate (optional)
        
    Returns:
        Exchange rate (amount of currency per 1 EUR)
    """
    currency = currency.upper()
    
    if currency == "EUR":
        return 1.0
    
    if currency in FIXED_RATES:
        return FIXED_RATES[currency]
    
    if currency == "USD":
        # frankfurter returns USD to EUR, we need EUR per USD
        # So we return the inverse
        usd_to_eur = get_usd_rate(date)
        return 1.0 / usd_to_eur if usd_to_eur > 0 else 1.18
    
    # Unknown currency, default to 1.0
    return 1.0


def convert_to_eur(amount: float, currency: str, date: Optional[str] = None) -> Tuple[float, float]:
    """Convert amount to EUR.
    
    Args:
        amount: Amount in original currency
        currency: Currency code
        date: Date for historical rate (optional)
        
    Returns:
        Tuple of (amount_in_eur, rate_used)
    """
    currency = currency.upper()
    
    if currency == "EUR":
        return amount, 1.0
    
    rate = get_rate(currency, date)
    
    # Rate is amount of currency per 1 EUR
    # So EUR = amount / rate
    eur_amount = amount / rate
    
    return round(eur_amount, 2), rate


def get_all_rates(date: Optional[str] = None) -> Dict[str, float]:
    """Get all available exchange rates.
    
    Args:
        date: Date for historical rates (optional)
        
    Returns:
        Dictionary of currency codes to rates
    """
    rates = FIXED_RATES.copy()
    rates["USD"] = get_rate("USD", date)
    return rates


if __name__ == "__main__":
    # Test
    print("Fixed rates:", FIXED_RATES)
    print("USD rate:", get_usd_rate())
    print("All rates:", get_all_rates())
    
    # Test conversions
    test_amounts = [
        (100000, "CLP"),
        (100, "DKK"),
        (100, "BRL"),
        (100, "USD"),
        (100, "EUR"),
    ]
    
    for amount, currency in test_amounts:
        eur, rate = convert_to_eur(amount, currency)
        print(f"{amount} {currency} = {eur} EUR (rate: {rate})")
