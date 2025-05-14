/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  mode: 'jit',
  theme: {
    extend: {
      colors: {
        bitcoin: "#F7931A",
        positive: "#00BF40",
        negative: "#FF0000",
        primary: {
          50: "#f7f0ff",
          100: "#e9d9ff",
          200: "#d4b4ff",
          300: "#b78eff",
          400: "#9c6bff",
          500: "#804aff",
          600: "#6933f5",
          700: "#5626dc",
          800: "#4520b5",
          900: "#361d86",
          950: "#23134f",
          DEFAULT: "#4520b5",
        },
        success: "#10B981",
        danger: "#EF4444",
        neutral: "#4B5563",
        green: "#34A853",
        dark: {
          light: "#18191c",
          DEFAULT: "#121214",
        },
        // FunOptionアプリケーション用の統一カラー
        funoption: {
          // 背景色
          bg: {
            DEFAULT: "#13131A",
            dark: "#0F0F14",
            light: "#1e2227",
            lighter: "#2a2e36",
          },
          // カード背景
          card: {
            DEFAULT: "rgba(26, 26, 35, 0.5)",
            hover: "rgba(26, 26, 35, 0.8)",
            active: "rgba(35, 35, 45, 0.9)",
          },
          // ボーダー
          border: {
            DEFAULT: "rgba(255, 255, 255, 0.1)",
            light: "rgba(255, 255, 255, 0.15)",
            dark: "rgba(0, 0, 0, 0.2)",
          },
          // アクセントカラー
          gold: {
            DEFAULT: "#F5A623",
            light: "#f0c85d",
            dark: "#c09b3d",
          },
          // テキスト色
          text: {
            DEFAULT: "#ffffff",
            muted: "#adadad",
            faint: "#777777",
          },
          // プライマリーグラデーション
          primary: {
            from: "#8E2DE2",
            to: "#4A00E0",
          },
          // 成功/エラーカラー
          success: "#10B981",
          danger: "#EF4444",
          // チャート表示関連の色
          chart: {
            call: "#10B981", // 緑色 - コールオプション
            put: "#EF4444", // 赤色 - プットオプション
            line: "#6B7280", // グレー - ライン
            grid: "#374151", // ダークグレー - グリッド線
          },
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
        grotesk: ["\"Space Grotesk\"", "sans-serif"],
        inter: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
        pulsePoint: {
          '0%, 100%': { r: 6, opacity: 0.9 },
          '50%': { r: 9, opacity: 1 },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out',
        pulse: 'pulse 1.5s infinite',
        pulsePoint: 'pulsePoint 2.4s ease-in-out infinite',
      },
      borderRadius: {
        'options': '6px',
      },
      spacing: {
        'button-padding-x': '16px',
      },
      minWidth: {
        'button': '80px',
      },
      height: {
        'button': '36px',
      },
    },
  },
  plugins: [],
};
