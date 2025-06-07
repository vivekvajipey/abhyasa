import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#a8c09a',
          light: '#c2d4b8',
          dark: '#8fa682',
        },
        sky: {
          DEFAULT: '#87ceeb',
          light: '#b8e3f5',
          dark: '#5fb8e0',
        },
        lavender: {
          DEFAULT: '#e6e6fa',
          light: '#f2f2fc',
          dark: '#d4d4f0',
        },
        coral: {
          DEFAULT: '#ffb6c1',
          light: '#ffd4dc',
          dark: '#ff8fa3',
        },
        neutral: {
          warm: '#f5f5dc',
          off: '#fafaf8',
          soft: '#f0f0f0',
        },
      },
      fontFamily: {
        'nunito': ['Nunito', 'sans-serif'],
        'quicksand': ['Quicksand', 'sans-serif'],
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '25px',
        '3xl': '30px',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease',
        'slide-up': 'slideUp 0.8s ease',
        'float': 'float 20s infinite ease-in-out',
        'shimmer': 'shimmer 2s infinite',
        'grow-progress': 'growProgress 1.5s ease',
      },
      keyframes: {
        fadeIn: {
          'from': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translate(0, 0) rotate(0deg)',
          },
          '50%': {
            transform: 'translate(30px, -30px) rotate(180deg)',
          },
        },
        shimmer: {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        growProgress: {
          'from': {
            width: '0',
          },
          'to': {
            width: '35%',
          },
        },
      },
      boxShadow: {
        'light': '0 5px 20px rgba(0, 0, 0, 0.05)',
        'medium': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'heavy': '0 15px 40px rgba(0, 0, 0, 0.15)',
        'sage': '0 10px 30px rgba(168, 192, 154, 0.3)',
        'coral': '0 10px 30px rgba(255, 182, 193, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config