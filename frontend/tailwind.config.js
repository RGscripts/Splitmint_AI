/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F8FAFC',
        app: '#F8FAFC',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        border: '#E5E7EB',
        primary: '#2563EB',
        'primary-dark': '#1D4ED8',
        accent: '#2563EB',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#D97706',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
