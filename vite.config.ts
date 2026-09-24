import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const now = new Date();
  const commitSha = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : 'main-live';
  const buildNumber = process.env.GITHUB_RUN_NUMBER 
    ? `v2.5.0-build.${process.env.GITHUB_RUN_NUMBER}` 
    : 'v2.5.0-prod';
  const buildTime = now.toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  }) + ' IST';

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
