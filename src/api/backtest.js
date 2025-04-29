export async function runBacktest() {
  const res = await fetch("http://localhost:5000/run-strategy", {
    method: "POST"
  });

  if (!res.ok) throw new Error("Failed to run backtest");
  return await res.json();
}