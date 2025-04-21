/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  mode: 'jit',  // JIT 모드 활성화
  theme: {
    extend: {
      colors: {
        bitcoin: "#F7931A",
        positive: "#00BF40",
        negative: "#FF0000",
        surface: {
          DEFAULT: "#FFFFFF",
          container: "#FAFAFA",
          "container-high": "#F5F5F5",
          on: "#242424",
          "on-var": "#999999",
        },
        outline: {
          DEFAULT: "#ADADAD",
          variant: "#EDEDED",
        },
        primary: {
          50: "#eef7ff",
          100: "#d8ecff",
          200: "#baddff",
          300: "#8bcaff",
          400: "#54abff",
          500: "#2d88ff",
          600: "#1666fa",
          700: "#0f50e6",
          800: "#1444c2",
          900: "#163b92",
          950: "#122659",
          DEFAULT: "#1444c2",
        },
        green: "#34A853"
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
