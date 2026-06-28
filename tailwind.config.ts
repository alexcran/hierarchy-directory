import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FAF8F5',
        surface: '#F0ECE4',
        'text-primary': '#1A1714',
        'text-secondary': '#6B6560',
        'text-tertiary': '#9C958D',
        burgundy: {
          DEFAULT: '#7A1B2E',
          hover: '#5C1422',
        },
        scarlet: '#C41E3A',
        'episcopal-green': '#007A00',
        border: '#DDD8D0',
        tag: '#E8E3DB',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'Palatino', 'Palatino Linotype', 'serif'],
        body: ['var(--font-body)', 'Public Sans', 'sans-serif'],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}

export default config
