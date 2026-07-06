/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Theme-responsive surface/text tokens — defined as CSS variables in
        // globals.css so every existing bg-*/text-*/border-* usage repaints
        // automatically when the `dark` class toggles, with no per-page edits.
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        paperalt: "rgb(var(--color-paperalt) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        inksoft: "rgb(var(--color-inksoft) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        // Brand tokens — fixed across both themes.
        brand: "#173A4E",
        accent: "#F25930",
        // Status/semantic tokens — unchanged.
        cyan: "#0092B8",
        magenta: "#B8005F",
        yellow: "#E0AE00",
        teal: "#0B7A63",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 4px 12px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};
