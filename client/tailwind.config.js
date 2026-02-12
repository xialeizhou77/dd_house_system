/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B263B',
          light: '#2A3A52',
          dark: '#0F172A',
          50: '#E8EBF0',
          100: '#C5CCD9',
          200: '#9EA9BD',
        },
        secondary: {
          DEFAULT: '#C5A059',
          light: '#D4B876',
          dark: '#A8863D',
          50: '#F7F3EB',
          100: '#EFE6D6',
          200: '#DFCCAD',
        },
        background: '#F8F9FA',
        'text-main': '#0F172A',
        'text-muted': '#64748B',
        status: {
          available: '#10B981',
          reserved: '#F59E0B',
          sold: '#E2E8F0',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter Variable', 'Noto Sans SC Variable', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
        'gold': '0 4px 14px 0 rgba(197, 160, 89, 0.25)',
        'gold-glow': '0 0 0 3px rgba(197, 160, 89, 0.35)',
        'indigo-lg': '0 20px 25px -5px rgba(27, 38, 59, 0.1), 0 8px 10px -6px rgba(27, 38, 59, 0.08)',
        'indigo-glow': '0 0 0 3px rgba(27, 38, 59, 0.15)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        'glass-xl': '24px',
      },
      borderRadius: {
        'glass': '16px',
        'glass-sm': '12px',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
