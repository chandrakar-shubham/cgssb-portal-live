import fs from 'node:fs';

const files = [
  ['.github/workflows/phase8-distributed-7500-load.yml','Phase 8 Distributed 7500-VU Promotion Gate'],
  ['.github/workflows/phase8-distributed-7500-load.yml','EXPECTED_TOTAL_VUS: 7500'],
  ['.github/workflows/phase8-distributed-7500-load.yml','EXPECTED_SHARDS: 5'],
  ['.github/workflows/phase8-distributed-7500-load.yml','vus: 1500'],
  ['scripts/phase8-distributed-aggregate.mjs','expectedTotalVus']
];
const failures=[];
for(const [file,needle] of files){
  const s=fs.readFileSync(file,'utf8');
  if(!s.includes(needle)) failures.push(file+' missing '+needle);
}
const gate5=fs.readFileSync('.github/workflows/phase8-distributed-5000-load.yml','utf8');
if(!gate5.includes('EXPECTED_TOTAL_VUS: 5000') || !gate5.includes('EXPECTED_SHARDS: 4'))
  failures.push('5,000-VU promotion gate was modified or no longer enforces its certified total');
const gate35=fs.readFileSync('.github/workflows/phase8-distributed-load.yml','utf8');
if(!gate35.includes('EXPECTED_TOTAL_VUS: 3500'))
  failures.push('3,500-VU certified workflow no longer enforces its certified total');
const pre=fs.readFileSync('scripts/phase8-distributed-preflight.mjs','utf8');
if(!pre.includes('1500')) failures.push('distributed preflight does not allow the 1,500-VU promotion shards');
if(!pre.includes('duration!==60')) failures.push('distributed preflight no longer requires 60 seconds');
if(!pre.includes('Production HTTP GET/read-only paths only')) failures.push('distributed preflight safety statement missing');
if(!pre.includes('^shard-[12345]$')) failures.push('distributed preflight does not allow shard-5');
if(failures.length){console.error('Phase 8 7500-VU promotion guard FAILED'); failures.forEach(x=>console.error('- '+x)); process.exit(1);}
console.log('Phase 8 7500-VU promotion guard PASSED');
