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
        // based on daisyUI night and winter themes
        themes: [
            {
                chessuLight: {
                    primary: "#047AFF",
                    secondary: "#9dc4e1",
                    accent: "#C148AC",
                    neutral: "#9dc4d1",
                    "base-100": "#FFFFFF",
                    "base-200": "#F2F7FF",
                    "base-300": "#E3E9F4",
                    "base-content": "#1E293B",
                    info: "#93E7FB",
                    success: "#81CFD1",
                    warning: "#EFD7BB",
                    error: "#E58B8B"
                },
                chessuDark: {
                    primary: "#38BDF8",
                    secondary: "#9dc4d1",
                    accent: "#1d4ed8",
                    neutral: "#1E293B",
                    "base-100": "#191923",
                    "base-content": "#9dc4d1",
                    info: "#0CA5E9",
                    success: "#2DD4BF",
                    warning: "#F4BF50",
                    error: "#FB7085"
                }
            }
        ],
        darkTheme: "chessuDark"
    }
};
