import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-8">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 drop-shadow-sm mb-2">
          Timulator
        </h1>
        <p className="text-gray-500 text-lg font-medium">
          실전 같은 티켓팅 시뮬레이션 서비스
        </p>
      </div>
      
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