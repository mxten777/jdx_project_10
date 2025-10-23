/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        pastelBlue: '#A7C7E7',
        cream: '#FFFDD0',
        accent: '#6C90C7',
        softGray: '#F7F7FA',
      },
      fontFamily: {
        sans: ['Avenir', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgba(100, 150, 200, 0.08)',
      },
      screens: {
        'xs': '400px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
}

