import { useState, useEffect, useMemo } from 'react';

export const useVirtualization = (items, containerHeight, itemHeight, overscan = 5) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      ...item,
      index: visibleRange.startIndex + index
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

export default useVirtualization;

