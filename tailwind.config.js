/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                'obg-dark': '#0a0a0f',
                'obg-accent': '#2dd4bf',
            },
            backgroundImage: {
                'space-gradient': 'linear-gradient(to bottom, #05050f, #1a1a2e)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px rgba(45, 212, 191, 0.5))' },
                    '50%': { opacity: '.7', filter: 'drop-shadow(0 0 20px rgba(45, 212, 191, 0.8))' },
                }
            }
        },
    },
    plugins: [],
};
