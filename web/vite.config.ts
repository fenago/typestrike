import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', '@xenova/transformers'],
  },
});
