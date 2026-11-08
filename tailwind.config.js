/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#090d16',
          surface: '#0f1626',
          surface2: '#131c2f',
          border: '#1e293f',
          muted: '#7c8aa8',
          text: '#e6ecff',
        },
        neon: {
          blue: '#3b82f6',
          pink: '#ec4899',
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-blue': 'glowBlue 2.5s ease-in-out infinite',
        'glow-pink': 'glowPink 2.5s ease-in-out infinite',
        'glow-green': 'glowGreen 2.5s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        glowBlue: {
          '0%,100%': { boxShadow: '0 0 12px rgba(59,130,246,0.35)' },
          '50%': { boxShadow: '0 0 28px rgba(59,130,246,0.7)' },
        },
        glowPink: {
          '0%,100%': { boxShadow: '0 0 12px rgba(236,72,153,0.35)' },
          '50%': { boxShadow: '0 0 28px rgba(236,72,153,0.7)' },
        },
        glowGreen: {
          '0%,100%': { boxShadow: '0 0 12px rgba(16,185,129,0.35)' },
          '50%': { boxShadow: '0 0 28px rgba(16,185,129,0.7)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        countUp: {
          '0%': { transform: 'scale(0.8)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
