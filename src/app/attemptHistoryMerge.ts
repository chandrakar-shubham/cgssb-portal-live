import type { TestAttempt, User } from '../types';

export function mergeUserAttemptHistory(persistedAttempt: TestAttempt, attempts: TestAttempt[], user: Pick<User, 'id'>): TestAttempt[] {
  return [persistedAttempt, ...attempts.filter(attempt => attempt.userId === user.id && attempt.id !== persistedAttempt.id)];
}
