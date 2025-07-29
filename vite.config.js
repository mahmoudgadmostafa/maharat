import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // تحسين البناء
    rollupOptions: {
      output: {
        manualChunks: {
          // تقسيم المكتبات الكبيرة
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'chart-vendor': ['recharts'],
          'radix-vendor': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ],
          'pdf-vendor': ['react-pdf', '@react-pdf-viewer/core'],
          'excel-vendor': ['xlsx']
        },
      },
    },
    // تحسين الضغط
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // تحسين حجم الملفات
    chunkSizeWarningLimit: 500,
    // تحسين الـ CSS
    cssCodeSplit: true,
    // تحسين الـ sourcemap
    sourcemap: false,
  },
  // تحسين الخادم التطويري
  server: {
    hmr: {
      overlay: false,
    },
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
  // تحسين التحميل
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'firebase/app', 
      'firebase/auth', 
      'firebase/firestore',
      'framer-motion',
      'lucide-react',
      'recharts'
    ],
    exclude: ['@react-pdf-viewer/core', 'react-pdf']
  },
})


