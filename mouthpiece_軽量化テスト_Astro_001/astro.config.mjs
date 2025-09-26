import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'public',
  base: '/mouthpiece_軽量化テスト_Astro_001/',
  build: {
    format: 'file'
  },
  server: {
    host: true
  }
});
