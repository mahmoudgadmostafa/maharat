// تحسين الأداء وتسريع التحميل
import React, { useRef, useCallback, useEffect } from 'react';

// تحسين تحميل الصور
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// تحسين تحميل الخطوط
export const preloadFont = (fontUrl) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.crossOrigin = 'anonymous';
  link.href = fontUrl;
  document.head.appendChild(link);
};

// تحسين تحميل الموارد الحرجة
export const preloadCriticalResources = () => {
  // تحميل مسبق للخطوط المهمة
  const criticalFonts = [
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
  ];
  
  criticalFonts.forEach(font => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = font;
    document.head.appendChild(link);
  });
};

// تحسين الذاكرة
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// تحسين الشبكة
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// مراقبة الأداء
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

// تحسين التخزين المؤقت
export const createCache = (maxSize = 100) => {
  const cache = new Map();
  
  return {
    get: (key) => cache.get(key),
    set: (key, value) => {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    has: (key) => cache.has(key),
    clear: () => cache.clear()
  };
};

// تحسين Firebase
export const batchFirebaseOperations = (operations, batchSize = 500) => {
  const batches = [];
  for (let i = 0; i < operations.length; i += batchSize) {
    batches.push(operations.slice(i, i + batchSize));
  }
  return batches;
};

// تحسين الرسوم المتحركة
export const useAnimationFrame = (callback) => {
  const requestRef = useRef();
  
  const animate = useCallback(() => {
    callback();
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);
};

// تحسين الذاكرة للمكونات
export const memoizeComponent = (Component, areEqual) => {
  return React.memo(Component, areEqual);
};

// تحسين استعلامات Firebase
export const optimizeFirebaseQuery = (query, limit = 50) => {
  return query.limit(limit);
};

// تحسين التحميل التدريجي
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// تحسين معالجة الأخطاء
export const withErrorBoundary = (Component, fallback) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error) {
      return { hasError: true };
    }
    
    componentDidCatch(error, errorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    render() {
      if (this.state.hasError) {
        return fallback || <div>حدث خطأ في التطبيق</div>;
      }
      
      return <Component {...this.props} />;
    }
  };
};

// تحسين تحميل البيانات
export const createDataLoader = () => {
  const cache = new Map();
  const loading = new Set();
  
  return {
    async load(key, fetcher) {
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      if (loading.has(key)) {
        return new Promise(resolve => {
          const checkCache = () => {
            if (cache.has(key)) {
              resolve(cache.get(key));
            } else {
              setTimeout(checkCache, 10);
            }
          };
          checkCache();
        });
      }
      
      loading.add(key);
      try {
        const data = await fetcher();
        cache.set(key, data);
        return data;
      } finally {
        loading.delete(key);
      }
    },
    
    invalidate(key) {
      cache.delete(key);
    },
    
    clear() {
      cache.clear();
    }
  };
};

