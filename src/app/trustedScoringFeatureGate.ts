/**
 * Explicit rollout gate for the trusted scoring migration.
 *
 * This gate is deliberately independent of localStorage, query parameters,
 * browser globals, and admin UI state. It is disabled unless deployment
 * configuration opts in with the exact string "true", a valid HTTPS Worker
 * origin is configured, and a non-anonymous Firebase student identity exists.
 *
 * It does not enable any route by itself; callers must still verify the
 * Worker deployment, Firestore rules, and end-to-end release policy.
 */
export interface TrustedScoringRuntimeConfig {
  enabled?: string;
  workerUrl?: string;
}

export interface TrustedScoringIdentity {
  uid?: string | null;
  isAnonymous?: boolean;
}

export function isTrustedScoringFeatureEnabled(
  config: TrustedScoringRuntimeConfig,
  identity: TrustedScoringIdentity | null | undefined,
): boolean {
  if (config.enabled !== 'true' || !identity?.uid || identity.isAnonymous === true) {
    return false;
  }

  if (typeof config.workerUrl !== 'string' || config.workerUrl.trim() === '') {
    return false;
  }

  try {
    const url = new URL(config.workerUrl);
    return url.protocol === 'https:' &&
      url.username === '' &&
      url.password === '' &&
      url.search === '' &&
      url.hash === '' &&
      url.pathname === '/';
  } catch {
    return false;
  }
}

/** Vite deployment configuration; missing variables remain safely disabled. */
export function getTrustedScoringRuntimeConfig(): TrustedScoringRuntimeConfig {
  return {
    enabled: import.meta.env.VITE_TRUSTED_SCORING_ENABLED,
    workerUrl: import.meta.env.VITE_TRUSTED_SCORING_WORKER_URL,
  };
}
