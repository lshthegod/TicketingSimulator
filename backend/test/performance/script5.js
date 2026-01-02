import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
  scenarios: {
    smoke: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '1m',
    },
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '30s', target: 300 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    'checks{type:auth}': ['rate>0.99'],
    'checks{type:browse}': ['rate>0.98'],
    'checks{type:queue}': ['rate>0.95'],
    'checks{type:hold}': ['rate>0.95'],
    'checks{type:confirm}': ['rate>0.95'],
    'http_req_duration{name:POST /auth/guest}': ['p(95)<600', 'p(99)<1500'],
    'http_req_duration{name:POST /queue/enter/:eventId}': ['p(95)<600', 'p(99)<1500'],
    'http_req_duration{name:GET /queue/status/:eventId}': ['p(95)<300', 'p(99)<700'],
    'http_req_duration{name:GET /seats/event/:eventId}': ['p(95)<700', 'p(99)<2000'],
    'http_req_duration{name:POST /reservations/hold}': ['p(95)<600', 'p(99)<2500'],
    'http_req_duration{name:POST /reservations/confirm/:id}': ['p(95)<600', 'p(99)<2500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

export function setup() {
  // 이벤트 오픈 시간은 과거로 설정하여 EventOpenGuard 통과를 안정화
  const openAt = new Date(Date.now() - 15000).toISOString();

  const createEventRes = http.post(
    `${BASE_URL}/events`,
    JSON.stringify({
      title: `k6-event-${Date.now()}`,
      description: 'k6 load test',
      openAt,
    }),
    { ...JSON_HEADERS, tags: { name: 'POST /events' } },
  );

  check(createEventRes, {
    'create event status 200/201': (r) => r && (r.status === 200 || r.status === 201),
  }, { type: 'seed' });

  let eventId;
  try {
    const body = createEventRes.json();
    eventId = body && body.id;
  } catch (_) {}

  if (eventId) {
    const bulkSeatsRes = http.post(
      `${BASE_URL}/seats/bulk`,
      JSON.stringify({ eventId, rowCount: 26, seatPerCol: 16 }),
      { ...JSON_HEADERS, tags: { name: 'POST /seats/bulk' } },
    );
    
    check(bulkSeatsRes, {
      'bulk seats status 200/201': (r) => r && (r.status === 200 || r.status === 201),
    }, { type: 'seed' });
  }

  return { eventId };
}

export default function (data) {
  // 1) 게스트 인증 (JWT는 쿠키로 설정됨)
  group('auth', () => {
    const guestRes = http.post(`${BASE_URL}/auth/guest`, null, { tags: { name: 'POST /auth/guest' } });
    check(guestRes, {
      'guest auth 200/302': (r) => r && (r.status === 200 || r.status === 302),
    }, { type: 'auth' });

    // 쿠키 기반 인증이므로 추가 헤더 없이 me 확인
    const meRes = http.get(`${BASE_URL}/auth/me`, { tags: { name: 'GET /auth/me' } });
    check(meRes, {
      'me 200': (r) => r && r.status === 200,
    }, { type: 'auth' });
  });

  // 2) 이벤트/좌석 조회
  let targetEventId = data && data.eventId;
  group('browse', () => {
    const eventsRes = http.get(`${BASE_URL}/events`, { tags: { name: 'GET /events' } });
    check(eventsRes, {
      'events 200': (r) => r && r.status === 200,
    }, { type: 'browse' });

    if (!targetEventId) {
      try {
        const list = eventsRes.json();
        if (Array.isArray(list) && list.length > 0) {
          targetEventId = list[0].id;
        }
      } catch (_) {}
    }
  });

  // 3) 큐 진입 및 ACTIVE 될 때까지 대기 (ActiveQueueGuard 대응)
  let isQueuePassed = false;
  if (targetEventId) {
    group('queue', () => {
      const enterRes = http.post(
        `${BASE_URL}/queue/enter/${targetEventId}`,
        null,
        { tags: { name: 'POST /queue/enter/:eventId' } },
      );

      check(enterRes, {
        'queue enter 200/201': (r) => r && (r.status === 200 || r.status === 201),
      }, { type: 'queue' });

      // 허용량/혼잡도에 대비해 충분한 재시도
      let retries = 180; // 최대 3분 대기
      while (retries > 0) {
        const statusRes = http.get(
          `${BASE_URL}/queue/status/${targetEventId}`,
          { tags: { name: 'GET /queue/status/:eventId' } },
        );

        let status = undefined;
        try {
          // k6는 selector 방식과 전체 파싱 모두 지원
          status = statusRes.json('status') || (statusRes.json() && statusRes.json().status);
        } catch (_) {}

        if (status === 'ACTIVE') {
          isQueuePassed = true;
          break;
        }

        retries--;
        sleep(1);
      }

      check(null, {
        'queue passed': () => isQueuePassed,
      }, { type: 'queue' });
    });
  }

  // 4) 좌석 선점 및 예약 확정 (EventOpenGuard + ActiveQueueGuard + JwtAuthGuard 고려)
  if (targetEventId && isQueuePassed) {
    group('reservation', () => {
      const seatsRes = http.get(
        `${BASE_URL}/seats/event/${targetEventId}`,
        { tags: { name: 'GET /seats/event/:eventId' } },
      );
      check(seatsRes, {
        'seats 200': (r) => r && r.status === 200,
      }, { type: 'browse' });

      let availableSeatId;
      try {
        const seats = seatsRes.json();
        if (Array.isArray(seats)) {
          const seat = seats.find((s) => s && (s.st === 'AVAILABLE' || s.status === 'AVAILABLE'));
          if (seat) availableSeatId = seat.id;
        }
      } catch (_) {}

      if (availableSeatId) {
        // hold: JwtAuthGuard + EventOpenGuard + ActiveQueueGuard
        const holdRes = http.post(
          `${BASE_URL}/reservations/hold`,
          JSON.stringify({ seatId: availableSeatId, eventId: targetEventId }),
          { ...JSON_HEADERS, tags: { name: 'POST /reservations/hold' } },
        );

        let holdOk = false;
        let reservationId;
        try {
          const hb = holdRes.json();
          reservationId = hb && (hb.reservationId || hb.id);
        } catch (_) {}

        holdOk = check(holdRes, {
          'hold 200/201': (r) => r && (r.status === 200 || r.status === 201),
        }, { type: 'hold' });

        if (holdOk && reservationId) {
          // confirm: JwtAuthGuard
          const confirmRes = http.post(
            `${BASE_URL}/reservations/confirm/${reservationId}`,
            null,
            { tags: { name: 'POST /reservations/confirm/:id' } },
          );

          check(confirmRes, {
            'confirm 200/201': (r) => r && (r.status === 200 || r.status === 201),
          }, { type: 'confirm' });
        }
      }
    });
  }

  sleep(1);
}


