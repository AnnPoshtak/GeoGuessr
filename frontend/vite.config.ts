import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

// https://vite.dev/config/
const viteConf = defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});

const vitestConf = defineVitestConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' }
      ]
    },
    setupFiles: ['./vitest.setup.ts']
  }
});

export default mergeConfig(viteConf, vitestConf);