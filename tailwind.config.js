/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
          pastelBlue: '#E6F0FF',
          cream: '#FFF9F0',
          accent: '#5B8CFF',
          softGray: '#F5F6FA',
      },
      fontFamily: {
          sans: [
            'Pretendard',
            'Inter',
            'Apple SD Gothic Neo',
            'Segoe UI',
            'Roboto',
            'sans-serif',
          ],
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

