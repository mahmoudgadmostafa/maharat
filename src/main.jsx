import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { preloadCriticalResources } from '@/utils/performance';

// تحميل الموارد الحرجة مسبقاً
preloadCriticalResources();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
