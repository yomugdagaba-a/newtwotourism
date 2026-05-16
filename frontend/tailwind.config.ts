import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Times New Roman', 'Times', 'serif'],
        serif: ['Times New Roman', 'Times', 'serif'],
        mono: ['Times New Roman', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
