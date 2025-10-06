import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  srcDir: 'src',
  publicDir: 'public',
  base: '/mouthpiece001/',
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },
  build: {
    format: 'file',
    inlineStylesheets: 'always'
  },
  vite: {
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 3,
          pure_funcs: ['console.log'],
          unsafe: true,
          unsafe_comps: true,
          unsafe_math: true
        },
        format: {
          comments: false
        }
      },
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          compact: true
        }
      },
      chunkSizeWarningLimit: 1500,
      assetsInlineLimit: 8192
    },
    css: {
      postcss: {
        plugins: []
      }
    }
  },
  server: {
    host: true
  },
  integrations: [tailwind()]
});
