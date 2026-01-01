/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",           // يغطي ملفات الجذر مثل App.tsx و index.tsx
    "./components/**/*.{js,ts,jsx,tsx}", // يغطي مجلد المكونات
    "./context/**/*.{js,ts,jsx,tsx}",    // يغطي مجلد السياق
    "./hooks/**/*.{js,ts,jsx,tsx}",      // يغطي مجلد الهوكس
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', light: '#60A5FA', dark: '#1E40AF' },
        success: { DEFAULT: '#10B981', light: '#34D399' },
        danger: { DEFAULT: '#EF4444', light: '#F87171' },
        surface: { 
          glass: 'rgba(255, 255, 255, 0.75)', 
          background: '#F3F4F6' 
        }
      },
      fontFamily: { sans: ['Tajawal', 'sans-serif'] },
      boxShadow: { 'glass': '0 4px 30px rgba(0, 0, 0, 0.1)' },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}