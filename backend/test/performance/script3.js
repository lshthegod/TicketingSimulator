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
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    'checks{type:auth}': ['rate>0.99'],
    'checks{type:browse}': ['rate>0.98'],
    'checks{type:queue}': ['rate>0.95'],
    'checks{type:hold}': ['rate>0.95'],
    'http_req_duration{name:POST /auth/guest}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{name:POST /queue/enter}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{name:GET /queue/status}': ['p(95)<200', 'p(99)<500'],
    'http_req_duration{name:GET /seats/event/:eventId}': ['p(95)<600', 'p(99)<1500'],
    'http_req_duration{name:POST /reservations/hold}': ['p(95)<400', 'p(99)<2000'],
    'http_req_duration{name:POST /reservations/confirm/:id}': ['p(95)<400', 'p(99)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

export function setup() {
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

  check(
    createEventRes,
    {
      'create event status 200/201': (r) => r && (r.status === 200 || r.status === 201),
    },
    { type: 'seed' },
  );

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

    check(
      bulkSeatsRes,
      {
        'bulk seats status 200/201': (r) => r && (r.status === 200 || r.status === 201),
      },
      { type: 'seed' },
    );
  }

  return { eventId };
}

export default function (data) {
  let authToken = '';
  let authHeaders = JSON_HEADERS;

  group('auth', () => {
    const guestRes = http.post(`${BASE_URL}/auth/guest`, null, {
      tags: { name: 'POST /auth/guest' },
    });

    check(
      guestRes,
      {
        'guest auth 200/201': (r) => r && (r.status === 200 || r.status === 201),
      },
      { type: 'auth' },
    );

    try {
      const body = guestRes.json();
      authToken = body.accessToken;
      authHeaders = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      };
    } catch (_) {}

    const meRes = http.get(`${BASE_URL}/auth/me`, { ...authHeaders, tags: { name: 'GET /auth/me' } });

    check(
      meRes,
      {
        'me 200': (r) => r && r.status === 200,
      },
      { type: 'auth' },
    );
  });

  let targetEventId = data && data.eventId;

  group('browse', () => {
    const eventsRes = http.get(`${BASE_URL}/events`, {
      ...authHeaders,
      tags: { name: 'GET /events' },
    });

    check(
      eventsRes,
      {
        'events 200': (r) => r && r.status === 200,
      },
      { type: 'browse' },
    );

    if (!targetEventId) {
      try {
        const list = eventsRes.json();
        if (Array.isArray(list) && list.length > 0) {
          targetEventId = list[0].id;
        }
      } catch (_) {}
    }
  });

  let isQueuePassed = false;

  group('queue', () => {
    const enterRes = http.post(`${BASE_URL}/queue/enter`, null, {
      ...authHeaders,
      tags: { name: 'POST /queue/enter' },
    });

    check(
      enterRes,
      {
        'queue enter 200/201': (r) => r && (r.status === 200 || r.status === 201),
      },
      { type: 'queue' },
    );

    let retries = 60;
    while (retries > 0) {
      const statusRes = http.get(`${BASE_URL}/queue/status`, {
        ...authHeaders,
        tags: { name: 'GET /queue/status' },
      });

      let status;
      try {
        status = statusRes.json('status');
      } catch (_) {}

      if (status === 'ACTIVE') {
        isQueuePassed = true;
        break;
      }

      retries--;
      sleep(1);
    }

    check(
      null,
      {
        'queue passed': () => isQueuePassed,
      },
      { type: 'queue' },
    );
  });

  if (targetEventId && isQueuePassed) {
    group('reservation', () => {
      const seatsRes = http.get(`${BASE_URL}/seats/event/${targetEventId}`, {
        ...authHeaders,
        tags: { name: 'GET /seats/event/:eventId' },
      });

      check(
        seatsRes,
        {
          'seats 200': (r) => r && r.status === 200,
        },
        { type: 'browse' },
      );

      let availableSeatId;
      try {
        const seats = seatsRes.json();
        if (Array.isArray(seats)) {
          const seat = seats.find((s) => s && (s.st === 'AVAILABLE' || s.status === 'AVAILABLE'));
          if (seat) availableSeatId = seat.id;
        }
      } catch (_) {}

      if (availableSeatId) {
        const holdRes = http.post(
          `${BASE_URL}/reservations/hold`,
          JSON.stringify({ seatId: availableSeatId }),
          { ...authHeaders, tags: { name: 'POST /reservations/hold' } },
        );

        let holdBody;
        try {
          holdBody = holdRes.json();
        } catch (_) {
          holdBody = holdRes && holdRes.body;
        }

        const holdOk = check(
          holdRes,
          {
            'hold 200/201': (r) => r && (r.status === 200 || r.status === 201),
          },
          { type: 'hold' },
        );

        if (holdOk) {
          let reservationId;
          try {
            const body = holdBody || holdRes.json();
            reservationId = body && (body.reservationId || body.id);
          } catch (_) {}

          if (reservationId) {
            const confirmRes = http.post(
              `${BASE_URL}/reservations/confirm/${reservationId}`,
              null,
              { ...authHeaders, tags: { name: 'POST /reservations/confirm/:id' } },
            );

            check(
              confirmRes,
              {
                'confirm 200/201': (r) => r && (r.status === 200 || r.status === 201),
              },
              { type: 'confirm' },
            );
          }
        }
      }
    });
  }

  sleep(1);
}
