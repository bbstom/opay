export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Noto Sans SC',
          'sans-serif',
        ],
      },
      colors: {
        cyan: {
          50: '#ebf7ff',
          100: '#d6efff',
          200: '#cfe8f3',
          300: '#8ad0ff',
          400: '#47b5ff',
          500: '#0095ff',
          600: '#007ad6',
          700: '#0062ad',
          800: '#0c4a6e',
          900: '#0a1224',
        },
        blue: {
          50: '#f1f8fd',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0095ff',
          600: '#007ad6',
          700: '#0369a1',
          800: '#075985',
          900: '#0a1224',
        },
      },
      borderRadius: {
        xl: '8px',
        '2xl': '12px',
        '3xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgb(120 151 191 / 0.12)',
        DEFAULT: '0 1px 2px rgb(120 151 191 / 0.12)',
        md: '0 4px 12px rgb(12 74 110 / 0.08)',
        lg: '0 12px 30px rgb(12 74 110 / 0.08)',
      },
      animation: {
        'in': 'fadeIn 0.7s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#0a1224',
            a: {
              color: '#0095ff',
              '&:hover': {
                color: '#007ad6',
              },
            },
            'h2': {
              color: '#0a1224',
              fontWeight: '700',
              borderBottomWidth: '1px',
              borderBottomColor: '#e2e8f0',
              paddingBottom: '0.5rem',
            },
            'h3': {
              color: '#0f172a',
              fontWeight: '700',
            },
            'code': {
              color: '#db2777',
              backgroundColor: '#fdf2f8',
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            'pre': {
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
            },
            'blockquote': {
              borderLeftColor: '#3b82f6',
              borderLeftWidth: '4px',
              fontStyle: 'italic',
              color: '#475569',
            },
            'table': {
              width: '100%',
            },
            'th': {
              backgroundColor: '#f1f5f9',
              padding: '0.75rem',
              textAlign: 'left',
              fontWeight: '700',
              borderWidth: '1px',
              borderColor: '#cbd5e1',
            },
            'td': {
              padding: '0.75rem',
              borderWidth: '1px',
              borderColor: '#cbd5e1',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
