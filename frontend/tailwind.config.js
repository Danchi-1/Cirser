/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cirser-dark': '#0f172a',
                'cirser-panel': '#1e293b',
                'cirser-accent': '#38bdf8',
                'cirser-danger': '#ef4444',
                'cirser-success': '#22c55e',
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
