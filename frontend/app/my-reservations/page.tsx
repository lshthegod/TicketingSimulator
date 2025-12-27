"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Link from "next/link";

interface Reservation {
  id: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  expiredAt: string;
  seat: {
    id: number;
    seatNo: string;
    eventId: number;
  };
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      // GET /reservations 호출 (쿠키가 자동으로 감)
      const res = await api.get<Reservation[]>("/reservations");
      setReservations(res.data);
    } catch (err) {
      console.error("예약 불러오기 실패", err);
      // 로그인이 안되어 있으면 로그인 페이지로 튕기게 할 수도 있음
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷팅 헬퍼 함수
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div className="text-center mt-20">로딩 중...</div>;

  return (
    <div className="min-h-screen pb-20">
      <h1 className="text-3xl font-bold my-8 text-center">내 예약 목록</h1>

      <div className="max-w-3xl mx-auto px-4 space-y-4">
        {reservations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
            <p className="text-gray-500 mb-4">아직 예약된 티켓이 없습니다.</p>
            <Link 
              href="/"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              메인 화면으로
            </Link>
          </div>
        ) : (
          reservations.map((res) => (
            <div 
              key={res.id} 
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition hover:shadow-md"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    res.status === 'CONFIRMED' 
                      ? 'bg-green-100 text-green-700' 
                      : res.status === 'PENDING' 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {res.status === 'CONFIRMED' ? '예매완료' : '결제대기'}
                  </span>
                  <span className="text-gray-400 text-sm">
                    예약번호 #{res.id}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800">
                  {/* 좌석 번호가 없으면(seat relations 실패 시) 대비 */}
                  좌석: {res.seat ? res.seat.seatNo : "정보 없음"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  예약일시: {formatDate(res.createdAt)}
                </p>
              </div>

              {/* 상태에 따른 액션 버튼 (일단 보류)*/}
              <div className="text-right">
                 {res.status === 'PENDING' && (
                   <Link href={`/reservation/${res.seat.eventId}`} className="text-blue-600 text-sm hover:underline">
                     결제하러 가기 &rarr;
                   </Link>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}