import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createDataLoader, debounce } from '@/utils/performance';

const FirebaseContext = createContext();

export const useOptimizedFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useOptimizedFirebase must be used within OptimizedFirebaseProvider');
  }
  return context;
};

export const OptimizedFirebaseProvider = ({ children }) => {
  const [dataLoader] = useState(() => createDataLoader());
  const [connectionState, setConnectionState] = useState('connected');

  // تحسين الاستعلامات بالتجميع
  const batchQueries = useCallback(
    debounce((queries) => {
      // تنفيذ الاستعلامات المجمعة
      queries.forEach(query => query());
    }, 100),
    []
  );

  // مراقبة حالة الاتصال
  useEffect(() => {
    const handleOnline = () => setConnectionState('connected');
    const handleOffline = () => setConnectionState('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // تحسين التخزين المؤقت للبيانات
  const getCachedData = useCallback((key, fetcher) => {
    return dataLoader.load(key, fetcher);
  }, [dataLoader]);

  // تنظيف التخزين المؤقت
  const clearCache = useCallback((key) => {
    if (key) {
      dataLoader.invalidate(key);
    } else {
      dataLoader.clear();
    }
  }, [dataLoader]);

  const value = {
    getCachedData,
    clearCache,
    batchQueries,
    connectionState,
    isOnline: connectionState === 'connected'
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

export default OptimizedFirebaseProvider;

