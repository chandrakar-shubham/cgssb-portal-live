import fs from 'node:fs';

const failures=[];

const workflow=fs.readFileSync('.github/workflows/phase8-distributed-10000-load.yml','utf8');
const pre=fs.readFileSync('scripts/phase8-10000-preflight.mjs','utf8');
const requiredRoutes=['/','/cgvyapam/mock-tests','/cgpsc/mock-tests','/leaderboard','/cgvyapam/pyp-papers','/cgvyapam-cgssb/chapter-tests','/cgvyapam-cgssb/practice-drills'];
for(const route of requiredRoutes){ if(!workflow.includes(route)) failures.push('10000-VU workflow missing required route '+route); }
const gate75=fs.readFileSync('.github/workflows/phase8-distributed-7500-load.yml','utf8');
const gate5=fs.readFileSync('.github/workflows/phase8-distributed-5000-load.yml','utf8');
const gate35=fs.readFileSync('.github/workflows/phase8-distributed-load.yml','utf8');

for(const needle of [
  'Phase 8 Distributed 10000-VU Promotion Gate',
  'EXPECTED_TOTAL_VUS: 10000',
  'EXPECTED_SHARDS: 8',
  'vus: 1250',
  'duration_sec',
  'phase8-distributed-10000-',
  'read-only routes',
  'no authentication or writes'
]) if(!workflow.includes(needle)) failures.push('10000-VU workflow missing '+needle);

for(const needle of ['vus!==1250','duration!==60','https://gen-lang-client-0783153446.web.app','^shard-[1-8]$','Production HTTP GET/read-only paths only']) {
  if(!pre.includes(needle)) failures.push('10000-VU preflight missing '+needle);
}

if(!gate75.includes('EXPECTED_TOTAL_VUS: 7500') || !gate75.includes('EXPECTED_SHARDS: 5'))
  failures.push('7,500-VU certified workflow was modified');
if(!gate5.includes('EXPECTED_TOTAL_VUS: 5000') || !gate5.includes('EXPECTED_SHARDS: 4'))
  failures.push('5,000-VU certified workflow was modified');
if(!gate35.includes('EXPECTED_TOTAL_VUS: 3500'))
  failures.push('3,500-VU certified workflow was modified');

const aggregate=fs.readFileSync('scripts/phase8-distributed-aggregate.mjs','utf8');
if(!aggregate.includes('EXPECTED_TOTAL_VUS') || !aggregate.includes('EXPECTED_SHARDS'))
  failures.push('aggregate gate does not enforce expected totals');

if(failures.length){
  console.error('Phase 8 10000-VU promotion guard FAILED');
  failures.forEach(x=>console.error('- '+x));
  process.exit(1);
}
console.log('Phase 8 10000-VU promotion guard PASSED');
