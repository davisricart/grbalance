import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // Enable fast refresh for faster development
    fastRefresh: true
  })],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    // Optimize file watching for better performance
    watch: {
      usePolling: false, // Use native file system events instead of polling
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    // Remove CSP headers in development for faster loading
    // headers: {
    //   'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:; object-src 'none'; base-uri 'self';"
    // }
  },
  // Aggressive dependency pre-bundling for faster dev startup
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@supabase/supabase-js',
      'react-icons/fi',
      'lucide-react',
      'papaparse'
    ],
    exclude: ['xlsx'], // Exclude large deps that slow down dev server startup
    force: true // Force re-optimization
  },
  // Enable esbuild for faster builds
  esbuild: {
    target: 'esnext',
    format: 'esm'
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
          'vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
})