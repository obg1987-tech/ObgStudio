import "./globals.css";

export const metadata = {
    title: "ObgStudio",
    description: "당신만의 미래형 AI 로봇 뮤지션",
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}
