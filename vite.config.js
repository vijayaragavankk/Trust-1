import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: true, // accessible on local network (mobile testing)
  },

  build: {
    // Raise the chunk-size warning threshold so Razorpay/firebase don't
    // trigger false-positive warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // BUG FIX: split vendor chunks so the app doesn't ship one giant bundle
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          react:    ['react', 'react-dom', 'react-router-dom'],
          icons:    ['react-icons'],
        },
      },
    },
  },
});
