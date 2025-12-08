/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                forge: {
                    // If 950 is white, then "Dark Mode" is actually Light Mode.
                    // BUT the user just asked for "Dark Mode".
                    // The previous config in index.html had:
                    // 950: '#ffffff', 900: '#f8fafc' ...
                    // This means "forge-950" was white.
                    // If I want to implement TRUE dark mode, I should invert these?
                    // OR, stick to the existing config from index.html first to fix the build, THEN flip for dark mode?
                    // User said "I would like to implement a dark mode".
                    // And "make sure it matches the design" (Dark/Orange).
                    // If I use the values from index.html (lines 15-25 of step 182), they are LIGHT colors.
                    // 950='#ffffff'. 900='#f8fafc'.
                    // SO THE CURRENT APP IS LIGHT MODE but using "forge-950" class names.
                    // To implement DARK MODE, I should change these values to actual dark colors.

                    // Let's implement actual Dark Mode colors here.
                    950: '#020617', // Slate 950 (Deep Dark)
                    900: '#0f172a', // Slate 900 (Sidebar/bg)
                    800: '#1e293b', // Slate 800 (Cards)
                    700: '#334155', // Slate 700 (Borders)
                    600: '#475569', // Slate 600 (Muted)
                    500: '#64748b', // Slate 500

                    // Accents stay same
                    accent: '#f97316', // Orange 500
                    success: '#10b981', // Emerald 500
                    text: '#f8fafc', // Slate 50 (Text)
                    muted: '#94a3b8', // Slate 400 (Muted Text)
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
