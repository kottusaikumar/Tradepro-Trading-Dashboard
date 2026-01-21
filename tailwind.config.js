/** @type {import('tailwindcss').Config} */
const defaultConfig = require("shadcn/ui/tailwind.config")

module.exports = {
  ...defaultConfig,
  content: ["./index.html", "./*.{js,jsx}", "./src/**/*.{js,jsx}", "*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    ...defaultConfig.theme,
    extend: {
      ...defaultConfig.theme.extend,
      colors: {
        ...defaultConfig.theme.extend.colors,
        primary: {
          DEFAULT: "#00d4aa",
          50: "#f0fdf9",
          100: "#ccfbef",
          500: "#00d4aa",
          600: "#00b894",
          700: "#009d7d",
        },
        secondary: {
          DEFAULT: "#1a1a1a",
          50: "#f8fafc",
          100: "#f1f5f9",
          800: "#1e293b",
          900: "#111827",
        },
        accent: {
          DEFAULT: "#333333",
          50: "#f9fafb",
          600: "#4b5563",
          700: "#374151",
        },
        success: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
        },
        danger: {
          DEFAULT: "#ef4444",
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
        },
        warning: {
          DEFAULT: "#f59e0b",
          500: "#f59e0b",
          600: "#d97706",
        },
        dark: "#0a0a0a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-glow": "pulse 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 170, 0.3)",
        "glow-success": "0 0 20px rgba(16, 185, 129, 0.3)",
        "glow-danger": "0 0 20px rgba(239, 68, 68, 0.3)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    ...defaultConfig.plugins,
    ({ addUtilities }) => {
      const newUtilities = {
        ".scrollbar-thin": {
          scrollbarWidth: "thin",
          scrollbarColor: "#555 #333",
        },
        ".scrollbar-thin::-webkit-scrollbar": {
          width: "4px",
          height: "4px",
        },
        ".scrollbar-thin::-webkit-scrollbar-track": {
          background: "#333",
        },
        ".scrollbar-thin::-webkit-scrollbar-thumb": {
          background: "#555",
          borderRadius: "2px",
        },
        ".scrollbar-thin::-webkit-scrollbar-thumb:hover": {
          background: "#666",
        },
        ".glass": {
          background: "rgba(26, 26, 26, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        ".hover-scale": {
          transition: "transform 0.2s ease",
        },
        ".hover-scale:hover": {
          transform: "scale(1.02)",
        },
      }
      addUtilities(newUtilities)
    },
  ],
}
