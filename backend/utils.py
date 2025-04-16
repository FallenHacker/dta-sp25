import os
import requests
import pandas as pd

ALPACA_HEADERS = {
    "APCA-API-KEY-ID": os.getenv("APCA_API_KEY_ID"),
    "APCA-API-SECRET-KEY": os.getenv("APCA_API_SECRET_KEY")
}
ALPACA_BASE_URL = "https://paper-api.alpaca.markets"

def get_option_contracts(underlying_symbol: str):
    url = f"{ALPACA_BASE_URL}/v2/options/contracts"
    params = {
        "underlying_symbols": underlying_symbol,
        "expiration_date_lte": "2025-01-01",  # You can make this dynamic
        "limit": 100
    }
    res = requests.get(url, headers=ALPACA_HEADERS, params=params)
    res.raise_for_status()
    return res.json()["option_contracts"]

def get_option_price_data(contract_symbol: str, start: str, end: str):
    url = f"{ALPACA_BASE_URL}/v1beta1/options/market_data/bars"
    params = {
        "symbols": contract_symbol,
        "start": start,
        "end": end,
        "timeframe": "1D"
    }
    res = requests.get(url, headers=ALPACA_HEADERS, params=params)
    res.raise_for_status()
    raw = res.json()["bars"][contract_symbol]
    df = pd.DataFrame(raw)
    df["t"] = pd.to_datetime(df["t"])
    df.set_index("t", inplace=True)
    df.rename(columns={"c": "close"}, inplace=True)
    return df
