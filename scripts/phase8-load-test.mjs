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
import { writeFile } from 'node:fs/promises';

const baseUrl = (process.env.BASE_URL || 'https://gen-lang-client-0783153446.web.app').replace(/\/$/, '');
const vus = Math.max(1, Number(process.env.VUS || 25));
const durationSec = Math.max(1, Number(process.env.DURATION_SEC || 30));
const paths = (process.env.PATHS || '/').split(',').map(s => s.trim()).filter(Boolean);
const timeoutMs = Math.max(1000, Number(process.env.TIMEOUT_MS || 10000));
const thinkMinMs = Math.max(0, Number(process.env.THINK_MIN_MS || 0));
const thinkMaxMs = Math.max(thinkMinMs, Number(process.env.THINK_MAX_MS || thinkMinMs));
const runId = process.env.RUN_ID || `phase8-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const resultFile = process.env.RESULT_FILE || 'phase8-load-result.json';

const samples = [];
let completed = 0;
let errors = 0;
let active = 0;
let stop = false;
const statusCounts = new Map();
const routeStats = new Map();

const sleep = ms => new Promise(r => setTimeout(r, ms));
const percentile = (xs, p) => {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a,b) => a-b);
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[i];
};

function getRouteStats(path) {
  let stats = routeStats.get(path);
  if (!stats) {
    stats = {
      samples: [],
      requests: 0,
      errors: 0,
      statusCounts: new Map(),
      errorTypes: new Map()
    };
    routeStats.set(path, stats);
  }
  return stats;
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

async function oneRequest(path) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const route = getRouteStats(path);

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
    route.samples.push(ms);
    route.requests++;
    increment(statusCounts, String(res.status));
    increment(route.statusCounts, String(res.status));

    if (!res.ok && res.status !== 304) {
      errors++;
      route.errors++;
    }
  } catch (error) {
    const ms = performance.now() - started;
    const errorType = error instanceof Error && error.name ? error.name : 'UnknownError';

    samples.push(ms);
    completed++;
    errors++;
    route.samples.push(ms);
    route.requests++;
    route.errors++;
    increment(statusCounts, 'NETWORK_ERROR');
    increment(route.statusCounts, 'NETWORK_ERROR');
    increment(route.errorTypes, errorType);
  } finally {
    clearTimeout(timer);
  }
}

function serializeCounts(map) {
  return Object.fromEntries([...map.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true })));
}

function serializeRouteStats() {
  return Object.fromEntries(
    [...routeStats.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, stats]) => [
        path,
        {
          requests: stats.requests,
          errors: stats.errors,
          errorRatePct: Number((stats.requests ? stats.errors / stats.requests * 100 : 0).toFixed(2)),
          statusCounts: serializeCounts(stats.statusCounts),
          errorTypes: serializeCounts(stats.errorTypes),
          latencyMs: {
            p50: Number(percentile(stats.samples, 0.50).toFixed(1)),
            p95: Number(percentile(stats.samples, 0.95).toFixed(1)),
            p99: Number(percentile(stats.samples, 0.99).toFixed(1)),
            max: Number(stats.samples.reduce((max, value) => Math.max(max, value), 0).toFixed(1))
          }
        }
      ])
  );
}

async function worker() {
  while (!stop) {
    const path = paths[Math.floor(Math.random() * paths.length)];
    active++;
    try {
      await oneRequest(path);
    } finally {
      active--;
    }

    if (!stop && thinkMaxMs > 0) {
      const delay = thinkMinMs + Math.random() * (thinkMaxMs - thinkMinMs);
      await sleep(delay);
    }
  }
}

console.log(JSON.stringify({
  phase: '8-http-read-only',
  baseUrl,
  virtualUsers: vus,
  durationSec,
  paths,
  timeoutMs,
  thinkTimeMs: { min: thinkMinMs, max: thinkMaxMs },
  runId,
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
  statusCounts: serializeCounts(statusCounts),
  routeStats: serializeRouteStats(),
  runId,
  generatedAt: new Date().toISOString(),
  latencyMs: {
    p50: Number(percentile(samples, 0.50).toFixed(1)),
    p95: Number(percentile(samples, 0.95).toFixed(1)),
    p99: Number(percentile(samples, 0.99).toFixed(1)),
    max: Number(samples.reduce((max, value) => Math.max(max, value), 0).toFixed(1))
  }
};
console.log(JSON.stringify(result, null, 2));

result.acceptance = {
  pass: result.errorRatePct <= 1 && result.latencyMs.p95 <= 2000,
  errorRateThresholdPct: 1,
  p95ThresholdMs: 2000
};
await writeFile(resultFile, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(`Result artifact written to ${resultFile}`);
if (!result.acceptance.pass) process.exitCode = 2;
