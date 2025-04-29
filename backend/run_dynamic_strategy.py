import vectorbt as vbt
import pandas as pd
from trading_strategy import run_strategy
from utils import collect_all_data

df = collect_all_data("AAPL", "2024-02-01", "2025-02-01")

strategy_output = run_strategy(df)

portfolio = vbt.Portfolio.from_signals(
    close=df['close'],
    entries=strategy_output['entries'],
    exits=strategy_output['exits'],
    size=strategy_output.get('size', 1),
    direction='longonly'
)

result = {
    "total_return": portfolio.total_return() * 100,
    "annualized_return": portfolio.annualized_return() * 100,
    "max_drawdown": portfolio.max_drawdown() * 100,
    "sharpe_ratio": portfolio.sharpe_ratio(),
    "win_rate": portfolio.win_rate() * 100,
    "portfolio_value_series": portfolio.value().tolist(),
    "dates": [pd.to_datetime(d).strftime('%Y-%m-%d') for d in portfolio.value().index]
}
