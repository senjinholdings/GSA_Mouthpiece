import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'public',
  // base: '/', // Vercel uses root path by default
  build: {
    format: 'file'
  },
  server: {
    host: true
  },
  integrations: [tailwind()]
});
