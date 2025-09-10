/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Waylight brand colors
        ink: {
          DEFAULT: '#0F172A',
          light: '#475569',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          dark: '#E2E8F0',
        },
        sea: {
          DEFAULT: '#0EA5A8',
          light: '#22D3EE',
          dark: '#0891B2',
        },
        glow: {
          DEFAULT: '#FBBF24',
          light: '#FCD34D',
          dark: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};