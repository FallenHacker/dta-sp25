from flask import Flask, request, jsonify
from flask_cors import CORS
from run_dynamic_strategy import run_backtest

app = Flask(__name__)
CORS(app)

@app.route("/run-strategy", methods=["POST"])
def run_strategy():
    try:
        data = request.get_json()
        strategy_file = data["strategy_file"]     # e.g. "allHands_strat1.py"
        symbol = data["symbol"]                   # e.g. "AAPL"
        start = data["start"]                     # e.g. "2024-01-01"
        end = data["end"]                         # e.g. "2024-03-31"

        result = run_backtest(strategy_file, symbol, start, end)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
