import "./globals.css";

export const metadata = {
    title: "ObgStudio",
    description: "당신만의 미래형 AI 로봇 뮤지션",
    openGraph: {
        title: "ObgStudio",
        description: "당신만의 미래형 AI 로봇 뮤지션",
        url: 'https://obgstudio.vercel.app',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'ObgStudio Main Robot',
            },
        ],
        type: 'website',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}
