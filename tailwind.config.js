/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'body': ['Exo 2', 'sans-serif'],
      },
      colors: {
        cosmic: {
          900: '#0a0a1a',
          800: '#12122a',
          700: '#1a1a3a',
          600: '#2a2a5a',
          500: '#4a4a8a',
          400: '#6a6aaa',
          300: '#8a8aca',
          200: '#aaaadd',
          100: '#ccccee',
        },
        nebula: {
          pink: '#ff6b9d',
          purple: '#c471ed',
          blue: '#12c2e9',
          cyan: '#00f5d4',
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(196, 113, 237, 0.5), 0 0 10px rgba(196, 113, 237, 0.3)' },
          '100%': { boxShadow: '0 0 15px rgba(196, 113, 237, 0.8), 0 0 25px rgba(196, 113, 237, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}





