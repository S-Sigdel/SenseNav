/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'base': '16px',           // Base font size
        'high': '18px',           // High importance text
        'normal': '14px',         // Normal talking text
        'high-bold': ['18px', { fontWeight: '700' }],  // High importance bold
        'base-bold': ['16px', { fontWeight: '700' }],  // Base bold
        'normal-bold': ['14px', { fontWeight: '700' }], // Normal bold
      }
    },
  },
  plugins: [],
}