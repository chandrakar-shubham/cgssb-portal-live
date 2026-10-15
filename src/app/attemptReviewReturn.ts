export function getAttemptReviewReturnPath(path: string | null): string | null { return typeof path === 'string' && path.length > 0 ? path : null; }
