import React, { useState } from 'react';

const StrategyForm = ({ onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
    }
  };

  return (
    <form className="strategy-form" onSubmit={handleSubmit}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your trading strategy..."
        rows={5}
      />
      <button type="submit">Analyze Strategy</button>
    </form>
  );
};

export default StrategyForm;