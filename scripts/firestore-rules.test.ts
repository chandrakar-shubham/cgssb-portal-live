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
  const start = rules.indexOf(`match /${collection}/`);
  if (start === -1) {
    throw new Error(`Firestore security regression: missing match block for ${collection}`);
  }

  const block = rules.slice(start, rules.indexOf('\\n    }', start) + 6);
  if (!block.includes('allow read: if true;') || !block.includes('allow write: if false;')) {
    throw new Error(`Firestore security regression: public-read/server-write policy missing for ${collection}`);
  }
}

console.log('Firestore security regression checks passed.');
