'use client';

import api from "@/lib/axios";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Event {
  id: number;
  title: string;
  description: string;
  openAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        setEvents(res.data);
      } catch (error) {
        console.error("이벤트 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div className="p-10 text-center">이벤트를 불러오는 중...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">진행 중인 이벤트</h2>
      <div className="grid gap-4">
        {events.map((event) => (
          <div key={event.id} className="p-6 bg-white rounded-lg shadow border border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">{event.title}</h3>
              <p className="text-gray-600">{event.description}</p>
              <p className="text-sm text-gray-400 mt-2">
                오픈: {new Date(event.openAt).toLocaleString()}
              </p>
            </div>
            <Link 
              href={`/events/${event.id}`} 
              className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold"
            >
              상세보기
            </Link>
          </div>
        ))}
        {!loading && events.length === 0 && (
          <p className="text-gray-500">등록된 이벤트가 없습니다.</p>
        )}
      </div>
    </div>
  );
}