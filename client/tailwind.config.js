/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                'base-content': '#9dc4d1'
            }
        }
    },
    plugins: [require("daisyui")],
    darkMode: ["class", '[data-theme="chessuDark"]'],
    daisyui: {
        themes: [
            {
                chessuLight: {
                    primary: "#0070F3",
                    secondary: "#3B82F6",
                    accent: "#F59E0B",
                    neutral: "#334155",
                    "base-100": "#F8FAFC",
                    "base-200": "#F1F5F9",
                    "base-300": "#E2E8F0",
                    "base-content": "#0F172A",
                    info: "#06B6D4",
                    success: "#10B981",
                    warning: "#F59E0B",
                    error: "#EF4444"
                },
                chessuDark: {
                    primary: "#3B82F6",
                    secondary: "#60A5FA",
                    accent: "#F59E0B",
                    neutral: "#334155",
                    "base-100": "#0F172A",
                    "base-200": "#1E293B",
                    "base-300": "#334155",
                    "base-content": "#F1F5F9",
                    info: "#06B6D4",
                    success: "#10B981",
                    warning: "#F59E0B",
                    error: "#EF4444"
                }
            }
        ],
        darkTheme: "chessuDark"
    }
};
