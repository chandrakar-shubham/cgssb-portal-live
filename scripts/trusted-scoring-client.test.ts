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
