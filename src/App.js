import React, { useState } from 'react';
import StrategyForm from './components/StrategyForm';
import OutputDisplay from './components/OutputDisplay';
import './App.css';

function App() {
  const [strategy, setStrategy] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [output, setOutput] = useState(null);

  const handleSubmit = async (inputStrategy) => {
    setStrategy(inputStrategy);
    setSubmitted(true);
    try {
      const res = await fetch('http://localhost:5000/analyze-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: inputStrategy })
      });
      const data = await res.json();
      setOutput(data);
    } catch (err) {
      console.error('Error fetching output:', err);
    }
  };

  return (
    <div className={`app-container ${submitted ? 'submitted' : ''}`}>
      <StrategyForm onSubmit={handleSubmit} />
      {submitted && <OutputDisplay output={output} />}
    </div>
  );
}

export default App;
