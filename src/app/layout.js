import "./globals.css";

export const metadata = {
    title: "ObgStudio",
    description: "당신만의 미래형 AI 로봇 뮤직 스튜디오",
    openGraph: {
        title: "ObgStudio",
        description: "당신만의 미래형 AI 로봇 뮤직 스튜디오",
        url: 'https://obgstudio.vercel.app',
        images: [
            {
                url: '/og-image.png?v=5',
                width: 1200,
                height: 630,
                alt: 'ObgStudio Main Robot',
            },
        ],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: "ObgStudio",
        description: "당신만의 미래형 AI 로봇 뮤직 스튜디오",
        images: ['/og-image.png?v=5'],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}
