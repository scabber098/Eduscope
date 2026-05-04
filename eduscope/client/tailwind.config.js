export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora','system-ui','sans-serif'],
        sans:    ['Inter','system-ui','sans-serif'],
        mono:    ['JetBrains Mono','monospace'],
      },
      colors: {
        gold:    '#F0B429',
        gold2:   '#E07B39',
        gold3:   '#ffd97d',
        surface: 'rgba(255,255,255,0.03)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'spin-slow':   'spin 20s linear infinite',
        'pulse-glow':  'pulse-glow 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
