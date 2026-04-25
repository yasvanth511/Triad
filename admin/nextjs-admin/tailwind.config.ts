import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', '"Plus Jakarta Sans"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Fraunces', 'serif'],
      },
      colors: {
        ink: '#241636',
        'muted-ink': '#6a5a84',
        accent: '#7c4dff',
        secondary: '#db2677',
      },
    },
  },
  plugins: [],
};

export default config;
