#!/usr/bin/env node
const vus=Number(process.env.VUS||0), duration=Number(process.env.DURATION_SEC||0);
const base=(process.env.BASE_URL||'').replace(/\/$/,'');
const paths=(process.env.PATHS||'').split(',').map(s=>s.trim()).filter(Boolean);
const shardId=process.env.SHARD_ID||'';
const allowed=new Set([1100,1200]);
const failures=[];
if(!allowed.has(vus)) failures.push('Distributed shard VUS must be 1100 or 1200.');
if(duration!==60) failures.push('Distributed Phase 8 duration must be exactly 60 seconds.');
if(base!=='https://gen-lang-client-0783153446.web.app') failures.push('BASE_URL must be the configured production Firebase Hosting origin.');
if(!/^shard-[123]$/.test(shardId)) failures.push('SHARD_ID must be shard-1, shard-2, or shard-3.');
if(!paths.length) failures.push('PATHS must contain at least one read-only route.');
const forbidden=paths.filter(p=>{const n=p.toLowerCase();return n.includes('/admin')||n.includes('/login')||n.includes('/signup')||n.includes('/auth')||n.includes('/api/write')||n.includes('/api/admin');});
if(forbidden.length) failures.push('Authenticated/admin/write paths are forbidden: '+forbidden.join(', '));
if(failures.length){console.error('Distributed Phase 8 shard preflight FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log(JSON.stringify({approved:true,phase:'8-http-read-only-distributed-shard',shardId,virtualUsers:vus,durationSec:duration,safety:'Production HTTP GET/read-only paths only; no authentication or writes.'},null,2));
