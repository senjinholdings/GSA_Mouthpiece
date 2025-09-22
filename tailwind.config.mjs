/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
      },
      maxWidth: {
        'container': '768px',
      },
    },
  },
  plugins: [],
}