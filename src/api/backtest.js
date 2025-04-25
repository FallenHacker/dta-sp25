export async function runBacktest({ strategyFile, symbol, start, end }) {
    const res = await fetch("http://localhost:5000/run-strategy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        strategy_file: strategyFile,     // e.g. "allHands_strat1.py"
        symbol: symbol,                  // e.g. "AAPL"
        start: start,                    // e.g. "2024-01-01"
        end: end                         // e.g. "2024-04-01"
      }),
    });
  
    if (!res.ok) throw new Error("Failed to run backtest");
    return await res.json();
  }
  