/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green:         '#00A651',
          'green-dark':  '#007A3D',
          'green-light': '#E6F7EF',
          blue:          '#0055A4',
          'blue-dark':   '#003D7A',
          'blue-light':  '#E8F1FB',
          white:         '#FFFFFF',
          'off-white':   '#F4F8FF',
          gray:          '#64748B',
          'gray-light':  '#F1F5F9',
          dark:          '#0F172A',
          border:        '#E2E8F0',
          danger:        '#EF4444',
          warning:       '#F59E0B',
          success:       '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient':       'linear-gradient(135deg, #0055A4 0%, #003D7A 50%, #007A3D 100%)',
        'brand-gradient-light': 'linear-gradient(135deg, #E8F1FB 0%, #E6F7EF 100%)',
        'hero-gradient':        'linear-gradient(135deg, #0055A4 0%, #00A651 100%)',
      },
      boxShadow: {
        card:        '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover':'0 4px 12px rgba(0,0,0,0.12)',
        green:       '0 4px 14px rgba(0,166,81,0.3)',
        blue:        '0 4px 14px rgba(0,85,164,0.3)',
      },
    },
  },
  plugins: [],
}
