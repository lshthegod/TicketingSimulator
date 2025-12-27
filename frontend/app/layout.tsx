import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-blue-600">
              TicketService
            </Link>
            <div className="space-x-4 text-sm font-medium">
              <Link href="/login" className="hover:text-blue-600">로그인</Link>
              <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                회원가입
              </Link>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 max-w-4xl mx-auto w-full p-4">
          {children}
        </main>
      </body>
    </html>
  );
}