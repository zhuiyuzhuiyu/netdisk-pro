/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d9edff',
          500: '#0f7ec9',
          700: '#085f98',
          900: '#063c61'
        }
      },
      boxShadow: {
        panel: '0 10px 30px rgba(4, 32, 51, 0.15)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};
