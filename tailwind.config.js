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
                    950: 'rgb(var(--color-forge-950) / <alpha-value>)',
                    900: 'rgb(var(--color-forge-900) / <alpha-value>)',
                    800: 'rgb(var(--color-forge-800) / <alpha-value>)',
                    700: 'rgb(var(--color-forge-700) / <alpha-value>)',
                    600: 'rgb(var(--color-forge-600) / <alpha-value>)',
                    500: 'rgb(var(--color-forge-500) / <alpha-value>)',

                    accent: 'rgb(var(--color-forge-accent) / <alpha-value>)',
                    success: 'rgb(var(--color-forge-success) / <alpha-value>)',
                    text: 'rgb(var(--color-forge-text) / <alpha-value>)',
                    muted: 'rgb(var(--color-forge-muted) / <alpha-value>)',
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
