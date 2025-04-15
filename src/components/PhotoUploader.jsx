import React, { useState, useRef, useEffect } from 'react';
import './PhotoUploader.css';

function PhotoUploader({ onPhotosUploaded, existingPhotos = [] }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [photos, setPhotos] = useState(existingPhotos);
  const fileInputRef = useRef(null);

  // When existingPhotos prop changes, update our internal state
  useEffect(() => {
    setPhotos(existingPhotos);
  }, [existingPhotos]);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    
    const photoPromises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              id: Date.now() + Math.random().toString(36).substr(2, 9), // Generate unique ID
              file: file,
              src: e.target.result,
              width: img.width,
              height: img.height,
              aspectRatio: img.width / img.height,
              name: file.name
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    const loadedPhotos = await Promise.all(photoPromises);
    const updatedPhotos = [...photos, ...loadedPhotos];
    setPhotos(updatedPhotos);
    onPhotosUploaded(updatedPhotos);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const removePhoto = (photoIndex) => {
    const updatedPhotos = photos.filter((_, index) => index !== photoIndex);
    const updatedFiles = selectedFiles.filter((_, index) => index !== photoIndex);
    
    setPhotos(updatedPhotos);
    setSelectedFiles(updatedFiles);
    onPhotosUploaded(updatedPhotos);
  };

  return (
    <div className="photo-uploader">
      <h2>Upload Photos</h2>
      <div className="upload-area" onClick={handleUploadClick}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <div className="upload-placeholder">
          <span>Click to add more photos</span>
          <span className="file-count">
            {photos.length > 0 ? `${photos.length} files selected` : 'No files selected'}
          </span>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="selected-photos">
          <h3>Selected Photos</h3>
          <div className="photo-thumbnails">
            {photos.map((photo, index) => (
              <div key={photo.id || index} className="photo-thumbnail">
                <img src={photo.src} alt={`Thumbnail ${index}`} />
                <div className="photo-info">
                  <span>{photo.name || `Photo ${index + 1}`}</span>
                  <span>{photo.width}×{photo.height}px</span>
                </div>
                <button 
                  className="remove-photo" 
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(index);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoUploader; 