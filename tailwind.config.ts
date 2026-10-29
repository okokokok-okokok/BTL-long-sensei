import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "tertiary-fixed-dim": "#bdc2ff",
        "on-tertiary": "#ffffff",
        "secondary-fixed": "#d8e2ff",
        "surface-container-highest": "#e1e3e4",
        "on-primary-container": "#ffaea1",
        "error-container": "#ffdad6",
        "on-primary-fixed-variant": "#930000",
        "surface-container-low": "#f3f4f5",
        "on-tertiary-fixed": "#000965",
        "on-tertiary-container": "#b8beff",
        "surface-tint": "#bb190e",
        "surface": "#f8f9fa",
        "tertiary-container": "#0025f6",
        "surface-container-high": "#e7e8e9",
        "surface-bright": "#f8f9fa",
        "surface-container-lowest": "#ffffff",
        "ptit-red-light": "#FFEBEE",
        "on-surface": "#191c1d",
        "on-error-container": "#93000a",
        "primary-container": "#a50000",
        "inverse-primary": "#ffb4a8",
        "on-secondary-fixed-variant": "#004494",
        "on-secondary-container": "#00285c",
        "warning-yellow": "#FBC02D",
        "surface-gray": "#E9ECEF",
        "inverse-on-surface": "#f0f1f2",
        "ptit-red-dark": "#7A0000",
        "error": "#ba1a1a",
        "on-background": "#191c1d",
        "on-tertiary-fixed-variant": "#0020dd",
        "primary": "#790000",
        "on-secondary-fixed": "#001a41",
        "outline-variant": "#e5beb7",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#410000",
        "outline": "#906f6a",
        "on-surface-variant": "#5c403b",
        "success-green": "#2E7D32",
        "surface-dim": "#d9dadb",
        "secondary-fixed-dim": "#adc6ff",
        "secondary": "#005ac1",
        "tertiary-fixed": "#dfe0ff",
        "surface-variant": "#e1e3e4",
        "on-secondary": "#ffffff",
        "primary-fixed-dim": "#ffb4a8",
        "secondary-container": "#4d8efe",
        "primary-fixed": "#ffdad4",
        "inverse-surface": "#2e3132",
        "background": "#f8f9fa",
        "tertiary": "#0019b6",
        "on-error": "#ffffff",
        "surface-container": "#edeeef"
      },
      fontFamily: {
        hanken: ["'Hanken Grotesk'", "sans-serif"],
        inter: ["'Inter'", "sans-serif"],
      },
      maxWidth: {
        "container-max-width": "1200px"
      },
      spacing: {
        "gutter": "16px",
        "base": "8px",
        "margin-mobile": "16px",
        "margin-desktop": "32px"
      }
    },
  },
  plugins: [],
};
export default config;
