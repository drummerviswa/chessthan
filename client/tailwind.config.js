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
                    primary: "#059669",
                    secondary: "#2563EB",
                    accent: "#D97706",
                    neutral: "#1E293B",
                    "base-100": "#F8FAFC",
                    "base-200": "#F1F5F9",
                    "base-300": "#CBD5E1",
                    "base-content": "#0F172A",
                    info: "#0284C7",
                    success: "#059669",
                    warning: "#D97706",
                    error: "#DC2626"
                },
                chessuDark: {
                    primary: "#10b981",
                    secondary: "#3b82f6",
                    accent: "#f59e0b",
                    neutral: "#1f293d",
                    "base-100": "#090b0e",
                    "base-200": "#121620",
                    "base-300": "#1f293d",
                    "base-content": "#f1f5f9",
                    info: "#38bdf8",
                    success: "#10b981",
                    warning: "#f59e0b",
                    error: "#ef4444"
                }
            }
        ],
        darkTheme: "chessuDark"
    }
};
