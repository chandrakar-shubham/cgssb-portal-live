import { readFileSync } from 'node:fs';

const rules = readFileSync('firestore.rules', 'utf8');

for (const fragment of [
  "rules_version = '2';",
  'function isAdmin()',
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
  if (!block.includes('allow write: if isAdmin();')) {
    throw new Error(`Admin write policy missing for ${collection}`);
  }
}

const usersStart = rules.indexOf('match /users/{userId}');
const usersEnd = rules.indexOf('\n    // Public exam/catalog content', usersStart);
const usersBlock = rules.slice(usersStart, usersEnd);
if (!usersBlock.includes('allow create: if (isOwner(userId) || isAdmin())')) {
  throw new Error('User profile create protection missing');
}
if (!usersBlock.includes('affectedKeys().hasOnly')) {
  throw new Error('User profile update allowlist missing');
}
for (const privilegedField of ['credits', 'adminPermissions']) {
  if (!usersBlock.includes(`'${privilegedField}'`)) {
    // These fields are intentionally not in the admin-managed create allowlist.
    continue;
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
    if (!block.includes('allow create, update, delete: if isBootstrapAdmin();')) {
      throw new Error('Admin role mutation policy must be Super Admin only');
    }
  } else if (!block.includes('allow read, write: if isAdmin();')) {
    throw new Error(`Admin write policy missing for ${collection}`);
  }
}

console.log('Firestore Spark security regression checks passed.');
