"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

interface Seat {
  id: number;
  eventId: number;
  seatNo: string;
  // 백엔드 Enum과 일치해야 함 (SOLD 또는 BOOKED)
  status: "AVAILABLE" | "HELD" | "SOLD"; 
}

interface GroupedSeats {
  [row: string]: Seat[];
}

type ViewStep = "SEAT_SELECTION" | "PAYMENT";

export default function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  
  const [viewStep, setViewStep] = useState<ViewStep>("SEAT_SELECTION");
  const [groupedSeats, setGroupedSeats] = useState<GroupedSeats>({});
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("CARD");

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetchSeats(resolvedParams.id);
  }, [resolvedParams]);

  const fetchSeats = async (eventId: string) => {
    try {
      setLoading(true);
      const res = await api.get<Seat[]>(`/seats/event/${eventId}`);
      
      const seats = res.data;
      const groups: GroupedSeats = {};

      seats.forEach((seat) => {
        const rowMatch = seat.seatNo.match(/[A-Z]+/); 
        const row = rowMatch ? rowMatch[0] : "ETC";

        if (!groups[row]) { groups[row] = []; }
        groups[row].push(seat);
      });

      Object.keys(groups).forEach(row => {
        groups[row].sort((a, b) => {
           const numA = parseInt(a.seatNo.replace(/[A-Z]/g, ""));
           const numB = parseInt(b.seatNo.replace(/[A-Z]/g, ""));
           return numA - numB;
        });
      });

      setGroupedSeats(groups);
    } catch (err) {
      console.error(err);
      alert("좌석 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    // ⭐️ AVAILABLE 상태가 아니면 클릭 불가
    if (seat.status !== "AVAILABLE") return;
    setSelectedSeat(seat);
  };

  const handleHoldRequest = async () => {
    if (!selectedSeat) return;
    try {
      const res = await api.post("/reservations/hold", { seatId: selectedSeat.id });
      setReservationId(res.data.reservationId);
      setViewStep("PAYMENT");
    } catch (err: any) {
      alert(err.response?.data?.message || "좌석 선점에 실패했습니다.");
      if (resolvedParams) fetchSeats(resolvedParams.id);
      setSelectedSeat(null);
    }
  };

  const handleFinalConfirm = async () => {
    if (!reservationId) return;
    try {
      await api.post(`/reservations/confirm/${reservationId}`);
      alert("예매가 성공적으로 완료되었습니다!");
      router.push("/events");
    } catch (err: any) {
      alert(err.response?.data?.message || "예매 확정에 실패했습니다.");
      setViewStep("SEAT_SELECTION");
      setReservationId(null);
      setSelectedSeat(null);
      if (resolvedParams) fetchSeats(resolvedParams.id);
    }
  };

  if (loading) return <div className="text-center mt-20">좌석 로딩중...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen pb-24 bg-white">
      
      {/* ---------------- 좌석 선택 화면 ---------------- */}
      {viewStep === "SEAT_SELECTION" && (
        <>
          <h2 className="text-3xl font-bold my-8">좌석 선택</h2>
          <div className="w-full max-w-2xl bg-gray-300 h-12 mb-10 rounded-t-xl flex items-center justify-center text-gray-600 font-bold shadow-md">
            SCREEN
          </div>

          <div className="flex flex-col gap-3 items-center w-full max-w-4xl px-4 overflow-x-auto">
            {Object.keys(groupedSeats).sort().map((row) => (
              <div key={row} className="flex items-center gap-4 flex-nowrap">
                <div className="w-8 text-center font-bold whitespace-nowrap text-gray-500">{row}열</div>
                <div className="flex gap-2">
                  {groupedSeats[row].map((seat) => {
                     const isSelected = selectedSeat?.id === seat.id;
                     const isAvailable = seat.status === "AVAILABLE";
                     // AVAILABLE이 아니면 모두 '불가' 상태 (HELD or SOLD)
                     const isUnavailable = !isAvailable; 
                     
                     const seatNumberOnly = seat.seatNo.replace(row, ""); 

                     return (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={isUnavailable} // 예약 불가능하면 클릭 비활성화
                        className={`
                          w-10 h-10 rounded-md text-sm font-semibold transition-all duration-200
                          flex items-center justify-center shadow-sm border
                          
                          /* 1. 내가 선택한 좌석 (초록색) */
                          ${isSelected 
                            ? "bg-green-500 text-white border-green-600 ring-2 ring-green-300 transform scale-110 z-10" 
                            : ""}
                          
                          /* 2. 예약 가능한 좌석 (흰색/파란색) */
                          ${isAvailable && !isSelected 
                            ? "bg-white hover:bg-blue-50 text-gray-700 border-gray-300 hover:border-blue-400" 
                            : ""}
                          
                          /* 3. 이미 선점되거나 팔린 좌석 (요청하신 회색 스타일 적용) */
                          ${isUnavailable
                            ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                            : ""}
                        `}
                      >
                        {seatNumberOnly}
                      </button>
                     );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* 범례 (Legend) */}
          <div className="flex gap-4 mt-8 text-sm text-gray-600">
            <div className="flex items-center"><div className="w-4 h-4 border border-gray-300 bg-white mr-2 rounded"></div>예약가능</div>
            <div className="flex items-center"><div className="w-4 h-4 bg-green-500 mr-2 rounded"></div>선택함</div>
            {/* 요청하신 클래스와 일치하는 범례 아이콘 */}
            <div className="flex items-center"><div className="w-4 h-4 bg-gray-300 mr-2 rounded"></div>예약불가</div>
          </div>

          {selectedSeat && (
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 animate-slide-up">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm">선택한 좌석</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedSeat.seatNo}</p>
                </div>
                <button 
                  onClick={handleHoldRequest}
                  className="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 shadow-lg"
                >
                  예매하기
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ---------------- 결제 화면 (기존 동일) ---------------- */}
      {viewStep === "PAYMENT" && selectedSeat && (
        <div className="w-full max-w-md mt-10 p-6 bg-white border rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center border-b pb-4">예매 확인 및 결제</h2>
           <div className="space-y-4 mb-8">
            <div className="flex justify-between">
              <span className="text-gray-600">선택 좌석</span>
              <span className="font-bold text-lg">{selectedSeat.seatNo}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>예약 번호</span>
              <span>#{reservationId}</span>
            </div>
            <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-700">
              ⚡ 좌석이 2분간 임시 선점되었습니다.<br/>
              시간 내에 결제를 완료해주세요.
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="font-bold mb-3">결제 수단 선택</h3>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="CARD" checked={paymentMethod === "CARD"} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600" />
                <span className="ml-3">신용/체크카드</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="BANK" checked={paymentMethod === "BANK"} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-blue-600" />
                <span className="ml-3">무통장 입금</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => {
                 setViewStep("SEAT_SELECTION");
                 setReservationId(null);
                 setSelectedSeat(null);
                 if (resolvedParams) fetchSeats(resolvedParams.id);
              }}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-bold hover:bg-gray-100"
            >
              취소
            </button>
            <button 
              onClick={handleFinalConfirm}
              className="flex-[2] py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg"
            >
              예매 완료하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}