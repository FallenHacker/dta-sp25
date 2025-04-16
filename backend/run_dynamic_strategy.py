import vectorbt as vbt
import pandas as pd
import importlib.util
from utils import get_option_contracts, get_option_price_data
import os

def load_strategy(filepath):
    spec = importlib.util.spec_from_file_location("strategy_module", filepath)
    strategy_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(strategy_module)
    return strategy_module

def run_backtest(strategy_file: str, symbol: str, start: str, end: str):
    # Load strategy logic from Python file
    strat = load_strategy(f"strategy_files/{strategy_file}")

    # Fetch options contracts and price data
    contracts = get_option_contracts(symbol)
    contract = next(c for c in contracts if c["type"] == "call" and c["tradable"])
    contract_symbol = contract["symbol"]

    price_df = get_option_price_data(contract_symbol, start, end)

    # Apply strategy logic from the loaded file
    entries, exits = strat.generate_signals(price_df)

    # Run vectorbt backtest
    pf = vbt.Portfolio.from_signals(
        price_df['close'],
        entries,
        exits
    )

    return {
        "contract_symbol": contract["symbol"],
        "contract_strike": contract["strike_price"],
        "expiration_date": contract["expiration_date"],
        "total_return": pf.total_return(),
        "sharpe_ratio": pf.sharpe_ratio(),
        "equity_curve": pf.value().tolist(),
        "dates": price_df.index.strftime('%Y-%m-%d').tolist()
    }
