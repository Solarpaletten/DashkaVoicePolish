/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dashka-blue': '#7c3aed',
        'dashka-green': '#10b981',
        'dashka-coral': '#f87171'
      }
    },
  },
  plugins: [],
}
