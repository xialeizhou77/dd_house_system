/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Primary - Slate deep backgrounds */
        background: {
          DEFAULT: '#0F172A',     /* Slate 900 - main bg */
          card: '#1E293B',       /* Slate 800 - card bg */
          elevated: '#334155',   /* Slate 700 */
        },
        /* Primary - Champagne Gold */
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E5C76B',
          dark: '#B8962E',
          50: '#FDF8E8',
          100: '#FAF0D1',
          200: '#F5E4A8',
          500: '#D4AF37',
        },
        primary: {
          DEFAULT: '#D4AF37',
          light: '#E5C76B',
          dark: '#B8962E',
          50: '#FDF8E8',
          100: '#FAF0D1',
          200: '#F5E4A8',
        },
        /* Functional - Status */
        status: {
          available: '#34D399',   /* Mint / Emerald 400 - modern mint */
          'available-glow': 'rgba(52, 211, 153, 0.35)',
          sold: '#F43F5E',        /* Rose 500 - soft red */
          'sold-muted': '#94A3B8', /* Slate 400 - subtle gray alternative */
          reserved: '#FBBF24',    /* Amber 400 */
        },
        /* Text */
        'text-primary': '#E2E8F0',   /* Slate 200 */
        'text-muted': '#94A3B8',     /* Slate 400 */
        'text-tertiary': '#64748B',  /* Slate 500 */
        slate: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Inter Variable', 'Noto Sans SC Variable', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.4)',
        'glass-lg': '0 8px 32px 0 rgba(15, 23, 42, 0.5)',
        'gold': '0 4px 14px 0 rgba(212, 175, 55, 0.25)',
        'gold-lg': '0 10px 40px -10px rgba(212, 175, 55, 0.3)',
        'gold-glow': '0 0 0 3px rgba(212, 175, 55, 0.35)',
        'gold-glow-strong': '0 0 20px rgba(212, 175, 55, 0.25)',
        'mint-glow': '0 0 20px rgba(52, 211, 153, 0.2)',
        'card': '0 4px 24px -4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        'glass-xl': '24px',
      },
      borderRadius: {
        'glass': '16px',
        'glass-sm': '12px',
        'card': '1rem',
        'card-lg': '1.5rem',
        'card-xl': '2rem',
      },
      letterSpacing: {
        'heading': '0.05em',
        'wide': '0.05em',
      },
      lineHeight: {
        'relaxed': '1.65',
        'loose': '1.75',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
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
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(212, 175, 55, 0.35)' },
        },
      },
    },
  },
  plugins: [],
};
