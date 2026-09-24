/**
 * Application Build and Version Metadata
 * Injected during build time and updated across continuous deployments
 */

export interface AppBuildInfo {
  version: string;
  buildNumber: string;
  buildTime: string;
  commitSha: string;
  environment: string;
  targetPlatform: string;
}

const currentYear = new Date().getFullYear();
const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
const currentDay = String(new Date().getDate()).padStart(2, '0');

export const APP_BUILD_INFO: AppBuildInfo = {
  version: '2.5.0',
  buildNumber: typeof __APP_BUILD_NUMBER__ !== 'undefined' 
    ? __APP_BUILD_NUMBER__ 
    : 'v2.5.0-prod',
  buildTime: typeof __APP_BUILD_TIME__ !== 'undefined'
    ? __APP_BUILD_TIME__
    : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST',
  commitSha: typeof __APP_COMMIT_SHA__ !== 'undefined'
    ? __APP_COMMIT_SHA__
    : 'main-live',
  environment: typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? 'production' : 'live-preview',
  targetPlatform: 'Hostinger & Cloud'
};

// Global declare for Vite define constants
declare global {
  const __APP_BUILD_NUMBER__: string | undefined;
  const __APP_BUILD_TIME__: string | undefined;
  const __APP_COMMIT_SHA__: string | undefined;
}
