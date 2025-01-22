const { heroui, colors } = require('@heroui/react');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        kino: {
          50: '#fffbe6', // Very Light
          100: '#fff7cc', // Lighter
          200: '#fff3aa',
          300: '#ffee88',
          400: '#ffe666',
          500: '#f7d400', // DEFAULT - Your base color
          600: '#e6c300',
          700: '#d4b200',
          800: '#c2a100',
          900: '#b09000', // Darker
          950: '#8e7000', // Very Dark
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: {
              DEFAULT: '#f7d400',
              foreground: '#000',
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: '#d0af1a',
              foreground: '#fff',
            },
          },
        },
      },
    }),
  ],
};
