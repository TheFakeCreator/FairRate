/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'imdb-yellow': '#F5C518',
        'imdb-dark': '#121212',
        'imdb-darker': '#000000',
        'imdb-border': '#2b2b2b',
      }
    },
  },
  plugins: [],
}

