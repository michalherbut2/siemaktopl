/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ "./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        discord: {
          blurple: '#5865F2',
          dark: '#2C2F33',
          darker: '#23272A',
          light: '#99AAB5'
        }
      }
    },
  },
  plugins: [],
};
