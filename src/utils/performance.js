// تحسين الأداء وتسريع التحميل

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

