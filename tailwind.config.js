/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html", // This is crucial for your index.html
    // Add other paths if you have components with Tailwind classes, e.g.:
    // "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
