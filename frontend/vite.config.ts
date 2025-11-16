import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'dfinity': ['@dfinity/agent', '@dfinity/auth-client', '@dfinity/candid', '@dfinity/principal'],
        },
      },
    },
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    sourcemap: false,
  },
})
