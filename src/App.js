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
  const [backtestResults, setBacktestResults] = useState(null);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async () => {
      if (!inputText.trim()) return;

        try {
          const res = await fetch('http://localhost:5000/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: inputText })
          });
    
          const { filename, error } = await res.json();
          if (error) throw new Error(error);
    
          console.log('Generated strategy file:', filename);
    
          const runRes = await fetch('http://localhost:5000/run-strategy', {
            method: 'POST'
          });
          const result = await runRes.json();
          setBacktestResults(result);
          
        } catch (err) {
          console.error('Error generating strategy:', err);
        } finally {
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
        />
        <button onClick={handleSubmit}>Go</button>
      </div>

      {isSubmitted && backtestResults && (
        <>
          <div className="content-container">
            <div className="graph-container">
              <Line
                data={{
                  labels: backtestResults.dates,
                  datasets: [{
                    label: 'Portfolio Value',
                    data: backtestResults.portfolio_value_series,
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
              <div className="sentence-placeholder">Total Return: {backtestResults.total_return.toFixed(2)}%</div>
              <div className="sentence-placeholder">Annualized Return: {backtestResults.annualized_return.toFixed(2)}%</div>
              <div className="sentence-placeholder">Max Drawdown: {backtestResults.max_drawdown.toFixed(2)}%</div>
              <div className="sentence-placeholder">Sharpe Ratio: {backtestResults.sharpe_ratio.toFixed(2)}</div>
              <div className="sentence-placeholder">Win Rate: {backtestResults.win_rate.toFixed(2)}%</div>
            </div>
          </div>
          <div className="paragraph-container"></div>
        </>
      )}
    </div>
  );
}

export default App;
