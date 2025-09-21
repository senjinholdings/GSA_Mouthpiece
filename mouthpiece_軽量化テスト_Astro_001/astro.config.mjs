import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'public',
  build: {
    format: 'file'
  },
  server: {
    host: true
  }
});
