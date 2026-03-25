/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './assets/**/*.{js,html}', './assets/js/ui/views/**/*.js', './components/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Crimson Pro', 'Georgia', 'serif'],
      },
      colors: {
        nl: {
          bg: '#0c0e12',
          surface: '#13161c',
          raised: '#1a1f28',
          border: '#2a3140',
          muted: '#8b95a8',
          accent: '#6366f1',
          accentMuted: '#4f46e5',
        },
      },
    },
  },
  plugins: [],
};
