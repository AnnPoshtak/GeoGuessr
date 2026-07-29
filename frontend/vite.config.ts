import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import ViteYaml from '@modyfi/vite-plugin-yaml';

const viteConf = defineConfig({
  plugins: [react(), tailwindcss(), ViteYaml()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '#root': path.resolve(__dirname, '..'),
    },
  },
});

const vitestConf = defineVitestConfig({
  test: {
    globals: true, 
    environment: 'jsdom',         
    setupFiles: ['./vitest.setup.ts'], 
  },
});

export default mergeConfig(viteConf, vitestConf);