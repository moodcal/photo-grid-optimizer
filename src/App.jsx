import React, { useState } from 'react';
import PhotoUploader from './components/PhotoUploader';
import LayoutGrid from './components/LayoutGrid';
import { generateLayouts } from './utils/layoutGenerator';
import './App.css';

function App() {
  const [photos, setPhotos] = useState([]);
  const [pageSize, setPageSize] = useState({ width: 800, height: 1000 });
  const [layouts, setLayouts] = useState([]);

  const handlePhotosUploaded = (uploadedPhotos) => {
    setPhotos(uploadedPhotos);
    // Generate layouts and update state
    const sortedPhotos = [...uploadedPhotos].sort((a, b) => {
      const aRatio = a.width / a.height;
      const bRatio = b.width / b.height;
      return bRatio - aRatio; // 横向照片优先
    });
    const generatedLayouts = generateLayouts(sortedPhotos, pageSize);
    setLayouts(generatedLayouts);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    // Regenerate layouts when page size changes if photos exist
    if (photos.length > 0) {
      const sortedPhotos = [...photos].sort((a, b) => {
        const aRatio = a.width / a.height;
        const bRatio = b.width / b.height;
        return bRatio - aRatio; // 横向照片优先
      });
      const generatedLayouts = generateLayouts(sortedPhotos, newSize);
      setLayouts(generatedLayouts);
    }
  };

  return (
    <div className="App">
      <main>
        <div className="config-section">
          <div className="page-size-config">
            <h2>Page Size</h2>
            <div className="size-inputs">
              <div>
                <label>Width (px):</label>
                <input 
                  type="number" 
                  value={pageSize.width} 
                  onChange={(e) => handlePageSizeChange({...pageSize, width: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label>Height (px):</label>
                <input 
                  type="number" 
                  value={pageSize.height} 
                  onChange={(e) => handlePageSizeChange({...pageSize, height: parseInt(e.target.value)})}
                />
              </div>
            </div>
          </div>
          <PhotoUploader 
            onPhotosUploaded={handlePhotosUploaded}
            existingPhotos={photos}
          />
        </div>
        
        {layouts.length > 0 && (
          <LayoutGrid layouts={layouts} pageSize={pageSize} />
        )}
      </main>
    </div>
  );
}

export default App; 