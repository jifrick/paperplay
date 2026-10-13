import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: 'localhost', port: 5173 },
  preview: { host: 'localhost', port: 4173 },
  test: {
    environment: 'jsdom',
    setupFiles: './src/testSetup.ts',
    globals: true,
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
