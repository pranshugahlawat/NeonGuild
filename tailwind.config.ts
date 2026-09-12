import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070A12",
        panel: "rgba(255,255,255,0.06)",
        panel2: "rgba(255,255,255,0.10)",
        text: "#EAF0FF",
        mut: "rgba(234,240,255,0.72)",
        neon: "#7C5CFF",
        neon2: "#25F6FF",
        danger: "#FF4D6D",
        ok: "#32D583"
      },
      boxShadow: {
        neon: "0 0 0 1px rgba(124,92,255,0.25), 0 10px 40px rgba(124,92,255,0.20)",
        neon2: "0 0 0 1px rgba(37,246,255,0.25), 0 10px 40px rgba(37,246,255,0.15)"
      }
    }
  },
  plugins: []
} satisfies Config;