const fs = require('fs');
const path = require('path');

async function runBuild() {
  console.log('🚀 Starting CGSSB Production Build Process...');

  // 1. Ensure index.html has the valid Vite source module before compiling
  const mainScriptTag = '<script type="module" src="/src/main.tsx"></script>';
  if (fs.existsSync('index.source.html')) {
    fs.copyFileSync('index.source.html', 'index.html');
  } else {
    let indexHtml = fs.readFileSync('index.html', 'utf-8');
    if (!indexHtml.includes('/src/main.tsx')) {
      indexHtml = indexHtml.replace(/<script type="module" crossorigin src="\/assets\/app-[^"]+"><\/script>/, mainScriptTag);
      fs.writeFileSync('index.html', indexHtml);
    }
    fs.writeFileSync('index.source.html', indexHtml);
  }

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

  // 2. Run Vite build via JavaScript API
  console.log(`📦 Executing Vite build [${uniqueBuildTag} - ${commitSha}]...`);
  const vite = await import('vite');
  await vite.build({
    root: process.cwd(),
    configFile: path.resolve(process.cwd(), 'vite.config.ts')
  });

  // 3. Compile backend server.ts for Node.js / Hostinger Passenger
  console.log('⚙️ Compiling server.ts to CommonJS for Node.js...');
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

  // 4. Passenger restart hook
  fs.mkdirSync('dist/tmp', { recursive: true });
  fs.writeFileSync('dist/tmp/restart.txt', new Date().toISOString());

  // 5. Ensure .htaccess is placed in dist/ and root
  if (fs.existsSync('public/.htaccess')) {
    fs.copyFileSync('public/.htaccess', 'dist/.htaccess');
    fs.copyFileSync('public/.htaccess', '.htaccess');
  }

  // 6. Generate version.json
  const versionInfo = {
    version: '2.5.2',
    buildId: uniqueBuildTag,
    commitSha: commitSha,
    buildTime: istTime,
    platform: 'Hostinger & AI Studio Cloud'
  };
  fs.writeFileSync('dist/version.json', JSON.stringify(versionInfo, null, 2));
  fs.writeFileSync('version.json', JSON.stringify(versionInfo, null, 2));

  // 7. Generate static aliases in dist/assets
  if (fs.existsSync('dist/assets')) {
    const assetFiles = fs.readdirSync('dist/assets');
    const jsFile = assetFiles.find(f => (f.startsWith('app-') || f.startsWith('index-')) && f.endsWith('.js'));
    const cssFile = assetFiles.find(f => (f.startsWith('index-') || f.startsWith('app-')) && f.endsWith('.css'));

    if (jsFile) {
      fs.copyFileSync(path.join('dist/assets', jsFile), path.join('dist/assets', 'index.js'));
    }
    if (cssFile) {
      fs.copyFileSync(path.join('dist/assets', cssFile), path.join('dist/assets', 'index.css'));
    }

    // Clean obsolete chunks from root assets/ first so stale bundles don't accumulate
    if (fs.existsSync('assets')) {
      fs.rmSync('assets', { recursive: true, force: true });
    }
    fs.mkdirSync('assets', { recursive: true });
    for (const file of fs.readdirSync('dist/assets')) {
      const srcFile = path.join('dist/assets', file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, path.join('assets', file));
      }
    }
  }

  // 8. Copy compiled dist/index.html to root index.html
  // This guarantees that if Hostinger Git pulls the repository, index.html is the production bundle!
  if (fs.existsSync('dist/index.html')) {
    fs.copyFileSync('dist/index.html', 'index.html');
    console.log('✅ Synced production index.html to repository root successfully.');
  }

  // 9. Runtime package.json in dist for Hostinger Node.js Application Manager
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const runtimePkg = {
    name: pkg.name || 'cgssb-portal',
    version: pkg.version || '1.0.0',
    type: 'commonjs',
    main: 'server.cjs',
    scripts: {
      start: 'node server.cjs'
    },
    dependencies: pkg.dependencies || {}
  };
  fs.writeFileSync('dist/package.json', JSON.stringify(runtimePkg, null, 2));

  console.log('✅ Build complete! All root & dist artifacts verified.');
}

runBuild().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
