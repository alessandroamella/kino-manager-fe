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
      keyframes: {
        'border-pulse': {
          '0%, 100%': { backgroundColor: 'background' },
          '50%': { backgroundColor: 'red' },
        },
      },
      animation: {
        'border-loop': 'border-pulse 0.5s infinite ease-in-out',
      },
      colors: {
        kino: {
          // Keep kino colors for potential other uses
          50: '#fffbe6',
          100: '#fff7cc',
          200: '#fff3aa',
          300: '#ffee88',
          400: '#ffe666',
          500: '#f7d400',
          600: '#e6c300',
          700: '#d4b200',
          800: '#c2a100',
          900: '#b09000',
          950: '#8e7000',
        },
        ...colors, // Optionally keep default Tailwind colors
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
            background: {
              // Define background palette for light theme (white -> black)
              50: '#f9f9f9', // Example light shades - adjust as needed
              100: '#f2f2f2',
              200: '#f0f0f0',
              300: '#e9e9e9',
              400: '#e2e2e2',
              500: '#dbdbdb',
              600: '#d4d4d4',
              700: '#cdcdcd',
              800: '#c6c6c6',
              900: '#bfbfbf',
              950: '#b0b0b0',
              DEFAULT: '#fff', // Default light background
              foreground: '#000', // Default light foreground if needed for background
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: '#d0af1a',
              foreground: '#fff',
            },
            background: {
              // Define background palette for dark theme
              50: '#0a0a0a', // Example dark shades - adjust as needed
              100: '#141414',
              200: '#212121',
              300: '#2e2e2e',
              400: '#3b3b3b',
              500: '#484848',
              600: '#555555',
              700: '#626262',
              800: '#6f6f6f',
              900: '#7d7d7d',
              950: '#8e8e8e',
              DEFAULT: '#000', // Default dark background
              foreground: '#fff', // Default dark foreground if needed for background
            },
          },
        },
      },
    }),
  ],
};
