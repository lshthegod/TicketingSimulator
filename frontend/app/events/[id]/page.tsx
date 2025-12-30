"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;

    const fetchData = async () => {
      try {
        const [eventRes, timeRes] = await Promise.all([
          api.get(`/events/${resolvedParams.id}`),
          api.get("/events/time")
        ]);
        setEvent(eventRes.data);
        const serverDate = new Date(timeRes.data.serverTime || Date.now());
        setServerTime(serverDate);
        
        if (serverDate >= new Date(eventRes.data.openAt)) {
            setIsOpened(true);
        }
      } catch (err) {
        console.error("Failed to fetch event info");
      }
    };
    fetchData();
  }, [resolvedParams]);

  useEffect(() => {
    if (!event) return;
    
    const interval = setInterval(() => {
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

  const handleBookingClick = () => {
    if (!resolvedParams) return;
    router.push(`/events/queue/${resolvedParams.id}`);
  };

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
          onClick={handleBookingClick}
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