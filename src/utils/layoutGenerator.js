// Generate all possible layouts for the given photos and page size
import { 
  getLayoutDescriptorsForPhotoCount, 
  LAYOUT_TYPES
} from './layoutDescriptors';

export function generateLayouts(photos, pageSize) {
  if (!photos || photos.length === 0) return [];
  
  // Sort photos by aspect ratio to optimize placement
  const sortedPhotos = [...photos].sort((a, b) => {
    // Sort by orientation (landscape vs portrait)
    const aRatio = a.width / a.height;
    const bRatio = b.width / b.height;
    return bRatio - aRatio; // Descending: landscape (w>h) photos first, portrait (h>w) last
  });
  
  // 获取所有适用于当前照片数量的布局描述符
  const descriptors = getLayoutDescriptorsForPhotoCount(photos.length);
  
  // 根据描述符创建具体的布局
  const layouts = descriptors.map(descriptor => 
    createLayoutFromDescriptor(sortedPhotos, pageSize, descriptor)
  );
  
  // 为每个基本布局创建一个优化版本
  descriptors.forEach(descriptor => {
    const layout = createLayoutFromDescriptor(sortedPhotos, pageSize, descriptor);
    const optimizedLayout = createOptimizedLayout(
      sortedPhotos, 
      [...layout.cells], 
      `${layout.name}-optimized`
    );
    layouts.push(optimizedLayout);
  });
  
  // Remove exact duplicates before scoring
  const uniqueLayouts = removeDuplicateLayouts(layouts, pageSize);
  
  // Score and sort layouts
  const scoredLayouts = scoreLayouts(uniqueLayouts, pageSize);
  
  return scoredLayouts;
}

// 从描述符创建布局
function createLayoutFromDescriptor(photos, pageSize, descriptor) {
  const layout = {
    type: descriptor.type,
    name: descriptor.name,
    photos: [...photos],
    cells: []
  };
  
  // 根据描述符创建单元格
  descriptor.cells.forEach(cellDesc => {
    const photoIndex = cellDesc.photoIndex;
    
    // 确保photoIndex在有效范围内
    if (photoIndex < photos.length) {
      layout.cells.push({
        photo: photos[photoIndex],
        x: cellDesc.x * pageSize.width,
        y: cellDesc.y * pageSize.height,
        width: cellDesc.width * pageSize.width,
        height: cellDesc.height * pageSize.height
      });
    }
  });
  
  return layout;
}

// 查找最匹配指定宽高比的照片
function findBestMatchingPhotoIndex(photos, targetAspectRatio) {
  let bestIndex = 0;
  let minDifference = Infinity;
  
  photos.forEach((photo, index) => {
    const photoRatio = photo.width / photo.height;
    const difference = Math.abs(photoRatio - targetAspectRatio);
    
    if (difference < minDifference) {
      minDifference = difference;
      bestIndex = index;
    }
  });
  
  return bestIndex;
}

// 创建优化布局 - 根据照片宽高比最佳匹配单元格
function createOptimizedLayout(photos, cells, name) {
  const optimizedLayout = {
    type: 'optimized',
    name: name || 'optimized',
    photos: [...photos],
    cells: []
  };
  
  // 计算每个单元格的宽高比，但不包含照片信息
  const cellsWithoutPhotos = cells.map(cell => ({
    ...cell,
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

// 计算布局签名，用于去重
function getLayoutSignature(layout, pageSize) {
  // 对单元格按位置排序
  const sortedCells = [...layout.cells].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
  
  // 创建签名字符串，包含布局类型、名称和单元格几何信息
  let signature = `${layout.type}-${layout.name}:`;
  
  // 将单元格的相对位置和尺寸添加到签名中（去掉照片信息，只关注结构）
  sortedCells.forEach(cell => {
    const relX = Math.round((cell.x / pageSize.width) * 100) / 100;
    const relY = Math.round((cell.y / pageSize.height) * 100) / 100;
    const relWidth = Math.round((cell.width / pageSize.width) * 100) / 100;
    const relHeight = Math.round((cell.height / pageSize.height) * 100) / 100;
    
    signature += `[${relX},${relY},${relWidth},${relHeight}]`;
  });
  
  return signature;
}

// 删除重复布局
function removeDuplicateLayouts(layouts, pageSize) {
  const uniqueLayouts = [];
  const signatures = new Map(); // 使用Map而不是Set，存储签名到索引的映射
  
  layouts.forEach((layout, index) => {
    const signature = getLayoutSignature(layout, pageSize);
    
    if (!signatures.has(signature)) {
      signatures.set(signature, uniqueLayouts.length);
      uniqueLayouts.push({
        ...layout,
        duplicateOf: null
      });
    } else {
      // 如果是重复的，记录它是哪个布局的重复
      const originalIndex = signatures.get(signature);
      uniqueLayouts.push({
        ...layout,
        duplicateOf: originalIndex + 1 // 使用1-based索引显示给用户
      });
    }
  });
  
  return uniqueLayouts;
}

// 对布局进行评分，考虑利用率、裁剪率和大小平衡
function scoreLayouts(layouts, pageSize) {
  const scoredLayouts = layouts.map(layout => {
    const utilizationScore = calculateUtilization(layout, pageSize);
    const croppingScore = calculateCroppingRate(layout);
    const balanceScore = calculateSizeBalance(layout);
    
    // 权重可以根据需要调整
    // 注意：croppingScore现在是越高越差，所以我们用(1-croppingScore)
    const totalScore = 
      utilizationScore * 0.4 + 
      (1 - croppingScore) * 0.4 + 
      balanceScore * 0.2;
    
    return {
      ...layout,
      score: totalScore,
      metrics: {
        utilization: utilizationScore,
        croppingRate: croppingScore,
        sizeBalance: balanceScore
      }
    };
  });
  
  // 按分数降序排序
  return scoredLayouts.sort((a, b) => b.score - a.score);
}

// 计算布局空间利用率
function calculateUtilization(layout, pageSize) {
  const totalPageArea = pageSize.width * pageSize.height;
  let usedArea = 0;
  
  layout.cells.forEach(cell => {
    usedArea += cell.width * cell.height;
  });
  
  return usedArea / totalPageArea;
}

// 计算照片裁剪率（越低越好）
function calculateCroppingRate(layout) {
  let totalCroppingRate = 0;
  let validCells = 0;
  
  layout.cells.forEach(cell => {
    const photo = cell.photo;
    if (!photo) return;
    
    validCells++;
    
    // 计算单元格和照片的宽高比
    const cellAspectRatio = cell.width / cell.height;
    const photoAspectRatio = photo.width / photo.height;
    
    // 确定哪个宽高比更大，计算真实的裁剪比例
    let croppingRate;
    
    if (cellAspectRatio > photoAspectRatio) {
      // 单元格更宽 - 照片会被上下裁剪
      // 计算照片将被裁剪的高度百分比
      const scaledPhotoWidth = cell.width;
      const scaledPhotoHeight = scaledPhotoWidth / photoAspectRatio;
      const heightDifference = scaledPhotoHeight - cell.height;
      
      croppingRate = heightDifference / scaledPhotoHeight;
    } else {
      // 单元格更高 - 照片会被左右裁剪
      // 计算照片将被裁剪的宽度百分比
      const scaledPhotoHeight = cell.height;
      const scaledPhotoWidth = scaledPhotoHeight * photoAspectRatio;
      const widthDifference = scaledPhotoWidth - cell.width;
      
      croppingRate = widthDifference / scaledPhotoWidth;
    }
    
    // 确保裁剪率在0-1范围内，并累加
    croppingRate = Math.max(0, Math.min(croppingRate, 1));
    totalCroppingRate += croppingRate;
  });
  
  if (validCells === 0) return 0;
  
  // 直接返回平均裁剪率，0表示没有裁剪，1表示全部裁剪
  return totalCroppingRate / validCells;
}

// 计算照片尺寸平衡度
function calculateSizeBalance(layout) {
  // 计算所有单元格的面积
  const areas = layout.cells.map(cell => cell.width * cell.height);
  const totalArea = areas.reduce((sum, area) => sum + area, 0);
  const avgArea = totalArea / areas.length;
  
  // 计算标准差
  const variance = areas.reduce((sum, area) => sum + Math.pow(area - avgArea, 2), 0) / areas.length;
  const stdDev = Math.sqrt(variance);
  
  // 计算变异系数（标准差/平均值）
  const cv = stdDev / avgArea;
  
  // 转换为0-1分数，0表示极不平衡，1表示完全平衡
  return 1 - Math.min(cv, 1);
} 