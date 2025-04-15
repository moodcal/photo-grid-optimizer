// 布局描述符 - 将布局定义从实现代码中分离出来
// 使用相对坐标系统 (0-1 范围)，这样可以适应任何页面尺寸

// 基本布局类型定义
export const LAYOUT_TYPES = {
  GRID: 'grid',          // 网格布局（等大小的单元格）
  SPLIT: 'split',        // 分割布局（左右或上下分割）
  COMPOSITE: 'composite' // 组合布局（混合单元格大小）
};

// 一些通用的布局生成函数
export function createGridDescriptor(rows, cols) {
  const cells = [];
  const cellWidth = 1 / cols;
  const cellHeight = 1 / rows;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: col * cellWidth,
        y: row * cellHeight, 
        width: cellWidth,
        height: cellHeight,
        photoIndex: row * cols + col
      });
    }
  }
  
  return {
    type: LAYOUT_TYPES.GRID,
    name: `grid-${rows}x${cols}`,
    cells
  };
}

export function createHorizontalSplitDescriptor(topCount, bottomCount) {
  const cells = [];
  const topHeight = 0.5;
  const bottomHeight = 0.5;
  
  // 顶部单元格
  if (topCount > 0) {
    const topCellWidth = 1 / topCount;
    for (let i = 0; i < topCount; i++) {
      cells.push({
        x: i * topCellWidth,
        y: 0,
        width: topCellWidth,
        height: topHeight,
        photoIndex: i
      });
    }
  }
  
  // 底部单元格
  if (bottomCount > 0) {
    const bottomCellWidth = 1 / bottomCount;
    for (let i = 0; i < bottomCount; i++) {
      cells.push({
        x: i * bottomCellWidth,
        y: topHeight,
        width: bottomCellWidth,
        height: bottomHeight,
        photoIndex: topCount + i
      });
    }
  }
  
  return {
    type: LAYOUT_TYPES.SPLIT,
    name: `hsplit-${topCount}-${bottomCount}`,
    cells
  };
}

export function createVerticalSplitDescriptor(leftCount, rightCount, splitRatio = 0.5) {
  const cells = [];
  const leftWidth = splitRatio;
  const rightWidth = 1 - splitRatio;
  
  // 左侧单元格
  if (leftCount > 0) {
    const leftCellHeight = 1 / leftCount;
    for (let i = 0; i < leftCount; i++) {
      cells.push({
        x: 0,
        y: i * leftCellHeight,
        width: leftWidth,
        height: leftCellHeight,
        photoIndex: i
      });
    }
  }
  
  // 右侧单元格
  if (rightCount > 0) {
    const rightCellHeight = 1 / rightCount;
    for (let i = 0; i < rightCount; i++) {
      cells.push({
        x: leftWidth,
        y: i * rightCellHeight,
        width: rightWidth,
        height: rightCellHeight,
        photoIndex: leftCount + i
      });
    }
  }
  
  return {
    type: LAYOUT_TYPES.SPLIT,
    name: `vsplit-${leftCount}-${rightCount}`,
    cells
  };
}

// 预定义布局描述符集合
export const layoutDescriptors = {
  // 基本网格布局
  grid1x1: createGridDescriptor(1, 1),
  grid1x2: createGridDescriptor(1, 2),
  grid1x3: createGridDescriptor(1, 3),
  grid1x4: createGridDescriptor(1, 4),
  grid2x1: createGridDescriptor(2, 1),
  grid2x2: createGridDescriptor(2, 2),
  grid2x3: createGridDescriptor(2, 3),
  grid3x1: createGridDescriptor(3, 1),
  grid3x2: createGridDescriptor(3, 2),
  grid3x3: createGridDescriptor(3, 3),
  
  // 左一右二布局 (适用于6张照片)
  leftOneRightTwo: {
    type: LAYOUT_TYPES.COMPOSITE,
    name: 'left-one-right-two',
    cells: [
      // 上半部分
      { photoIndex: 0, x: 0, y: 0, width: 0.5, height: 0.5 },
      { photoIndex: 1, x: 0.5, y: 0, width: 0.5, height: 0.25 },
      { photoIndex: 2, x: 0.5, y: 0.25, width: 0.5, height: 0.25 },
      // 下半部分
      { photoIndex: 3, x: 0, y: 0.5, width: 0.5, height: 0.5 },
      { photoIndex: 4, x: 0.5, y: 0.5, width: 0.5, height: 0.25 },
      { photoIndex: 5, x: 0.5, y: 0.75, width: 0.5, height: 0.25 }
    ]
  },
  
  // 左二右一布局 (适用于6张照片)
  leftTwoRightOne: {
    type: LAYOUT_TYPES.COMPOSITE,
    name: 'left-two-right-one',
    cells: [
      // 上半部分
      { photoIndex: 0, x: 0, y: 0, width: 0.5, height: 0.25 },
      { photoIndex: 1, x: 0, y: 0.25, width: 0.5, height: 0.25 },
      { photoIndex: 2, x: 0.5, y: 0, width: 0.5, height: 0.5 },
      // 下半部分
      { photoIndex: 3, x: 0, y: 0.5, width: 0.5, height: 0.25 },
      { photoIndex: 4, x: 0, y: 0.75, width: 0.5, height: 0.25 },
      { photoIndex: 5, x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
    ]
  },
  
  // 三三一布局 (适用于7张照片)
  threeThreeOne: {
    type: LAYOUT_TYPES.COMPOSITE,
    name: 'three-three-one',
    cells: [
      // 上面3张
      { photoIndex: 0, x: 0, y: 0, width: 1/3, height: 1/3 },
      { photoIndex: 1, x: 1/3, y: 0, width: 1/3, height: 1/3 },
      { photoIndex: 2, x: 2/3, y: 0, width: 1/3, height: 1/3 },
      // 中间3张
      { photoIndex: 3, x: 0, y: 1/3, width: 1/3, height: 1/3 },
      { photoIndex: 4, x: 1/3, y: 1/3, width: 1/3, height: 1/3 },
      { photoIndex: 5, x: 2/3, y: 1/3, width: 1/3, height: 1/3 },
      // 底部1张
      { photoIndex: 6, x: 0, y: 2/3, width: 1, height: 1/3 }
    ]
  },
  
  // 二三二布局 (适用于7张照片)
  twoThreeTwo: {
    type: LAYOUT_TYPES.COMPOSITE,
    name: 'two-three-two',
    cells: [
      // 上面2张
      { photoIndex: 0, x: 0, y: 0, width: 0.5, height: 1/3 },
      { photoIndex: 1, x: 0.5, y: 0, width: 0.5, height: 1/3 },
      // 中间3张
      { photoIndex: 2, x: 0, y: 1/3, width: 1/3, height: 1/3 },
      { photoIndex: 3, x: 1/3, y: 1/3, width: 1/3, height: 1/3 },
      { photoIndex: 4, x: 2/3, y: 1/3, width: 1/3, height: 1/3 },
      // 底部2张
      { photoIndex: 5, x: 0, y: 2/3, width: 0.5, height: 1/3 },
      { photoIndex: 6, x: 0.5, y: 2/3, width: 0.5, height: 1/3 }
    ]
  }
};

// 根据照片数量获取适用的布局描述符
export function getLayoutDescriptorsForPhotoCount(photoCount) {
  // 基本网格布局总是可用的
  const descriptors = [];
  
  // 尝试找到合适行列的网格布局
  for (let rows = 1; rows <= photoCount; rows++) {
    if (photoCount % rows === 0) {
      const cols = photoCount / rows;
      descriptors.push(createGridDescriptor(rows, cols));
    }
  }
  
  // 对于特定数量的照片添加特殊布局
  if (photoCount === 6) {
    descriptors.push(layoutDescriptors.leftOneRightTwo);
    descriptors.push(layoutDescriptors.leftTwoRightOne);
  } else if (photoCount === 7) {
    descriptors.push(layoutDescriptors.threeThreeOne);
    descriptors.push(layoutDescriptors.twoThreeTwo);
  }
  
  // 添加分割布局
  for (let leftCount = 1; leftCount < photoCount; leftCount++) {
    const rightCount = photoCount - leftCount;
    descriptors.push(createVerticalSplitDescriptor(leftCount, rightCount));
  }
  
  for (let topCount = 1; topCount < photoCount; topCount++) {
    const bottomCount = photoCount - topCount;
    descriptors.push(createHorizontalSplitDescriptor(topCount, bottomCount));
  }
  
  return descriptors;
} 