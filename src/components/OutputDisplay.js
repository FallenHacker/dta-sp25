import React from 'react';

const OutputDisplay = ({ output }) => {
  if (!output) return <div>Loading analysis...</div>;

  return (
    <div className="output-display">
      {output.text && <p>{output.text}</p>}
      {output.images && output.images.map((imgUrl, idx) => (
        <img key={idx} src={imgUrl} alt={`Output ${idx}`} />
      ))}
    </div>
  );
};

export default OutputDisplay;
