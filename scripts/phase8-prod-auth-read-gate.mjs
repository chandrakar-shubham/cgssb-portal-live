#!/usr/bin/env node
/**
 * Phase 8 authenticated production READ gate.
 *
 * This deliberately stops short of Firestore writes. It verifies:
 * - Firebase Auth sign-in with real pre-created test accounts
 * - authenticated user-profile reads
 * - authenticated owner-scoped attempt/enrollment reads
 * - public canonical catalog/content reads using authenticated ID tokens
 *
 * Required:
 *   PHASE8_PROD_PROJECT_ID
 *   PHASE8_PROD_API_KEY
 *   PHASE8_PROD_TEST_USERS_JSON='[{"email":"...","password":"..."}]'
 *
 * Safety:
 * - Refuses every project except the configured CGSSB production project.
 * - Never creates, updates, or deletes Firestore documents.
 * - Test accounts must be dedicated synthetic accounts.
 */
import { performance } from 'node:perf_hooks';

const allowedProductionProject = 'gen-lang-client-0783153446';
const projectId = process.env.PHASE8_PROD_PROJECT_ID;
const apiKey = process.env.PHASE8_PROD_API_KEY;
const users = JSON.parse(process.env.PHASE8_PROD_TEST_USERS_JSON || '[]');
const vus = Math.max(1, Number(process.env.VUS || 25));
const durationSec = Math.max(1, Number(process.env.DURATION_SEC || 30));
const databaseId = process.env.PHASE8_PROD_DATABASE_ID || 'ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089';
const thinkMinMs = Math.max(0, Number(process.env.THINK_MIN_MS || 700));
const thinkMaxMs = Math.max(thinkMinMs, Number(process.env.THINK_MAX_MS || 1400));

if (!projectId || !apiKey || !users.length) {
  throw new Error('Missing production configuration: PHASE8_PROD_PROJECT_ID, PHASE8_PROD_API_KEY and PHASE8_PROD_TEST_USERS_JSON are required.');
}
if (projectId !== allowedProductionProject) {
  throw new Error('SAFETY STOP: this production gate is hard-pinned to the CGSSB production Firebase project.');
}
for (const user of users) {
  if (!user?.email || !user?.password) throw new Error('Each production test user must contain email and password.');
}

const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
const paths = [
  ({uid}) => `/users/${encodeURIComponent(uid)}`,
  ({uid}) => `/attempts?pageSize=20&mask.fieldPaths=userId&mask.fieldPaths=submissionId`,
  ({uid}) => `/seriesEnrollments?pageSize=20&mask.fieldPaths=userId&mask.fieldPaths=seriesId`,
  () => '/examPrograms?pageSize=100',
  () => '/examPosts?pageSize=100',
  () => '/examTestSeries?pageSize=100',
  () => '/bundles?pageSize=100',
  () => '/mockTests?pageSize=100',
  () => '/questions?pageSize=100',
  () => '/pypPapers?pageSize=50'
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const percentile = (xs,p) => {
  if (!xs.length) return 0;
  const sorted=[...xs].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1, Math.max(0, Math.ceil(p*sorted.length)-1))];
};

async function signIn(user) {
  const started=performance.now();
  const response=await fetch(authUrl,{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({email:user.email,password:user.password,returnSecureToken:true})
  });
  const latency=performance.now()-started;
  if (!response.ok) throw new Error(`Auth failed for ${user.email}: HTTP ${response.status}`);
  const body=await response.json();
  return {...body, authLatencyMs:latency};
}

const sessions=await Promise.all(users.map(signIn));
sessions.forEach((session,index)=>{ users[index].uid=session.localId; });

console.log(JSON.stringify({
  phase:'8-authenticated-production-read-gate',
  projectId,
  databaseId,
  virtualUsers:vus,
  durationSec,
  testAccounts:users.length,
  thinkTimeMs:{min:thinkMinMs,max:thinkMaxMs},
  safety:'READ ONLY: no Firestore create/update/delete operations are performed.'
},null,2));

const samples=[];
const statusCounts=new Map();
let requests=0;
let errors=0;
let authErrors=0;
let stop=false;

async function oneRequest(session, pathFactory) {
  const started=performance.now();
  try {
    const path=pathFactory({uid:session.localId});
    const response=await fetch(firestoreBase+path,{
      method:'GET',
      headers:{
        authorization:`Bearer ${session.idToken}`,
        'User-Agent':'CGSSB-Phase8-Authenticated-Read/1.0'
      }
    });
    const latency=performance.now()-started;
    samples.push(latency);
    requests++;
    statusCounts.set(String(response.status),(statusCounts.get(String(response.status))||0)+1);
    if (!response.ok) errors++;
    await response.arrayBuffer();
  } catch {
    samples.push(performance.now()-started);
    requests++;
    errors++;
    statusCounts.set('NETWORK_ERROR',(statusCounts.get('NETWORK_ERROR')||0)+1);
  }
}

async function worker(index) {
  const session=sessions[index % sessions.length];
  while(!stop) {
    const pathFactory=paths[Math.floor(Math.random()*paths.length)];
    await oneRequest(session,pathFactory);
    const delay=thinkMinMs + Math.random()*(thinkMaxMs-thinkMinMs);
    if (!stop) await sleep(delay);
  }
}

const started=performance.now();
await Promise.all(Array.from({length:vus},(_,index)=>worker(index)));
