/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        avp: {
          blue: { DEFAULT: '#333687', deep: '#1f216b', bright: '#4a4eaa' },
          green: { DEFAULT: '#02A153', deep: '#017a3e', bright: '#1cc36e' },
          black: '#08090d', dark: '#11131a', card: '#181b24',
          'card-hover': '#232634', border: '#252836',
          text: '#f0f1f5', 'text-dim': '#8a8fa3', danger: '#e63946',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        serif: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'avp-gradient': 'linear-gradient(135deg, #333687 0%, #1f216b 35%, #017a3e 70%, #02A153 100%)',
      },
    },
  },
  plugins: [],
};
