import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#D47B8C", // 豆沙粉/玫瑰金
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#3D2C2E", // 深棕，温柔不刺眼
        },
        muted: {
          DEFAULT: "#FDF2F4", // 极浅粉底
          foreground: "#A97C85",
        },
        accent: {
          DEFAULT: "#F4E1E4", // 柔和点缀色
          foreground: "#6D4C55",
        },
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
        reading: ["Lora", "Merriweather", "serif"], // 阅读器专用
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.04)",
        "card-hover": "0 12px 30px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
}
export default config
