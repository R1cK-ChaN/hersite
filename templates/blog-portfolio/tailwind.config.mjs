/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        cream: '#F5F2EC',
        ink: '#1A1A1A',
        navy: '#1C3A5E',
        gold: '#8B7355',
        oldGold: '#8B7355',
        stone: '#D4CFC7',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
}
