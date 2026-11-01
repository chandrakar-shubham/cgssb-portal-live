export interface TrustedAttemptSubmission {
  testId: string;
  clientAttemptId: string;
  timeTakenSeconds: number;
  responses: Record<string, string | null>;
  questionStatuses?: Record<string, 'not_visited' | 'unanswered' | 'answered' | 'marked_for_review' | 'answered_and_marked'>;
}

export interface TrustedAttemptReview {
  canViewSolutions: boolean;
  attempt: Record<string, unknown>;
}


export interface TrustedAttemptHistoryPage {
  attempts: Record<string, unknown>[];
  nextCursor: string | null;
}

const HISTORY_FIELDS = new Set([
  'id', 'userId', 'userName', 'testId', 'testTitle', 'category', 'submittedAt',
  'timeTakenSeconds', 'totalDurationSeconds', 'responses', 'questionStatuses',
  'score', 'maxScore', 'percentage', 'accuracy', 'correctCount', 'incorrectCount',
  'unattemptedCount', 'attemptedCount', 'markedForReviewCount', 'negativeMarksDeducted',
  'sectorAnalysis', 'submissionId', 'seriesId', 'targetKey', 'targetExam',
]);

function validateHistoryAttempt(value: unknown): Record<string, unknown> {
  const attempt = copyPlainDataRecord(value, 'A trusted history attempt');
  if (Object.keys(attempt).some(key => !HISTORY_FIELDS.has(key)) ||
      typeof attempt.id !== 'string' || !ID_PATTERN.test(attempt.id) ||
      typeof attempt.userId !== 'string' || !attempt.userId ||
      typeof attempt.testId !== 'string' || !ID_PATTERN.test(attempt.testId) ||
      typeof attempt.submittedAt !== 'string' || !Number.isFinite(Date.parse(attempt.submittedAt))) {
    throw new TrustedScoringApiError('Trusted history contains an invalid attempt.', 502, 'INVALID_RESPONSE');
  }
  if (Object.prototype.hasOwnProperty.call(attempt, 'scoreBreakdown') ||
      Object.prototype.hasOwnProperty.call(attempt, 'correctOption')) {
    throw new TrustedScoringApiError('Trusted history exposed solution data.', 502, 'INVALID_RESPONSE');
  }
  return attempt;
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
const PALETTE_STATUSES = new Set(['not_visited', 'unanswered', 'answered', 'marked_for_review', 'answered_and_marked']);

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
  const questionStatuses = input.questionStatuses === undefined
    ? undefined
    : copyPlainDataRecord(input.questionStatuses, 'Question palette statuses');
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
  if (questionStatuses) {
    const statusKeys = Object.keys(questionStatuses);
    if (statusKeys.length > 500) throw new Error('A submission cannot contain more than 500 question statuses.');
    for (const questionId of statusKeys) {
      if (!ID_PATTERN.test(questionId) || !PALETTE_STATUSES.has(questionStatuses[questionId] as string)) {
        throw new Error('Question palette statuses contain an invalid question ID or status.');
      }
    }
  }
  return {
    testId,
    clientAttemptId,
    timeTakenSeconds,
    responses: responses as TrustedAttemptSubmission['responses'],
    ...(questionStatuses ? { questionStatuses: questionStatuses as TrustedAttemptSubmission['questionStatuses'] } : {}),
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
          ...(safeSubmission.questionStatuses ? { questionStatuses: safeSubmission.questionStatuses } : {}),
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

    async listMyAttempts(options: { limit?: number; cursor?: string | null } = {}): Promise<TrustedAttemptHistoryPage> {
      const limit = options.limit ?? 25;
      if (!Number.isInteger(limit) || limit < 1 || limit > 50 ||
          (options.cursor !== undefined && options.cursor !== null &&
           (typeof options.cursor !== 'string' || options.cursor.length > 2048))) {
        throw new Error('Attempt history pagination options are invalid.');
      }
      const params = new URLSearchParams({ limit: String(limit) });
      if (options.cursor) params.set('cursor', options.cursor);
      const payload = await request('/v1/attempts?' + params.toString());
      if (!Array.isArray(payload.attempts) ||
          !(payload.nextCursor === null || (typeof payload.nextCursor === 'string' && payload.nextCursor.length <= 2048))) {
        throw new TrustedScoringApiError('Trusted history response is incomplete.', 502, 'INVALID_RESPONSE');
      }
      return {
        attempts: payload.attempts.map(validateHistoryAttempt),
        nextCursor: payload.nextCursor as string | null,
      };
    },

    async listAllMyAttempts(): Promise<Record<string, unknown>[]> {
      const all: Record<string, unknown>[] = [];
      const seenIds = new Set<string>();
      const seenCursors = new Set<string>();
      let cursor: string | null = null;
      let pages = 0;
      do {
        if (++pages > 10000) {
          throw new TrustedScoringApiError('Trusted history exceeded the safe pagination boundary.', 502, 'INVALID_RESPONSE');
        }
        const page = await this.listMyAttempts({ limit: 50, cursor });
        for (const attempt of page.attempts) {
          const id = attempt.id as string;
          if (!seenIds.has(id)) {
            seenIds.add(id);
            all.push(attempt);
          }
        }
        cursor = page.nextCursor;
        if (cursor && seenCursors.has(cursor)) {
          throw new TrustedScoringApiError('Trusted history pagination cursor did not advance.', 502, 'INVALID_RESPONSE');
        }
        if (cursor) seenCursors.add(cursor);
      } while (cursor);
      return all.sort((a, b) =>
        String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')) ||
        String(b.id || '').localeCompare(String(a.id || ''))
      );
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
