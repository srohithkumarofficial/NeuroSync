/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F6F7F9",
          sunken: "#F0F2F5"
        },
        ink: {
          DEFAULT: "#1B2430",
          muted: "#4B5768",
          faint: "#7A8699"
        },
        border: {
          DEFAULT: "#E2E5EA",
          strong: "#CBD1DA"
        },
        clinical: {
          DEFAULT: "#2C5F8A",
          dark: "#204A6E",
          light: "#E8F0F7",
          50: "#F1F6FA"
        },
        stable: {
          DEFAULT: "#1F7A5C",
          light: "#E5F3EE"
        },
        warn: {
          DEFAULT: "#B7791F",
          light: "#FBF1DF"
        },
        critical: {
          DEFAULT: "#B42318",
          light: "#FBEAE8"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'IBM Plex Sans'", "Inter", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"]
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,36,48,0.04), 0 1px 6px rgba(27,36,48,0.04)",
        pop: "0 4px 16px rgba(27,36,48,0.08)"
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px"
      }
    },
  },
  plugins: [],
}
