#!/usr/bin/env node
/**
 * Phase 8 load harness.
 *
 * Safe by default: 25 virtual users, 30s, read-only HTTP requests.
 * This intentionally does NOT write Firestore data or attempt authentication.
 *
 * Examples:
 *   node scripts/phase8-load-test.mjs
 *   BASE_URL=https://YOUR-HOST.web.app VUS=250 DURATION_SEC=60 node scripts/phase8-load-test.mjs
 *   BASE_URL=https://YOUR-HOST.web.app VUS=1000 DURATION_SEC=120 PATHS=/,/robots.txt node scripts/phase8-load-test.mjs
 */
import { performance } from 'node:perf_hooks';

const baseUrl = (process.env.BASE_URL || 'https://gen-lang-client-0783153446.web.app').replace(/\/$/, '');
const vus = Math.max(1, Number(process.env.VUS || 25));
const durationSec = Math.max(1, Number(process.env.DURATION_SEC || 30));
const paths = (process.env.PATHS || '/').split(',').map(s => s.trim()).filter(Boolean);
const timeoutMs = Math.max(1000, Number(process.env.TIMEOUT_MS || 10000));

const samples = [];
let completed = 0;
let errors = 0;
let active = 0;
let stop = false;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const percentile = (xs, p) => {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a,b) => a-b);
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[i];
};

async function oneRequest(path) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(new URL(path, baseUrl), {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'User-Agent': 'CGSSB-Phase8-LoadHarness/1.0' }
    });
    const ms = performance.now() - started;
    samples.push(ms);
    completed++;
    if (!res.ok && res.status !== 304) errors++;
  } catch {
    samples.push(performance.now() - started);
    completed++;
    errors++;
  } finally {
    clearTimeout(timer);
  }
}

async function worker() {
  active++;
  try {
    while (!stop) {
      const path = paths[Math.floor(Math.random() * paths.length)];
      await oneRequest(path);
    }
  } finally {
    active--;
  }
}

console.log(JSON.stringify({
  phase: '8-http-read-only',
  baseUrl,
  virtualUsers: vus,
  durationSec,
  paths,
  timeoutMs,
  warning: 'HTTP smoke/load only. No Firestore writes, no auth simulation, no claim of 10K-user capacity.'
}, null, 2));

const started = performance.now();
const workers = Array.from({ length: vus }, worker);
await sleep(durationSec * 1000);
stop = true;
await Promise.all(workers);
const elapsedSec = (performance.now() - started) / 1000;

const rps = completed / elapsedSec;
const result = {
  elapsedSec: Number(elapsedSec.toFixed(2)),
  requests: completed,
  errors,
  errorRatePct: Number((completed ? errors / completed * 100 : 0).toFixed(2)),
  requestsPerSecond: Number(rps.toFixed(2)),
  latencyMs: {
    p50: Number(percentile(samples, 0.50).toFixed(1)),
    p95: Number(percentile(samples, 0.95).toFixed(1)),
    p99: Number(percentile(samples, 0.99).toFixed(1)),
    max: Number((samples.length ? Math.max(...samples) : 0).toFixed(1))
  }
};
console.log(JSON.stringify(result, null, 2));

if (result.errorRatePct > 1 || result.latencyMs.p95 > 2000) process.exitCode = 2;
