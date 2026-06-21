export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F26522',
          light:   '#fb923c',
          dark:    '#D8480F',
          50:      '#FFF3EC',
          100:     '#FBE0CD',
        },
        ink:  '#15171C',
        ink2: '#3A3D44',
        mu:   '#7C8089',
        line: '#E8EAED',
        bg:   '#F5F6F8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04)',
        'card-md': '0 2px 8px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)',
      },
    }
  },
  plugins: []
}
