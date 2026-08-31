/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tv: {
          bg: '#0b0f19',
          surface: '#131b2e',
          card: '#1a243b',
          border: '#243254',
          accent: '#3b82f6',
          accentHover: '#2563eb',
          gold: '#eab308'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'tv-focus': '0 0 0 3px #3b82f6, 0 10px 25px -5px rgba(59, 130, 246, 0.5)',
      }
    },
  },
  plugins: [],
}
