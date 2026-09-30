const fs = require('fs');
const path = require('path');

async function runBuild() {
  console.log('🚀 Starting CGSSB Firebase Production Build Process...');

  // Generate unique build timestamp and build tag
  const now = new Date();
  const dateCode = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timeCode = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const uniqueBuildTag = process.env.BUILD_ID || `B#${dateCode}.${timeCode.slice(0, 4)}`;
  const istTime = now.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata', 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  }) + ' IST';

  const commitSha = process.env.GITHUB_SHA 
    ? process.env.GITHUB_SHA.slice(0, 7) 
    : (process.env.COMMIT_SHA || `sha-${Date.now().toString(16).slice(-6)}`);

  process.env.BUILD_ID = uniqueBuildTag;
  process.env.BUILD_TIME = istTime;
  process.env.COMMIT_SHA = commitSha;

  // 1. Run Vite build for SPA (outputs cleanly to dist/)
  console.log(`📦 Executing Vite build [${uniqueBuildTag} - ${commitSha}]...`);
  const vite = await import('vite');
  await vite.build({
    root: process.cwd(),
    configFile: path.resolve(process.cwd(), 'vite.config.ts')
  });

  // 2. Compile backend server.ts for Node full-stack SSR/API environment
  console.log('⚙️ Compiling server.ts for Node runtime...');
  const esbuild = require('esbuild');
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/server.cjs'
  });
  fs.copyFileSync('dist/server.cjs', 'dist/server.js');
  // Firebase Functions receives the same production API bundle.
  fs.mkdirSync('functions', { recursive: true });
  fs.copyFileSync('dist/server.cjs', 'functions/server.cjs');

  // 3. Compile Firebase Functions API wrapper.
  console.log('☁️ Compiling Firebase Functions API wrapper...');
  await esbuild.build({
    entryPoints: ['firebaseFunctions.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    sourcemap: true,
    outfile: 'dist/firebase-functions.cjs'
  });

  // 4. Generate version.json inside dist/
  const versionInfo = {
    version: '2.5.2',
    buildId: uniqueBuildTag,
    commitSha: commitSha,
    buildTime: istTime,
    platform: 'Firebase Hosting & Cloud Run'
  };
  fs.writeFileSync('dist/version.json', JSON.stringify(versionInfo, null, 2));
  fs.writeFileSync('version.json', JSON.stringify(versionInfo, null, 2));

  console.log('✅ Build complete! All dist artifacts ready for Firebase deployment.');
}

runBuild().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
