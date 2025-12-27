"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const router = useRouter();
  const [user, setUser] = useState<{ nickname: string } | null>(null);

  // 페이지 로드 시 내 정보 가져오기
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // 쿠키가 자동으로 실려가므로 별도 설정 불필요
      const res = await api.get("/auth/me");
      console.log("내 정보: ", res.data);
      setUser(res.data);
    } catch (err) {
      // 로그인 안 된 상태 (401) -> 무시하거나 user를 null로
      console.log("로그인 안 된 상태: ", err);
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      alert("로그아웃 되었습니다.");
      router.push("/"); // 홈으로 이동
      window.location.reload(); // 상태 초기화를 위해 새로고침 한 번 해주는 게 깔끔함
    } catch (err) {
      console.error("로그아웃 실패");
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Timulator
        </Link>
        
        <div className="flex items-center space-x-6 text-sm font-medium">
          {user ? (
            // ✅ 로그인 했을 때 보여줄 UI
            <>
              <span className="text-gray-700">
                <span className="font-bold text-gray-900 text-base">{user.nickname}</span>님, 환영합니다!
              </span>
              
              <Link 
                href="/reservations" // 내 예약 조회 페이지
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                내 예약 조회
              </Link>
              
              <button 
                onClick={handleLogout}
                className="text-gray-500 underline hover:text-black cursor-pointer"
              >
                로그아웃
              </button>
            </>
          ) : (
            // ✅ 로그인 안 했을 때 보여줄 UI
            <>
              <Link href="/login" className="hover:text-blue-600">로그인</Link>
              <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}