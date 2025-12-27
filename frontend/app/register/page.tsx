"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", nickname: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", form);
      alert("회원가입 성공! 로그인해주세요.");
      router.push("/login");
    } catch (err) {
      alert("회원가입 실패");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="이메일"
          className="w-full p-3 border rounded-md"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="닉네임"
          className="w-full p-3 border rounded-md"
          onChange={(e) => setForm({ ...form, nickname: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          className="w-full p-3 border rounded-md"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-md font-bold hover:bg-green-700">
          가입하기
        </button>
      </form>
    </div>
  );
}