import { LeaderboardProfileRecord, TestAttempt, User } from '../types';

type Scope = 'target' | 'series' | 'test';

const bestPerTest = (attempts: TestAttempt[]) => {
  const map = new Map<string, TestAttempt>();
  for (const attempt of attempts) {
    const old = map.get(attempt.testId);
    if (!old ||
      attempt.percentage > old.percentage ||
      (attempt.percentage === old.percentage && attempt.timeTakenSeconds < old.timeTakenSeconds)) {
      map.set(attempt.testId, attempt);
    }
  }
  return [...map.values()];
};

const makeProfile = (
  user: User,
  attempts: TestAttempt[],
  scopeType: Scope,
  scopeKey: string,
  targetKey: string,
  targetExam: string,
  seriesId?: string,
  testId?: string
): LeaderboardProfileRecord | null => {
  if (!attempts.length) return null;
  const best = bestPerTest(attempts);
  if (!best.length) return null;
  const average = (field: keyof Pick<TestAttempt, 'score' | 'maxScore' | 'percentage' | 'accuracy' | 'timeTakenSeconds'>) =>
    Number((best.reduce((sum, a) => sum + Number(a[field] || 0), 0) / best.length).toFixed(2));

  return {
    id: encodeURIComponent(user.id + '__' + scopeType + '__' + scopeKey),
    userId: user.id,
    scopeType,
    scopeKey,
    targetKey,
    targetExam,
    seriesId,
    testId,
    candidateName: user.name || 'Aspirant',
    district: user.district,
    category: user.categoryReservation,
    score: average('score'),
    maxScore: average('maxScore'),
    averagePercentage: average('percentage'),
    averageAccuracy: average('accuracy'),
    testsTaken: best.length,
    averageTimeSeconds: Math.round(average('timeTakenSeconds')),
    updatedAt: new Date().toISOString(),
    source: 'practice_summary',
  };
};

export function buildLeaderboardProfilesForUser(
  user: User,
  attempts: TestAttempt[]
): LeaderboardProfileRecord[] {
  const mine = attempts.filter(a => a.userId === user.id);
  const targetGroups = new Map<string, TestAttempt[]>();
  const seriesGroups = new Map<string, TestAttempt[]>();
  const testGroups = new Map<string, TestAttempt[]>();

  mine.forEach(a => {
    if (a.targetKey) {
      const list = targetGroups.get(a.targetKey) || [];
      list.push(a);
      targetGroups.set(a.targetKey, list);
    }
    if (a.seriesId) {
      const list = seriesGroups.get(a.seriesId) || [];
      list.push(a);
      seriesGroups.set(a.seriesId, list);
    }
    const list = testGroups.get(a.testId) || [];
    list.push(a);
    testGroups.set(a.testId, list);
  });

  const profiles: LeaderboardProfileRecord[] = [];
  targetGroups.forEach((group, targetKey) => {
    const first = group[0];
    const profile = makeProfile(user, group, 'target', targetKey, targetKey, first.targetExam || user.targetExam || 'Exam Target');
    if (profile) profiles.push(profile);
  });
  seriesGroups.forEach((group, seriesId) => {
    const first = group[0];
    const targetKey = first.targetKey || 'unknown';
    const profile = makeProfile(user, group, 'series', seriesId, targetKey, first.targetExam || user.targetExam || 'Exam Target', seriesId);
    if (profile) profiles.push(profile);
  });
  testGroups.forEach((group, testId) => {
    const first = group[0];
    const targetKey = first.targetKey || 'unknown';
    const profile = makeProfile(user, group, 'test', testId, targetKey, first.targetExam || user.targetExam || 'Exam Target', first.seriesId, testId);
    if (profile) profiles.push(profile);
  });

  return profiles;
}
