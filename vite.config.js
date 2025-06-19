import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 100
    },
    // Ensure CSP headers don't conflict with our meta tag
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.google.com wss://*.firebaseio.com https://*.cloudfunctions.net https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.supabase.co; img-src 'self' data: https:; object-src 'none'; base-uri 'self';"
    }
  },
  optimizeDeps: {
    include: ['xlsx']
  },
  build: {
    // Increase chunk size warning limit to reduce build warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // CACHE BUSTING: Force new filenames with hashes
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manually chunk large dependencies
        manualChunks: {
          'xlsx': ['xlsx'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
})