import type { TestAttempt, User } from '../types';
import { mergeUserAttemptHistory } from './attemptHistoryMerge';

export interface AttemptPersistenceDependencies<TProfiles> {
  saveAttempt: (attempt: TestAttempt) => Promise<TestAttempt>;
  buildLeaderboardProfiles: (user: User, attempts: TestAttempt[]) => TProfiles;
  saveLeaderboardProfiles: (profiles: TProfiles) => Promise<unknown>;
}

export interface PersistSubmittedAttemptInput {
  attempt: TestAttempt;
  user: User | null | undefined;
  attempts: TestAttempt[];
}

/**
 * Persist an authenticated student's attempt before the UI clears the active
 * exam checkpoint. Any write failure propagates so callers can keep the exam
 * open and allow a safe retry.
 */
export async function persistSubmittedAttempt<TProfiles>(
  input: PersistSubmittedAttemptInput,
  dependencies: AttemptPersistenceDependencies<TProfiles>,
): Promise<TestAttempt> {
  const { attempt, user, attempts } = input;
  if (!user?.id) return attempt;

  const persistedAttempt = await dependencies.saveAttempt(attempt);
  const allMineAttempts = mergeUserAttemptHistory(persistedAttempt, attempts, user);
  const profiles = dependencies.buildLeaderboardProfiles(user, allMineAttempts);
  await dependencies.saveLeaderboardProfiles(profiles);
  return persistedAttempt;
}
