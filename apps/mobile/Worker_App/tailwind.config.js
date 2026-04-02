/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './contexts/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'antigravity-regular': ['Nunito_400Regular'],
        'antigravity-medium': ['Nunito_500Medium'],
        'antigravity-semibold': ['Nunito_600SemiBold'],
        'antigravity-bold': ['Nunito_700Bold'],
      },
      colors: {
        clay: {
          background: '#E0F2FE', // Light blue background
          card: '#F0F9FF', // Lighter blue/white for cards
          primary: '#0EA5E9', // Sky blue primary
          secondary: '#64748B', // Blue-gray secondary
          text: '#1E293B', // Dark slate text
          border: '#FFFFFF', // White border for glass/clay
          shadow: '#BFDBFE', // Blue shadow
        },
      },
    },
  },
  plugins: [],
};
