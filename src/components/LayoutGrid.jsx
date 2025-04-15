import React, { useState, useEffect } from 'react';
import LayoutPreview from './LayoutPreview';
import ScoreDisplay from './ScoreDisplay';
import './LayoutGrid.css';

function LayoutGrid({ layouts, pageSize }) {
  const [uniqueLayouts, setUniqueLayouts] = useState([]);
  const [displayLayouts, setDisplayLayouts] = useState([]);
  const [filter, setFilter] = useState('unique'); // 'all', 'unique', 'optimized', 'grid', 'split', 'composite'
  const [numColumns, setNumColumns] = useState(4);
  const [structureGroups, setStructureGroups] = useState({});
  
  useEffect(() => {
    // 计算合适的列数
    const updateColumnCount = () => {
      const width = window.innerWidth;
      if (width > 1600) setNumColumns(4);
      else if (width > 1200) setNumColumns(4);
      else if (width > 900) setNumColumns(3);
      else if (width > 600) setNumColumns(2);
      else if (width > 480) setNumColumns(1);
      else setNumColumns(1);
    };
    
    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);
  
  useEffect(() => {
    // Find and mark duplicate layouts
    const layoutMap = new Map();
    const structureGroupMap = {}; // 保存结构相同的布局组
    
    const processed = layouts.map((layout, index) => {
      // Create a unique identifier based on layout properties
      const layoutKey = generateLayoutKey(layout);
      
      // 添加到结构组
      if (!structureGroupMap[layoutKey]) {
        structureGroupMap[layoutKey] = {
          structures: [],
          bestScore: -1,
          bestIndex: -1
        };
      }
      
      // 存储该结构的所有布局
      structureGroupMap[layoutKey].structures.push(index);
      
      // 记录最高分的布局
      const score = layout.score || 0;
      if (score > structureGroupMap[layoutKey].bestScore) {
        structureGroupMap[layoutKey].bestScore = score;
        structureGroupMap[layoutKey].bestIndex = index;
      }
      
      if (layoutMap.has(layoutKey)) {
        // If we've seen this layout before, mark it as duplicate
        return { 
          ...layout, 
          isDuplicate: true, 
          duplicateOf: layoutMap.get(layoutKey), 
          originalIndex: index,
          structureGroup: layoutKey
        };
      } else {
        // Otherwise, record this as the first occurrence
        layoutMap.set(layoutKey, index);
        return { 
          ...layout, 
          isDuplicate: false, 
          originalIndex: index,
          structureGroup: layoutKey
        };
      }
    });
    
    setStructureGroups(structureGroupMap);
    setUniqueLayouts(processed);
  }, [layouts]);
  
  useEffect(() => {
    let filtered;
    
    // 根据过滤条件更新显示的布局
    if (filter === 'all') {
      filtered = uniqueLayouts;
    } else if (filter === 'unique') {
      // 对于unique过滤，只显示每个结构组的最佳布局
      const bestLayouts = new Set();
      Object.values(structureGroups).forEach(group => {
        if (group.bestIndex !== -1) {
          bestLayouts.add(group.bestIndex);
        }
      });
      
      filtered = uniqueLayouts.filter(layout => 
        bestLayouts.has(layout.originalIndex)
      );
    } else if (filter === 'optimized') {
      filtered = uniqueLayouts.filter(layout => layout.type === 'optimized');
    } else if (filter === 'grid') {
      filtered = uniqueLayouts.filter(layout => 
        layout.type === 'grid' || 
        (layout.name && layout.name.startsWith('grid-'))
      );
    } else if (filter === 'split') {
      filtered = uniqueLayouts.filter(layout => 
        layout.type === 'split' || 
        (layout.name && (layout.name.startsWith('hsplit-') || layout.name.startsWith('vsplit-')))
      );
    } else if (filter === 'composite') {
      filtered = uniqueLayouts.filter(layout => layout.type === 'composite');
    }
    
    // 按分数排序，同时在相同结构中尽可能显示最佳布局
    filtered.sort((a, b) => {
      // 对于相同结构的布局，按分数排序
      if (a.structureGroup === b.structureGroup) {
        return (b.score || 0) - (a.score || 0);
      }
      return (b.score || 0) - (a.score || 0);
    });
    
    setDisplayLayouts(filtered);
  }, [uniqueLayouts, filter, structureGroups]);
  
  // Generate a unique key for a layout based on its configuration
  const generateLayoutKey = (layout) => {
    // 如果没有单元格，无法进行结构比较
    if (!layout || !layout.cells || layout.cells.length === 0) {
      return `${layout.type || 'unknown'}_${layout.name || 'unnamed'}_${Date.now()}`;
    }
    
    // 按位置排序单元格
    const sortedCells = [...layout.cells].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    
    // 计算页面尺寸
    let maxX = 0, maxY = 0;
    sortedCells.forEach(cell => {
      maxX = Math.max(maxX, cell.x + cell.width);
      maxY = Math.max(maxY, cell.y + cell.height);
    });
    
    // 计算基于单元格几何形状的签名
    // 这里我们关注的是结构而不是名称
    let structureKey = '';
    
    // 首先添加单元格数量，这是最基本的区分
    structureKey += `cells_${sortedCells.length}_`;
    
    // 标准化单元格尺寸和位置
    const normalizedCells = sortedCells.map(cell => {
      return {
        x: Math.round((cell.x / maxX) * 1000) / 1000,
        y: Math.round((cell.y / maxY) * 1000) / 1000,
        width: Math.round((cell.width / maxX) * 1000) / 1000,
        height: Math.round((cell.height / maxY) * 1000) / 1000
      };
    });
    
    // 按位置和大小排序标准化后的单元格，确保相同结构但不同排列顺序的布局被识别为相同
    normalizedCells.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      if (a.width !== b.width) return a.width - b.width;
      return a.height - b.height;
    });
    
    // 生成最终的结构键
    normalizedCells.forEach(cell => {
      structureKey += `[${cell.x},${cell.y},${cell.width},${cell.height}]`;
    });
    
    return structureKey;
  };

  // 获取结构组信息
  const getStructureGroupInfo = (layout) => {
    if (!layout || !layout.structureGroup || !structureGroups[layout.structureGroup]) {
      return null;
    }
    
    const group = structureGroups[layout.structureGroup];
    const variantCount = group.structures.length;
    const isBest = layout.originalIndex === group.bestIndex;
    
    return { variantCount, isBest };
  };

  // Generate a visual representation of the layout structure
  const generateLayoutStructure = (layout) => {
    if (!layout || !layout.type) {
      return <div className="layout-structure">Unknown layout structure</div>;
    }
    
    // 处理网格布局
    if (layout.type === 'grid') {
      const match = layout.name.match(/grid-(\d+)x(\d+)/);
      if (match) {
        const rows = parseInt(match[1]);
        const cols = parseInt(match[2]);
        
        return (
          <div className="layout-structure">
            <div className="structure-title">Structure:</div>
            <div className="structure-grid" style={{gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)`}}>
              {Array.from({length: rows * cols}).map((_, i) => (
                <div key={i} className="grid-cell">{i + 1}</div>
              ))}
            </div>
            <div className="structure-desc">
              {rows} row{rows !== 1 ? 's' : ''} × {cols} column{cols !== 1 ? 's' : ''}
            </div>
          </div>
        );
      }
    }
    
    // 处理分割布局
    if (layout.type === 'split') {
      if (layout.name.startsWith('hsplit')) {
        const parts = layout.name.split('-');
        if (parts.length === 3) {
          const topCount = parseInt(parts[1]);
          const bottomCount = parseInt(parts[2]);
          
          return (
            <div className="layout-structure">
              <div className="structure-title">Structure:</div>
              <div className="structure-grid" style={{display: 'flex', flexDirection: 'column'}}>
                <div style={{display: 'flex', flex: 1}}>
                  {Array.from({length: topCount}).map((_, i) => (
                    <div key={i} className="grid-cell" style={{flex: 1}}>{i + 1}</div>
                  ))}
                </div>
                <div style={{display: 'flex', flex: 1}}>
                  {Array.from({length: bottomCount}).map((_, i) => (
                    <div key={i} className="grid-cell" style={{flex: 1}}>{i + topCount + 1}</div>
                  ))}
                </div>
              </div>
              <div className="structure-desc">
                Horizontal Split: {topCount} top + {bottomCount} bottom
              </div>
            </div>
          );
        }
      } else if (layout.name.startsWith('vsplit')) {
        const parts = layout.name.split('-');
        if (parts.length === 3) {
          const leftCount = parseInt(parts[1]);
          const rightCount = parseInt(parts[2]);
          
          return (
            <div className="layout-structure">
              <div className="structure-title">Structure:</div>
              <div className="structure-grid" style={{display: 'flex'}}>
                <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                  {Array.from({length: leftCount}).map((_, i) => (
                    <div key={i} className="grid-cell" style={{flex: 1}}>{i + 1}</div>
                  ))}
                </div>
                <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                  {Array.from({length: rightCount}).map((_, i) => (
                    <div key={i} className="grid-cell" style={{flex: 1}}>{i + leftCount + 1}</div>
                  ))}
                </div>
              </div>
              <div className="structure-desc">
                Vertical Split: {leftCount} left + {rightCount} right
              </div>
            </div>
          );
        }
      }
    }
    
    // 处理复合和优化布局
    if (layout.type === 'composite' || layout.type === 'optimized') {
      // 获取布局单元格
      const cells = layout.cells || [];
      if (cells.length === 0) {
        return <div className="layout-structure">Empty layout</div>;
      }
      
      // 按位置排序单元格
      const sortedCells = [...cells].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });
      
      // 获取页面尺寸或估计页面尺寸
      let pageWidth = 0;
      let pageHeight = 0;
      
      cells.forEach(cell => {
        pageWidth = Math.max(pageWidth, cell.x + cell.width);
        pageHeight = Math.max(pageHeight, cell.y + cell.height);
      });
      
      // 确定布局结构描述
      let structureDesc = '';
      switch(layout.name) {
        case 'left-one-right-two':
          structureDesc = "Left 1, Right 2 layout";
          break;
        case 'left-two-right-one':
          structureDesc = "Left 2, Right 1 layout";
          break;
        case 'three-three-one':
          structureDesc = "3-3-1 Layout";
          break;
        case 'two-three-two':
          structureDesc = "2-3-2 Layout";
          break;
        default:
          if (layout.type === 'optimized') {
            structureDesc = "Optimized: " + layout.name.replace('-optimized', '');
          } else {
            structureDesc = layout.name || "Custom layout";
          }
      }
      
      return (
        <div className="layout-structure nested-structure">
          <div className="structure-title">Structure:</div>
          <div className="nested-grid">
            {sortedCells.map((cell, i) => {
              const cellStyle = {
                left: `${(cell.x / pageWidth) * 100}%`,
                top: `${(cell.y / pageHeight) * 100}%`,
                width: `${(cell.width / pageWidth) * 100}%`,
                height: `${(cell.height / pageHeight) * 100}%`,
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
    
    // 默认情况
    return <div className="layout-structure">Unknown layout structure</div>;
  };

  // 获取布局类型显示名称
  const getLayoutTypeDisplay = (layout) => {
    if (!layout || !layout.type) return 'Unknown';
    
    if (layout.type === 'grid') {
      return 'Grid Layout';
    } else if (layout.type === 'split') {
      if (layout.name.startsWith('hsplit')) {
        return 'Horizontal Split';
      } else if (layout.name.startsWith('vsplit')) {
        return 'Vertical Split';
      }
      return 'Split Layout';
    } else if (layout.type === 'composite') {
      return 'Composite Layout';
    } else if (layout.type === 'optimized') {
      if (layout.name.includes('grid')) {
        return 'Optimized Grid';
      } else if (layout.name.includes('hsplit')) {
        return 'Optimized H-Split';
      } else if (layout.name.includes('vsplit')) {
        return 'Optimized V-Split';
      } else if (layout.name.includes('left-one')) {
        return 'Opt: Left 1, Right 2';
      } else if (layout.name.includes('left-two')) {
        return 'Opt: Left 2, Right 1';
      }
      return 'Optimized Layout';
    }
    
    return layout.type.charAt(0).toUpperCase() + layout.type.slice(1);
  };

  // 获取唯一结构数
  const getUniqueStructureCount = () => {
    return Object.keys(structureGroups).length;
  };

  return (
    <div className="layout-grid">
      <div className="layout-header-controls">
        <h2>Generated Layouts ({getUniqueStructureCount()} unique structures, {layouts.length} total)</h2>
        <div className="filter-controls">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All Variants</button>
          <button className={filter === 'unique' ? 'active' : ''} onClick={() => setFilter('unique')}>Unique Only</button>
          <button className={filter === 'grid' ? 'active' : ''} onClick={() => setFilter('grid')}>Grid</button>
          <button className={filter === 'split' ? 'active' : ''} onClick={() => setFilter('split')}>Split</button>
          <button className={filter === 'composite' ? 'active' : ''} onClick={() => setFilter('composite')}>Composite</button>
          <button className={filter === 'optimized' ? 'active' : ''} onClick={() => setFilter('optimized')}>Optimized</button>
        </div>
      </div>
      
      <div className="layouts-container" style={{gridTemplateColumns: `repeat(${numColumns}, 1fr)`}}>
        {displayLayouts.map((layout) => {
          const groupInfo = getStructureGroupInfo(layout);
          const isBestInGroup = groupInfo && groupInfo.isBest;
          const variantCount = groupInfo ? groupInfo.variantCount : 1;
          const hasSimilar = variantCount > 1;
          
          return (
            <div 
              key={layout.originalIndex} 
              className={`layout-item ${layout.isDuplicate ? 'duplicate-layout' : ''} ${isBestInGroup ? 'best-layout' : ''}`}
            >
              <div className="layout-header">
                <div className="layout-number">#{layout.originalIndex + 1}</div>
                <div className="layout-badges">
                  {hasSimilar && (
                    <div className="similar-badge" title="There are similar layouts with the same structure">
                      {variantCount} variants
                    </div>
                  )}
                  {isBestInGroup && hasSimilar && (
                    <div className="best-badge" title="This is the highest-scoring layout in this structure group">
                      Best Variant
                    </div>
                  )}
                  {layout.isDuplicate && (
                    <div className="duplicate-badge">
                      Duplicate of #{layout.duplicateOf + 1}
                    </div>
                  )}
                </div>
              </div>
              <LayoutPreview layout={layout} pageSize={pageSize} />
              <div className="layout-info">
                <div className="layout-type">
                  {getLayoutTypeDisplay(layout)}
                </div>
                {generateLayoutStructure(layout)}
              </div>
              <ScoreDisplay layout={layout} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LayoutGrid; 