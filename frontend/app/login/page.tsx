"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("accessToken", res.data.accessToken); // 토큰 저장 가정
      alert("로그인 성공!");
      router.push("/");
    } catch (err) {
      alert("로그인 실패: 아이디나 비밀번호를 확인하세요.");
    }
  };

  const handleGuestLogin = async () => {
    try {
      const res = await api.post("/auth/guest");
      localStorage.setItem("accessToken", res.data.accessToken);
      alert(`게스트(${res.data.nickname})로 로그인되었습니다.`);
      router.push("/");
    } catch (err) {
      alert("게스트 로그인 실패");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">로그인</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-md"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-md"
          required
        />
        <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700">
          로그인
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        <button onClick={handleGuestLogin} className="w-full py-3 bg-gray-200 text-gray-800 rounded-md font-bold hover:bg-gray-300">
          게스트로 시작하기
        </button>
        <div className="text-center mt-2 text-sm text-gray-500">
          계정이 없으신가요? <Link href="/register" className="text-blue-600 underline">회원가입</Link>
        </div>
      </div>
    </div>
  );
}