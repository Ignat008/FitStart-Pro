/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: 'rgb(var(--cyber-bg) / <alpha-value>)',
          surface: 'rgb(var(--cyber-surface) / <alpha-value>)',
          surface2: 'rgb(var(--cyber-surface2) / <alpha-value>)',
          border: 'rgb(var(--cyber-border) / <alpha-value>)',
          muted: 'rgb(var(--cyber-muted) / <alpha-value>)',
          text: 'rgb(var(--cyber-text) / <alpha-value>)',
        },
        neon: {
          blue: 'rgb(var(--neon-blue) / <alpha-value>)',
          pink: 'rgb(var(--neon-pink) / <alpha-value>)',
          green: 'rgb(var(--neon-green) / <alpha-value>)',
          amber: 'rgb(var(--neon-amber) / <alpha-value>)',
          red: 'rgb(var(--neon-red) / <alpha-value>)',
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
