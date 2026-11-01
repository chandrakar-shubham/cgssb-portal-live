export interface TrustedAttemptSubmission {
  testId: string;
  clientAttemptId: string;
  timeTakenSeconds: number;
  responses: Record<string, string | null>;
}

export interface TrustedAttemptReview {
  canViewSolutions: boolean;
  attempt: Record<string, unknown>;
}

export interface TrustedScoringClientOptions {
  /** HTTPS Worker origin, e.g. https://cgssb-trusted-scoring.<account>.workers.dev */
  baseUrl: string;
  /** Return a fresh Firebase ID token for the currently authenticated user. */
  getIdToken: () => Promise<string>;
  /** Injectable transport for deterministic tests. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export class TrustedScoringApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'TrustedScoringApiError';
  }
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const ANSWERS = new Set(['A', 'B', 'C', 'D', null]);

function validateBaseUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Trusted scoring Worker URL must be a valid absolute URL.');
  }
  const localHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(localHost && url.protocol === 'http:')) {
    throw new Error('Trusted scoring Worker must use HTTPS outside local development.');
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('Trusted scoring Worker URL must not contain credentials, query parameters, or fragments.');
  }
  return url.origin;
}

function copyPlainDataRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(label + ' must be a plain object.');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(label + ' must be a plain object.');
  }
  const copy: Record<string, unknown> = Object.create(null);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      throw new Error(label + ' must contain only enumerable data properties.');
    }
    copy[key] = descriptor.value;
  }
  return copy;
}

function validateSubmission(value: TrustedAttemptSubmission): TrustedAttemptSubmission {
  const input = copyPlainDataRecord(value, 'A trusted attempt submission');
  const responses = copyPlainDataRecord(input.responses, 'Attempt responses');
  const testId = input.testId;
  const clientAttemptId = input.clientAttemptId;
  const timeTakenSeconds = input.timeTakenSeconds;
  if (typeof testId !== 'string' || !ID_PATTERN.test(testId) ||
      typeof clientAttemptId !== 'string' || !ID_PATTERN.test(clientAttemptId)) {
    throw new Error('Test ID and client attempt ID must be valid identifiers.');
  }
  if (typeof timeTakenSeconds !== 'number' || !Number.isInteger(timeTakenSeconds) ||
      timeTakenSeconds < 0 || timeTakenSeconds > 86400) {
    throw new Error('Time taken must be an integer between 0 and 86400 seconds.');
  }
  const keys = Object.keys(responses);
  if (keys.length > 500) throw new Error('A submission cannot contain more than 500 responses.');
  for (const questionId of keys) {
    const answer: unknown = responses[questionId];
    if (!ID_PATTERN.test(questionId) || !ANSWERS.has(answer as string | null)) {
      throw new Error('Attempt responses contain an invalid question ID or answer value.');
    }
  }
  return {
    testId,
    clientAttemptId,
    timeTakenSeconds,
    responses: responses as TrustedAttemptSubmission['responses'],
  };
}

export function createTrustedScoringClient(options: TrustedScoringClientOptions) {
  const baseUrl = validateBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 12000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) {
    throw new Error('Trusted scoring timeout must be between 1000 and 60000 milliseconds.');
  }

  async function request(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
    const token = await options.getIdToken();
    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new TrustedScoringApiError('Student authentication is required.', 401, 'UNAUTHENTICATED');
    }

    let response: Response;
    try {
      response = await fetchImpl(new URL(path, baseUrl), {
        ...init,
        headers: (() => {
          const headers = new Headers(init.headers);
          headers.set('accept', 'application/json');
          headers.set('authorization', `Bearer ${token}`);
          if (init.body && !headers.has('content-type')) {
            headers.set('content-type', 'application/json');
          }
          return headers;
        })(),
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        signal: init.signal ?? AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new TrustedScoringApiError(
        'Trusted scoring service could not be reached. Retry using the same attempt ID.',
        0,
        'NETWORK_ERROR',
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new TrustedScoringApiError('Trusted scoring service returned an invalid response.', response.status, 'INVALID_RESPONSE');
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new TrustedScoringApiError('Trusted scoring service returned an invalid response.', response.status, 'INVALID_RESPONSE');
    }
    const payload = body as Record<string, unknown>;
    if (!response.ok || payload.ok !== true) {
      const code = typeof payload.error === 'string' ? payload.error : 'REQUEST_FAILED';
      throw new TrustedScoringApiError(code, response.status, code);
    }
    return payload;
  }

  return {
    async submitAttempt(submission: TrustedAttemptSubmission) {
      const safeSubmission = validateSubmission(submission);
      const payload = await request('/v1/attempts:submit', {
        method: 'POST',
        body: JSON.stringify({
          testId: safeSubmission.testId,
          clientAttemptId: safeSubmission.clientAttemptId,
          timeTakenSeconds: safeSubmission.timeTakenSeconds,
          responses: safeSubmission.responses,
        }),
      });
      if (!payload.attempt || typeof payload.attempt !== 'object' || Array.isArray(payload.attempt) ||
          typeof payload.replayed !== 'boolean') {
        throw new TrustedScoringApiError('Trusted scoring receipt is incomplete.', 502, 'INVALID_RESPONSE');
      }
      return {
        replayed: payload.replayed,
        attempt: payload.attempt as Record<string, unknown>,
      };
    },

    async getAttemptReview(attemptId: string): Promise<TrustedAttemptReview> {
      if (!ID_PATTERN.test(attemptId)) throw new Error('Attempt ID is invalid.');
      const payload = await request(`/v1/attempts/${encodeURIComponent(attemptId)}/review`);
      if (typeof payload.canViewSolutions !== 'boolean' ||
          !payload.attempt || typeof payload.attempt !== 'object' || Array.isArray(payload.attempt)) {
        throw new TrustedScoringApiError('Trusted review response is incomplete.', 502, 'INVALID_RESPONSE');
      }
      const attempt = payload.attempt as Record<string, unknown>;
      if (attempt.id !== attemptId) {
        throw new TrustedScoringApiError('Trusted review response does not match the requested attempt.', 502, 'INVALID_RESPONSE');
      }
      // The Worker must not return per-question correctness before release.
      if (!payload.canViewSolutions && Object.prototype.hasOwnProperty.call(attempt, 'scoreBreakdown')) {
        throw new TrustedScoringApiError('Trusted review response exposed unreleased solutions.', 502, 'INVALID_RESPONSE');
      }
      if (Object.prototype.hasOwnProperty.call(attempt, 'scoreBreakdown')) {
        const breakdown = attempt.scoreBreakdown;
        if (!breakdown || typeof breakdown !== 'object' || Array.isArray(breakdown) ||
            !Array.isArray((breakdown as Record<string, unknown>).questionResults)) {
          throw new TrustedScoringApiError('Trusted review response contains an invalid score breakdown.', 502, 'INVALID_RESPONSE');
        }
        for (const result of (breakdown as { questionResults: unknown[] }).questionResults) {
          if (!result || typeof result !== 'object' || Array.isArray(result)) {
            throw new TrustedScoringApiError('Trusted review response contains an invalid question result.', 502, 'INVALID_RESPONSE');
          }
          const questionResult = result as Record<string, unknown>;
          if (typeof questionResult.questionId !== 'string' ||
              (questionResult.correctOption !== undefined &&
               !['A', 'B', 'C', 'D'].includes(questionResult.correctOption as string))) {
            throw new TrustedScoringApiError('Trusted review response contains an invalid question result.', 502, 'INVALID_RESPONSE');
          }
        }
      }
      return {
        canViewSolutions: payload.canViewSolutions,
        attempt,
      };
    },
  };
}
