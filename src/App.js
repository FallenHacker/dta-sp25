import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = () => {
    if (inputText.trim() !== '') {
      setIsSubmitted(true);
    }
  };

  // Allow pressing Enter to submit
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && inputText.trim() !== '') {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="App">
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
