/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{svelte,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        warp: {
          base: "#111111", // dark background
          ghost: "#3a3a3a", // mid gray
          glow: "#e5e5e5", // light gray
          dim: "#1c1c1c", // dim gray
        },
      },
      animation: {
        "warp-pulse": "warp-pulse 4s ease-in-out infinite",
      },
      keyframes: {
        "warp-pulse": {
          "0%, 100%": { transform: "scale(1) skew(0deg)" },
          "50%": {
            transform: "scale(1.05) skew(-2deg)",
            filter: "hue-rotate(-10deg) blur(1px)",
          },
        },
      },
    },
  },
  plugins: [],
};
