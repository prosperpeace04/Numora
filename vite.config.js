import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        auth: resolve(__dirname, 'auth.html'),
        dashboard: resolve(__dirname, 'numora-dashboard.html'),
      },
    },
  },
});
