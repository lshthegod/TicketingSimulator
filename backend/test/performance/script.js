import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
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
    http_req_failed: ['rate<0.01'], // 전체 실패율
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 전체 95퍼센타일
    'checks{type:auth}': ['rate>0.99'],
    'checks{type:browse}': ['rate>0.98'],
    'checks{type:hold}': ['rate>0.95'],
    'http_req_duration{name:POST /reservations/hold}': ['p(95)<400', 'p(99)<2000'],
    'http_req_duration{name:POST /reservations/confirm/:id}': ['p(95)<400', 'p(99)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

export function setup() {
  console.log('[setup] start');
  // 이벤트 생성
  const openAt = new Date().toISOString();
  const createEventRes = http.post(
    `${BASE_URL}/events`,
    JSON.stringify({
      title: `k6-event-${Date.now()}`,
      description: 'k6 load test',
      openAt,
    }),
    { ...JSON_HEADERS, tags: { name: 'POST /events' } },
  );

  console.log(`[setup] POST /events status=${createEventRes.status}`);
  check(createEventRes, {
    'create event status 200/201': (r) => r && (r.status === 200 || r.status === 201),
  }, { type: 'seed' });

  let eventId;
  try {
    const body = createEventRes.json();
    eventId = body && body.id;
    console.log(`[setup] created eventId=${eventId}`);
  } catch (_) {
    // ignore
    console.log('[setup] failed to parse event create response json');
  }

  // 좌석 벌크 생성 (26행 x 16열 = 416석)
  if (eventId) {
    const bulkSeatsRes = http.post(
      `${BASE_URL}/seats/bulk`,
      JSON.stringify({ eventId, rowCount: 26, seatPerCol: 16 }),
      { ...JSON_HEADERS, tags: { name: 'POST /seats/bulk' } },
    );
    console.log(`[setup] POST /seats/bulk status=${bulkSeatsRes.status}`);
    check(bulkSeatsRes, {
      'bulk seats status 200/201': (r) => r && (r.status === 200 || r.status === 201),
    }, { type: 'seed' });
  } else {
    console.log('[setup] skip /seats/bulk because eventId is undefined');
  }

  return { eventId };
}

export default function (data) {
  console.log(`[flow] start VU=${__VU} ITER=${__ITER}`);
  // 1) 게스트 인증 (쿠키로 JWT 설정됨) + me 확인
  group('auth', () => {
    const guestRes = http.post(`${BASE_URL}/auth/guest`, null, { tags: { name: 'POST /auth/guest' } });
    const hasCookie = !!(guestRes && guestRes.cookies && guestRes.cookies['accessToken']);
    console.log(`[auth] POST /auth/guest status=${guestRes.status} setCookieAccessToken=${hasCookie}`);
    check(guestRes, {
      'guest auth 200/302': (r) => r && (r.status === 200 || r.status === 302),
    }, { type: 'auth' });

    const meRes = http.get(`${BASE_URL}/auth/me`, { tags: { name: 'GET /auth/me' } });
    console.log(`[auth] GET /auth/me status=${meRes.status}`);
    check(meRes, {
      'me 200': (r) => r && r.status === 200,
    }, { type: 'auth' });
  });

  // 2) 이벤트/좌석 조회
  let targetEventId = data && data.eventId;
  group('browse', () => {
    const eventsRes = http.get(`${BASE_URL}/events`, { tags: { name: 'GET /events' } });
    let eventsCount = -1;
    try {
      const list = eventsRes.json();
      eventsCount = Array.isArray(list) ? list.length : -1;
    } catch (_) {
      // ignore
    }
    console.log(`[browse] GET /events status=${eventsRes.status} count=${eventsCount}`);
    check(eventsRes, {
      'events 200': (r) => r && r.status === 200,
    }, { type: 'browse' });

    if (!targetEventId) {
      try {
        const list = eventsRes.json();
        if (Array.isArray(list) && list.length > 0) {
          targetEventId = list[0].id;
          console.log(`[browse] picked eventId=${targetEventId} from list`);
        }
      } catch (_) {
        // ignore
        console.log('[browse] failed to parse events json');
      }
    }

    const seatsRes = http.get(`${BASE_URL}/seats/event/${targetEventId}`, { tags: { name: 'GET /seats/event/:eventId' } });
    let seatsCount = -1;
    try {
      const list = seatsRes.json();
      seatsCount = Array.isArray(list) ? list.length : -1;
    } catch (_) {
      // ignore
    }
    console.log(`[browse] GET /seats/event/${targetEventId} status=${seatsRes.status} count=${seatsCount}`);
    check(seatsRes, {
      'seats 200': (r) => r && r.status === 200,
    }, { type: 'browse' });

    // 3) 좌석 선점 -> 예약 확정
    let availableSeatId;
    try {
      const seats = seatsRes.json();
      if (Array.isArray(seats)) {
        const seat = seats.find((s) => s && s.status === 'AVAILABLE');
        if (seat) availableSeatId = seat.id;
      }
    } catch (_) {
      // ignore
      console.log('[hold] failed to parse seats json');
    }

    if (availableSeatId) {
      console.log(`[hold] try seatId=${availableSeatId}`);
      const holdRes = http.post(
        `${BASE_URL}/reservations/hold`,
        JSON.stringify({ seatId: availableSeatId }),
        { ...JSON_HEADERS, tags: { name: 'POST /reservations/hold' } },
      );
      let holdBody;
      try {
        holdBody = holdRes.json();
      } catch (_) {
        holdBody = holdRes && holdRes.body;
      }
      console.log(`[hold] POST /reservations/hold status=${holdRes.status} body=${JSON.stringify(holdBody)}`);
      const holdOk = check(holdRes, {
        'hold 200/201': (r) => r && (r.status === 200 || r.status === 201),
      }, { type: 'hold' });

      if (holdOk) {
        let reservationId;
        try {
          const body = holdBody || holdRes.json();
          reservationId = body && (body.reservationId || body.id);
        } catch (_) {
          // ignore
          console.log('[confirm] failed to parse hold response json');
        }

        if (reservationId) {
          console.log(`[confirm] try reservationId=${reservationId}`);
          const confirmRes = http.post(
            `${BASE_URL}/reservations/confirm/${reservationId}`,
            null,
            { tags: { name: 'POST /reservations/confirm/:id' } },
          );
          let confirmBody;
          try {
            confirmBody = confirmRes.json();
          } catch (_) {
            confirmBody = confirmRes && confirmRes.body;
          }
          console.log(`[confirm] POST /reservations/confirm/${reservationId} status=${confirmRes.status} body=${JSON.stringify(confirmBody)}`);
          check(confirmRes, {
            'confirm 200/201': (r) => r && r.status === 200 || r.status === 201,
          }, { type: 'confirm' });
        } else {
          console.log('[confirm] reservationId is undefined; skip confirm');
        }
      } else {
        console.log('[hold] hold check failed; skip confirm step');
      }
    } else {
      console.log('[hold] no AVAILABLE seat found; skip hold/confirm');
    }
  });

  sleep(1);
}

