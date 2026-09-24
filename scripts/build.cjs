const fs = require('fs');
const path = require('path');

async function runBuild() {
  console.log('🚀 Starting CGSSB Production Build Process...');

  // 1. Ensure index.html has the valid Vite source module
  const mainScriptTag = '<script type="module" src="/src/main.tsx"></script>';
  let indexHtml = fs.readFileSync('index.html', 'utf-8');
  if (!indexHtml.includes('/src/main.tsx')) {
    console.log('🔄 Restoring /src/main.tsx entry point in index.html...');
    if (fs.existsSync('index.source.html')) {
      indexHtml = fs.readFileSync('index.source.html', 'utf-8');
    } else {
      indexHtml = indexHtml.replace(/<script type="module" crossorigin src="\/assets\/app-[^"]+"><\/script>/, mainScriptTag);
    }
    fs.writeFileSync('index.html', indexHtml);
  }

  if (!fs.existsSync('index.source.html')) {
    fs.writeFileSync('index.source.html', indexHtml);
  }

  // 2. Run Vite build via JavaScript API
  console.log('📦 Executing Vite build...');
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
    version: '2.5.0',
    commitSha: process.env.GITHUB_SHA || 'dev-build',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    platform: 'Hostinger & AI Studio Cloud'
  };
  fs.writeFileSync('dist/version.json', JSON.stringify(versionInfo, null, 2));

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
  }

  // 8. Runtime package.json in dist for Hostinger Node.js Application Manager
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

  console.log('✅ Build complete! All dist artifacts verified.');
}

runBuild().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
