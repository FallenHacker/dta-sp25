from flask import Flask, jsonify
from flask_cors import CORS
import time
import os
app = Flask(__name__)
CORS(app)


@app.route("/run-strategy", methods=["POST"])
def run_strategy():
    try:
        strategy_path = "strategy_files/trading_strategy.py"
        timeout = 5
        elapsed = 0
        while not os.path.exists(strategy_path) and elapsed < timeout:
            time.sleep(0.1)
            elapsed += 0.1

        if not os.path.exists(strategy_path):
            raise FileNotFoundError("Strategy file was not created in time.")

        from run_dynamic_strategy import result
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
