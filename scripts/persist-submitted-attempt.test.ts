import assert from 'node:assert/strict';
import type { TestAttempt, User } from '../src/types';
import { persistSubmittedAttempt } from '../src/app/persistSubmittedAttempt';

function attempt(id: string, userId: string): TestAttempt {
  return { id, userId, testId: 'test-1', percentage: 75, score: 15, maxScore: 20, accuracy: 80, timeTakenSeconds: 300 } as TestAttempt;
}

const student = { id: 'student-1', name: 'Student', targetExam: 'CGPSC', targetYear: '2026' } as User;

async function run() {
  {
    const guestAttempt = attempt('guest-attempt', 'guest');
    let saveCalled = false;
    const result = await persistSubmittedAttempt(
      { attempt: guestAttempt, user: null, attempts: [] },
      {
        saveAttempt: async value => { saveCalled = true; return value; },
        buildLeaderboardProfiles: () => [],
        saveLeaderboardProfiles: async () => undefined,
      },
    );
    assert.equal(result, guestAttempt);
    assert.equal(saveCalled, false);
  }

  {
    const submitted = attempt('attempt-new', student.id);
    const existing = attempt('attempt-old', student.id);
    let profilesWereBuilt = false;
    let profilesWereSaved = false;
    const result = await persistSubmittedAttempt(
      { attempt: submitted, user: student, attempts: [existing] },
      {
        saveAttempt: async value => ({ ...value, id: 'persisted-attempt' } as TestAttempt),
        buildLeaderboardProfiles: (_user, attempts) => {
          profilesWereBuilt = true;
          assert.deepEqual(attempts.map(item => item.id), ['persisted-attempt', 'attempt-old']);
          return [{ id: 'profile-1' }];
        },
        saveLeaderboardProfiles: async profiles => {
          profilesWereSaved = true;
          assert.deepEqual(profiles, [{ id: 'profile-1' }]);
        },
      },
    );
    assert.equal(result.id, 'persisted-attempt');
    assert.equal(profilesWereBuilt, true);
    assert.equal(profilesWereSaved, true);
  }

  {
    const submitted = attempt('attempt-fail', student.id);
    let profileSaveCalled = false;
    await assert.rejects(
      persistSubmittedAttempt(
        { attempt: submitted, user: student, attempts: [] },
        {
          saveAttempt: async () => { throw new Error('attempt write failed'); },
          buildLeaderboardProfiles: () => [],
          saveLeaderboardProfiles: async () => { profileSaveCalled = true; },
        },
      ),
      /attempt write failed/,
    );
    assert.equal(profileSaveCalled, false);
  }

  process.stdout.write('Passed 3 submitted-attempt persistence regression tests.\n');
}

run().catch(error => {
  process.stderr.write(String(error) + '\n');
  process.exitCode = 1;
});
