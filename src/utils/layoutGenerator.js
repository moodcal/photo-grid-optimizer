// Generate all possible layouts for the given photos and page size
export function generateLayouts(photos, pageSize) {
  if (!photos || photos.length === 0) return [];
  
  // Sort photos by aspect ratio to optimize placement
  const sortedPhotos = [...photos].sort((a, b) => {
    // Sort by orientation (landscape vs portrait)
    const aRatio = a.width / a.height;
    const bRatio = b.width / b.height;
    return bRatio - aRatio; // Descending: landscape (w>h) photos first, portrait (h>w) last
  });
  
  const layouts = [];
  
  // Generate basic horizontal stack layouts
  const hStackLayouts = generateHStackLayouts(sortedPhotos, pageSize);
  layouts.push(...hStackLayouts);
  
  // Generate basic vertical stack layouts - Only generate these if they're not duplicates of hStack
  // i.e., only generate patterns not already covered by hStack
  const vStackLayouts = generateVStackLayouts(sortedPhotos, pageSize);
  layouts.push(...vStackLayouts);
  
  // Generate mixed row layouts (uneven distribution)
  const mixedRowLayouts = generateMixedRowLayouts(sortedPhotos, pageSize);
  layouts.push(...mixedRowLayouts);
  
  // Generate complex nested layouts
  const nestedLayouts = generateNestedLayouts(sortedPhotos, pageSize);
  layouts.push(...nestedLayouts);
  
  // Generate advanced composite layouts
  const compositeLayouts = generateCompositeLayouts(sortedPhotos, pageSize);
  layouts.push(...compositeLayouts);
  
  // Generate complex layouts for 7-9 photos
  const complexLayouts = generateComplexLayouts(sortedPhotos, pageSize);
  layouts.push(...complexLayouts);
  
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
      
      // Create multiple layouts with different photo assignments
      const normalLayout = createHStackLayout(photos, pageSize, rows, photosPerRow, false);
      layouts.push(normalLayout);
      
      // For layouts where photosPerRow and rows are different, try alternative arrangements
      if (photosPerRow !== rows && photos.length > 2) {
        const optimizedLayout = createHStackLayout(photos, pageSize, rows, photosPerRow, true);
        layouts.push(optimizedLayout);
      }
    }
  }
  
  return layouts;
}

// Helper function to create a horizontal stack layout with optimized photo assignment
function createHStackLayout(photos, pageSize, rows, photosPerRow, optimizeOrientation) {
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
  const cellAspectRatio = cellWidth / cellHeight;
  
  if (optimizeOrientation) {
    // Clone the photos to avoid mutating the original array
    const remainingPhotos = [...photos];
    
    // Create cells for all positions in the grid
    const cells = [];
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < photosPerRow; j++) {
        cells.push({
          x: j * cellWidth,
          y: i * cellHeight,
          width: cellWidth,
          height: cellHeight,
          aspectRatio: cellWidth / cellHeight
        });
      }
    }
    
    // Sort cells by aspect ratio (width/height)
    cells.sort((a, b) => b.aspectRatio - a.aspectRatio);
    
    // Assign photos to cells to minimize aspect ratio mismatch
    cells.forEach(cell => {
      // Find the best matching photo for this cell
      const bestPhotoIndex = findBestMatchingPhotoIndex(remainingPhotos, cell.aspectRatio);
      
      // Assign the photo to the cell
      cell.photo = remainingPhotos[bestPhotoIndex];
      
      // Remove the assigned photo from the pool
      remainingPhotos.splice(bestPhotoIndex, 1);
      
      // Add the cell to the layout
      layout.cells.push(cell);
    });
    
    // Sort cells by position for consistent display
    layout.cells.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  } else {
    // Standard layout without orientation optimization
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
  }
  
  return layout;
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
        // Create regular layout
        layouts.push(createVStackLayout(photos, pageSize, cols, photosPerColumn, false));
        
        // Create orientation-optimized layout
        layouts.push(createVStackLayout(photos, pageSize, cols, photosPerColumn, true));
      }
    }
  }
  
  return layouts;
}

// Helper function to create a vertical stack layout
function createVStackLayout(photos, pageSize, cols, photosPerColumn, optimizeOrientation) {
  const layout = {
    type: 'vstack',
    columns: cols,
    photosPerColumn: photosPerColumn,
    variableHeights: true,
    photos: [...photos],
    cells: []
  };
  
  if (optimizeOrientation) {
    // Clone photos to avoid mutating the original array
    const remainingPhotos = [...photos];
    
    // Create all cells first
    const cells = [];
    let xPos = 0;
    
    for (let col = 0; col < cols; col++) {
      const photosInThisCol = photosPerColumn[col];
      const colWidth = pageSize.width / cols;
      
      for (let row = 0; row < photosInThisCol; row++) {
        const cellHeight = pageSize.height / photosInThisCol;
        
        cells.push({
          x: xPos,
          y: row * cellHeight,
          width: colWidth,
          height: cellHeight,
          aspectRatio: colWidth / cellHeight
        });
      }
      
      xPos += pageSize.width / cols;
    }
    
    // Sort cells by aspect ratio
    cells.sort((a, b) => b.aspectRatio - a.aspectRatio);
    
    // Assign photos to cells to minimize aspect ratio mismatch
    cells.forEach(cell => {
      // Find the best matching photo for this cell
      const bestPhotoIndex = findBestMatchingPhotoIndex(remainingPhotos, cell.aspectRatio);
      
      // Assign the photo to the cell
      cell.photo = remainingPhotos[bestPhotoIndex];
      
      // Remove the assigned photo from the pool
      remainingPhotos.splice(bestPhotoIndex, 1);
      
      // Add the cell to the layout
      layout.cells.push(cell);
    });
    
    // Sort cells by position for consistent display
    layout.cells.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x;
      return a.y - b.y;
    });
  } else {
    // Standard layout without orientation optimization
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
  }
  
  return layout;
}

// Helper function to find the best matching photo based on aspect ratio
function findBestMatchingPhotoIndex(photos, targetAspectRatio) {
  let bestMatchIndex = 0;
  let minDifference = Infinity;
  
  photos.forEach((photo, index) => {
    const photoAspectRatio = photo.width / photo.height;
    const difference = Math.abs(photoAspectRatio - targetAspectRatio);
    
    if (difference < minDifference) {
      minDifference = difference;
      bestMatchIndex = index;
    }
  });
  
  return bestMatchIndex;
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
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 3], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 3], true));
    
    // Pattern 2: 3 + 2 (3 photos in first row, 2 in second)
    layouts.push(createMixedRowLayout(photos, pageSize, [3, 2], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [3, 2], true));
    
    // Pattern 3: 1 + 4 (1 photo in first row, 4 in second)
    layouts.push(createMixedRowLayout(photos, pageSize, [1, 4], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [1, 4], true));
    
    // Pattern 4: 4 + 1 (4 photos in first row, 1 in second)
    layouts.push(createMixedRowLayout(photos, pageSize, [4, 1], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [4, 1], true));
    
    // Pattern 5: 1 + 2 + 2 (3 rows with 1, 2, and 2 photos)
    layouts.push(createMixedRowLayout(photos, pageSize, [1, 2, 2], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [1, 2, 2], true));
    
    // Pattern 6: 2 + 1 + 2 (3 rows with 2, 1, and 2 photos)
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 1, 2], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 1, 2], true));
    
    // Pattern 7: 2 + 2 + 1 (3 rows with 2, 2, and 1 photos)
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 2, 1], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 2, 1], true));
  } else if (photos.length === 7) {
    // For 7 photos, add patterns like 3+4, 4+3, 2+3+2, etc.
    layouts.push(createMixedRowLayout(photos, pageSize, [3, 4], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [3, 4], true));
    layouts.push(createMixedRowLayout(photos, pageSize, [4, 3], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [4, 3], true));
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 3, 2], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [2, 3, 2], true));
  } else if (photos.length % 2 === 1) {
    // For any odd number, try the most balanced distributions
    // (middle-heavy and edge-heavy)
    const mid = Math.floor(photos.length / 2);
    layouts.push(createMixedRowLayout(photos, pageSize, [mid, mid + 1], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [mid, mid + 1], true));
    layouts.push(createMixedRowLayout(photos, pageSize, [mid + 1, mid], false));
    layouts.push(createMixedRowLayout(photos, pageSize, [mid + 1, mid], true));
    
    if (photos.length >= 9) {
      // For larger collections, add 3-row distributions
      const third = Math.floor(photos.length / 3);
      const remainder = photos.length % 3;
      
      if (remainder === 0) {
        // Even distribution for multiples of 3
        layouts.push(createMixedRowLayout(photos, pageSize, [third, third, third], false));
        layouts.push(createMixedRowLayout(photos, pageSize, [third, third, third], true));
      } else if (remainder === 1) {
        // Add the extra photo to the middle row
        layouts.push(createMixedRowLayout(photos, pageSize, [third, third + 1, third], false));
        layouts.push(createMixedRowLayout(photos, pageSize, [third, third + 1, third], true));
      } else { // remainder === 2
        // Distribute the extra photos to first and last rows
        layouts.push(createMixedRowLayout(photos, pageSize, [third + 1, third, third + 1], false));
        layouts.push(createMixedRowLayout(photos, pageSize, [third + 1, third, third + 1], true));
      }
    }
  }
  
  return layouts;
}

// Helper function to create a layout with mixed row distribution
function createMixedRowLayout(photos, pageSize, rowDistribution, optimizeOrientation) {
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
  
  if (optimizeOrientation) {
    // Create all cells first
    const cells = [];
    let y = 0;
    
    for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
      const photosInThisRow = rowDistribution[rowIndex];
      const cellWidth = pageSize.width / photosInThisRow;
      
      for (let colIndex = 0; colIndex < photosInThisRow; colIndex++) {
        cells.push({
          x: colIndex * cellWidth,
          y: y,
          width: cellWidth,
          height: rowHeight,
          aspectRatio: cellWidth / rowHeight
        });
      }
      
      y += rowHeight;
    }
    
    // Sort cells by aspect ratio
    cells.sort((a, b) => b.aspectRatio - a.aspectRatio);
    
    // Clone photos to avoid mutating the original array
    const remainingPhotos = [...photos];
    
    // Assign photos to cells to minimize aspect ratio mismatch
    cells.forEach(cell => {
      // Find the best matching photo for this cell
      const bestPhotoIndex = findBestMatchingPhotoIndex(remainingPhotos, cell.aspectRatio);
      
      // Assign the photo to the cell
      cell.photo = remainingPhotos[bestPhotoIndex];
      
      // Remove the assigned photo from the pool
      remainingPhotos.splice(bestPhotoIndex, 1);
      
      // Add the cell to the layout
      layout.cells.push(cell);
    });
    
    // Sort cells by position for consistent display
    layout.cells.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  } else {
    // Standard layout without orientation optimization
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
  } else if (photos.length === 6) {
    // 6张照片的复合布局
    
    // 布局1: 两行, 每行3张均匀分布
    const layout1 = {
      type: 'composite',
      name: 'six-grid-3x2',
      photos: [...photos],
      cells: []
    };
    
    const rowHeight = pageSize.height / 2;
    const cellWidth = pageSize.width / 3;
    
    // 创建6个单元格
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        layout1.cells.push({
          photo: photos[row * 3 + col],
          x: col * cellWidth,
          y: row * rowHeight,
          width: cellWidth,
          height: rowHeight
        });
      }
    }
    
    layouts.push(layout1);
    
    // 布局2: 2行, 上排3张(左边1竖，右边2横)
    const layout2 = {
      type: 'composite',
      name: 'six-mixed-left-vertical',
      photos: [...photos],
      cells: []
    };
    
    // 行高
    const topRowHeight = pageSize.height / 2;
    const bottomRowHeight = pageSize.height / 2;
    
    // 上排第一列 - 竖向照片
    layout2.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 3,
      height: topRowHeight
    });
    
    // 上排右侧两张横向照片
    const topRightWidth = (pageSize.width * 2/3) / 2;
    layout2.cells.push({
      photo: photos[1],
      x: pageSize.width / 3,
      y: 0,
      width: topRightWidth,
      height: topRowHeight
    });
    
    layout2.cells.push({
      photo: photos[2],
      x: pageSize.width / 3 + topRightWidth,
      y: 0,
      width: topRightWidth,
      height: topRowHeight
    });
    
    // 下排3张均分
    const bottomCellWidth = pageSize.width / 3;
    for (let i = 0; i < 3; i++) {
      layout2.cells.push({
        photo: photos[i + 3],
        x: i * bottomCellWidth,
        y: topRowHeight,
        width: bottomCellWidth,
        height: bottomRowHeight
      });
    }
    
    layouts.push(layout2);
    
    // 布局3: 2行, 上排3张(右边1竖，左边2横)
    const layout3 = {
      type: 'composite',
      name: 'six-mixed-right-vertical',
      photos: [...photos],
      cells: []
    };
    
    // 上排左侧两张横向照片
    const topLeftWidth = (pageSize.width * 2/3) / 2;
    layout3.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: topLeftWidth,
      height: topRowHeight
    });
    
    layout3.cells.push({
      photo: photos[1],
      x: topLeftWidth,
      y: 0,
      width: topLeftWidth,
      height: topRowHeight
    });
    
    // 上排右边一张竖向照片
    layout3.cells.push({
      photo: photos[2],
      x: pageSize.width * 2/3,
      y: 0,
      width: pageSize.width / 3,
      height: topRowHeight
    });
    
    // 下排3张均分
    for (let i = 0; i < 3; i++) {
      layout3.cells.push({
        photo: photos[i + 3],
        x: i * bottomCellWidth,
        y: topRowHeight,
        width: bottomCellWidth,
        height: bottomRowHeight
      });
    }
    
    layouts.push(layout3);
    
    // 布局4: 2行, 下排3张(左边1竖，右边2横)
    const layout4 = {
      type: 'composite',
      name: 'six-mixed-bottom-left-vertical',
      photos: [...photos],
      cells: []
    };
    
    // 上排3张均分
    const topCellWidth = pageSize.width / 3;
    for (let i = 0; i < 3; i++) {
      layout4.cells.push({
        photo: photos[i],
        x: i * topCellWidth,
        y: 0,
        width: topCellWidth,
        height: topRowHeight
      });
    }
    
    // 下排第一列 - 竖向照片
    layout4.cells.push({
      photo: photos[3],
      x: 0,
      y: topRowHeight,
      width: pageSize.width / 3,
      height: bottomRowHeight
    });
    
    // 下排右侧两张横向照片
    const bottomRightWidth = (pageSize.width * 2/3) / 2;
    layout4.cells.push({
      photo: photos[4],
      x: pageSize.width / 3,
      y: topRowHeight,
      width: bottomRightWidth,
      height: bottomRowHeight
    });
    
    layout4.cells.push({
      photo: photos[5],
      x: pageSize.width / 3 + bottomRightWidth,
      y: topRowHeight,
      width: bottomRightWidth,
      height: bottomRowHeight
    });
    
    layouts.push(layout4);
    
    // 布局5: 2行, 下排3张(右边1竖，左边2横)
    const layout5 = {
      type: 'composite',
      name: 'six-mixed-bottom-right-vertical',
      photos: [...photos],
      cells: []
    };
    
    // 上排3张均分
    for (let i = 0; i < 3; i++) {
      layout5.cells.push({
        photo: photos[i],
        x: i * topCellWidth,
        y: 0,
        width: topCellWidth,
        height: topRowHeight
      });
    }
    
    // 下排左侧两张横向照片
    const bottomLeftWidth = (pageSize.width * 2/3) / 2;
    layout5.cells.push({
      photo: photos[3],
      x: 0,
      y: topRowHeight,
      width: bottomLeftWidth,
      height: bottomRowHeight
    });
    
    layout5.cells.push({
      photo: photos[4],
      x: bottomLeftWidth,
      y: topRowHeight,
      width: bottomLeftWidth,
      height: bottomRowHeight
    });
    
    // 下排右边一张竖向照片
    layout5.cells.push({
      photo: photos[5],
      x: pageSize.width * 2/3,
      y: topRowHeight,
      width: pageSize.width / 3,
      height: bottomRowHeight
    });
    
    layouts.push(layout5);
    
    // 新增布局6：两行，每行有2列，左侧列各一张，右侧列各两张
    // [1][ 2 ][ 3 ]
    // [4][ 5 ][ 6 ]
    const layout6 = {
      type: 'composite',
      name: 'six-mixed-left-one-right-two-both-rows',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左1右2
    layout6.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout6.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout6.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 第二行：左1右2
    layout6.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout6.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout6.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 3 + pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layouts.push(layout6);
    
    // 新增布局7：两行，每行有2列，右侧列各一张，左侧列各两张
    // [ 1 ][ 2 ][3]
    // [ 4 ][ 5 ][6]
    const layout7 = {
      type: 'composite',
      name: 'six-mixed-right-one-left-two-both-rows',
      photos: [...photos],
      cells: []
    };
    
    // 左侧两列-上部
    const leftColumnWidth7 = (pageSize.width * 2/3) / 2;
    layout7.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: leftColumnWidth7,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[1],
      x: leftColumnWidth7,
      y: 0,
      width: leftColumnWidth7,
      height: pageSize.height / 6
    });
    
    // 右侧列-上部照片
    layout7.cells.push({
      photo: photos[2],
      x: pageSize.width * 2/3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 左侧两列-下部
    layout7.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: leftColumnWidth7,
      height: pageSize.height / 6
    });
    
    layout7.cells.push({
      photo: photos[4],
      x: leftColumnWidth7,
      y: pageSize.height / 3,
      width: leftColumnWidth7,
      height: pageSize.height / 6
    });
    
    // 右侧列-下部照片
    layout7.cells.push({
      photo: photos[5],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layouts.push(layout7);
    
    // 新增布局8：上行3张均分，下行左1右2(一列一张，一列上下两张)
    // [  1  ][  2  ][  3  ]
    // [  4  ][  5  ]
    // [     ][  6  ]
    const layout8 = {
      type: 'composite',
      name: 'six-mixed-top-uniform-bottom-split',
      photos: [...photos],
      cells: []
    };
    
    // 上行3张均分
    const topRowHeight8 = pageSize.height / 2;
    const topCellWidth8 = pageSize.width / 3;
    for (let i = 0; i < 3; i++) {
      layout8.cells.push({
        photo: photos[i],
        x: i * topCellWidth8,
        y: 0,
        width: topCellWidth8,
        height: topRowHeight8
      });
    }
    
    // 下行左侧一张大照片
    layout8.cells.push({
      photo: photos[3],
      x: 0,
      y: topRowHeight8,
      width: pageSize.width / 2,
      height: topRowHeight8
    });
    
    // 下行右侧两张堆叠照片
    const bottomRightCellWidth8 = pageSize.width / 2;
    const bottomRightCellHeight8 = topRowHeight8 / 2;
    
    layout8.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: topRowHeight8,
      width: bottomRightCellWidth8,
      height: bottomRightCellHeight8
    });
    
    layout8.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: topRowHeight8 + bottomRightCellHeight8,
      width: bottomRightCellWidth8,
      height: bottomRightCellHeight8
    });
    
    layouts.push(layout8);
    
    // 新增布局9：上行3张均分，下行右1左2(一列一张，一列上下两张)
    // [  1  ][  2  ][  3  ]
    // [  4  ][     ][  6  ]
    // [  5  ][     ][     ]
    const layout9 = {
      type: 'composite',
      name: 'six-mixed-top-uniform-bottom-right-single',
      photos: [...photos],
      cells: []
    };
    
    // 上行3张均分
    const topRowHeight9 = pageSize.height / 2;
    const topCellWidth9 = pageSize.width / 3;
    for (let i = 0; i < 3; i++) {
      layout9.cells.push({
        photo: photos[i],
        x: i * topCellWidth9,
        y: 0,
        width: topCellWidth9,
        height: topRowHeight9
      });
    }
    
    // 下行右侧一张大照片
    layout9.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: topRowHeight9,
      width: pageSize.width / 2,
      height: topRowHeight9
    });
    
    // 下行左侧两张堆叠照片
    const bottomLeftCellWidth9 = pageSize.width / 2;
    const bottomLeftCellHeight9 = topRowHeight9 / 2;
    
    layout9.cells.push({
      photo: photos[3],
      x: 0,
      y: topRowHeight9,
      width: bottomLeftCellWidth9,
      height: bottomLeftCellHeight9
    });
    
    layout9.cells.push({
      photo: photos[4],
      x: 0,
      y: topRowHeight9 + bottomLeftCellHeight9,
      width: bottomLeftCellWidth9,
      height: bottomLeftCellHeight9
    });
    
    layouts.push(layout9);
    
    // 新增布局10：上行左1右2(一列一张，一列上下两张)，下行3张均分
    // [  1  ][  2  ]
    // [     ][  3  ]
    // [  4  ][  5  ][  6  ]
    const layout10 = {
      type: 'composite',
      name: 'six-mixed-top-left-single-bottom-uniform',
      photos: [...photos],
      cells: []
    };
    
    // 上行左侧一张大照片
    const topLeftHeight10 = pageSize.height / 2;
    layout10.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: topLeftHeight10
    });
    
    // 上行右侧两张堆叠照片
    const topRightCellWidth10 = pageSize.width / 2;
    const topRightCellHeight10 = topLeftHeight10 / 2;
    
    layout10.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: topRightCellWidth10,
      height: topRightCellHeight10
    });
    
    layout10.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: topRightCellHeight10,
      width: topRightCellWidth10,
      height: topRightCellHeight10
    });
    
    // 下行3张均分
    const bottomRowHeight10 = pageSize.height / 2;
    const bottomCellWidth10 = pageSize.width / 3;
    for (let i = 0; i < 3; i++) {
      layout10.cells.push({
        photo: photos[i + 3],
        x: i * bottomCellWidth10,
        y: topLeftHeight10,
        width: bottomCellWidth10,
        height: bottomRowHeight10
      });
    }
    
    layouts.push(layout10);
    
    // 新增布局11：上行右1左2(一列一张，一列上下两张)，下行3张均分
    // [  1  ][     ][  4  ]
    // [  2  ][     ][     ]
    // [  3  ][  5  ][  6  ]
    const layout11 = {
      type: 'composite',
      name: 'six-mixed-top-right-single-bottom-uniform',
      photos: [...photos],
      cells: []
    };
    
    // 上行右侧一张大照片
    const topRightHeight11 = pageSize.height / 2;
    layout11.cells.push({
      photo: photos[3],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: topRightHeight11
    });
    
    // 上行左侧两张堆叠照片
    const topLeftCellWidth11 = pageSize.width / 2;
    const topLeftCellHeight11 = topRightHeight11 / 2;
    
    layout11.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: topLeftCellWidth11,
      height: topLeftCellHeight11
    });
    
    layout11.cells.push({
      photo: photos[1],
      x: 0,
      y: topLeftCellHeight11,
      width: topLeftCellWidth11,
      height: topLeftCellHeight11
    });
    
    // 下行3张均分
    const bottomRowHeight11 = pageSize.height / 2;
    const bottomCellWidth11 = pageSize.width / 3;
    
    layout11.cells.push({
      photo: photos[2],
      x: 0,
      y: topRightHeight11,
      width: bottomCellWidth11,
      height: bottomRowHeight11
    });
    
    layout11.cells.push({
      photo: photos[4],
      x: bottomCellWidth11,
      y: topRightHeight11,
      width: bottomCellWidth11,
      height: bottomRowHeight11
    });
    
    layout11.cells.push({
      photo: photos[5],
      x: bottomCellWidth11 * 2,
      y: topRightHeight11,
      width: bottomCellWidth11,
      height: bottomRowHeight11
    });
    
    layouts.push(layout11);
    
    // 新增布局12：第一行左1右2，第二行左1右2
    // [1][ 2 ][ 3 ]
    // [4][ 5 ][ 6 ]
    const layout12 = {
      type: 'composite',
      name: 'six-mixed-left-one-right-two-both-rows',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左1右2
    // 左侧一张照片
    layout12.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 2
    });
    
    // 右侧两张堆叠照片
    layout12.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout12.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第二行：左1右2
    // 左侧一张照片
    layout12.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 2
    });
    
    // 右侧两张堆叠照片
    layout12.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout12.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 2 + pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layouts.push(layout12);
    
    // 新增布局13：第一行左1右2，第二行左2右1
    // [1][ 2 ][ 3 ]
    // [4][ 5 ][ 6 ]
    const layout13 = {
      type: 'composite',
      name: 'six-mixed-left-one-right-two-first-row',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左1右2
    // 左侧一张照片
    layout13.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 2
    });
    
    // 右侧两张堆叠照片
    layout13.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout13.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第二行：左2右1
    // 左侧两张堆叠照片
    layout13.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout13.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 2 + pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 右侧一张照片
    layout13.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 2
    });
    
    layouts.push(layout13);
    
    // 新增布局14：第一行左2右1，第二行左1右2
    // [ 1 ][ 2 ][3]
    // [4][ 5 ][ 6 ]
    const layout14 = {
      type: 'composite',
      name: 'six-mixed-left-two-right-one-first-row',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左2右1
    // 左侧两张堆叠照片
    layout14.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout14.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 右侧一张照片
    layout14.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 2
    });
    
    // 第二行：左1右2
    // 左侧一张照片
    layout14.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 2
    });
    
    // 右侧两张堆叠照片
    layout14.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout14.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 2 + pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layouts.push(layout14);
    
    // 新增布局15：第一行左2右1，第二行左2右1
    // [ 1 ][ 2 ][3]
    // [ 4 ][ 5 ][6]
    const layout15 = {
      type: 'composite',
      name: 'six-mixed-left-two-right-one-both-rows',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左2右1
    // 左侧两张堆叠照片
    layout15.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout15.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 右侧一张照片
    layout15.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 2
    });
    
    // 第二行：左2右1
    // 左侧两张堆叠照片
    layout15.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout15.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 2 + pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 右侧一张照片
    layout15.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 2
    });
    
    layouts.push(layout15);

    // 创建优化版本 - 将照片按最佳宽高比分配到单元格
    const cells12 = [...layout12.cells];
    const cells13 = [...layout13.cells];
    const cells14 = [...layout14.cells];
    const cells15 = [...layout15.cells];
    
    // 按照宽高比排序照片和单元格，然后生成优化布局
    layouts.push(createOptimizedLayout(photos, cells12, 'six-mixed-left-one-right-two-both-rows-optimized'));
    layouts.push(createOptimizedLayout(photos, cells13, 'six-mixed-left-one-right-two-first-row-optimized'));
    layouts.push(createOptimizedLayout(photos, cells14, 'six-mixed-left-two-right-one-first-row-optimized'));
    layouts.push(createOptimizedLayout(photos, cells15, 'six-mixed-left-two-right-one-both-rows-optimized'));
  }
  
  return layouts;
}

// 生成复杂布局（7-9张照片）
function generateComplexLayouts(photos, pageSize) {
  const layouts = [];
  const photoCount = photos.length;

  if (photoCount === 7) {
    // 7张照片的布局
    // 1. (3,3,1) 变体
    // 1.1 3列+3列+1
    const layout1 = {
      type: 'composite',
      name: 'seven-mixed-three-three-one',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：3列
    layout1.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[1],
      x: pageSize.width / 3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[2],
      x: pageSize.width * 2/3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout1.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[4],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[5],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：1列
    layout1.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width,
      height: pageSize.height / 3
    });
    
    layouts.push(layout1);
    
    // 1.2 左1右2 + 左1右2 + 1
    const layout2 = {
      type: 'composite',
      name: 'seven-mixed-left-one-right-two-both-rows',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左1右2
    layout2.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout2.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout2.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 第二行：左1右2
    layout2.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout2.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout2.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 3 + pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 第三行：1列
    layout2.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width,
      height: pageSize.height / 3
    });
    
    layouts.push(layout2);
    
    // 2. (2,2,2,1) 变体
    // 2.1 2+2+2+1
    const layout3 = {
      type: 'composite',
      name: 'seven-mixed-two-two-two-one',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：2列
    layout3.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout3.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第二行：2列
    layout3.cells.push({
      photo: photos[2],
      x: 0,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout3.cells.push({
      photo: photos[3],
      x: pageSize.width / 2,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第三行：2列
    layout3.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout3.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第四行：1列
    layout3.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 3/4,
      width: pageSize.width,
      height: pageSize.height / 4
    });
    
    layouts.push(layout3);
    
    // 3. (2,3,2) 变体
    // 3.1 2+3列+2
    const layout4 = {
      type: 'composite',
      name: 'seven-mixed-two-three-two',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：2列
    layout4.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout4.cells.push({
      photo: photos[2],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[3],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[4],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：2列
    layout4.cells.push({
      photo: photos[5],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[6],
      x: pageSize.width / 2,
      y: pageSize.height * 2/3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layouts.push(layout4);
    
    // 新增布局: 左2右1 + 左2右1 + 1
    const layout5 = {
      type: 'composite',
      name: 'seven-mixed-left-two-right-one-both-rows',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左2右1
    // 左侧两张堆叠照片
    layout5.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout5.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 右侧一张照片
    layout5.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第二行：左2右1
    // 左侧两张堆叠照片
    layout5.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout5.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 3 + pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 右侧一张照片
    layout5.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第三行：1列
    layout5.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width,
      height: pageSize.height / 3
    });
    
    layouts.push(layout5);
    
    // 新增布局: 左1右2 + 左2右1 + 1
    const layout6 = {
      type: 'composite',
      name: 'seven-mixed-left-one-right-two-first-row',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左1右2
    layout6.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout6.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout6.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 第二行：左2右1
    // 左侧两张堆叠照片
    layout6.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout6.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 3 + pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 右侧一张照片
    layout6.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第三行：1列
    layout6.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width,
      height: pageSize.height / 3
    });
    
    layouts.push(layout6);
    
    // 新增布局: 左2右1 + 左1右2 + 1
    const layout7 = {
      type: 'composite',
      name: 'seven-mixed-left-two-right-one-first-row',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左2右1
    // 左侧两张堆叠照片
    layout7.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout7.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 右侧一张照片
    layout7.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第二行：左1右2
    layout7.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    layout7.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 3 + pageSize.height / 6,
      width: pageSize.width / 2,
      height: pageSize.height / 6
    });
    
    // 第三行：1列
    layout7.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width,
      height: pageSize.height / 3
    });
    
    layouts.push(layout7);
    
    // 新增布局: 1 + 3列 + 3列
    const layout8 = {
      type: 'composite',
      name: 'seven-mixed-one-three-three',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：1列
    layout8.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout8.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[2],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[3],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：3列
    layout8.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[5],
      x: pageSize.width / 3,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[6],
      x: pageSize.width * 2/3,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layouts.push(layout8);
    
    // 新增布局: 3列 + 3列 + 左右对称1
    const layout9 = {
      type: 'composite',
      name: 'seven-mixed-three-three-one-centered',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：3列
    layout9.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout9.cells.push({
      photo: photos[1],
      x: pageSize.width / 3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout9.cells.push({
      photo: photos[2],
      x: pageSize.width * 2/3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout9.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout9.cells.push({
      photo: photos[4],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout9.cells.push({
      photo: photos[5],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：1列（居中）
    layout9.cells.push({
      photo: photos[6],
      x: pageSize.width / 4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layouts.push(layout9);
    
    // 新增布局: 1+2+2+2 垂直变体
    const layout10 = {
      type: 'composite',
      name: 'seven-mixed-one-two-two-two',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：1列
    layout10.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width,
      height: pageSize.height / 4
    });
    
    // 第二行：2列
    layout10.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout10.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第三行：2列
    layout10.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout10.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第四行：2列
    layout10.cells.push({
      photo: photos[5],
      x: 0,
      y: pageSize.height * 3/4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout10.cells.push({
      photo: photos[6],
      x: pageSize.width / 2,
      y: pageSize.height * 3/4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layouts.push(layout10);
    
    // 为每个布局创建优化版本
    layouts.forEach(layout => {
      const cells = [...layout.cells];
      layouts.push(createOptimizedLayout(photos, cells, `${layout.name}-optimized`));
    });
  } else if (photoCount === 8) {
    // 8张照片的布局
    // 1. (3,3,2) 变体
    // 1.1 3列+3列+2
    const layout1 = {
      type: 'composite',
      name: 'eight-mixed-three-three-two',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：3列
    layout1.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[1],
      x: pageSize.width / 3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[2],
      x: pageSize.width * 2/3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout1.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[4],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[5],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：2列
    layout1.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[7],
      x: pageSize.width / 2,
      y: pageSize.height * 2/3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layouts.push(layout1);
    
    // 2. (2,2,2,2) 变体
    // 2.1 2+2+2+2
    const layout2 = {
      type: 'composite',
      name: 'eight-mixed-two-two-two-two',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：2列
    layout2.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第二行：2列
    layout2.cells.push({
      photo: photos[2],
      x: 0,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[3],
      x: pageSize.width / 2,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第三行：2列
    layout2.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第四行：2列
    layout2.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 3/4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[7],
      x: pageSize.width / 2,
      y: pageSize.height * 3/4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layouts.push(layout2);
    
    // 3. (2,2,4) 变体
    // 3.1 2+2+4列
    const layout3 = {
      type: 'composite',
      name: 'eight-mixed-two-two-four',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：2列
    layout3.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第二行：2列
    layout3.cells.push({
      photo: photos[2],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[3],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第三行：4列
    layout3.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[5],
      x: pageSize.width / 4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[6],
      x: pageSize.width / 2,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[7],
      x: pageSize.width * 3/4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layouts.push(layout3);
    
    // 新增布局：(左1右3 + 左3右1) - 上下对称变体
    const layout4 = {
      type: 'composite',
      name: 'eight-mixed-left-one-right-three-top-left-three-right-one-bottom',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左1右3
    // 左侧一张照片
    layout4.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    // 右侧三张照片
    layout4.cells.push({
      photo: photos[1],
      x: pageSize.width / 4,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout4.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout4.cells.push({
      photo: photos[3],
      x: pageSize.width * 3/4,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    // 第二行：左3右1
    // 左侧三张照片
    layout4.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout4.cells.push({
      photo: photos[5],
      x: pageSize.width / 4,
      y: pageSize.height / 2,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout4.cells.push({
      photo: photos[6],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    // 右侧一张照片
    layout4.cells.push({
      photo: photos[7],
      x: pageSize.width * 3/4,
      y: pageSize.height / 2,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layouts.push(layout4);
    
    // 新增布局：(左2右2 + 左2右2) - 均衡分布变体
    const layout5 = {
      type: 'composite',
      name: 'eight-mixed-left-two-right-two-both-rows',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：左2右2
    // 左侧两张堆叠照片
    layout5.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout5.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 右侧两张堆叠照片
    layout5.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout5.cells.push({
      photo: photos[3],
      x: pageSize.width / 2,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第二行：左2右2
    // 左侧两张堆叠照片
    layout5.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout5.cells.push({
      photo: photos[5],
      x: 0,
      y: pageSize.height * 3/4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 右侧两张堆叠照片
    layout5.cells.push({
      photo: photos[6],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout5.cells.push({
      photo: photos[7],
      x: pageSize.width / 2,
      y: pageSize.height * 3/4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layouts.push(layout5);
    
    // 新增布局：(4 + 4) - 两行均分变体
    const layout6 = {
      type: 'composite',
      name: 'eight-mixed-four-four',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：4列
    layout6.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout6.cells.push({
      photo: photos[1],
      x: pageSize.width / 4,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout6.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout6.cells.push({
      photo: photos[3],
      x: pageSize.width * 3/4,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    // 第二行：4列
    layout6.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout6.cells.push({
      photo: photos[5],
      x: pageSize.width / 4,
      y: pageSize.height / 2,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout6.cells.push({
      photo: photos[6],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layout6.cells.push({
      photo: photos[7],
      x: pageSize.width * 3/4,
      y: pageSize.height / 2,
      width: pageSize.width / 4,
      height: pageSize.height / 2
    });
    
    layouts.push(layout6);
    
    // 新增布局：(3 + 2 + 3) - 三行变体
    const layout7 = {
      type: 'composite',
      name: 'eight-mixed-three-two-three',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：3列
    layout7.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[1],
      x: pageSize.width / 3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[2],
      x: pageSize.width * 2/3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第二行：2列
    layout7.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第三行：3列
    layout7.cells.push({
      photo: photos[5],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[6],
      x: pageSize.width / 3,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[7],
      x: pageSize.width * 2/3,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layouts.push(layout7);
    
    // 新增布局：(1 + 3 + 4) - 顶部大图变体
    const layout8 = {
      type: 'composite',
      name: 'eight-mixed-one-three-four',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：1大图
    layout8.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout8.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[2],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[3],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：4列
    layout8.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[5],
      x: pageSize.width / 4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[6],
      x: pageSize.width / 2,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[7],
      x: pageSize.width * 3/4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layouts.push(layout8);
    
    // 为每个布局创建优化版本
    layouts.forEach(layout => {
      const cells = [...layout.cells];
      layouts.push(createOptimizedLayout(photos, cells, `${layout.name}-optimized`));
    });
  } else if (photoCount === 9) {
    // 9张照片的布局
    // 1. (3,3,3) 变体
    // 1.1 3列+3列+3列
    const layout1 = {
      type: 'composite',
      name: 'nine-mixed-three-three-three',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：3列
    layout1.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[1],
      x: pageSize.width / 3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[2],
      x: pageSize.width * 2/3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout1.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[4],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[5],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：3列
    layout1.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[7],
      x: pageSize.width / 3,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout1.cells.push({
      photo: photos[8],
      x: pageSize.width * 2/3,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layouts.push(layout1);
    
    // 2. (2,2,2,3) 变体
    // 2.1 2+2+2+3列
    const layout2 = {
      type: 'composite',
      name: 'nine-mixed-two-two-two-three',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：2列
    layout2.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第二行：2列
    layout2.cells.push({
      photo: photos[2],
      x: 0,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[3],
      x: pageSize.width / 2,
      y: pageSize.height / 4,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第三行：2列
    layout2.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 2,
      width: pageSize.width / 2,
      height: pageSize.height / 4
    });
    
    // 第四行：3列
    layout2.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 3/4,
      width: pageSize.width / 3,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[7],
      x: pageSize.width / 3,
      y: pageSize.height * 3/4,
      width: pageSize.width / 3,
      height: pageSize.height / 4
    });
    
    layout2.cells.push({
      photo: photos[8],
      x: pageSize.width * 2/3,
      y: pageSize.height * 3/4,
      width: pageSize.width / 3,
      height: pageSize.height / 4
    });
    
    layouts.push(layout2);
    
    // 新增布局：(3,2,4) - 多行不同列数变体
    const layout3 = {
      type: 'composite',
      name: 'nine-mixed-three-two-four',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：3列
    layout3.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[1],
      x: pageSize.width / 3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[2],
      x: pageSize.width * 2/3,
      y: 0,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第二行：2列
    layout3.cells.push({
      photo: photos[3],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[4],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第三行：4列
    layout3.cells.push({
      photo: photos[5],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[6],
      x: pageSize.width / 4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[7],
      x: pageSize.width / 2,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout3.cells.push({
      photo: photos[8],
      x: pageSize.width * 3/4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layouts.push(layout3);
    
    // 新增布局：(4,2,3) - 多行不同列数变体
    const layout4 = {
      type: 'composite',
      name: 'nine-mixed-four-two-three',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：4列
    layout4.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[1],
      x: pageSize.width / 4,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[3],
      x: pageSize.width * 3/4,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    // 第二行：2列
    layout4.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[5],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第三行：3列
    layout4.cells.push({
      photo: photos[6],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[7],
      x: pageSize.width / 3,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout4.cells.push({
      photo: photos[8],
      x: pageSize.width * 2/3,
      y: pageSize.height * 2/3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layouts.push(layout4);
    
    // 新增布局：(1,4,4) - 顶部大图变体
    const layout5 = {
      type: 'composite',
      name: 'nine-mixed-one-four-four',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：1列（大图）
    layout5.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width,
      height: pageSize.height / 3
    });
    
    // 第二行：4列
    layout5.cells.push({
      photo: photos[1],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout5.cells.push({
      photo: photos[2],
      x: pageSize.width / 4,
      y: pageSize.height / 3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout5.cells.push({
      photo: photos[3],
      x: pageSize.width / 2,
      y: pageSize.height / 3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout5.cells.push({
      photo: photos[4],
      x: pageSize.width * 3/4,
      y: pageSize.height / 3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    // 第三行：4列
    layout5.cells.push({
      photo: photos[5],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout5.cells.push({
      photo: photos[6],
      x: pageSize.width / 4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout5.cells.push({
      photo: photos[7],
      x: pageSize.width / 2,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout5.cells.push({
      photo: photos[8],
      x: pageSize.width * 3/4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layouts.push(layout5);
    
    // 新增布局：(3x3) - 中心大图变体
    const layout6 = {
      type: 'composite',
      name: 'nine-mixed-center-dominant',
      photos: [...photos],
      cells: []
    };
    
    // 外围8张小图，中心1张大图
    const cellSize = pageSize.width / 3;
    
    // 上排三张
    layout6.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: cellSize,
      height: cellSize
    });
    
    layout6.cells.push({
      photo: photos[1],
      x: cellSize,
      y: 0,
      width: cellSize,
      height: cellSize
    });
    
    layout6.cells.push({
      photo: photos[2],
      x: cellSize * 2,
      y: 0,
      width: cellSize,
      height: cellSize
    });
    
    // 中排左右两张
    layout6.cells.push({
      photo: photos[3],
      x: 0,
      y: cellSize,
      width: cellSize,
      height: cellSize
    });
    
    // 中心大图
    layout6.cells.push({
      photo: photos[4],
      x: cellSize,
      y: cellSize,
      width: cellSize,
      height: cellSize
    });
    
    layout6.cells.push({
      photo: photos[5],
      x: cellSize * 2,
      y: cellSize,
      width: cellSize,
      height: cellSize
    });
    
    // 下排三张
    layout6.cells.push({
      photo: photos[6],
      x: 0,
      y: cellSize * 2,
      width: cellSize,
      height: cellSize
    });
    
    layout6.cells.push({
      photo: photos[7],
      x: cellSize,
      y: cellSize * 2,
      width: cellSize,
      height: cellSize
    });
    
    layout6.cells.push({
      photo: photos[8],
      x: cellSize * 2,
      y: cellSize * 2,
      width: cellSize,
      height: cellSize
    });
    
    layouts.push(layout6);
    
    // 新增布局：(2+3+4) - 逐行增加列数
    const layout7 = {
      type: 'composite',
      name: 'nine-mixed-two-three-four',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：2列
    layout7.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[1],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout7.cells.push({
      photo: photos[2],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[3],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[4],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：4列
    layout7.cells.push({
      photo: photos[5],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[6],
      x: pageSize.width / 4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[7],
      x: pageSize.width / 2,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout7.cells.push({
      photo: photos[8],
      x: pageSize.width * 3/4,
      y: pageSize.height * 2/3,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layouts.push(layout7);
    
    // 新增布局：(4+3+2) - 逐行减少列数
    const layout8 = {
      type: 'composite',
      name: 'nine-mixed-four-three-two',
      photos: [...photos],
      cells: []
    };
    
    // 第一行：4列
    layout8.cells.push({
      photo: photos[0],
      x: 0,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[1],
      x: pageSize.width / 4,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[2],
      x: pageSize.width / 2,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[3],
      x: pageSize.width * 3/4,
      y: 0,
      width: pageSize.width / 4,
      height: pageSize.height / 3
    });
    
    // 第二行：3列
    layout8.cells.push({
      photo: photos[4],
      x: 0,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[5],
      x: pageSize.width / 3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[6],
      x: pageSize.width * 2/3,
      y: pageSize.height / 3,
      width: pageSize.width / 3,
      height: pageSize.height / 3
    });
    
    // 第三行：2列
    layout8.cells.push({
      photo: photos[7],
      x: 0,
      y: pageSize.height * 2/3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layout8.cells.push({
      photo: photos[8],
      x: pageSize.width / 2,
      y: pageSize.height * 2/3,
      width: pageSize.width / 2,
      height: pageSize.height / 3
    });
    
    layouts.push(layout8);
    
    // 为每个布局创建优化版本
    layouts.forEach(layout => {
      const cells = [...layout.cells];
      layouts.push(createOptimizedLayout(photos, cells, `${layout.name}-optimized`));
    });
  }

  return layouts;
}

// 创建照片优化布局的辅助函数
function createOptimizedLayout(photos, cells, name) {
  // 创建新的布局
  const optimizedLayout = {
    type: 'composite',
    name: name,
    photos: [...photos],
    cells: []
  };
  
  // 复制单元格但不包含照片信息
  const cellsWithoutPhotos = cells.map(cell => ({
    x: cell.x,
    y: cell.y,
    width: cell.width,
    height: cell.height,
    aspectRatio: cell.width / cell.height
  }));
  
  // 按宽高比从大到小排序单元格（横向优先）
  cellsWithoutPhotos.sort((a, b) => b.aspectRatio - a.aspectRatio);
  
  // 复制照片数组
  const remainingPhotos = [...photos];
  
  // 为每个单元格分配最佳匹配的照片
  cellsWithoutPhotos.forEach(cell => {
    const bestPhotoIndex = findBestMatchingPhotoIndex(remainingPhotos, cell.aspectRatio);
    cell.photo = remainingPhotos[bestPhotoIndex];
    remainingPhotos.splice(bestPhotoIndex, 1);
    optimizedLayout.cells.push(cell);
  });
  
  // 按位置排序单元格以确保一致的渲染
  optimizedLayout.cells.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  
  return optimizedLayout;
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