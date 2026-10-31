import test from "node:test";
import assert from "node:assert/strict";
import { createFirestoreAttemptRepository } from "../src/firestoreAttemptRepository.mjs";

function makeFirestore() {
  const docs = new Map([
    ["mockTests/test-1", {
      title: "Test", isPublished: true, isPro: false, questionCount: 1,
      durationMinutes: 30, marksPerQuestion: 2, negativeMarksPerQuestion: 0.5,
      sections: [{ id: "s1", questionIds: ["q1"] }],
      solutionReleasePolicy: { mode: "manual", isReleased: false },
    }],
    ["users/student-1", { name: "Student", status: "active" }],
    ["questions/q1", { correctOption: "A", marks: 2, questionType: "mcq" }],
  ]);
  const writes = [];
  return {
    docs, writes,
    async getDocument(path) { return docs.get(path) ?? null; },
    async batchGetDocuments(paths) {
      return paths.map(path => docs.has(path) ? { ...docs.get(path), __path: path } : null).filter(Boolean);
    },
    async commitWrites(batch) {
      writes.push(batch);
      // Simulate Firestore commit preconditions and all-or-nothing semantics.
      if (batch.some(write => docs.has(write.path))) {
        const error = new Error("FAILED_PRECONDITION");
        error.code = "FAILED_PRECONDITION";
        throw error;
      }
      for (const write of batch) docs.set(write.path, write.data);
    },
  };
}

const attempt = {
  id: "attempt_abc", userId: "student-1", testId: "test-1",
  score: 2, scoreBreakdown: { rawScore: 2, questionResults: [] },
};

test("atomically stores trusted attempt and idempotency record", async () => {
  const firestore = makeFirestore();
  const repository = createFirestoreAttemptRepository({ firestore });
  const result = await repository.commitAttemptAtomically({
    uid: "student-1", testId: "test-1", documentId: attempt.id,
    fingerprint: "fp-1", attempt,
  });
  assert.equal(result.kind, "created");
  assert.equal(firestore.writes[0].length, 2);
  assert.equal(firestore.writes[0][0].currentDocument.exists, false);
  assert.equal(firestore.writes[0][1].currentDocument.exists, false);
  assert.equal(firestore.docs.get("trustedAttempts/attempt_abc").score, 2);
  assert.equal(firestore.docs.get("trustedAttemptIdempotency/attempt_abc").fingerprint, "fp-1");
});

test("replays the original result on duplicate atomic commit", async () => {
  const firestore = makeFirestore();
  const repository = createFirestoreAttemptRepository({ firestore });
  const args = {
    uid: "student-1", testId: "test-1", documentId: attempt.id,
    fingerprint: "fp-1", attempt,
  };
  assert.equal((await repository.commitAttemptAtomically(args)).kind, "created");
  const replay = await repository.commitAttemptAtomically(args);
  assert.equal(replay.kind, "replay");
  assert.equal(replay.fingerprint, "fp-1");
  assert.equal(replay.result.score, 2);
});

test("conflicts when same idempotency key is reused with a different fingerprint", async () => {
  const firestore = makeFirestore();
  const repository = createFirestoreAttemptRepository({ firestore });
  const args = {
    uid: "student-1", testId: "test-1", documentId: attempt.id,
    fingerprint: "fp-1", attempt,
  };
  await repository.commitAttemptAtomically(args);
  const conflict = await repository.commitAttemptAtomically({ ...args, fingerprint: "fp-2" });
  assert.equal(conflict.kind, "conflict");
  assert.equal(firestore.docs.get("trustedAttempts/attempt_abc").score, 2);
});

test("does not replay another user's idempotency record", async () => {
  const firestore = makeFirestore();
  firestore.docs.set("trustedAttemptIdempotency/attempt_abc", {
    fingerprint: "fp-1", attemptId: attempt.id, userId: "victim", testId: "test-1",
  });
  const repository = createFirestoreAttemptRepository({ firestore });
  await assert.rejects(() => repository.findAttemptByIdempotencyKey({
    uid: "student-1", testId: "test-1", documentId: attempt.id,
  }), /SCOPE_VIOLATION/);
});

test("loads only explicitly requested canonical question IDs in declared order", async () => {
  const firestore = makeFirestore();
  const repository = createFirestoreAttemptRepository({ firestore });
  const questions = await repository.loadCanonicalQuestions(["q1", "q-missing"]);
  assert.deepEqual(questions.map(question => question.id), ["q1"]);
  await assert.rejects(() => repository.loadCanonicalQuestions(["q1", "q1"]), /invalid canonical/);
});

test("eligibility uses trusted test, profile and entitlement documents", async () => {
  const firestore = makeFirestore();
  const repository = createFirestoreAttemptRepository({ firestore });
  const testDefinition = await repository.loadPublishedTest("test-1");
  assert.equal(await repository.authorizeAttempt({ uid: "student-1", test: testDefinition, now: Date.now() }), true);
  assert.equal(await repository.authorizeAttempt({ uid: "missing-user", test: testDefinition, now: Date.now() }), false);
});

test("review repository returns unknown release policy as hidden by default", async () => {
  const firestore = makeFirestore();
  const repository = createFirestoreAttemptRepository({ firestore });
  firestore.docs.set("trustedAttempts/attempt_abc", attempt);
  const record = await repository.loadAttemptForReview({ requesterUid: "student-1", attemptId: attempt.id });
  assert.equal(record.releasePolicy.mode, "manual");
  assert.equal(record.isAuthorizedAdmin, false);
});

test("does not overwrite a mismatched stored profile ID with the authenticated UID", async () => {
  const firestore = makeFirestore();
  firestore.docs.set("users/student-1", { id: "another-user", name: "Student", status: "active" });
  const repository = createFirestoreAttemptRepository({ firestore });
  const profile = await repository.loadStudentProfile("student-1");
  assert.equal(profile.id, "another-user");
  const testDefinition = await repository.loadPublishedTest("test-1");
  assert.equal(await repository.authorizeAttempt({
    uid: "student-1", test: testDefinition, now: Date.now(),
  }), false);
});
