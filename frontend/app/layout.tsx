import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Ticket Service",
  description: "Next.js Ticketing App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        {/* 네비게이션 바 */}
        <NavBar />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 max-w-4xl mx-auto w-full p-4">
          {children}
        </main>
      </body>
    </html>
  );
}