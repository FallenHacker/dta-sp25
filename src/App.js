import React, { useState } from 'react';
import './App.css';
import logo from './logo.png';
import dta from './dta.png';

function App() {
  const [inputText, setInputText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async () => {
      if (!inputText.trim()) return;

        try {
          const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: inputText })
          });
    
          const { filename, error } = await res.json();
          if (error) throw new Error(error);
    
          console.log('Generated strategy file:', filename);
    
          //can do vectorbt graphs and stuff here
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

      {isSubmitted && (
        <>
          <div className="content-container">
            <div className="graph-container">
              <div className="graph-placeholder">
                <div className="graph-line"></div>
              </div>
            </div>
            <div className="sentences-container">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="sentence-placeholder"></div>
              ))}
            </div>
          </div>
          <div className="paragraph-container"></div>
        </>
      )}
    </div>
  );
}

export default App;
