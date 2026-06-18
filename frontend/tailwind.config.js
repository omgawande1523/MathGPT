/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        math: {
          dark: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          accent: '#58a6ff',
          success: '#2ea043',
          purple: '#ab7df8'
        }
      }
    },
  },
  plugins: [],
}
