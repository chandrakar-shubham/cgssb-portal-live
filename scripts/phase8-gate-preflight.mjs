#!/usr/bin/env node

const vus = Number(process.env.VUS || 0);
const durationSec = Number(process.env.DURATION_SEC || 0);
const baseUrl = (process.env.BASE_URL || '').replace(/\/$/, '');
const paths = (process.env.PATHS || '').split(',').map(s => s.trim()).filter(Boolean);

const failures = [];
const approvedVus = new Set([3500, 5000]);

if (!approvedVus.has(vus)) {
  failures.push('VUS=' + vus + ' is not an approved Phase 8 controlled gate. Approved gates: 3500 or 5000.');
}

if (durationSec !== 60) {
  failures.push('DURATION_SEC=' + durationSec + ' must be exactly 60 seconds for a controlled Phase 8 gate.');
}

if (baseUrl !== 'https://gen-lang-client-0783153446.web.app') {
  failures.push('BASE_URL must be the configured production Firebase Hosting origin.');
}

const forbidden = paths.filter((path) => {
  const normalized = path.toLowerCase();
  return normalized.includes('/admin') ||
    normalized.includes('/login') ||
    normalized.includes('/signup') ||
    normalized.includes('/auth') ||
    normalized.includes('/api/write') ||
    normalized.includes('/api/admin');
});

if (forbidden.length) {
  failures.push(
    'Potentially authenticated/admin/write paths are forbidden in the production read-only gate: ' +
    forbidden.join(', ')
  );
}

if (!paths.length) {
  failures.push('PATHS must contain at least one read-only route.');
}

if (failures.length) {
  console.error('Phase 8 controlled-gate preflight FAILED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log(JSON.stringify({
  phase: '8-http-read-only-controlled-gate',
  virtualUsers: vus,
  durationSec,
  baseUrl,
  paths,
  approved: true,
  safety: 'Production HTTP GET/read-only paths only; no authentication or writes.'
}, null, 2));
