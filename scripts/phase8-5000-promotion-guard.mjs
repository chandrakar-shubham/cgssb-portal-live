import fs from 'node:fs';

const files = [
  ['.github/workflows/phase8-distributed-5000-load.yml','Phase 8 Distributed 5000-VU Promotion Gate'],
  ['.github/workflows/phase8-distributed-5000-load.yml','EXPECTED_TOTAL_VUS: 5000'],
  ['.github/workflows/phase8-distributed-5000-load.yml','EXPECTED_SHARDS: 4'],
  ['scripts/phase8-distributed-preflight.mjs','1250'],
  ['scripts/phase8-distributed-aggregate.mjs','expectedTotalVus']
];
const failures=[];
for(const [file,needle] of files){
  const s=fs.readFileSync(file,'utf8');
  if(!s.includes(needle)) failures.push(file+' missing '+needle);
}
const original=fs.readFileSync('.github/workflows/phase8-distributed-load.yml','utf8');
if(!original.includes('EXPECTED_TOTAL_VUS: 3500')) failures.push('3,500-VU workflow no longer enforces its certified total');
const pre=fs.readFileSync('scripts/phase8-distributed-preflight.mjs','utf8');
if(!pre.includes('new Set([1100,1200,1250])')) failures.push('distributed preflight does not explicitly allow the 1,250-VU promotion shards');
if(!pre.includes('duration!==60')) failures.push('distributed preflight no longer requires 60 seconds');
if(!pre.includes('Production HTTP GET/read-only paths only')) failures.push('distributed preflight safety statement missing');
if(failures.length){console.error('Phase 8 5000-VU promotion guard FAILED'); failures.forEach(x=>console.error('- '+x)); process.exit(1);}
console.log('Phase 8 5000-VU promotion guard PASSED');
