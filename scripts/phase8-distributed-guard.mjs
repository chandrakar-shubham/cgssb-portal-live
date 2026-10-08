import fs from 'node:fs';
const required=[
 ['scripts/phase8-load-test.mjs','result.acceptance'],
 ['scripts/phase8-distributed-shard.mjs','phase8-http-read-only-distributed-shard'],
 ['scripts/phase8-distributed-preflight.mjs','Distributed Phase 8 shard preflight'],
 ['.github/workflows/phase8-distributed-load.yml','Phase 8 Distributed External Read Load'],
 ['.github/workflows/phase8-distributed-load.yml','SHARD_ID'],
 ['.github/workflows/phase8-distributed-load.yml','phase8-distributed-aggregate.json'],
 ['package.json','test:phase8:distributed-guard']
];
const failures=[];
for(const [file,needle] of required){const s=fs.readFileSync(file,'utf8');if(!s.includes(needle))failures.push(file+' missing '+needle);}
const pre=fs.readFileSync('scripts/phase8-gate-preflight.mjs','utf8');
if(!pre.includes('approvedVus = new Set([3500])'))failures.push('controlled gate is not locked to 3500 VUs');
if(!pre.includes('durationSec !== 60'))failures.push('controlled gate duration is not 60 seconds');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('Phase 8 distributed-load integrity guard PASSED');
