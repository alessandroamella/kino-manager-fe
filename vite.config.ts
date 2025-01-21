import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'esbuild',
    target: 'es2015',
    cssMinify: 'lightningcss',
  },
  server: {
    proxy: {
      '/v1': {
        target: 'https://backend:5000',
        changeOrigin: true,
      },
    },
  },
});
