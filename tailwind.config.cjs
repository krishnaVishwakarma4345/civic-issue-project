/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#eef5ff",
          100: "#d9e8ff",
          200: "#bdd7ff",
          300: "#93bfff",
          400: "#639dff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        status: {
          reported:    "#ef4444",
          assigned:    "#f97316",
          inprogress:  "#eab308",
          resolved:    "#16a34a",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};