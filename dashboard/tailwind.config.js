/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f172a',
          secondary: '#1e293b',
          card: '#334155',
        },
        border: '#475569',
        accent: '#3b82f6',
      }
    },
  },
  plugins: [],
}
