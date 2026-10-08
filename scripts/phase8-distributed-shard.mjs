#!/usr/bin/env node
/**
 * Phase 8 distributed read-only load shard.
 * Each shard is an independent GitHub runner. It produces a structured result
 * consumed by the distributed coordinator. No auth or writes.
 */
import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';

const baseUrl=(process.env.BASE_URL||'https://gen-lang-client-0783153446.web.app').replace(/\/$/,'');
const vus=Math.max(1,Number(process.env.VUS||1200));
const durationSec=Math.max(1,Number(process.env.DURATION_SEC||60));
const paths=(process.env.PATHS||'/').split(',').map(s=>s.trim()).filter(Boolean);
const timeoutMs=Math.max(1000,Number(process.env.TIMEOUT_MS||10000));
const thinkMinMs=Math.max(0,Number(process.env.THINK_MIN_MS||700));
const thinkMaxMs=Math.max(thinkMinMs,Number(process.env.THINK_MAX_MS||1400));
const shardId=process.env.SHARD_ID||'unknown';
const resultFile=process.env.RESULT_FILE||`phase8-distributed-${shardId}.json`;

const samples=[]; let completed=0; let errors=0; let stop=false;
const statusCounts=new Map(); const routeStats=new Map();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const percentile=(xs,p)=>{if(!xs.length)return 0;const s=[...xs].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.max(0,Math.ceil(p*s.length)-1))];};
const inc=(m,k)=>m.set(k,(m.get(k)||0)+1);
function route(path){let s=routeStats.get(path);if(!s){s={samples:[],requests:0,errors:0,statusCounts:new Map(),errorCodes:new Map(),errorTypes:new Map()};routeStats.set(path,s);}return s;}
async function request(path){
 const started=performance.now(), controller=new AbortController(), timer=setTimeout(()=>controller.abort(),timeoutMs), r=route(path);
 try{
  const res=await fetch(new URL(path,baseUrl),{method:'GET',redirect:'manual',cache:'no-store',signal:controller.signal,headers:{'User-Agent':`CGSSB-Phase8-Distributed/${shardId}`}});
  await res.arrayBuffer(); const ms=performance.now()-started;
  samples.push(ms);completed++;r.requests++;r.samples.push(ms);inc(statusCounts,String(res.status));inc(r.statusCounts,String(res.status));
  if(!res.ok&&res.status!==304){errors++;r.errors++;}
 }catch(e){
  const ms=performance.now()-started;completed++;errors++;r.requests++;r.errors++;r.samples.push(ms);
  inc(statusCounts,'NETWORK_ERROR');inc(r.statusCounts,'NETWORK_ERROR');
  inc(r.errorTypes,e instanceof Error&&e.name?e.name:'UnknownError');
  const c=e&&typeof e==='object'&&e.cause&&typeof e.cause==='object'&&e.cause.code?String(e.cause.code):'UNKNOWN';
  inc(r.errorCodes,c);
 }finally{clearTimeout(timer);}
}
const workers=Array.from({length:vus},async()=>{while(!stop){await request(paths[Math.floor(Math.random()*paths.length)]);if(!stop&&thinkMaxMs>0)await sleep(thinkMinMs+Math.random()*(thinkMaxMs-thinkMinMs));}});
const started=performance.now();await sleep(durationSec*1000);stop=true;await Promise.all(workers);
const elapsedSec=(performance.now()-started)/1000;
const serialize=m=>Object.fromEntries(m);
const routeOut=Object.fromEntries([...routeStats.entries()].map(([p,s])=>[p,{requests:s.requests,errors:s.errors,errorRatePct:Number((s.errors/s.requests*100||0).toFixed(2)),statusCounts:serialize(s.statusCounts),errorTypes:serialize(s.errorTypes),errorCodes:serialize(s.errorCodes),latencyMs:{p50:Number(percentile(s.samples,.5).toFixed(1)),p95:Number(percentile(s.samples,.95).toFixed(1)),p99:Number(percentile(s.samples,.99).toFixed(1))}}]));
const result={phase:'8-http-read-only-distributed-shard',shardId,baseUrl,virtualUsers:vus,durationSec,elapsedSec:Number(elapsedSec.toFixed(2)),requests:completed,errors,errorRatePct:Number((errors/completed*100||0).toFixed(2)),requestsPerSecond:Number((completed/elapsedSec).toFixed(2)),statusCounts:serialize(statusCounts),routeStats:routeOut,latencyMs:{p50:Number(percentile(samples,.5).toFixed(1)),p95:Number(percentile(samples,.95).toFixed(1)),p99:Number(percentile(samples,.99).toFixed(1))},generatedAt:new Date().toISOString()};
result.acceptance={pass:result.errorRatePct<=1&&result.latencyMs.p95<=2000,errorRateThresholdPct:1,p95ThresholdMs:2000};
await writeFile(resultFile,JSON.stringify(result,null,2)+'\n','utf8');
console.log(JSON.stringify(result,null,2));
if(!result.acceptance.pass)process.exitCode=2;
