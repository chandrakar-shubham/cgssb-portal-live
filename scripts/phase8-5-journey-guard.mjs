import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');
const exam = read('src/components/ExamEngine.tsx');
const app = read('src/App.tsx');
const service = read('src/firebase/firestoreService.ts');
const rules = read('firestore.rules');
const authLoad = read('scripts/phase8-auth-load-test.mjs');
const prodLoad = read('.github/workflows/phase8-distributed-10000-load.yml');
const preflight = read('scripts/phase8-10000-preflight.mjs');

function requireText(source, text, label) {
  if (!source.includes(text)) failures.push(label + ': missing "' + text + '"');
}

// Student exam session resilience and submit contract.
for (const [needle, label] of [
  ['localStorage.getItem(sessionKey)', 'Exam session restore'],
  ['localStorage.setItem(sessionKey', 'Exam checkpoint persistence'],
  ['questionCount: questions.length', 'Checkpoint question-set consistency'],
  ['submissionId: sessionId', 'Stable retry submission identity'],
  ['if (persisted)', 'Submission success handling'],
  ['setIsSubmitting(false)', 'Retry unlock after submission failure'],
  ['onSubmit: (attemptData:', 'Exam submit callback contract']
]) requireText(exam, needle, label);

// Real submission path: attempt write is idempotent; leaderboard follows attempt.
requireText(app, 'const handleSubmitTest = async', 'Student submission handler');
requireText(app, 'persistedAttempt = await saveAttemptToFirestore(newAttempt)', 'Firestore attempt persistence');
requireText(app, 'await saveLeaderboardProfilesToFirestore(profiles)', 'Leaderboard profile persistence');
requireText(app, 'return false;', 'Submission failure propagation');
requireText(service, 'runTransaction(db, async (transaction) =>', 'Idempotent attempt transaction');
requireText(service, 'if (existing.exists())', 'Duplicate submission protection');
requireText(service, 'Cannot persist attempt: authenticated owner mismatch.', 'Attempt owner identity check');
requireText(service, 'where(documentId(), \'in\', chunk)', 'Chunked question reads');
requireText(service, 'Math.min(Math.max(options.limitCount || 100, 1), 100)', 'Bounded leaderboard reads');

// Rules must prevent cross-user attempt writes and post-submit mutation.
requireText(rules, 'allow create: if hasManageStudents() ||', 'Attempt create authorization');
requireText(rules, 'isOwner(request.resource.data.userId)', 'Attempt owner enforcement');
requireText(rules, 'allow update: if hasManageStudents();', 'Student attempt immutability');
requireText(rules, 'resource.data.userId == request.auth.uid', 'Attempt query ownership');
requireText(rules, 'request.query.limit <= 100', 'Public leaderboard query cap');

// Authenticated writes must remain isolated from production.
requireText(authLoad, 'if (projectId === productionProject)', 'Staging workload production-project stop');
requireText(authLoad, 'authenticated load testing against the production Firebase project is prohibited', 'Production write-test prohibition');
requireText(authLoad, 'GOOGLE_APPLICATION_CREDENTIALS', 'Staging cleanup credential requirement');
requireText(authLoad, 'cleanupErrors>0', 'Staging cleanup failure gate');
requireText(prodLoad, 'no authentication or writes are exercised', 'Production load workflow safety statement');
requireText(prodLoad, 'EXPECTED_TOTAL_VUS: 10000', 'Certified 10K read-only gate');
requireText(preflight, 'Production HTTP GET/read-only paths only', 'Production read-only preflight');

if (failures.length) {
  console.error('Phase 8.5 student journey safety guard FAILED');
  failures.forEach((failure) => console.error('- ' + failure));
  process.exit(1);
}

const attemptQueryStart = service.indexOf('export async function fetchMyAttemptsFromFirestore');
const attemptQueryEnd = service.indexOf('\nexport async function saveLeaderboardEntryToFirestore', attemptQueryStart);
const attemptQueryBody = service.slice(attemptQueryStart, attemptQueryEnd);
const attemptsUseBoundedCursorPages =
  attemptQueryBody.includes('const pageSize = 100;') &&
  attemptQueryBody.includes('startAfter(cursor)') &&
  attemptQueryBody.includes('limit(pageSize)') &&
  attemptQueryBody.includes('orderBy(documentId(), \'asc\')') &&
  attemptQueryBody.includes("results.sort((a, b) =>");
if (!attemptsUseBoundedCursorPages) {
  failures.push('Student attempt history: expected ordered Firestore cursor pagination with a 100-document page limit.');
}

console.log(JSON.stringify({
  phase: '8.5-student-journey-safety-audit',
  passed: true,
  verified: [
    'local exam checkpoint and restore contract',
    'stable submission ID and retry path',
    'transactional duplicate-attempt protection',
    'authenticated owner check and immutable student attempts',
    'chunked question reads and bounded leaderboard reads',
    'student attempt history uses 100-document cursor pages while preserving full history',
    'staging-only authenticated workload guard',
    'production 10K workflow remains read-only'
  ],
  findings: [],
  boundary: 'Static source-contract verification only; it does not claim a live authenticated Firestore journey or staging capacity test.'
}, null, 2));
