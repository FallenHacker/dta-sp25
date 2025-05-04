# backend/run_dynamic_strategy.py
import vectorbt as vbt
import pandas as pd
import importlib.util
import os
import sys
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s:%(name)s: %(message)s')
log = logging.getLogger(__name__)

log.info("--- [START] Executing run_dynamic_strategy.py ---")
result = {"error": "Script finished unexpectedly before calculating results."}

try:
    # --- Load Utils ---
    log.info("--- Loading utils ---")
    from utils import get_stock_data
    log.info("--- Utils loaded ---")

    # --- Load Generated Strategy Code ---
    # (Keep this section as is)
    log.info("--- Loading generated strategy ---")
    strategy_module = None
    strategy_path = os.path.join(os.path.dirname(__file__), "..", "generated_strategies", "run_strategy.py")
    log.info(f"Strategy path: {os.path.abspath(strategy_path)}")
    if not os.path.exists(strategy_path):
        log.error(f"Strategy file not found at {os.path.abspath(strategy_path)}")
        raise FileNotFoundError(f"Strategy file not found at {os.path.abspath(strategy_path)}")

    spec = importlib.util.spec_from_file_location("run_strategy", strategy_path)
    if spec is None or spec.loader is None:
         log.error(f"Could not create module spec for {strategy_path}")
         raise ImportError(f"Could not create module spec for {strategy_path}")
    strategy_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(strategy_module)
    if not hasattr(strategy_module, 'run_strategy'):
        log.error("Generated strategy module does not have a 'run_strategy' function.")
        raise AttributeError("Generated strategy module does not have a 'run_strategy' function.")
    log.info("--- Generated strategy loaded successfully ---")

    # --- Fetch Underlying Stock Data ---
    # (Keep this section as is)
    log.info("--- Fetching underlying stock data ---")
    stock_df_raw = get_stock_data("AAPL", "2024-02-01", "2025-02-01") # Use appropriate ticker/dates
    if stock_df_raw is None or stock_df_raw.empty:
        log.error("Failed to fetch underlying stock data or data is empty.")
        raise ValueError("Failed to fetch underlying stock data or data is empty.")
    stock_df_raw['date'] = pd.to_datetime(stock_df_raw['date'])
    stock_df = stock_df_raw.set_index('date')
    log.info(f"--- Stock data fetched. Shape: {stock_df.shape}, Columns: {stock_df.columns.tolist()} ---")

    # --- Run Generated Strategy Function ---
    # (Keep this section as is)
    log.info("--- Running generated strategy function ---")
    strategy_output = strategy_module.run_strategy(stock_df.copy())
    log.info(f"--- Strategy function executed. Output keys: {list(strategy_output.keys())} ---")
    if not all(k in strategy_output for k in ['entries', 'exits']):
         log.error("Strategy output missing 'entries' or 'exits'.")
         raise ValueError("Strategy output missing 'entries' or 'exits'.")

    # --- Run vectorbt Portfolio ---
    log.info("--- Running vectorbt Portfolio ---")
    stock_close_series = stock_df['close']
    portfolio = vbt.Portfolio.from_signals(
        close=stock_close_series,
        entries=strategy_output['entries'],
        exits=strategy_output['exits'],
        size=strategy_output.get('size', 1),
        # size_type='shares', # REMOVED THIS LINE
        direction='longonly',
        freq='D'
    )
    log.info("--- Portfolio calculation finished ---") # Should reach here now

    # --- Calculate Metrics ---
    # (Keep this section as is)
    log.info("--- Calculating metrics ---")
    pf_stats = portfolio.stats()
    if pf_stats is None:
        log.error("Portfolio stats calculation resulted in None.")
        raise ValueError("Portfolio stats calculation resulted in None.")
    def get_stat(key, multiplier=1, default=None):
        value = pf_stats.get(key)
        return value * multiplier if pd.notna(value) else default
    result = {
        "total_return": get_stat('Total Return [%]'),
        "annualized_return": get_stat('Annualized Return [%]'),
        "max_drawdown": get_stat('Max Drawdown [%]'),
        "sharpe_ratio": get_stat('Sharpe Ratio'),
        "win_rate": get_stat('Win Rate [%]'),
        "portfolio_value_series": portfolio.value().tolist() if portfolio.value is not None else None,
        "dates": [d.strftime('%Y-%m-%d') for d in portfolio.value().index.to_list()] if portfolio.value is not None else None
    }
    log.info(f"--- Metrics calculated: {result} ---")

except Exception as e:
    log.error(f"\n!!! ERROR in run_dynamic_strategy.py: {type(e).__name__}: {e} !!!", exc_info=True)
    result = {"error": f"Error during backtest script execution: {type(e).__name__}: {e}"}

log.info(f"--- [END] run_dynamic_strategy.py ---")
log.info(f"Final result value: {result}\n")