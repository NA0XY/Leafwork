import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px"
    },
    extend: {
      colors: {
        primary: "#1a6b3c",
        accent: "#22c55e",
        paper: "#f5f0e8",
        surface: "#ffffff",
        ink: "#1a1a1a",
        danger: "#b91c1c",
        muted: "#6b7280"
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "Space Grotesk", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"]
      },
      borderRadius: {
        brutal: "4px"
      },
      boxShadow: {
        brutal: "4px 4px 0px #1a1a1a",
        "brutal-sm": "2px 2px 0px #1a1a1a",
        "brutal-none": "0px 0px 0px #1a1a1a"
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" }
        },
        slideUp: {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" }
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        }
      },
      animation: {
        wiggle: "wiggle 200ms ease-in-out",
        slideUp: "slideUp 220ms ease-out",
        fadeIn: "fadeIn 250ms ease-out"
      }
    }
  },
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        ".brutalist-card": {
          border: "2px solid #1a1a1a",
          borderRadius: "4px",
          backgroundColor: "#ffffff",
          boxShadow: "4px 4px 0px #1a1a1a"
        },
        ".brutalist-btn": {
          border: "2px solid #1a1a1a",
          borderRadius: "4px",
          backgroundColor: "#22c55e",
          color: "#1a1a1a",
          boxShadow: "4px 4px 0px #1a1a1a",
          fontWeight: "700",
          transitionProperty: "transform, box-shadow",
          transitionDuration: "120ms",
          transitionTimingFunction: "ease-out"
        },
        ".brutalist-btn:hover": {
          boxShadow: "2px 2px 0px #1a1a1a",
          transform: "translate(2px, 2px)"
        },
        ".brutalist-btn:active": {
          boxShadow: "0px 0px 0px #1a1a1a",
          transform: "translate(4px, 4px)"
        }
      });
    })
  ]
};

export default config;
