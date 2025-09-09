export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'dashka': {
          'primary': '#667eea',
          'secondary': '#764ba2',
          'accent': '#4ecdc4',
          'error': '#ff6b6b',
          'success': '#2ecc71'
        }
      },
      backgroundImage: {
        'gradient-dashka': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    }
  },
  plugins: []
}
