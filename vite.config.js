import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: false,
    // Allow overlay to be dismissed
    hmr: {
      overlay: true
    },
    // Optimize file watching for better performance
    watch: {
      usePolling: false, // Use native file system events instead of polling
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    // Remove CSP headers in development for faster loading
    headers: {
      // Remove CSP in development for speed
    }
  },
  // Strategic dependency optimization for performance
  optimizeDeps: {
    // Force include stable, frequently used dependencies
    include: [
      'react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'
    ],
    
    // Exclude heavy/conditional dependencies for on-demand loading
    exclude: [
      'xlsx', 'react-icons/fi', 
      'papaparse', 'react-helmet-async'
    ],
    
    esbuildOptions: {
      target: 'es2020',
      // Optimize for modern browsers
      supported: {
        'dynamic-import': true,
        'import-meta': true
      }
    }
  },
  // Enable esbuild for faster builds
  esbuild: {
    target: 'esnext',
    format: 'esm'
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Optimized file naming for better caching
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // Strategic manual chunking for better caching
        manualChunks: {
          // Core framework (most stable, cache-friendly)
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          
          // UI libraries (only include what's actually installed)
          // 'ui-headless': ['@headlessui/react'], // Not installed
          // 'ui-icons': ['@heroicons/react/24/outline'], // Not installed
          
          // Feature-specific chunks
          'auth': ['@supabase/supabase-js'],
          'admin-utils': ['react-helmet-async'],
          
          // Keep xlsx dynamic - never chunk it for on-demand loading
        }
      }
    }
  }
})