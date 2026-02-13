/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        cream: 'rgb(var(--color-cream-rgb) / <alpha-value>)',
        ink: 'rgb(var(--color-ink-rgb) / <alpha-value>)',
        navy: 'rgb(var(--color-navy-rgb) / <alpha-value>)',
        oldGold: 'rgb(var(--color-oldGold-rgb) / <alpha-value>)',
        stone: 'rgb(var(--color-stone-rgb) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
        sans: ['var(--font-sans)'],
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
}
