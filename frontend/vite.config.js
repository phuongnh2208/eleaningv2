import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Keep REACT_APP_* env var naming (instead of Vite's default VITE_*) so this
// matches the .env contract requested for this project.
export default defineConfig({
  plugins: [react()],
  envPrefix: 'REACT_APP_',
  server: {
    port: 3001,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
