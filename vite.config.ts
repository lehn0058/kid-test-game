import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000, // Phaser is ~1.5 MB bundled; suppress false-positive warning
  },
});
