/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 700: "#1A4466", 800: "#12334F", 900: "#0B2239", 950: "#071827" },
        gold: { 400: "#F0A63D", 500: "#E8941A", 600: "#C97A0C" },
        brand: { 50: "#EAF3FB", 100: "#D3E6F5", 500: "#2380C7", 600: "#1769AA", 700: "#12578F" },
        success: "#1F9D63",
        danger: "#D64545",
        warning: "#F2B01E",
        surface: "#F8FAFC",
        canvas: "#F8FAFC",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-bangla)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 10px -3px rgba(11,34,57,0.06), 0 1px 2px rgba(11,34,57,0.04)",
        "card-hover": "0 12px 28px -8px rgba(11,34,57,0.14), 0 2px 6px rgba(11,34,57,0.05)",
        glow: "0 0 0 4px rgba(23,105,170,0.12)",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "none" } },
        "scale-in": { from: { opacity: 0, transform: "scale(.97)" }, to: { opacity: 1, transform: "none" } },
      },
      animation: {
        "fade-in": "fade-in .25s ease-out both",
        "scale-in": "scale-in .18s ease-out both",
      },
    },
  },
  plugins: [],
};
