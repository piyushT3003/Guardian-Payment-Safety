/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        navy: {
          800: '#0f172a',
          900: '#0a0f1d',
          950: '#060a13',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft-purple': '0 8px 30px -4px rgba(124, 58, 237, 0.12)',
        'card': '0 2px 14px 0 rgba(100, 116, 139, 0.06)',
        'card-hover': '0 10px 30px -4px rgba(100, 116, 139, 0.12)',
      }
    },
  },
  plugins: [],
}
