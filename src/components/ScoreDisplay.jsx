import React from 'react';
import './ScoreDisplay.css';

function ScoreDisplay({ layout }) {
  const { score, metrics } = layout;
  
  return (
    <div className="score-display">
      <div className="overall-score">
        Score: {Math.round(score * 100)}%
      </div>
      <div className="metrics">
        <div className="metric">
          <span>Utilization:</span> {Math.round(metrics.utilization * 100)}%
        </div>
        <div className="metric">
          <span>Cropping:</span> {Math.round(metrics.croppingRate * 100)}%
        </div>
        <div className="metric">
          <span>Balance:</span> {Math.round(metrics.sizeBalance * 100)}%
        </div>
      </div>
    </div>
  );
}

export default ScoreDisplay; 