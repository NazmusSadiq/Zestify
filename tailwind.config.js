/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5", // Indigo 600
        secondary: "#F59E0B", // Amber 500
        accent: "#10B981", // Emerald 500
        background: "#F3F4F6", // Gray 100
        light:{
          100: '#D6C6FF', // Light Purple 100
          200: '#A8B5DB', // Light Blue 200
          300: '#9CA4AB', // Light Gray 300
        },
        dark: {
          100: '#221F3D', // Dark Gray 100
          200: '#0F0D23', // Dark Gray 200
        },
      },
    },
  },
  plugins: [],
}