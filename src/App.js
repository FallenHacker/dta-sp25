import React, { useState } from 'react';
import './App.css';
import logo from './logo.png';
import dta from './dta.png';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function App() {
  const [inputText, setInputText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null); // State to hold results or null on error/initial
  const [errorMessage, setErrorMessage] = useState(''); // Optional: State to hold error messages for display

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    setErrorMessage(''); // Clear previous errors on new input
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    // Reset state before new submission
    setIsSubmitted(false); // Reset submission state temporarily
    setBacktestResults(null);
    setErrorMessage('');

    try {
      // --- Step 1: Generate Strategy Code ---
      const generateRes = await fetch('http://localhost:5002/api/generate', { // Node server
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputText })
      });

      const generateData = await generateRes.json(); // Parse JSON response

      if (!generateRes.ok || generateData.error) {
        const errorMsg = generateData.error || `HTTP error! Status: ${generateRes.status}`;
        console.error("Error generating strategy:", errorMsg);
        setErrorMessage(`Error generating strategy: ${errorMsg}`);
        setIsSubmitted(true); // Move layout even on error
        return; // Stop if generation failed
      }

      console.log('Generated strategy file:', generateData.filename);

      // --- Step 2: Run Strategy Backtest ---
      const runRes = await fetch('http://localhost:5001/run-strategy', { // Flask server
        method: 'POST'
      });

      const result = await runRes.json(); // Parse JSON response from Flask
      console.log(">>> Data received from Flask:", result);

      // Check if Flask returned an error status OR if the result object contains an error key
      if (!runRes.ok || (result && result.error)) {
        const errorMsg = result?.error || `Backend error! Status: ${runRes.status}`; // Use error from JSON if available
        console.error("Error from backend:", errorMsg);
        setErrorMessage(`Error running strategy: ${errorMsg}`); // Set error message state
        setBacktestResults(null); // Ensure results are null
        setIsSubmitted(true); // Move layout
        return; // Stop processing
      }

      // --- Step 3: Validate SUCCESSFUL data structure ---
      // Check if result is an object and contains essential keys for rendering
      if (!result || typeof result !== 'object' || !result.dates || !result.portfolio_value_series ||
          result.total_return === undefined || result.annualized_return === undefined ||
          result.max_drawdown === undefined || result.sharpe_ratio === undefined ||
          result.win_rate === undefined) {
          console.error("Invalid or incomplete data received from backend:", result);
          setErrorMessage(`Error: Received invalid data structure from backtest.`);
          setBacktestResults(null);
          setIsSubmitted(true);
          return; // Stop processing
      }

      // --- Step 4: Data is valid, set state ---
      setBacktestResults(result);
      setErrorMessage(''); // Clear any previous errors

    } catch (err) {
      // Catch network errors (e.g., connection refused) or JS errors during the process
      console.error('Error during handleSubmit:', err);
      setErrorMessage(`Failed to process strategy: ${err.message}`); // Set network/JS error message
      setBacktestResults(null); // Clear results on error
    } finally {
      // Ensure layout moves after submission attempt (success or failure)
      setIsSubmitted(true);
    }
  };

  // Allow pressing Enter to submit
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="App">
      <img src={logo} alt="Logo" className="app-logo" />
      <img src={dta} alt="Dta" className="dta-logo" />
      <div className={`input-container ${isSubmitted ? 'top' : ''}`}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Please Enter Your Trading Strategy . . ."
          disabled={isSubmitted && !backtestResults && !errorMessage} // Optional: Disable input while processing
        />
        <button onClick={handleSubmit} disabled={isSubmitted && !backtestResults && !errorMessage}>Go</button>
      </div>

      {/* Display Error Message if exists */}
      {isSubmitted && errorMessage && (
        <div className="error-container">
           <p style={{ color: 'red' }}>{errorMessage}</p>
        </div>
      )}

      {/* Display Results only if submitted, no error, and results are valid */}
      {isSubmitted && !errorMessage && backtestResults && (
        <>
          <div className="content-container">
            <div className="graph-container">
              {/* Add null checks for data used in chart */}
              <Line
                data={{
                  labels: backtestResults.dates || [],
                  datasets: [{
                    label: 'Portfolio Value',
                    data: backtestResults.portfolio_value_series || [],
                    borderColor: 'blue',
                    tension: 0.2
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: { title: { display: true, text: 'Portfolio Value ($)' } }
                  }
                }}
              />
            </div>

            <div className="sentences-container">
              {/* Add null/undefined checks before calling toFixed */}
              <div className="sentence-placeholder">Total Return: {backtestResults.total_return != null ? backtestResults.total_return.toFixed(2) : 'N/A'}%</div>
              <div className="sentence-placeholder">Annualized Return: {backtestResults.annualized_return != null ? backtestResults.annualized_return.toFixed(2) : 'N/A'}%</div>
              <div className="sentence-placeholder">Max Drawdown: {backtestResults.max_drawdown != null ? backtestResults.max_drawdown.toFixed(2) : 'N/A'}%</div>
              <div className="sentence-placeholder">Sharpe Ratio: {backtestResults.sharpe_ratio != null ? backtestResults.sharpe_ratio.toFixed(2) : 'N/A'}</div>
              <div className="sentence-placeholder">Win Rate: {backtestResults.win_rate != null ? backtestResults.win_rate.toFixed(2) : 'N/A'}%</div>
            </div>
          </div>
          <div className="paragraph-container"></div> {/* What is this for? */}
        </>
      )}
    </div>
  );
}

export default App;