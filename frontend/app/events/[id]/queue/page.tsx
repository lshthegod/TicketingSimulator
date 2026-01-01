"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function QueuePage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const [rank, setRank] = useState<number | null>(null);
  const [isEntering, setIsEntering] = useState(true);
  
  // pollingRef: 폴링 인터벌 관리
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // isPassed: 대기열을 무사히 통과했는지 체크 (통과했다면 leave 요청 안 보내기 위함)
  const isPassed = useRef(false);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // 1. 대기열 진입 및 이탈(Cleanup) 관리
  useEffect(() => {
    if (!resolvedParams) return;

    const enterQueue = async () => {
      try {
        // ✅ [수정] 이벤트 ID별 진입
        await api.post(`/queue/enter/${resolvedParams.id}`);
        setIsEntering(false);
        startPolling();
      } catch (error) {
        alert("로그인이 필요합니다.");
        router.back();
      }
    };

    enterQueue();

    // ✅ [추가] 브라우저 닫기/새로고침 시 이탈 요청 전송
    const handleBeforeUnload = () => {
      if (!isPassed.current) {
        // fetch keepalive로 브라우저가 닫혀도 요청 전송 보장
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const token = localStorage.getItem('accessToken'); // 토큰 필요 시
        
        fetch(`${baseUrl}/queue/leave/${resolvedParams.id}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            keepalive: true,
        }).catch(err => console.error(err));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 컴포넌트 언마운트(뒤로가기 등) 시 정리
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopPolling();
      
      // 통과하지 못하고 나가는 경우에만 leave 요청
      if (!isPassed.current) {
        // 여기서는 api 인스턴스 대신 fetch를 사용하지 않아도 되지만, 
        // 안전하게 handleBeforeUnload와 동일한 로직 사용 권장
        handleBeforeUnload(); 
      }
    };
  }, [resolvedParams]);

  const startPolling = () => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      if (!resolvedParams) return;

      try {
        // ✅ [수정] 이벤트 ID별 상태 조회
        const res = await api.get(`/queue/status/${resolvedParams.id}`);
        const { status, rank } = res.data;

        if (status === "ACTIVE") {
          stopPolling();
          isPassed.current = true; // ✅ 통과 플래그 세팅
          
          // 대기열 통과 후 '/reservation/{id}' 경로로 이동
          router.replace(`/reservation/${resolvedParams.id}`);
          
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
        
        {/* 상단 아이콘 및 안내 문구 */}
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
          <p className="text-gray-600">현재 이용자가 많아 대기열에 진입했습니다.<br/>잠시만 기다려주세요.</p>
        </div>

        {/* 대기 순서 카드 (한글 UI 적용) */}
        {!isEntering && rank !== null && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-400 animate-loading-bar"></div>
            
            <p className="text-gray-500 text-sm mb-2 font-bold uppercase tracking-wider">
              현재 나의 대기 순서
            </p>
            
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl font-black text-blue-600 tabular-nums tracking-tight">
                {rank.toLocaleString()}
              </span>
              <span className="text-xl text-gray-700 font-medium">번째</span>
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100 flex flex-col gap-1">
               <p className="text-red-600 font-bold">⚠️ 주의! 새로고침을 하거나 창을 닫으면 대기 순서가 초기화됩니다.</p>
               <p className="text-xs text-gray-500">이 화면을 유지하고 잠시만 기다려주세요.</p>
            </div>
          </div>
        )}

        {/* 예상 시간 */}
        {!isEntering && rank !== null && rank > 0 && (
          <div className="text-sm text-gray-500 animate-pulse bg-gray-50 py-2 px-4 rounded-full inline-block">
            ⏱️ 예상 대기 시간: 약 <span className="font-bold text-gray-700">{Math.ceil(rank / 50)}</span>초
          </div>
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