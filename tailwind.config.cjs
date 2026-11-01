/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 800: "#12334F", 900: "#0B2239" },
        gold: { 500: "#E8941A" },
        brand: { 50: "#EAF3FB", 100: "#D3E6F5", 600: "#1769AA", 700: "#12578F" },
        success: "#1F9D63",
        danger: "#D64545",
        warning: "#F2B01E",
        surface: "#F1F5F9",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-bangla)", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(11,34,57,.06), 0 4px 14px rgba(11,34,57,.06)" },
    },
  },
  plugins: [],
};
