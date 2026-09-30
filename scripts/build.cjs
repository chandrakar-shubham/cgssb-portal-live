const fs = require('fs');
const path = require('path');

async function runBuild() {
  console.log('🚀 Starting CGSSB Firebase Spark production build...');

  const now = new Date();
  const dateCode = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timeCode = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const uniqueBuildTag = process.env.BUILD_ID || `B#${dateCode}.${timeCode.slice(0, 4)}`;
  const istTime = now.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'short', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  }) + ' IST';

  const commitSha = process.env.GITHUB_SHA
    ? process.env.GITHUB_SHA.slice(0, 7)
    : (process.env.COMMIT_SHA || `sha-${Date.now().toString(16).slice(-6)}`);

  process.env.BUILD_ID = uniqueBuildTag;
  process.env.BUILD_TIME = istTime;
  process.env.COMMIT_SHA = commitSha;

  const vite = await import('vite');
  await vite.build({
    root: process.cwd(),
    configFile: path.resolve(process.cwd(), 'vite.config.ts')
  });

  const versionInfo = {
    version: '2.5.2',
    buildId: uniqueBuildTag,
    commitSha,
    buildTime: istTime,
    platform: 'Firebase Hosting + Firestore + Firebase Authentication (Spark)'
  };

  fs.writeFileSync('dist/version.json', JSON.stringify(versionInfo, null, 2));
  fs.writeFileSync('version.json', JSON.stringify(versionInfo, null, 2));

  console.log('✅ Firebase Spark frontend build complete.');
}

runBuild().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
