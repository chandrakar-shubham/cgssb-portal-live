#!/usr/bin/env node
const vus=Number(process.env.VUS||0), duration=Number(process.env.DURATION_SEC||0);
const base=(process.env.BASE_URL||'').replace(/\/$/,'');
const paths=(process.env.PATHS||'').split(',').map(s=>s.trim()).filter(Boolean);
const shardId=process.env.SHARD_ID||'';
const failures=[];
if(vus!==1250) failures.push('10000-VU promotion shards must use exactly 1,250 VUs each.');
if(duration!==60) failures.push('10000-VU promotion duration must be exactly 60 seconds.');
if(base!=='https://gen-lang-client-0783153446.web.app') failures.push('BASE_URL must be the configured production Firebase Hosting origin.');
if(!/^shard-[1-8]$/.test(shardId)) failures.push('SHARD_ID must be shard-1 through shard-8.');
if(!paths.length) failures.push('PATHS must contain at least one read-only route.');
const forbidden=paths.filter(p=>{const n=p.toLowerCase();return n.includes('/admin')||n.includes('/login')||n.includes('/signup')||n.includes('/auth')||n.includes('/api/write')||n.includes('/api/admin');});
if(forbidden.length) failures.push('Authenticated/admin/write paths are forbidden: '+forbidden.join(', '));
if(failures.length){console.error('Phase 8 10000-VU promotion preflight FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log(JSON.stringify({approved:true,phase:'8-http-read-only-10000-vu-promotion',shardId,virtualUsers:vus,durationSec:duration,safety:'Production HTTP GET/read-only paths only; no authentication or writes.'},null,2));
