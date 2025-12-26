import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-8">
      <h1 className="text-4xl font-bold mb-8">티켓 예매 서비스</h1>
      
      <div className="grid grid-cols-2 gap-6 w-full max-w-md">
        {/* 조회 버튼 -> /events 이동 */}
        <Link 
          href="/events"
          className="flex items-center justify-center h-40 bg-blue-500 text-white text-2xl font-bold rounded-xl shadow-lg hover:bg-blue-600 transition transform hover:-translate-y-1"
        >
          공연 조회
        </Link>

        {/* 생성 버튼 -> 기능 없음 */}
        <button 
          className="flex items-center justify-center h-40 bg-gray-300 text-gray-600 text-2xl font-bold rounded-xl shadow-inner cursor-not-allowed"
          disabled
        >
          공연 생성
          <span className="block text-xs font-normal mt-2">(준비중)</span>
        </button>
      </div>
    </div>
  );
}