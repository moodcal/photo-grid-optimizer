import React from 'react';
import './ScoreDisplay.css';

function ScoreDisplay({ layout }) {
  if (!layout) {
    return <div className="score-display">No layout data available</div>;
  }

  // 如果是重复布局，显示是哪个布局的重复
  if (layout.duplicateOf !== null) {
    return (
      <div className="score-display duplicate">
        <div className="overall-score">
          Duplicate of #{layout.duplicateOf}
        </div>
      </div>
    );
  }

  const { score = 0, metrics = {}, type = 'Unknown', name = '' } = layout;
  const { 
    utilization = 0, 
    croppingRate = 0, 
    sizeBalance = 0 
  } = metrics || {};
  
  const croppingPercentage = Math.round((croppingRate || 0) * 100);
  const isHighCropping = croppingPercentage > 30;
  
  // 获取布局结构的人类可读描述
  const getLayoutStructure = () => {
    if (!type || !name) return "Unknown layout structure";
    
    if (type === 'grid') {
      const match = name.match(/grid-(\d+)x(\d+)/);
      if (match) {
        return `${match[1]}×${match[2]} Grid`;
      }
    } else if (type === 'split') {
      if (name.startsWith('hsplit')) {
        const parts = name.split('-');
        if (parts.length === 3) {
          return `Horizontal ${parts[1]}/${parts[2]} Split`;
        }
      } else if (name.startsWith('vsplit')) {
        const parts = name.split('-');
        if (parts.length === 3) {
          return `Vertical ${parts[1]}/${parts[2]} Split`;
        }
      }
    } else if (type === 'composite') {
      if (name === 'left-one-right-two') {
        return 'Left 1, Right 2';
      } else if (name === 'left-two-right-one') {
        return 'Left 2, Right 1';
      } else if (name === 'three-three-one') {
        return '3-3-1 Layout';
      } else if (name === 'two-three-two') {
        return '2-3-2 Layout';
      }
    } else if (type === 'optimized') {
      const baseName = name.replace('-optimized', '');
      return `Optimized: ${getLayoutName(baseName)}`;
    }
    
    return name || type;
  };
  
  // 获取布局名称的函数
  const getLayoutName = (name) => {
    if (!name) return "Unknown";
    
    if (name.startsWith('grid-')) {
      const match = name.match(/grid-(\d+)x(\d+)/);
      if (match) {
        return `${match[1]}×${match[2]} Grid`;
      }
    } else if (name.startsWith('hsplit-')) {
      const parts = name.split('-');
      if (parts.length === 3) {
        return `Horizontal ${parts[1]}/${parts[2]} Split`;
      }
    } else if (name.startsWith('vsplit-')) {
      const parts = name.split('-');
      if (parts.length === 3) {
        return `Vertical ${parts[1]}/${parts[2]} Split`;
      }
    } else if (name === 'left-one-right-two') {
      return 'Left 1, Right 2';
    } else if (name === 'left-two-right-one') {
      return 'Left 2, Right 1';
    } else if (name === 'three-three-one') {
      return '3-3-1 Layout';
    } else if (name === 'two-three-two') {
      return '2-3-2 Layout';
    }
    
    return name;
  };
  
  return (
    <div className="score-display">
      <div className="layout-type">
        {getLayoutStructure()}
      </div>
      <div className="overall-score">
        Score: {Math.round((score || 0) * 100)}%
      </div>
      <div className="metrics">
        <div className="metric">
          <span>Utilization:</span> {Math.round((utilization || 0) * 100)}%
        </div>
        <div className={`metric ${isHighCropping ? 'high-cropping' : ''}`}>
          <span>Cropping:</span> {croppingPercentage}%
        </div>
        <div className="metric">
          <span>Balance:</span> {Math.round((sizeBalance || 0) * 100)}%
        </div>
      </div>
    </div>
  );
}

export default ScoreDisplay; 