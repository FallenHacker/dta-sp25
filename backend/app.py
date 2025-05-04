from flask import Flask, jsonify
from flask_cors import CORS
import os
import time
import importlib.util
import sys
import traceback
import logging # Import logging

# Configure logging early
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s')

# Optional: Load .env file if needed for API keys in utils.py
try:
    from dotenv import load_dotenv
    load_dotenv()
    logging.info(".env file loaded if present.")
except ImportError:
    logging.info("dotenv package not installed, skipping .env load.")


app = Flask(__name__)
CORS(app)

# --- Load the module containing the backtest logic ---
def load_run_dynamic_strategy():
    module = None
    result_value = {"error": "Default error in load_run_dynamic_strategy"} # Default error
    try:
        app.logger.info(">>> Attempting to load run_dynamic_strategy.py module...")
        # Use path relative to app.py's location
        path = os.path.join(os.path.dirname(__file__), "run_dynamic_strategy.py")
        app.logger.info(f">>> Module path: {path}")
        spec = importlib.util.spec_from_file_location("run_dynamic_strategy", path)

        if spec is None or spec.loader is None:
             app.logger.error(">>> Failed to create module spec.")
             raise ImportError("Failed to create module spec.")

        module = importlib.util.module_from_spec(spec)
        app.logger.info(">>> Module object created. Attempting execution (exec_module)...")

        # Execute the module's code (this runs run_dynamic_strategy.py top-to-bottom)
        spec.loader.exec_module(module) # <--- The silent point?

        app.logger.info(">>> exec_module completed.") # Did it reach here?

        # Check if 'result' exists in the executed module's namespace
        if hasattr(module, 'result'):
            result_value = module.result # Get the actual result
            app.logger.info(f">>> Found 'result' variable in module. Type: {type(result_value)}. Value: {result_value}")
        else:
            # This case might explain the 'null' if the script finishes but 'result' isn't set
            app.logger.error(">>> 'result' variable NOT FOUND in executed module run_dynamic_strategy.py!")
            result_value = {"error": "'result' variable not found in executed module."}

    except Exception as e:
        app.logger.error(f"!!! Error during load/execute run_dynamic_strategy.py: {e}", exc_info=True)
        result_value = {"error": f"Failed to load/execute strategy script: {type(e).__name__}"}

    app.logger.info(f">>> Returning from load_run_dynamic_strategy. Final value check: {result_value}")
    return result_value # Return the found result or an error dictionary


# --- API Endpoint ---
@app.route("/run-strategy", methods=["POST"])
def run_strategy2():
    app.logger.info("--- Received request for /run-strategy ---")
    final_result = None
    status_code = 500 # Default to error
    try:
        # Path relative to project root (dta-sp25) since Node writes it there
        # Flask CWD is 'backend', so use '..' to go up one level
        strategy_path = os.path.join("..", "generated_strategies", "run_strategy.py")
        app.logger.info(f"Checking for generated strategy file at: {os.path.abspath(strategy_path)}")

        timeout = 5 # Increased timeout slightly
        elapsed = 0
        while not os.path.exists(strategy_path) and elapsed < timeout:
            time.sleep(0.1)
            elapsed += 0.1
        app.logger.info(f"Waited {elapsed:.1f}s for file.")

        if not os.path.exists(strategy_path):
            app.logger.error(f"Strategy file NOT found: {strategy_path}")
            final_result = {"error": f"Strategy file not found"}
            status_code = 404
        else:
            app.logger.info(f"Strategy file found. Calling load_run_dynamic_strategy...")
            final_result = load_run_dynamic_strategy() # Call the function to load/run the script
            app.logger.info(f"Received result object from load_run_dynamic_strategy. Type: {type(final_result)}")

            # Determine status code based on result
            if isinstance(final_result, dict) and 'error' in final_result:
                 app.logger.warning(f"Execution script returned an error object: {final_result}")
                 status_code = 500 # Error occurred within the script execution
            elif final_result is None:
                 app.logger.warning("Execution script result is None. Sending null.")
                 status_code = 200 # Operation completed, but result is null
            else:
                 app.logger.info("Execution script completed, returning result.")
                 status_code = 200 # Success

    except Exception as e:
        app.logger.error(f"!!! Unhandled error in /run-strategy endpoint: {e}", exc_info=True)
        final_result = {"error": f"An internal server error occurred in API handler: {str(e)}"}
        status_code = 500

    # Ensure response_data is suitable for jsonify
    response_data = final_result
    if status_code == 200 and final_result is None:
         response_data = None # jsonify(None) becomes null
    elif not isinstance(final_result, (dict, list)) and final_result is not None: # Check if it's suitable for JSON
         app.logger.error(f"Result type {type(final_result)} is not JSON serializable (dict/list/None). Returning error.")
         response_data = {"error": "Invalid result type from backtest script."}
         status_code = 500

    app.logger.info(f"--- Sending response. Status: {status_code}, Data: {response_data} ---")
    return jsonify(response_data), status_code

if __name__ == "__main__":
    # Keep debug=True for development
    app.run(debug=True, port=5001)