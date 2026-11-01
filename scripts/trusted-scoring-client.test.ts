import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTrustedScoringClient,
  TrustedScoringApiError,
} from '../src/services/trustedScoringClient';

const submission = {
  testId: 'test-1',
  clientAttemptId: 'attempt-1',
  timeTakenSeconds: 90,
  responses: { q1: 'A', q2: null },
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

test('submission sends only the allowlisted payload with a fresh Firebase bearer token', async () => {
  let captured: { url: URL; init: RequestInit } | undefined;
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'firebase-id-token',
    fetchImpl: async (input, init) => {
      captured = { url: new URL(String(input)), init: init ?? {} };
      return response({ ok: true, replayed: false, attempt: { id: 'attempt-1', score: 2 } }, 201);
    },
  });

  const result = await client.submitAttempt(submission);
  assert.equal(result.replayed, false);
  assert.equal(result.attempt.score, 2);
  assert.equal(captured?.url.pathname, '/v1/attempts:submit');
  assert.equal(new Headers(captured?.init.headers).get('authorization'), 'Bearer firebase-id-token');
  assert.deepEqual(JSON.parse(String(captured?.init.body)), submission);
  assert.equal(new Headers(captured?.init.headers).has('x-score'), false);
  assert.equal(captured?.init.credentials, 'omit');
  assert.equal(captured?.init.cache, 'no-store');
});

test('same attempt ID can be retried and replay receipt is surfaced', async () => {
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => response({ ok: true, replayed: true, attempt: { id: 'attempt-1' } }, 200),
  });
  const result = await client.submitAttempt(submission);
  assert.equal(result.replayed, true);
});

test('review response distinguishes hidden solutions from released solutions', async () => {
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => response({ ok: true, canViewSolutions: false, attempt: { id: 'attempt-1' } }),
  });
  const result = await client.getAttemptReview('attempt-1');
  assert.equal(result.canViewSolutions, false);
  assert.equal(result.attempt.id, 'attempt-1');
});

test('worker errors preserve status and stable error code without exposing token', async () => {
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'secret-token',
    fetchImpl: async () => response({ error: 'ATTEMPT_NOT_AUTHORIZED' }, 403),
  });
  await assert.rejects(
    client.submitAttempt(submission),
    (error: unknown) => error instanceof TrustedScoringApiError &&
      error.status === 403 && error.code === 'ATTEMPT_NOT_AUTHORIZED',
  );
});

test('invalid payloads and insecure remote origins are rejected before network access', async () => {
  let calls = 0;
  const options = {
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => { calls += 1; return response({ ok: true, replayed: false, attempt: {} }); },
  };
  const client = createTrustedScoringClient(options);
  await assert.rejects(client.submitAttempt({ ...submission, responses: { q1: 'correct' } }));
  await assert.rejects(client.getAttemptReview('../other'));
  assert.equal(calls, 0);
  assert.throws(() => createTrustedScoringClient({ ...options, baseUrl: 'http://scoring.example.workers.dev' }));
});

test('network failure is retryable with the same idempotency key', async () => {
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => { throw new Error('offline'); },
  });
  await assert.rejects(
    client.submitAttempt(submission),
    (error: unknown) => error instanceof TrustedScoringApiError && error.code === 'NETWORK_ERROR',
  );
});

test('rejects response objects with custom prototypes, symbol keys, or accessors', async () => {
  let calls = 0;
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => { calls += 1; return response({ ok: true, replayed: false, attempt: {} }); },
  });

  const inherited = Object.assign(Object.create({ q2: 'B' }), { q1: 'A' });
  await assert.rejects(client.submitAttempt({ ...submission, responses: inherited }));

  const symbolKey = { q1: 'A', [Symbol('hidden')]: 'B' } as Record<string, string | null>;
  await assert.rejects(client.submitAttempt({ ...submission, responses: symbolKey }));

  let getterCalls = 0;
  const accessor = {};
  Object.defineProperty(accessor, 'q1', {
    enumerable: true,
    get() { getterCalls += 1; return 'A'; },
  });
  await assert.rejects(client.submitAttempt({
    ...submission,
    responses: accessor as Record<string, string | null>,
  }));
  assert.equal(getterCalls, 0);
  assert.equal(calls, 0);
});

test('review rejects a receipt for a different attempt ID', async () => {
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => response({ ok: true, canViewSolutions: false, attempt: { id: 'other-attempt' } }),
  });
  await assert.rejects(
    client.getAttemptReview('attempt-1'),
    (error: unknown) => error instanceof TrustedScoringApiError &&
      error.status === 502 && error.code === 'INVALID_RESPONSE',
  );
});

test('review rejects solution data before the trusted release flag', async () => {
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => response({
      ok: true,
      canViewSolutions: false,
      attempt: { id: 'attempt-1', scoreBreakdown: { questionResults: [] } },
    }),
  });
  await assert.rejects(
    client.getAttemptReview('attempt-1'),
    /unreleased solutions/,
  );
});

test('released review validates the per-question result structure', async () => {
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => response({
      ok: true,
      canViewSolutions: true,
      attempt: {
        id: 'attempt-1',
        scoreBreakdown: {
          questionResults: [{ questionId: 'q1', correctOption: 'Z' }],
        },
      },
    }),
  });
  await assert.rejects(
    client.getAttemptReview('attempt-1'),
    /invalid question result/,
  );
});

test('submission rejects top-level getters without invoking them', async () => {
  let getterCalls = 0;
  const unsafe = { ...submission };
  Object.defineProperty(unsafe, 'testId', {
    enumerable: true,
    get() { getterCalls += 1; return 'test-1'; },
  });
  let calls = 0;
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => { calls += 1; return response({ ok: true, replayed: false, attempt: {} }); },
  });
  await assert.rejects(client.submitAttempt(unsafe));
  assert.equal(getterCalls, 0);
  assert.equal(calls, 0);
});

test('submission rejects non-enumerable response properties rather than silently omitting them', async () => {
  const responses = { q1: 'A' } as Record<string, string | null>;
  Object.defineProperty(responses, 'q2', { value: 'B', enumerable: false });
  let calls = 0;
  const client = createTrustedScoringClient({
    baseUrl: 'https://scoring.example.workers.dev',
    getIdToken: async () => 'token',
    fetchImpl: async () => { calls += 1; return response({ ok: true, replayed: false, attempt: {} }); },
  });
  await assert.rejects(client.submitAttempt({ ...submission, responses }));
  assert.equal(calls, 0);
});

