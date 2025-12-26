"use client";

import { useEffect, useState, use } from "react"; // Next.js 15에서는 params를 use()로 감싸야 함 (또는 props)
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // params 언랩핑 (Next.js 15)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [isOpened, setIsOpened] = useState(false);

  // Params 처리
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // 이벤트 정보 및 서버 시간 가져오기
  useEffect(() => {
    if (!resolvedParams) return;

    const fetchData = async () => {
      try {
        const [eventRes, timeRes] = await Promise.all([
          api.get(`/events/${resolvedParams.id}`),
          api.get("/events/time") // 서버 시간 API
        ]);
        setEvent(eventRes.data);
        setServerTime(new Date(timeRes.data.serverTime || Date.now())); // 서버 시간이 없으면 로컬 시간 fallback
      } catch (err) {
        console.error("Failed to fetch event info");
      }
    };
    fetchData();
  }, [resolvedParams]);

  // 1초마다 시간 체크
  useEffect(() => {
    if (!event) return;
    
    const interval = setInterval(() => {
      // 실제로는 서버 시간을 한번만 받고 로컬에서 +1초씩 더하는게 일반적이지만 간단하게 구현
      setServerTime((prev) => {
        const newTime = new Date(prev.getTime() + 1000);
        if (newTime >= new Date(event.openAt)) {
          setIsOpened(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  if (!event) return <div>로딩중...</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg text-center space-y-6">
      <h1 className="text-4xl font-bold">{event.title}</h1>
      <p className="text-lg text-gray-600">{event.description}</p>
      
      <div className="p-4 bg-gray-50 rounded-md inline-block">
        <p className="text-sm text-gray-500">현재 서버 시간</p>
        <p className="text-xl font-mono font-bold text-red-500">
          {serverTime.toLocaleString()}
        </p>
      </div>

      <div className="pt-4">
        <button
          onClick={() => router.push(`/reservation/${event.id}`)}
          disabled={!isOpened}
          className={`w-full max-w-xs py-4 text-xl font-bold rounded-full transition-all ${
            isOpened 
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-105" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isOpened ? "예매하기" : `오픈 대기중 (${new Date(event.openAt).toLocaleTimeString()} 오픈)`}
        </button>
      </div>
    </div>
  );
}