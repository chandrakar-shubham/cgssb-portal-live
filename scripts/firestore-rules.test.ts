import { readFileSync } from 'node:fs';

const rules = readFileSync('firestore.rules', 'utf8');

const requiredFragments = [
  'allow write: if false;',
  'match /{document=**}',
  'allow read, write: if false;',
  'request.auth.uid == userId',
];

for (const fragment of requiredFragments) {
  if (!rules.includes(fragment)) {
    throw new Error(`Firestore security regression: missing required rule fragment: ${fragment}`);
  }
}

const publicCollections = [
  'mockTests',
  'questions',
  'pypPapers',
  'bundles',
  'pages',
  'posts',
  'seriesPacks',
  'cmsSettings',
  'slider_banners',
  'currentAffairsSources',
  'currentAffairsTopics',
  'currentAffairsQuestions',
  'dailyEditions',
  'monthlyEditions',
  'remoteConfig',
];

for (const collection of publicCollections) {
  const marker = `match /${collection}/`;
  const start = rules.indexOf(marker);
  if (start === -1) {
    throw new Error(`Firestore security regression: missing match block for ${collection}`);
  }

  const nextMatch = rules.indexOf("\n    match /", start + marker.length);
  const block = rules.slice(start, nextMatch === -1 ? rules.length : nextMatch);

  if (!block.includes('allow read: if true;') || !block.includes('allow write: if false;')) {
    throw new Error(`Firestore security regression: public-read/server-write policy missing for ${collection}`);
  }
}

const usersStart = rules.indexOf('match /users/{userId}');
const usersEnd = rules.indexOf('\n    // Public exam/catalog content', usersStart);
const usersBlock = rules.slice(usersStart, usersEnd);
if (!usersBlock.includes("allow create: if isOwner(userId)")) {
  throw new Error('Firestore security regression: user profile create protection missing');
}
if (!usersBlock.includes("affectedKeys().hasOnly")) {
  throw new Error('Firestore security regression: user profile update allowlist missing');
}
for (const privilegedField of ['role', 'isBlocked', 'credits', 'hasProPass', 'adminPermissions']) {
  if (usersBlock.includes(`'${privilegedField}'`)) {
    throw new Error(`Firestore security regression: privileged user field became client-writable: ${privilegedField}`);
  }
}

const referralsStart = rules.indexOf('match /referrals/{referralId}');
const referralsEnd = rules.indexOf('\n    // Server-driven configuration', referralsStart);
const referralsBlock = rules.slice(referralsStart, referralsEnd);
if (!referralsBlock.includes('allow read, write: if false;')) {
  throw new Error('Firestore security regression: referral records must remain server-only');
}

console.log('Firestore security regression checks passed.');
