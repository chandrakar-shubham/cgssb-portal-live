import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigData from '../firebase-applet-config.json';
import { auditPublishedStudentExamDefinitionsFromFirestore } from '../src/firebase/studentExamDefinitionAuditFirestore';

const projectId = String(firebaseConfigData.projectId || '');
const confirmedProjectId = process.env.CGSSB_AUDIT_CONFIRM_PROJECT_ID || '';
const readOnlyConfirmation = process.env.CGSSB_AUDIT_CONFIRM_READ_ONLY || '';

if (!projectId || confirmedProjectId !== projectId || readOnlyConfirmation !== 'YES') {
  throw new Error(
    'Refusing Firestore audit. Set CGSSB_AUDIT_CONFIRM_PROJECT_ID to the exact configured project ID and CGSSB_AUDIT_CONFIRM_READ_ONLY=YES after confirming this is an authorized read-only audit.',
  );
}

const maxQuestionIds = Number(process.env.CGSSB_AUDIT_MAX_QUESTION_IDS ?? 5000);
const concurrency = Number(process.env.CGSSB_AUDIT_CONCURRENCY ?? 4);
const app = initializeApp({
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
});
const firestore = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

const summary = await auditPublishedStudentExamDefinitionsFromFirestore(firestore, {
  maxQuestionIds,
  concurrency,
});

// Deliberately print only aggregate outcomes and test IDs/statuses; no question
// content, options, answers, explanations, student profiles, or attempt data.
process.stdout.write(`${JSON.stringify({
  projectId,
  readOnly: true,
  ...summary,
}, null, 2)}\n`);

if (summary.blocked > 0) process.exitCode = 2;
