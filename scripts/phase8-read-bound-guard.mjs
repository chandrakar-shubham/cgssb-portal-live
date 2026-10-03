import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];

const app = read('src/App.tsx');
if (!app.includes('useTestManager(currentRoute === \'admin\' && isAdminAuthenticated)')) {
  failures.push('Student test catalog is no longer explicitly admin-gated in src/App.tsx.');
}

const manager = read('src/hooks/useTestManager.ts');
if (!manager.includes('fetchPublishedTestsFromFirestore')) {
  failures.push('useTestManager.ts no longer references the bounded published-test catalog path.');
}

const loadHarness = read('scripts/phase8-load-test.mjs');
if (!loadHarness.includes("await writeFile(resultFile, JSON.stringify(result, null, 2) + '\\n', 'utf8');")) {
  failures.push('Phase 8 load harness no longer persists its structured result artifact.');
}
if (!loadHarness.includes('result.acceptance') || !loadHarness.includes('process.exitCode = 2')) {
  failures.push('Phase 8 load harness no longer enforces its acceptance gate.');
}

const bundleStore = read('src/utils/bundleStore.ts');
if (bundleStore.includes('subscribeToBundles(')) {
  failures.push('bundleStore.ts reintroduced a collection-wide subscribeToBundles listener.');
}

const filterStart = bundleStore.indexOf('const filterCanonicalBundles');
const filterEnd = bundleStore.indexOf('syncBundlesFromFirestore', filterStart);
if (filterStart >= 0) {
  const filterBody = bundleStore.slice(filterStart, filterEnd >= 0 ? filterEnd : bundleStore.length);
  if (filterBody.includes('fetchExamTestSeries(')) {
    failures.push('filterCanonicalBundles() reintroduced an unbounded fetchExamTestSeries() call.');
  }
  if (!filterBody.includes('fetchExamTestSeriesByIds(')) {
    failures.push('filterCanonicalBundles() is missing bounded exact-ID series loading.');
  }
} else {
  failures.push('filterCanonicalBundles() could not be located; inspect bundle startup validation manually.');
}

if (failures.length) {
  console.error('Phase 8.3 student read-bound regression guard FAILED');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('Phase 8.3 student read-bound regression guard PASSED');
