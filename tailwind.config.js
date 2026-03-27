/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0052D9',
          light: '#366EF4',
          lighter: '#618DFF',
        },
        background: {
          DEFAULT: '#FFFFFF',
          gray: '#F3F4F6',
          dark: '#1F1F1F',
        },
        text: {
          DEFAULT: '#1F1F1F',
          secondary: '#4B5563',
          muted: '#9CA3AF',
        },
        success: '#00A870',
        error: '#E34D59',
        warning: '#ED7B2F',
        task: {
          blue: '#618DFF',
          green: '#2BA47D',
          orange: '#ED7B2F',
          red: '#E34D59',
          purple: '#9F6FFF',
          gray: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['PingFang SC', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'spring-bounce': 'springBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'panel-enter': 'panelEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'panel-leave': 'panelLeave 0.2s ease-in',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        springBounce: {
          '0%': { transform: 'scale(1.02)' },
          '30%': { transform: 'scale(0.98)' },
          '50%': { transform: 'scale(1.01)' },
          '70%': { transform: 'scale(0.995)' },
          '100%': { transform: 'scale(1)' },
        },
        panelEnter: {
          '0%': { opacity: '0', transform: 'translateX(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        panelLeave: {
          '0%': { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(20px) scale(0.95)' },
        },
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
