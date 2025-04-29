import requests
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from py_vollib.black_scholes.greeks.analytical import delta, gamma, vega, theta
from py_vollib.black_scholes.implied_volatility import implied_volatility

API_KEY = os.getenv('APCA_API_KEY_ID')
API_SECRET = os.getenv('APCA_API_SECRET_KEY')
BASE_URL = "https://data.alpaca.markets"
HEADERS = {"APCA-API-KEY-ID": API_KEY, "APCA-API-SECRET-KEY": API_SECRET}


def get_stock_data(symbol, start_date, end_date):
    url = f"{BASE_URL}/v2/stocks/bars"
    params = {"symbols": symbol, "start": start_date, "end": end_date, "timeframe": "1D"}
    r = requests.get(url, headers=HEADERS, params=params)
    data = r.json()["bars"][symbol]
    return pd.DataFrame([{
        "date": b["t"],
        "open": b["o"], "high": b["h"], "low": b["l"], "close": b["c"], "volume": b["v"]
    } for b in data])


def get_contracts(symbol, date):
    url = f"{BASE_URL}/v2/options/contracts"
    params = {"underlying_symbol": symbol, "as_of": date}
    r = requests.get(url, headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()["contracts"]


def get_top_of_book(contract_symbols, date):
    url = f"{BASE_URL}/v2/options/bars"
    params = {
        "symbols": ",".join(contract_symbols),
        "start": date,
        "end": date,
        "timeframe": "1D"
    }
    r = requests.get(url, headers=HEADERS, params=params)
    data = r.json()["bars"]
    rows = []
    for sym, bars in data.items():
        for b in bars:
            rows.append({
                "contract_symbol": sym,
                "date": b["t"], "open": b["o"], "high": b["h"],
                "low": b["l"], "close": b["c"], "volume": b["v"]
            })
    return pd.DataFrame(rows)


def calculate_greeks_and_iv(row, S, r=0.01):
    T = (datetime.strptime(row["expiration_date"], "%Y-%m-%d") - pd.to_datetime(row["date"])).days / 365
    if T <= 0: return None
    try:
        price = row["close"]
        K = float(row["strike_price"])
        flag = "c" if row["type"] == "call" else "p"
        iv = implied_volatility(price, S, K, T, r, flag)
        return {
            "iv": iv,
            "delta": delta(flag, S, K, T, r, iv),
            "gamma": gamma(flag, S, K, T, r, iv),
            "vega": vega(flag, S, K, T, r, iv),
            "theta": theta(flag, S, K, T, r, iv)
        }
    except Exception:
        return None


def collect_all_data(symbol, start_date, end_date):
    stock_df = get_stock_data(symbol, start_date, end_date)
    all_results = []

    for _, row in stock_df.iterrows():
        date_str = pd.to_datetime(row["date"]).strftime("%Y-%m-%d")
        spot_price = row["close"]

        print(f"Fetching contracts for {date_str}...")
        contracts = get_contracts(symbol, date_str)
        contract_symbols = [c["symbol"] for c in contracts]
        contract_map = {c["symbol"]: c for c in contracts}

        print(f"Fetching quotes for {len(contract_symbols)} contracts...")
        quotes = get_top_of_book(contract_symbols[:50], date_str)  # limit for sanity

        # Add contract metadata
        quotes["strike_price"] = quotes["contract_symbol"].map(lambda s: contract_map[s]["strike_price"])
        quotes["type"] = quotes["contract_symbol"].map(lambda s: contract_map[s]["type"])
        quotes["expiration_date"] = quotes["contract_symbol"].map(lambda s: contract_map[s]["expiration_date"])

        # Calculate Greeks and IV
        print(f"Calculating Greeks...")
        greeks_data = quotes.apply(lambda x: calculate_greeks_and_iv(x, spot_price), axis=1)
        greeks_df = pd.DataFrame(greeks_data.tolist())

        full_df = pd.concat([quotes.reset_index(drop=True), greeks_df], axis=1)
        all_results.append(full_df)

    return pd.concat(all_results, ignore_index=True)