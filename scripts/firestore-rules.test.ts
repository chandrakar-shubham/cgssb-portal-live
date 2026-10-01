import { readFileSync } from 'node:fs';

const rules = readFileSync('firestore.rules', 'utf8');

for (const fragment of [
  "rules_version = '2';",
  'function isAdmin()',
  'function hasManageTests()',
  'function hasManageQuestions()',
  'function hasManageStudents()',
  'function hasManageCMS()',
  'function hasManagePayments()',
  'function hasManageSystem()',
  "request.auth.token.email == 'admin@cgtest.in'",
  'match /{document=**}',
  'allow read, write: if false;',
]) {
  if (!rules.includes(fragment)) throw new Error(`Firestore security regression: missing required fragment: ${fragment}`);
}

const publicCollections = [
  'mockTests','questions','pypPapers','bundles','pages','posts','seriesPacks',
  'cmsSettings','slider_banners','currentAffairsSources','currentAffairsTopics',
  'currentAffairsQuestions','dailyEditions','monthlyEditions','remoteConfig',
];

for (const collection of publicCollections) {
  const marker = `match /${collection}/`;
  const start = rules.indexOf(marker);
  if (start === -1) throw new Error(`Missing public collection rule: ${collection}`);
  const nextMatch = rules.indexOf("\n    match /", start + marker.length);
  const block = rules.slice(start, nextMatch === -1 ? rules.length : nextMatch);
  if (!block.includes('allow read: if true;')) {
    throw new Error(`Public read policy missing for ${collection}`);
  }
  const permissionMarkers: Record<string, string> = {
    mockTests: 'hasManageTests()', questions: 'hasManageQuestions()', pypPapers: 'hasManageTests()',
    bundles: 'hasManageCMS()', pages: 'hasManageCMS()', posts: 'hasManageCMS()', seriesPacks: 'hasManageCMS()',
    cmsSettings: 'hasManageCMS()', slider_banners: 'hasManageCMS()', currentAffairsSources: 'hasManageQuestions()',
    currentAffairsTopics: 'hasManageQuestions()', currentAffairsQuestions: 'hasManageQuestions()', dailyEditions: 'hasManageQuestions()',
    monthlyEditions: 'hasManageQuestions()', remoteConfig: 'hasManageSystem()'
  };
  if (!block.includes(permissionMarkers[collection])) {
    throw new Error(`Permission-aware admin write policy missing for ${collection}`);
  }
}

const usersStart = rules.indexOf('match /users/{userId}');
const usersEnd = rules.indexOf('\n    // Public exam/catalog content', usersStart);
const usersBlock = rules.slice(usersStart, usersEnd);
if (!usersBlock.includes('allow create: if (isOwner(userId)')) {
  throw new Error('Student profile create protection missing');
}
if (!usersBlock.includes('(hasManageStudents() &&')) {
  throw new Error('Admin profile create protection missing');
}
if (!usersBlock.includes('affectedKeys().hasOnly')) {
  throw new Error('User profile update allowlist missing');
}
if (!usersBlock.includes("'role', 'status', 'isBlocked'") ||
    !usersBlock.includes("'lastSyncedAt'")) {
  throw new Error('User profile create field policies missing');
}
if (!usersBlock.includes("allow create: if (isOwner(userId)")) {
  throw new Error('Student profile create must use an owner-only field allowlist');
}
for (const privilegedField of ['credits', 'adminPermissions']) {
  if (!usersBlock.includes(`'${privilegedField}'`)) {
    // These fields are intentionally not in the admin-managed create allowlist.
    continue;
  }
}

const profileStart = rules.indexOf('match /leaderboardProfiles/{profileId}');
if (profileStart === -1) throw new Error('Scalable leaderboard profile rule missing');
const profileEnd = rules.indexOf('\n    // Referral records', profileStart);
const profileBlock = rules.slice(profileStart, profileEnd);
for (const required of [
  'allow get: if true;',
  'allow list: if request.query.limit <= 100;',
  'isOwner(request.resource.data.userId)',
  "'practice_summary'",
  'affectedKeys().hasOnly'
]) {
  if (!profileBlock.includes(required)) {
    throw new Error(`Leaderboard profile security policy missing: ${required}`);
  }
}

const indexes = readFileSync('firestore.indexes.json', 'utf8');
for (const field of ['scopeType', 'scopeKey', 'averagePercentage']) {
  if (!indexes.includes(`"fieldPath": "${field}"`)) {
    throw new Error(`Leaderboard index missing field: ${field}`);
  }
}

const attemptsStart = rules.indexOf('match /attempts/{attemptId}');
const attemptsEnd = rules.indexOf('\n    // User-specific application state', attemptsStart);
const attemptsBlock = rules.slice(attemptsStart, attemptsEnd);
if (!attemptsBlock.includes('isOwner(request.resource.data.userId)')) {
  throw new Error('Attempt ownership rule missing');
}

const adminCollections = ['adminMembers', 'discountCoupons'];
for (const collection of adminCollections) {
  const start = rules.indexOf(`match /${collection}/`);
  if (start === -1) throw new Error(`Missing admin collection rule: ${collection}`);
  const nextMatch = rules.indexOf("\n    match /", start + 1);
  const block = rules.slice(start, nextMatch === -1 ? rules.length : nextMatch);
  if (collection === 'adminMembers' && !block.includes('allow read: if isAdmin();')) {
    throw new Error(`Admin read policy missing for ${collection}`);
  }
  if (collection === 'adminMembers') {
    if (!block.includes('allow create, update, delete: if hasManageAdmins();')) {
      throw new Error('Admin role mutation policy must be Super Admin only');
    }
  } else if (!block.includes('allow read, write: if hasManagePayments();')) {
    throw new Error(`Payment permission policy missing for ${collection}`);
  }
}

console.log('Firestore Spark security regression checks passed.');
