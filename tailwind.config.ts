import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        table: {
          950: "#0f1f15",
          900: "#163121",
          800: "#1e472f",
        },
        accent: {
          400: "#f7cf5d",
          500: "#e9b824",
        },
      },
      fontFamily: {
        display: ["Baskerville", "\"Palatino Linotype\"", "\"Book Antiqua\"", "Georgia", "serif"],
        body: ["Trebuchet MS", "Verdana", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(247, 207, 93, 0.2), 0 24px 80px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
