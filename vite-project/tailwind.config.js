/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        stellar: {
          blue: '#001f4d',
          lightblue: '#0066cc',
          gray: '#f7f7f8',
        },
      },
    },
  },
  plugins: [],
}
