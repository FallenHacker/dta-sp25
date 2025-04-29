from flask import Flask, jsonify
from flask_cors import CORS
import os
import time
import importlib.util

app = Flask(__name__)
CORS(app)

def load_run_dynamic_strategy():
    path = os.path.join("backend", "run_dynamic_strategy.py")
    spec = importlib.util.spec_from_file_location("run_dynamic_strategy", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.result  # result is defined inside that script

@app.route("/run-strategy", methods=["POST"])
def run_strategy2():
    try:
        strategy_path = os.path.join("generate_strategies", "run_strategy.py")
        timeout = 5
        elapsed = 0
        while not os.path.exists(strategy_path) and elapsed < timeout:
            time.sleep(0.1)
            elapsed += 0.1

        if not os.path.exists(strategy_path):
            raise FileNotFoundError("Strategy file was not created in time.")

        # Dynamically re-run run_dynamic_strategy.py every time
        result = load_run_dynamic_strategy()
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5001)
