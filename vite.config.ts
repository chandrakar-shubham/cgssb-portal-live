import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const now = new Date();
  const dateCode = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timeCode = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const uniqueBuildTag = process.env.BUILD_ID || `B#${dateCode}.${timeCode.slice(0, 4)}`;
  
  const commitSha = process.env.GITHUB_SHA 
    ? process.env.GITHUB_SHA.slice(0, 7) 
    : (process.env.COMMIT_SHA || `sha-${Date.now().toString(16).slice(-6)}`);

  const buildNumber = process.env.GITHUB_RUN_NUMBER 
    ? `v2.5.0-run.${process.env.GITHUB_RUN_NUMBER} (${uniqueBuildTag})` 
    : uniqueBuildTag;

  const buildTime = process.env.BUILD_TIME || (now.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  }) + ' IST');

  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      __APP_BUILD_NUMBER__: JSON.stringify(buildNumber),
      __APP_BUILD_TIME__: JSON.stringify(buildTime),
      __APP_COMMIT_SHA__: JSON.stringify(commitSha),
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      rollupOptions: {
        output: {
          entryFileNames: 'assets/app-[hash].js',
          chunkFileNames: 'assets/chunk-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
