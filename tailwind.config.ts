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
        campus: {
          50: "#FFF5F7",
          100: "#FFE4E8",
          200: "#FECDD6",
          300: "#FDA4B4",
          400: "#FB7189",
          500: "#F43F5E",
          600: "#E11D48",
          700: "#BE123C",
          800: "#9F1239",
          900: "#881337",
          950: "#4C0519",
        },
        slate: {
          850: "#151F32",
        },
        surface: {
          DEFAULT: "#FFFDFE",
          subtle: "#FFF5F8",
          muted: "#FFE8ED",
          border: "#F0BFCB",
          hover: "#FFE4E8",
        }
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"SFMono-Regular"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'monospace',
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(159, 18, 57, 0.05)',
        'card': '0 1px 3px 0 rgba(159, 18, 57, 0.06), 0 1px 2px -1px rgba(159, 18, 57, 0.04)',
        'elevated': '0 4px 12px -2px rgba(159, 18, 57, 0.08), 0 2px 6px -1px rgba(159, 18, 57, 0.04)',
      }
    },
  },
  plugins: [],
};
export default config;
