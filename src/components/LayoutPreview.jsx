import React from 'react';
import './LayoutPreview.css';

function LayoutPreview({ layout, pageSize }) {
  const scale = 0.25; // Scale down the preview for display
  
  return (
    <div 
      className="layout-preview"
      style={{
        width: pageSize.width * scale,
        height: pageSize.height * scale,
        position: 'relative'
      }}
    >
      {layout.cells.map((cell, index) => (
        <div 
          key={index}
          className="photo-cell"
          style={{
            position: 'absolute',
            left: cell.x * scale,
            top: cell.y * scale,
            width: cell.width * scale,
            height: cell.height * scale,
            overflow: 'hidden',
            border: '1px solid #ccc'
          }}
        >
          {cell.photo && (
            <img 
              src={cell.photo.src}
              alt={`Photo ${index}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default LayoutPreview; 