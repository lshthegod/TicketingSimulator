# TicketingSimulator

대기열, 좌석 선점, 예약 확정 흐름을 포함한 공연/콘서트 티켓 예매 시뮬레이터

## 기술 스택

### 프론트엔드

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS v4
- Axios

### 백엔드

- NestJS (Node.js)
- TypeORM
- MySQL
- Redis
- Docker

## 주요 기능

- 회원가입 / 로그인 / 로그아웃
  - 이메일 기반 회원가입 및 JWT 인증
  - 게스트 로그인 지원
- 좌석 조회/생성
  - 이벤트별 좌석 조회(Redis 캐시, TTL 5초)
  - 좌석 벌크 생성 API
- 예약
  - 좌석 선점(비관적 락) 및 만료 시간 부여
  - 예약 확정 시 좌석 상태 변경(AVAILABLE → HELD → BOOKED)
- 대기열
  - Redis Sorted Set 기반 대기열 진입/이탈/순번 조회
  - 초당 N명(기본 10명) 활성화 토큰 발급 스케줄러
  - Event 오픈 시간 검증 Guard 및 대기열 활성 사용자 검증 Guard
- 보안
  - JWT 기반 인증, 비밀번호 해시화(bcrypt), Helmet, CORS 설정
- Docker 지원
  - Redis 포함 컨테이너 실행 (docker-compose)

## 설치 및 실행 방법

### 1. 환경 변수 설정

- backend/.env
- frontend/.env

### 2-1. Docker로 실행 (백엔드 + Redis)
docker-compose.yml에는 Nest(Backend) + Redis만 포함되어 있습니다.
프론트엔드는 Docker로 실행되지 않으며, 별도로 실행해야 합니다

```bash
cd backend
docker-compose up -d
```

- 백엔드: http://localhost:8080
- Redis: 6379 (컨테이너)

주의: MySQL은 별도 준비 필요(로컬 설치 또는 외부 인스턴스). 환경 변수로 연결하세요.
### 프론트엔드 실행 (별도)
```bash
cd frontend
npm install
npm run dev
```
- 프론트엔드: http://localhost:3000

- 백엔드 API 연결: `frontend/.env`의 `NEXT_PUBLIC_API_URL` 사용

### 2-2. 로컬 개발 환경 (직접 실행)

사전 준비:
- MySQL 실행
- Redis 실행(`docker run -p 6379:6379 redis:alpine` 권장)

백엔드 실행:

```bash
cd backend
npm install
npm run start:dev
```

프론트엔드 실행:

```bash
cd frontend
npm install
npm run dev
```

## 프론트 라우트 개요:

- `/login`, `/register`
- `/events`, `/events/[id]`, `/events/[id]/queue`
- `/reservation/[id]`, `/my-reservations`
  
## 기타

- K6 스크립트 제공: `backend/test/performance/`