/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // The dashboards' palette (see dashboards/*.html :root)
        accent: {
          DEFAULT: '#7c5cff',
          hi: '#a08cff',
          lo: '#5b3fe0',
        },
        ink: {
          0: '#070A12',
          1: '#0B1020',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
