/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azul primario del rediseño (#1F52C7). Mapeado a "brand" para
        // que el código existente que usa brand-* adopte el nuevo color.
        brand: {
          50: '#eef2fd',
          100: '#e2e9fb',
          200: '#c7d4f6',
          300: '#9db4ec',
          400: '#5f81dd',
          500: '#2f5fd2',
          600: '#1f52c7',
          700: '#1a45a8',
          800: '#193c8c',
          900: '#193572',
        },
        paper: '#f4f2ec',
        ink: '#13243b',
        ink2: '#4a5567',
        mut: '#8a93a1',
        line: '#e7e3d8',
        accent: {
          DEFAULT: '#b5852a',
          soft: '#f3e9d2',
          ink: '#6e5418',
        },
        success: {
          DEFAULT: '#2e7d52',
          soft: '#dcefe2',
        },
        navy: {
          700: '#1a3057',
          900: '#13243b',
        },
      },
      fontFamily: {
        sans: ['Public Sans', 'system-ui', 'Segoe UI', 'sans-serif'],
        display: ['Source Serif 4', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(19,36,59,.04)',
        soft: '0 4px 14px -10px rgba(19,36,59,.2)',
        lift: '0 18px 36px -22px rgba(19,36,59,.3)',
        primary: '0 8px 18px -8px rgba(31,82,199,.6)',
      },
    },
  },
  plugins: [],
}
