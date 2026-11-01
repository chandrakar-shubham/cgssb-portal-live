import assert from 'node:assert/strict';
import { isTrustedScoringFeatureEnabled } from '../src/app/trustedScoringFeatureGate';

const student = { uid: 'student-1', isAnonymous: false };
const enabled = { enabled: 'true', workerUrl: 'https://trusted-scoring.example.workers.dev/' };

assert.equal(isTrustedScoringFeatureEnabled({}, student), false, 'missing config must stay disabled');
assert.equal(isTrustedScoringFeatureEnabled({ ...enabled, enabled: 'TRUE' }, student), false, 'flag must require exact true');
assert.equal(isTrustedScoringFeatureEnabled(enabled, null), false, 'missing identity must stay disabled');
assert.equal(isTrustedScoringFeatureEnabled(enabled, { uid: 'guest', isAnonymous: true }), false, 'anonymous identity must stay disabled');
assert.equal(isTrustedScoringFeatureEnabled({ ...enabled, workerUrl: '' }, student), false, 'missing Worker URL must stay disabled');
assert.equal(isTrustedScoringFeatureEnabled({ ...enabled, workerUrl: 'http://trusted.example/' }, student), false, 'HTTP Worker URL must stay disabled');
assert.equal(isTrustedScoringFeatureEnabled({ ...enabled, workerUrl: 'https://user:pass@trusted.example/' }, student), false, 'credential-bearing URL must stay disabled');
assert.equal(isTrustedScoringFeatureEnabled({ ...enabled, workerUrl: 'https://trusted.example/?debug=1' }, student), false, 'query-bearing URL must stay disabled');
assert.equal(isTrustedScoringFeatureEnabled({ ...enabled, workerUrl: 'https://trusted.example/path' }, student), false, 'non-origin URL must stay disabled');
assert.equal(isTrustedScoringFeatureEnabled(enabled, student), true, 'explicitly configured authenticated student may pass the rollout gate');

console.log('PASS trusted scoring feature gate: disabled by default, HTTPS origin and authenticated non-anonymous identity required');
