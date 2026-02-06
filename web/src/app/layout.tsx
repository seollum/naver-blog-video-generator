import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Blog2Clips - 블로그를 클립으로",
  description: "네이버 블로그를 50초 클립 영상으로 자동 변환하세요. AI 스크립트, 자연스러운 TTS, 자동 자막 생성.",
  keywords: ["블로그", "클립", "영상", "AI", "자동화", "네이버"],
  openGraph: {
    title: "Blog2Clips - 블로그를 클립으로",
    description: "네이버 블로그를 50초 클립 영상으로 자동 변환",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
