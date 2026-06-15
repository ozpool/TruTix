/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm-tinted ink, not flat slate, so surfaces feel layered.
        ink: {
          950: "#08080f",
          900: "#0d0d17",
          850: "#13131f",
          800: "#1a1a28",
          700: "#242436",
          600: "#323248",
        },
        brand: {
          300: "#b6a6ff",
          400: "#9c86ff",
          500: "#7c5cff",
          600: "#5b3df0",
          700: "#4a2fd0",
        },
        // Citrus pop for tickets / the strongest CTAs.
        citrus: {
          300: "#dcff7a",
          400: "#c8ff4d",
          500: "#aef000",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.35), 0 8px 30px -8px rgba(124,92,255,0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 10px 30px -16px rgba(0,0,0,0.8)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        rise: "rise 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.3s ease both",
        "pop-in": "pop-in 0.25s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
