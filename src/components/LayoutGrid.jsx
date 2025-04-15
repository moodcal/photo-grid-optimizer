import React, { useState, useEffect } from 'react';
import LayoutPreview from './LayoutPreview';
import ScoreDisplay from './ScoreDisplay';
import './LayoutGrid.css';

function LayoutGrid({ layouts, pageSize }) {
  const [uniqueLayouts, setUniqueLayouts] = useState([]);
  
  useEffect(() => {
    // Find and mark duplicate layouts
    const layoutMap = new Map();
    const processed = layouts.map((layout, index) => {
      // Create a unique identifier based on layout properties
      const layoutKey = generateLayoutKey(layout);
      
      if (layoutMap.has(layoutKey)) {
        // If we've seen this layout before, mark it as duplicate
        return { ...layout, isDuplicate: true, duplicateOf: layoutMap.get(layoutKey), originalIndex: index };
      } else {
        // Otherwise, record this as the first occurrence
        layoutMap.set(layoutKey, index);
        return { ...layout, isDuplicate: false, originalIndex: index };
      }
    });
    
    setUniqueLayouts(processed);
  }, [layouts]);
  
  // Generate a unique key for a layout based on its configuration
  const generateLayoutKey = (layout) => {
    if (layout.type === 'hstack') {
      if (layout.mixedRows) {
        return `hstack_mixed_${layout.rowDistribution.join('_')}`;
      }
      return `hstack_${layout.rows}_${layout.photosPerRow}`;
    } else if (layout.type === 'vstack') {
      if (layout.variableHeights) {
        return `vstack_variable_${layout.photosPerColumn.join('_')}`;
      }
      return `vstack_${layout.columns}_${layout.photosPerColumn}`;
    } else if (layout.type === 'nested' || layout.type === 'composite') {
      // For nested layouts, create a key based on cell positions
      const cellsKey = layout.cells
        .map(cell => `${cell.x / pageSize.width}_${cell.y / pageSize.height}_${cell.width / pageSize.width}_${cell.height / pageSize.height}`)
        .sort()
        .join('|');
      return `${layout.type}_${layout.name || cellsKey}`;
    }
    return 'unknown';
  };
  
  // Generate a visual representation of the layout structure
  const generateLayoutStructure = (layout) => {
    if (layout.type === 'hstack') {
      // For regular grid layouts
      if (!layout.mixedRows) {
        // Create a visual grid representation for horizontal stack
        const rows = layout.rows;
        const cols = layout.photosPerRow;
        return (
          <div className="layout-structure">
            <div className="structure-title">Structure:</div>
            <div className="structure-grid" style={{gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)`}}>
              {Array.from({length: rows * cols}).map((_, i) => (
                <div key={i} className="grid-cell">{i + 1}</div>
              ))}
            </div>
            <div className="structure-desc">
              {rows} row{rows !== 1 ? 's' : ''} × {cols} photo{cols !== 1 ? 's' : ''} per row
            </div>
          </div>
        );
      } else {
        // Mixed row distribution (uneven rows)
        const rows = layout.rows;
        const rowDistribution = layout.rowDistribution;
        
        return (
          <div className="layout-structure">
            <div className="structure-title">Mixed Row Structure:</div>
            <div className="mixed-structure-grid">
              {rowDistribution.map((photosInRow, rowIndex) => (
                <div key={rowIndex} className="mixed-row" style={{height: `${100 / rows}%`}}>
                  {Array.from({length: photosInRow}).map((_, colIndex) => {
                    // Calculate the photo number
                    let photoNum = 0;
                    for (let r = 0; r < rowIndex; r++) {
                      photoNum += rowDistribution[r];
                    }
                    photoNum += colIndex + 1;
                    
                    return (
                      <div 
                        key={colIndex} 
                        className="grid-cell" 
                        style={{width: `${100 / photosInRow}%`}}
                      >
                        {photoNum}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="structure-desc">
              {rowDistribution.join(' + ')} photos per row
            </div>
          </div>
        );
      }
    } else if (layout.type === 'vstack') {
      if (!layout.variableHeights) {
        // Regular vertical stack with equal heights
        const rows = layout.photosPerColumn;
        const cols = layout.columns;
        return (
          <div className="layout-structure">
            <div className="structure-title">Structure:</div>
            <div className="structure-grid" style={{gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)`}}>
              {Array.from({length: rows * cols}).map((_, i) => {
                // Calculate the correct photo number based on column-first order
                const col = Math.floor(i / rows);
                const row = i % rows;
                const photoNum = col * rows + row + 1;
                return <div key={i} className="grid-cell">{photoNum}</div>;
              })}
            </div>
            <div className="structure-desc">
              {cols} column{cols !== 1 ? 's' : ''} × {rows} photo{rows !== 1 ? 's' : ''} per column
            </div>
          </div>
        );
      } else {
        // Variable height columns
        const cols = layout.columns;
        const colDistribution = layout.photosPerColumn;
        
        return (
          <div className="layout-structure">
            <div className="structure-title">Variable Column Structure:</div>
            <div className="variable-column-grid">
              {colDistribution.map((photosInCol, colIndex) => (
                <div key={colIndex} className="var-column" style={{width: `${100 / cols}%`}}>
                  {Array.from({length: photosInCol}).map((_, rowIndex) => {
                    // Calculate the photo number
                    let photoNum = 0;
                    for (let c = 0; c < colIndex; c++) {
                      photoNum += colDistribution[c];
                    }
                    photoNum += rowIndex + 1;
                    
                    return (
                      <div 
                        key={rowIndex} 
                        className="grid-cell" 
                        style={{height: `${100 / photosInCol}%`}}
                      >
                        {photoNum}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="structure-desc">
              {colDistribution.join(' + ')} photos per column
            </div>
          </div>
        );
      }
    } else if (layout.type === 'nested' || layout.type === 'composite') {
      // For nested layouts, show a more detailed visualization
      // Clone and sort cells by position for consistent display
      const sortedCells = [...layout.cells].sort((a, b) => {
        // Sort by y first (top to bottom), then by x (left to right)
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });
      
      // Find the structure type
      let structureDesc = "Custom nested layout";
      
      if (layout.name) {
        // Use the named layout if available
        switch (layout.name) {
          case 'left-dominant':
            structureDesc = "Left dominant: 1 large photo + " + (sortedCells.length - 1) + " stacked on right";
            break;
          case 'right-dominant':
            structureDesc = "Right dominant: " + (sortedCells.length - 1) + " stacked on left + 1 large photo";
            break;
          case 'top-dominant':
            structureDesc = "Top dominant: 1 large photo above + " + (sortedCells.length - 1) + " in row below";
            break;
          case 'bottom-dominant':
            structureDesc = "Bottom dominant: " + (sortedCells.length - 1) + " in row above + 1 large photo below";
            break;
          case 'center-dominant':
            structureDesc = "Center dominant: Large center photo with photos in corners";
            break;
          case 'split-grid':
            structureDesc = "Split grid: 2×2 small grid + 1 large photo";
            break;
          case 'mixed-stack-1':
            structureDesc = "2 photos on top, 1 below with 2 stacked on right";
            break;
          case 'mixed-stack-2':
            structureDesc = "2 photos on left, 3 stacked on right";
            break;
          case 'mixed-stack-3':
            structureDesc = "Full width photo top & bottom, 3 in middle";
            break;
          default:
            structureDesc = layout.name;
        }
      } else if (sortedCells.length > 1) {
        const firstCell = sortedCells[0];
        if (firstCell.width > pageSize.width / 2 && firstCell.height === pageSize.height) {
          structureDesc = "1 large photo on left + " + (sortedCells.length - 1) + " stacked on right";
        } else if (firstCell.width === pageSize.width && firstCell.height > pageSize.height / 2) {
          structureDesc = "1 large photo on top + " + (sortedCells.length - 1) + " in row below";
        }
      }
      
      return (
        <div className="layout-structure nested-structure">
          <div className="structure-title">Structure:</div>
          <div className="nested-grid">
            {sortedCells.map((cell, i) => {
              const cellStyle = {
                left: `${(cell.x / pageSize.width) * 100}%`,
                top: `${(cell.y / pageSize.height) * 100}%`,
                width: `${(cell.width / pageSize.width) * 100}%`,
                height: `${(cell.height / pageSize.height) * 100}%`,
              };
              return (
                <div key={i} className="nested-cell" style={cellStyle}>
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div className="structure-desc">{structureDesc}</div>
        </div>
      );
    }
    
    return <div className="layout-structure">Unknown layout structure</div>;
  };

  return (
    <div className="layout-grid">
      <h2>Generated Layouts ({uniqueLayouts.filter(l => !l.isDuplicate).length} unique of {layouts.length} total)</h2>
      <div className="layouts-container">
        {uniqueLayouts.map((layout) => (
          <div 
            key={layout.originalIndex} 
            className={`layout-item ${layout.isDuplicate ? 'duplicate-layout' : ''}`}
          >
            <div className="layout-header">
              <div className="layout-number">#{layout.originalIndex + 1}</div>
              {layout.isDuplicate && (
                <div className="duplicate-badge">
                  Duplicate of #{layout.duplicateOf + 1}
                </div>
              )}
            </div>
            <LayoutPreview layout={layout} pageSize={pageSize} />
            <div className="layout-info">
              <div className="layout-type">
                {layout.type === 'hstack' && (layout.mixedRows ? 'Mixed Row Layout' : 'Horizontal Stack Layout')}
                {layout.type === 'vstack' && (layout.variableHeights ? 'Variable Height Columns' : 'Vertical Stack Layout')}
                {layout.type === 'nested' && 'Nested Layout'}
                {layout.type === 'composite' && 'Composite Layout'}
              </div>
              {generateLayoutStructure(layout)}
            </div>
            <ScoreDisplay layout={layout} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LayoutGrid; 