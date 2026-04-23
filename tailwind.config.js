/** @type {import('tailwindcss').Config} */
export default {
  content: ["./entrypoints/**/*.{html,ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        claim: "#3B82F6",
        evidence: "#22C55E",
        counter: "#F97316",
        opinion: "#A855F7",
        other: "#6B7280",
      },
    },
  },
  plugins: [],
};
