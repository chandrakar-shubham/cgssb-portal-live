#!/usr/bin/env node
/**
 * Phase 8 authenticated Firebase workload harness.
 *
 * SAFETY:
 * - Requires an explicitly isolated Firebase project.
 * - Refuses the production CGSSB project.
 * - Requires pre-created staging test accounts.
 * - Uses Firebase Auth REST for real user ID tokens.
 * - Uses Firestore REST with those ID tokens, so Security Rules are exercised.
 * - Writes only to the staging attempts collection and requires a cleanup
 *   service-account credential.
 *
 * Required:
 *   PHASE8_STAGING_PROJECT_ID
 *   PHASE8_STAGING_API_KEY
 *   PHASE8_TEST_USERS_JSON='[{"email":"...","password":"..."}]'
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/staging-service-account.json
 *
 * Optional:
 *   VUS=100 DURATION_SEC=60 TEST_ID=<staging test id>
 */
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import crypto from 'node:crypto';

const productionProject = 'gen-lang-client-0783153446';
const projectId = process.env.PHASE8_STAGING_PROJECT_ID;
const apiKey = process.env.PHASE8_STAGING_API_KEY;
const users = JSON.parse(process.env.PHASE8_TEST_USERS_JSON || '[]');
const vus = Math.max(1, Number(process.env.VUS || 25));
const durationSec = Math.max(1, Number(process.env.DURATION_SEC || 30));
const testId = process.env.TEST_ID || 'PHASE8-STAGING-TEST';
const databaseId = process.env.PHASE8_STAGING_DATABASE_ID || '(default)';

if (!projectId || !apiKey || !users.length || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error('Missing staging configuration: PHASE8_STAGING_PROJECT_ID, PHASE8_STAGING_API_KEY, PHASE8_TEST_USERS_JSON and GOOGLE_APPLICATION_CREDENTIALS are required.');
}
if (projectId === productionProject) {
  throw new Error('SAFETY STOP: authenticated load testing against the production Firebase project is prohibited.');
}
if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS does not point to an existing file.');
}

const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
const samples = [];
let requests = 0;
let errors = 0;
let stop = false;

const percentile = (xs,p) => {
  if (!xs.length) return 0;
  const sorted=[...xs].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1, Math.max(0, Math.ceil(p*sorted.length)-1))];
};

async function signIn(user) {
  const r = await fetch(authUrl, {
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({email:user.email,password:user.password,returnSecureToken:true})
  });
  if (!r.ok) throw new Error(`Auth failed: ${r.status}`);
  return r.json();
}

function fieldsForAttempt(uid, token, id) {
  const map = {
    id:{stringValue:id}, userId:{stringValue:uid}, testId:{stringValue:testId},
    testTitle:{stringValue:'PHASE8 STAGING'}, category:{stringValue:'CGSSB'},
    submittedAt:{stringValue:new Date().toISOString()}, timeTakenSeconds:{integerValue:'30'},
    totalDurationSeconds:{integerValue:'60'}, responses:{mapValue:{fields:{}}},
    questionStatuses:{mapValue:{fields:{}}}, score:{doubleValue:0}, maxScore:{doubleValue:1},
    percentage:{doubleValue:0}, accuracy:{doubleValue:0}, correctCount:{integerValue:'0'},
    incorrectCount:{integerValue:'0'}, unattemptedCount:{integerValue:'1'}, attemptedCount:{integerValue:'0'},
    markedForReviewCount:{integerValue:'0'}, negativeMarksDeducted:{doubleValue:0},
    sectorAnalysis:{arrayValue:{values:[]}}, submissionId:{stringValue:id}
  };
  return map;
}

async function writeAttempt(uid, token, id) {
  const started=performance.now();
  const url=`${firestoreBase}/attempts/${encodeURIComponent(id)}`;
  const r=await fetch(url,{method:'PATCH',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({fields:fieldsForAttempt(uid,token,id)})});
  samples.push(performance.now()-started); requests++;
  if (!r.ok) { errors++; return; }
}

async function worker(index, token) {
  while(!stop) {
    const id=`phase8-${Date.now()}-${index}-${Math.random().toString(36).slice(2,10)}`;
    await writeAttempt(users[index % users.length].uid, token, id);
  }
}

const sessions = await Promise.all(users.map(signIn));
sessions.forEach((s,i)=>users[i].uid=s.localId);

console.log(JSON.stringify({
  phase:'8-authenticated-firestore-rules',
  projectId,
  databaseId,
  virtualUsers:vus,
  durationSec,
  testId,
  testAccounts:users.length,
  warning:'STAGING ONLY. Firebase Auth + Firestore Security Rules are exercised; this is not a production capacity claim.'
},null,2));

const started=performance.now();
const workers=Array.from({length:vus},(_,i)=>worker(i,sessions[i % sessions.length].idToken));
await new Promise(r=>setTimeout(r,durationSec*1000));
stop=true;
await Promise.all(workers);
const elapsedSec=(performance.now()-started)/1000;

const serviceAccount=JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS,'utf8'));
const b64 = value => Buffer.from(value).toString('base64url');
const now=Math.floor(Date.now()/1000);
const assertion=b64(JSON.stringify({alg:'RS256',typ:'JWT'}))+'.'+b64(JSON.stringify({
  iss:serviceAccount.client_email,
  scope:'https://www.googleapis.com/auth/datastore',
  aud:'https://oauth2.googleapis.com/token',
  iat:now,
  exp:now+3600
}));
const signer=crypto.createSign('RSA-SHA256');
signer.update(assertion);
const signed=signer.sign(serviceAccount.private_key,'base64url');
const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{
  method:'POST',
  headers:{'content-type':'application/x-www-form-urlencoded'},
  body:new URLSearchParams({
    grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion:assertion+'.'+signed
  })
});
if(!tokenResponse.ok) throw new Error(`Service-account OAuth token failed: ${tokenResponse.status}`);
const token=(await tokenResponse.json()).access_token;
const parent=`projects/${projectId}/databases/${databaseId}/documents`;
const listUrl=`https://firestore.googleapis.com/v1/${parent}/attempts?pageSize=1000`;
const listed=await fetch(listUrl,{headers:{authorization:`Bearer ${token}`}});
if(!listed.ok) throw new Error(`Cleanup enumeration failed: ${listed.status}`);
const body=await listed.json();
const cleanup=(body.documents||[]).filter(d=>d.fields?.testId?.stringValue===testId);
let cleanupErrors=0;
for (let i=0;i<cleanup.length;i+=20) {
  await Promise.all(cleanup.slice(i,i+20).map(d=>fetch(`https://firestore.googleapis.com/v1/${d.name}`,{method:'DELETE',headers:{authorization:`Bearer ${token}`}}).then(r=>{if(!r.ok) cleanupErrors++;})));
}

const result={
  elapsedSec:Number(elapsedSec.toFixed(2)),requests,errors,
  errorRatePct:Number((requests?errors/requests*100:0).toFixed(2)),
  requestsPerSecond:Number((requests/elapsedSec).toFixed(2)),
  latencyMs:{
    p50:Number(percentile(samples,.5).toFixed(1)),
    p95:Number(percentile(samples,.95).toFixed(1)),
    p99:Number(percentile(samples,.99).toFixed(1)),
    max:Number(samples.reduce((m,v)=>Math.max(m,v),0).toFixed(1))
  },
  cleanupDocuments:cleanup.length,
  cleanupErrors
};
console.log(JSON.stringify(result,null,2));
if(result.errorRatePct>1 || result.latencyMs.p95>2000 || cleanupErrors>0) process.exitCode=2;
