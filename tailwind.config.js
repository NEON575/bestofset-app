/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F1E6",
        paperalt: "#EEE6D3",
        card: "#FBF8F1",
        ink: "#18181F",
        inksoft: "#5B5A55",
        line: "#DCD2B8",
        cyan: "#0092B8",
        magenta: "#B8005F",
        yellow: "#E0AE00",
        teal: "#0B7A63",
      },
    },
  },
  plugins: [],
};
