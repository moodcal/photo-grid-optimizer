// Generate all possible layouts for the given photos and page size
export function generateLayouts(photos, pageSize) {
  if (!photos || photos.length === 0) return [];
  
  const layouts = [];
  
  // Generate basic horizontal stack layouts
  const hStackLayouts = generateHStackLayouts(photos, pageSize);
  layouts.push(...hStackLayouts);
  
  // Generate basic vertical stack layouts - Only generate these if they're not duplicates of hStack
  // i.e., only generate patterns not already covered by hStack
  const vStackLayouts = generateVStackLayouts(photos, pageSize);
  layouts.push(...vStackLayouts);
  
  // Generate mixed row layouts (uneven distribution)
  const mixedRowLayouts = generateMixedRowLayouts(photos, pageSize);
  layouts.push(...mixedRowLayouts);
  
  // Generate complex nested layouts
  const nestedLayouts = generateNestedLayouts(photos, pageSize);
  layouts.push(...nestedLayouts);
  
  // Generate advanced composite layouts
  const compositeLayouts = generateCompositeLayouts(photos, pageSize);
  layouts.push(...compositeLayouts);
  
  // Remove exact duplicates before scoring
  const uniqueLayouts = removeDuplicateLayouts(layouts, pageSize);
  
  // Score and sort layouts
  const scoredLayouts = scoreLayouts(uniqueLayouts, pageSize);
  
  return scoredLayouts;
}

// Generate horizontal stack layouts (photos placed side by side)
function generateHStackLayouts(photos, pageSize) {
  const layouts = [];
  
  // For every possible division of photos in a row
  for (let photosPerRow = 1; photosPerRow <= photos.length; photosPerRow++) {
    if (photos.length % photosPerRow === 0) {
      const rows = photos.length / photosPerRow;
      const layout = {
        type: 'hstack',
        rows: rows,
        photosPerRow: photosPerRow,
        photos: [...photos],
        cells: []
      };
      
      // Calculate cell dimensions
      const cellWidth = pageSize.width / photosPerRow;
      const cellHeight = pageSize.height / rows;
      
      // Distribute photos in cells
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < photosPerRow; j++) {
          const photoIndex = i * photosPerRow + j;
          layout.cells.push({
            photo: photos[photoIndex],
            x: j * cellWidth,
            y: i * cellHeight,
            width: cellWidth,
            height: cellHeight
          });
        }
      }
      
      layouts.push(layout);
    }
  }
  
  return layouts;
}

// Generate vertical stack layouts (photos stacked vertically)
function generateVStackLayouts(photos, pageSize) {
  const layouts = [];
  
  // We'll only generate unique vertical stacks that aren't duplicates of horizontal stacks
  // For 5 photos, we've already covered patterns like 5×1 and 1×5 in the horizontal stacks
  // So we'll skip those cases to avoid duplicates
  
  // For layouts that can't be expressed as simple horizontal stacks
  if (photos.length > 2) {
    // For example, create layouts with variable column heights
    for (let cols = 2; cols <= Math.min(photos.length - 1, 4); cols++) {
      if (cols === 1 || photos.length % cols === 0) {
        continue; // Skip layouts already covered by hstack
      }
      
      // Try to distribute photos among columns as evenly as possible
      const photosPerColumn = distributePhotos(photos.length, cols);
      
      if (photosPerColumn.length > 0) {
        const layout = {
          type: 'vstack',
          columns: cols,
          photosPerColumn: photosPerColumn,
          variableHeights: true,
          photos: [...photos],
          cells: []
        };
        
        // Calculate and assign cells
        let photoIndex = 0;
        let xPos = 0;
        const colWidth = pageSize.width / cols;
        
        for (let col = 0; col < cols; col++) {
          const photosInThisCol = photosPerColumn[col];
          const cellHeight = pageSize.height / photosInThisCol;
          
          for (let row = 0; row < photosInThisCol; row++) {
            layout.cells.push({
              photo: photos[photoIndex],
              x: xPos,
              y: row * cellHeight,
              width: colWidth,
              height: cellHeight
            });
            photoIndex++;
          }
          
          xPos += colWidth;
        }
        
        layouts.push(layout);
      }
    }
  }
  
  return layouts;
}

// Helper function to distribute photos among columns as evenly as possible
function distributePhotos(totalPhotos, columns) {
  // Skip even distributions already covered by hstack
  if (totalPhotos % columns === 0) {
    return []; // Already covered by hstack
  }
  
  const photosPerColumn = [];
  const baseCount = Math.floor(totalPhotos / columns);
  let remainder = totalPhotos % columns;
  
  for (let i = 0; i < columns; i++) {
    photosPerColumn.push(baseCount + (i < remainder ? 1 : 0));
  }
  
  return photosPerColumn;
}

// Generate layouts with mixed row distributions (for odd number of photos)
function generateMixedRowLayouts(photos, pageSize) {
  const layouts = [];
  
  if (photos.length === 5) {
    // Pattern 1: 2 + 3 (2 photos in first row, 3 in second)
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 3]));
    
    // Pattern 2: 3 + 2 (3 photos in first row, 2 in second)
    layouts.push(createMixedRowLayout(photos, pageSize, [3, 2]));
    
    // Pattern 3: 1 + 4 (1 photo in first row, 4 in second)
    layouts.push(createMixedRowLayout(photos, pageSize, [1, 4]));
    
    // Pattern 4: 4 + 1 (4 photos in first row, 1 in second)
    layouts.push(createMixedRowLayout(photos, pageSize, [4, 1]));
    
    // Pattern 5: 1 + 2 + 2 (3 rows with 1, 2, and 2 photos)
    layouts.push(createMixedRowLayout(photos, pageSize, [1, 2, 2]));
    
    // Pattern 6: 2 + 1 + 2 (3 rows with 2, 1, and 2 photos)
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 1, 2]));
    
    // Pattern 7: 2 + 2 + 1 (3 rows with 2, 2, and 1 photos)
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 2, 1]));
  } else if (photos.length === 7) {
    // For 7 photos, add patterns like 3+4, 4+3, 2+3+2, etc.
    layouts.push(createMixedRowLayout(photos, pageSize, [3, 4]));
    layouts.push(createMixedRowLayout(photos, pageSize, [4, 3]));
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 3, 2]));
  } else if (photos.length % 2 === 1) {
    // For any odd number, try the most balanced distributions
    // (middle-heavy and edge-heavy)
    const mid = Math.floor(photos.length / 2);
    layouts.push(createMixedRowLayout(photos, pageSize, [mid, mid + 1]));
    layouts.push(createMixedRowLayout(photos, pageSize, [mid + 1, mid]));
    
    if (photos.length >= 9) {
      // For larger collections, add 3-row distributions
      const third = Math.floor(photos.length / 3);
      const remainder = photos.length % 3;
      
      if (remainder === 0) {
        // Even distribution for multiples of 3
        layouts.push(createMixedRowLayout(photos, pageSize, [third, third, third]));
      } else if (remainder === 1) {
        // Add the extra photo to the middle row
        layouts.push(createMixedRowLayout(photos, pageSize, [third, third + 1, third]));
      } else { // remainder === 2
        // Distribute the extra photos to first and last rows
        layouts.push(createMixedRowLayout(photos, pageSize, [third + 1, third, third + 1]));
      }
    }
  }
  
  return layouts;
}

// Helper function to create a layout with mixed row distribution
function createMixedRowLayout(photos, pageSize, rowDistribution) {
  const totalRows = rowDistribution.length;
  const layout = {
    type: 'hstack',
    rows: totalRows,
    rowDistribution: rowDistribution,
    mixedRows: true,
    photos: [...photos],
    cells: []
  };
  
  // Calculate row heights (all rows have equal height)
  const rowHeight = pageSize.height / totalRows;
  
  let photoIndex = 0;
  
  // Create cells for each row based on its photo count
  for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
    const photosInThisRow = rowDistribution[rowIndex];
    const cellWidth = pageSize.width / photosInThisRow;
    
    for (let colIndex = 0; colIndex < photosInThisRow; colIndex++) {
      layout.cells.push({
        photo: photos[photoIndex],
        x: colIndex * cellWidth,
        y: rowIndex * rowHeight,
        width: cellWidth,
        height: rowHeight
      });
      
      photoIndex++;
    }
  }
  
  return layout;
}

// Generate more complex composite layouts - combinations of horizontal and vertical stacks
function generateCompositeLayouts(photos, pageSize) {
  const layouts = [];
  
  if (photos.length === 5) {
    // Example 1: Row with 2 photos on top, with bottom row having 1 photo and 2 stacked photos
    // [1][2]
    // [3][4]
    //   [5]
    const layout1 = {
      type: 'composite',
      name: 'mixed-stack-1',
      photos: [...photos],
      cells: []
    };
    
    // Top row - 2 photos side by side
    const topRowHeight = pageSize.height * 0.5;
    const topCellWidth = pageSize.width / 2;
    
    layout1.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: topCellWidth,
      height: topRowHeight
    });
    
    layout1.cells.push({
      photo: photos[1],
      x: topCellWidth,
      y: 0,
      width: topCellWidth,
      height: topRowHeight
    });
    
    // Bottom row - one large on left, two stacked on right
    const bottomRowHeight = pageSize.height * 0.5;
    
    // Left photo in bottom row
    layout1.cells.push({
      photo: photos[2],
      x: 0,
      y: topRowHeight,
      width: topCellWidth,
      height: bottomRowHeight
    });
    
    // Two stacked photos on right side of bottom row
    const stackedHeight = bottomRowHeight / 2;
    
    layout1.cells.push({
      photo: photos[3],
      x: topCellWidth,
      y: topRowHeight,
      width: topCellWidth,
      height: stackedHeight
    });
    
    layout1.cells.push({
      photo: photos[4],
      x: topCellWidth,
      y: topRowHeight + stackedHeight,
      width: topCellWidth,
      height: stackedHeight
    });
    
    layouts.push(layout1);
    
    // Example 2: Left column with 2 photos, right column with 3 photos
    // [1][3]
    // [2][4]
    //   [5]
    const layout2 = {
      type: 'composite',
      name: 'mixed-stack-2',
      photos: [...photos],
      cells: []
    };
    
    // Left column - 2 photos stacked
    const leftColumnWidth = pageSize.width * 0.5;
    const leftCellHeight = pageSize.height / 2;
    
    layout2.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: leftColumnWidth,
      height: leftCellHeight
    });
    
    layout2.cells.push({
      photo: photos[1],
      x: 0,
      y: leftCellHeight,
      width: leftColumnWidth,
      height: leftCellHeight
    });
    
    // Right column - 3 photos stacked
    const rightColumnWidth = pageSize.width * 0.5;
    const rightCellHeight = pageSize.height / 3;
    
    for (let i = 0; i < 3; i++) {
      layout2.cells.push({
        photo: photos[i + 2],
        x: leftColumnWidth,
        y: i * rightCellHeight,
        width: rightColumnWidth,
        height: rightCellHeight
      });
    }
    
    layouts.push(layout2);
    
    // Example 3: Top 1 photo, middle 3 photos, bottom 1 photo
    // [----1----]
    // [2][3][4]
    // [----5----]
    const layout3 = {
      type: 'composite',
      name: 'mixed-stack-3',
      photos: [...photos],
      cells: []
    };
    
    // Top full-width photo
    const fullRowHeight = pageSize.height * 0.3;
    
    layout3.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width,
      height: fullRowHeight
    });
    
    // Middle row - 3 photos
    const middleRowHeight = pageSize.height * 0.4;
    const middleCellWidth = pageSize.width / 3;
    
    for (let i = 0; i < 3; i++) {
      layout3.cells.push({
        photo: photos[i + 1],
        x: i * middleCellWidth,
        y: fullRowHeight,
        width: middleCellWidth,
        height: middleRowHeight
      });
    }
    
    // Bottom full-width photo
    layout3.cells.push({
      photo: photos[4],
      x: 0,
      y: fullRowHeight + middleRowHeight,
      width: pageSize.width,
      height: fullRowHeight
    });
    
    layouts.push(layout3);
  }
  
  return layouts;
}

// Generate more complex nested layouts
function generateNestedLayouts(photos, pageSize) {
  // Only generate nested layouts if we have enough photos
  if (photos.length < 3) return [];
  
  const layouts = [];
  
  // Layout 1: 2/3 + 1/3 split layout (large photo on left)
  if (photos.length >= 3) {
    // Create a layout with 2/3 of width for first photo, 1/3 for others stacked
    const layout = {
      type: 'nested',
      name: 'left-dominant',
      photos: [...photos],
      cells: []
    };
    
    const mainPhotoWidth = pageSize.width * (2/3);
    const sideColumnWidth = pageSize.width * (1/3);
    const mainPhotoHeight = pageSize.height;
    
    // Add main photo on the left
    layout.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: mainPhotoWidth,
      height: mainPhotoHeight
    });
    
    // Add remaining photos stacked on the right
    const sidePhotos = photos.slice(1);
    const sidePhotoHeight = pageSize.height / sidePhotos.length;
    
    sidePhotos.forEach((photo, index) => {
      layout.cells.push({
        photo: photo,
        x: mainPhotoWidth,
        y: index * sidePhotoHeight,
        width: sideColumnWidth,
        height: sidePhotoHeight
      });
    });
    
    layouts.push(layout);
  }
  
  // Layout 2: First row with one large photo, second row with remaining photos
  if (photos.length >= 3) {
    const layout = {
      type: 'nested',
      name: 'top-dominant',
      photos: [...photos],
      cells: []
    };
    
    // First row has one large photo
    layout.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width,
      height: pageSize.height / 2
    });
    
    // Second row has remaining photos
    const bottomPhotos = photos.slice(1);
    const bottomPhotoWidth = pageSize.width / bottomPhotos.length;
    
    bottomPhotos.forEach((photo, index) => {
      layout.cells.push({
        photo: photo,
        x: index * bottomPhotoWidth,
        y: pageSize.height / 2,
        width: bottomPhotoWidth,
        height: pageSize.height / 2
      });
    });
    
    layouts.push(layout);
  }
  
  // Layout 3: Right-dominant (1/3 + 2/3 split, large photo on right)
  if (photos.length >= 3) {
    const layout = {
      type: 'nested',
      name: 'right-dominant',
      photos: [...photos],
      cells: []
    };
    
    const sideColumnWidth = pageSize.width * (1/3);
    const mainPhotoWidth = pageSize.width * (2/3);
    
    // Add smaller photos stacked on the left
    const sidePhotos = photos.slice(0, -1);
    const sidePhotoHeight = pageSize.height / sidePhotos.length;
    
    sidePhotos.forEach((photo, index) => {
      layout.cells.push({
        photo: photo,
        x: 0,
        y: index * sidePhotoHeight,
        width: sideColumnWidth,
        height: sidePhotoHeight
      });
    });
    
    // Add main photo on the right
    layout.cells.push({
      photo: photos[photos.length - 1],
      x: sideColumnWidth,
      y: 0,
      width: mainPhotoWidth,
      height: pageSize.height
    });
    
    layouts.push(layout);
  }
  
  // Layout 4: Bottom-dominant (large photo at bottom)
  if (photos.length >= 3) {
    const layout = {
      type: 'nested',
      name: 'bottom-dominant',
      photos: [...photos],
      cells: []
    };
    
    // Top row has remaining photos
    const topPhotos = photos.slice(0, -1);
    const topPhotoWidth = pageSize.width / topPhotos.length;
    
    topPhotos.forEach((photo, index) => {
      layout.cells.push({
        photo: photo,
        x: index * topPhotoWidth,
        y: 0,
        width: topPhotoWidth,
        height: pageSize.height / 2
      });
    });
    
    // Bottom row has one large photo
    layout.cells.push({
      photo: photos[photos.length - 1],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width,
      height: pageSize.height / 2
    });
    
    layouts.push(layout);
  }
  
  // For 5 photos, add some specific patterns
  if (photos.length === 5) {
    // Layout 5: Center dominant (large center photo with 4 smaller photos in corners)
    const centerLayout = {
      type: 'nested',
      name: 'center-dominant',
      photos: [...photos],
      cells: []
    };
    
    const smallSize = pageSize.width / 3;
    const largeSize = smallSize * 2;
    const center = pageSize.width / 2 - largeSize / 2;
    
    // Top-left photo
    centerLayout.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: smallSize,
      height: smallSize
    });
    
    // Top-right photo
    centerLayout.cells.push({
      photo: photos[1],
      x: pageSize.width - smallSize,
      y: 0,
      width: smallSize,
      height: smallSize
    });
    
    // Center photo (large)
    centerLayout.cells.push({
      photo: photos[2],
      x: center,
      y: center,
      width: largeSize,
      height: largeSize
    });
    
    // Bottom-left photo
    centerLayout.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height - smallSize,
      width: smallSize,
      height: smallSize
    });
    
    // Bottom-right photo
    centerLayout.cells.push({
      photo: photos[4],
      x: pageSize.width - smallSize,
      y: pageSize.height - smallSize,
      width: smallSize,
      height: smallSize
    });
    
    layouts.push(centerLayout);
    
    // Layout 6: Split grid (2×2 grid in top-left plus one large photo filling the rest)
    const splitLayout = {
      type: 'nested',
      name: 'split-grid',
      photos: [...photos],
      cells: []
    };
    
    const gridSize = pageSize.width / 2;
    const smallGridSize = gridSize / 2;
    
    // Top-left 2×2 grid
    splitLayout.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: smallGridSize,
      height: smallGridSize
    });
    
    splitLayout.cells.push({
      photo: photos[1],
      x: smallGridSize,
      y: 0,
      width: smallGridSize,
      height: smallGridSize
    });
    
    splitLayout.cells.push({
      photo: photos[2],
      x: 0,
      y: smallGridSize,
      width: smallGridSize,
      height: smallGridSize
    });
    
    splitLayout.cells.push({
      photo: photos[3],
      x: smallGridSize,
      y: smallGridSize,
      width: smallGridSize,
      height: smallGridSize
    });
    
    // One large photo on the right and possibly bottom
    splitLayout.cells.push({
      photo: photos[4],
      x: gridSize,
      y: 0,
      width: gridSize,
      height: pageSize.height
    });
    
    layouts.push(splitLayout);
  }
  
  return layouts;
}

// Helper function to generate a unique layout signature for duplicate detection
function getLayoutSignature(layout, pageSize) {
  // We need to normalize the cell positions and sizes to make comparison
  // independent of page dimensions
  const normalizedCells = layout.cells.map(cell => {
    return {
      x: cell.x / pageSize.width,
      y: cell.y / pageSize.height,
      width: cell.width / pageSize.width,
      height: cell.height / pageSize.height
    };
  });
  
  // Sort cells by position for consistent comparison
  normalizedCells.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  
  // Create a string signature from the positions and dimensions
  return normalizedCells.map(cell => 
    `${cell.x.toFixed(6)}-${cell.y.toFixed(6)}-${cell.width.toFixed(6)}-${cell.height.toFixed(6)}`
  ).join('|');
}

// Remove duplicate layouts based on cell positions regardless of layout type
function removeDuplicateLayouts(layouts, pageSize) {
  const uniqueLayouts = [];
  const signatures = new Set();
  
  for (const layout of layouts) {
    const signature = getLayoutSignature(layout, pageSize);
    
    if (!signatures.has(signature)) {
      signatures.add(signature);
      uniqueLayouts.push(layout);
    }
  }
  
  return uniqueLayouts;
}

// Calculate the score for each layout
function scoreLayouts(layouts, pageSize) {
  return layouts.map(layout => {
    // Calculate space utilization (percentage of page used)
    const utilization = calculateUtilization(layout, pageSize);
    
    // Calculate cropping percentage for each photo
    const croppingRate = calculateCroppingRate(layout);
    
    // Calculate balance of photo sizes
    const sizeBalance = calculateSizeBalance(layout);
    
    // Calculate the final score
    const score = (
      utilization * 0.5 +  // 50% weight to space utilization
      (1 - croppingRate) * 0.3 +  // 30% weight to minimizing cropping
      sizeBalance * 0.2  // 20% weight to size balance
    );
    
    return {
      ...layout,
      score,
      metrics: {
        utilization,
        croppingRate,
        sizeBalance
      }
    };
  }).sort((a, b) => b.score - a.score); // Sort by score in descending order
}

function calculateUtilization(layout, pageSize) {
  // Calculate what percentage of the page is used by photos
  const totalPageArea = pageSize.width * pageSize.height;
  const totalUsedArea = layout.cells.reduce((sum, cell) => sum + (cell.width * cell.height), 0);
  return Math.min(1, totalUsedArea / totalPageArea);
}

function calculateCroppingRate(layout) {
  // Calculate average cropping percentage across all photos
  let totalCroppingRate = 0;
  
  layout.cells.forEach(cell => {
    const photo = cell.photo;
    const originalAspectRatio = photo.width / photo.height;
    const cellAspectRatio = cell.width / cell.height;
    
    // Calculate how much of the photo needs to be cropped to fit the cell
    const aspectRatioDifference = Math.abs(originalAspectRatio - cellAspectRatio);
    const croppingRate = aspectRatioDifference / Math.max(originalAspectRatio, cellAspectRatio);
    
    totalCroppingRate += croppingRate;
  });
  
  return totalCroppingRate / layout.cells.length;
}

function calculateSizeBalance(layout) {
  // Calculate how evenly distributed the visible areas of photos are
  const areas = layout.cells.map(cell => cell.width * cell.height);
  const avgArea = areas.reduce((sum, area) => sum + area, 0) / areas.length;
  
  // Calculate variance of areas
  const variance = areas.reduce((sum, area) => sum + Math.pow(area - avgArea, 2), 0) / areas.length;
  const maxPossibleVariance = Math.pow(avgArea, 2) * (areas.length - 1);
  
  // Convert to a 0-1 score where 1 means perfectly balanced
  return Math.max(0, 1 - (variance / maxPossibleVariance));
} 