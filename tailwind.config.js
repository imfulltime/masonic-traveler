/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary = Deep Masonic Navy (was sky blue)
        primary: {
          50: '#f0f3fa',
          100: '#dde4f4',
          200: '#bdcae9',
          300: '#94a8d8',
          400: '#6a85c4',
          500: '#4a66ad',
          600: '#3a4f8e',
          700: '#2e3f72',
          800: '#1e3a8a',
          900: '#15275f',
          950: '#0a1538',
        },
        // Accent = Antique Gold
        gold: {
          50: '#fdf9ec',
          100: '#faf0c9',
          200: '#f5e190',
          300: '#eecc55',
          400: '#e8b730',
          500: '#D4AF37',
          600: '#b8862c',
          700: '#955f25',
          800: '#7a4b25',
          900: '#683f24',
          950: '#3c2110',
        },
        // Refined neutrals — warmer, more luxurious
        ivory: {
          50: '#fdfcf8',
          100: '#faf7ed',
          200: '#f3eddb',
          300: '#e8dcb8',
          400: '#d4c391',
          500: '#bca974',
        },
        ink: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#d8dde6',
          300: '#b6bfd0',
          400: '#8d99b0',
          500: '#6c7891',
          600: '#535e75',
          700: '#414a5d',
          800: '#2d3343',
          900: '#1a1f2c',
          950: '#0d1018',
        },
        masonic: {
          gold: '#D4AF37',
          'gold-light': '#E8C76B',
          'gold-dark': '#B8862C',
          blue: '#1e3a8a',
          'blue-light': '#3a4f8e',
          'blue-dark': '#0a1538',
          ink: '#1a1f2c',
          ivory: '#faf7ed',
        },
      },
      fontFamily: {
        // Clean, Arial-style sans-serif throughout. System fonts give native
        // platform feel + zero load cost. Falls back to Arial/Helvetica.
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"'],
        // Aliased to sans so existing font-serif/font-display classes still work
        serif: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.02em',
        regal: '0.08em',
      },
      boxShadow: {
        'luxe': '0 10px 40px -10px rgba(26, 31, 44, 0.25), 0 4px 12px -4px rgba(26, 31, 44, 0.1)',
        'luxe-lg': '0 25px 70px -15px rgba(26, 31, 44, 0.35), 0 10px 25px -5px rgba(26, 31, 44, 0.15)',
        'gold': '0 4px 20px -4px rgba(212, 175, 55, 0.4)',
        'gold-glow': '0 0 0 1px rgba(212, 175, 55, 0.3), 0 8px 30px -8px rgba(212, 175, 55, 0.5)',
        'inner-luxe': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #E8C76B 50%, #B8862C 100%)',
        'navy-gradient': 'linear-gradient(135deg, #0a1538 0%, #1e3a8a 50%, #2e3f72 100%)',
        'navy-gold-gradient': 'linear-gradient(135deg, #0a1538 0%, #1e3a8a 60%, #D4AF37 100%)',
        'ivory-shine': 'linear-gradient(180deg, #fdfcf8 0%, #faf7ed 100%)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
