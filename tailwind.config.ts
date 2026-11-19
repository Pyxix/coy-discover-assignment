import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coy: {
          dark: "#0F1115",
          card: "#181A20",
          border: "#262933",
          primary: "#FF4D67",
          primaryHover: "#FF3352",
          secondary: "#8B5CF6",
          like: "#10B981",
          pass: "#EF4444",
          muted: "#9CA3AF",
          surface: "#1F232B"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'card': '0 20px 40px -15px rgba(0, 0, 0, 0.45)',
        'float': '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
};
export default config;
