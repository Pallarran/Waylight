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
          DEFAULT: '#4ECDC4', // Updated to match logo turquoise
          light: '#6EE7E0',   // Lighter variant
          dark: '#0EA5A8',    // Darker variant (original PRD color)
          darker: '#0891B2',  // Even darker for contrast
        },
        glow: {
          DEFAULT: '#FBBF24',
          light: '#FCD34D',
          dark: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'Manrope_400Regular', 'System'],
        'sans-medium': ['Inter_500Medium', 'Manrope_500Medium', 'System'], 
        'sans-semibold': ['Inter_600SemiBold', 'Manrope_600SemiBold', 'System'],
        'sans-bold': ['Inter_700Bold', 'Manrope_700Bold', 'System'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'sparkle': 'sparkle 0.8s ease-in-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { 
            transform: 'translateY(10px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          },
        },
        slideDown: {
          '0%': { 
            transform: 'translateY(-10px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          },
        },
        scaleIn: {
          '0%': { 
            transform: 'scale(0.95)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
        },
        sparkle: {
          '0%': { 
            transform: 'scale(0.8) rotate(-45deg)',
            opacity: '0'
          },
          '50%': { 
            transform: 'scale(1.2) rotate(0deg)',
            opacity: '1'
          },
          '100%': { 
            transform: 'scale(0.8) rotate(45deg)',
            opacity: '0'
          },
        },
        pulseSoft: {
          '0%, 100%': { 
            opacity: '0.6',
            transform: 'scale(1)'
          },
          '50%': { 
            opacity: '0.8',
            transform: 'scale(1.05)'
          },
        },
      },
    },
  },
  plugins: [],
};