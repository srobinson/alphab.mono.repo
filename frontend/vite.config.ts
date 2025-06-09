import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Configure the server to handle client-side routing
    port: 3000,
    strictPort: true,
    open: true,
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
  base: '/',
});
