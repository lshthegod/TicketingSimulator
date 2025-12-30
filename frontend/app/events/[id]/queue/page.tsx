"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function QueuePage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const [rank, setRank] = useState<number | null>(null);
  const [isEntering, setIsEntering] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;

    const enterQueue = async () => {
      try {
        await api.post("/queue/enter");
        setIsEntering(false);
        startPolling();
      } catch (error) {
        alert("대기열 진입에 실패했습니다.");
        router.back();
      }
    };

    enterQueue();

    return () => stopPolling();
  }, [resolvedParams]);

  const startPolling = () => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await api.get("/queue/status");
        const { status, rank } = res.data;

        if (status === "ACTIVE") {
          stopPolling();
          if (resolvedParams) {
            // ✅ [수정됨] 대기열 통과 후 '/reservation/{id}' 경로로 이동
            router.replace(`/reservation/${resolvedParams.id}`);
          }
        } else if (status === "WAITING") {
          setRank(rank);
        }
      } catch (error) {
        console.error(error);
      }
    }, 1000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        
        <div>
          <div className="mx-auto w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-md shadow-blue-100">
            {isEntering ? (
              <svg className="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h1 className="text-3xl font-bold mb-2">접속 대기 중입니다</h1>
          <p className="text-gray-600">잠시만 기다리시면 예매 페이지로 자동 이동합니다.</p>
        </div>

        {!isEntering && rank !== null && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400 animate-loading-bar"></div>
            
            <p className="text-gray-500 text-sm mb-2 uppercase tracking-wider">Current Position</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-black text-blue-600 tabular-nums tracking-tight">
                {rank.toLocaleString()}
              </span>
              <span className="text-xl text-gray-700 font-medium">명</span>
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
              <span className="text-blue-600 font-bold">Tip.</span> 새로고침을 하셔도 대기 순서는 유지됩니다.
            </div>
          </div>
        )}

        {!isEntering && rank !== null && rank > 0 && (
          <p className="text-sm text-gray-500 animate-pulse">
            예상 대기 시간: 약 {Math.ceil(rank / 50)}초
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}