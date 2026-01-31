/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        zen: {
          bg: '#F5F1E8',
          card: '#FFFFFF',
          text: {
            primary: '#2D2D2D',
            secondary: '#6B6B6B',
            muted: '#A0A0A0'
          },
          accent: {
            red: '#D32F2F',
            wood: '#8B6F47',
            gold: '#C9A961'
          },
          border: '#E5E5E5',
          divider: '#F0F0F0'
        }
      },
      fontFamily: {
        ja: ['Noto Serif JP', 'serif'],
        en: ['Playfair Display', 'serif'],
        sans: ['Inter', 'Noto Sans JP', 'sans-serif']
      },
      borderRadius: {
        'card': '16px',
        'button': '12px'
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)'
      }
    },
  },
  plugins: [],
}
