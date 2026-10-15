/**
 * Local deletion markers for catalog/admin UI state.
 * These markers only affect local presentation; Firestore remains the production
 * source of truth for published catalog and student attempts.
 */
export function getDeletedIds(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set<string>();
}

export function addDeletedId(key: string, id: string): void {
  try {
    const ids = getDeletedIds(key);
    ids.add(id);
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function removeDeletedId(key: string, id: string): void {
  try {
    const ids = getDeletedIds(key);
    if (ids.has(id)) {
      ids.delete(id);
      localStorage.setItem(key, JSON.stringify(Array.from(ids)));
    }
  } catch {}
}

/** Merge built-in and locally saved items while honoring local deletion markers. */
export function mergeWithInitial<T extends { id: string }>(
  initial: T[],
  saved: T[],
  deletedKey: string,
): T[] {
  const deletedSet = getDeletedIds(deletedKey);
  const map = new Map<string, T>();
  initial.forEach(item => {
    if (item && item.id && !deletedSet.has(item.id)) map.set(item.id, item);
  });
  saved.forEach(item => {
    if (item && item.id && !deletedSet.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}
