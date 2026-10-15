const GUEST_COMPLETION_KEY = 'cgtest_guest_test_completed';
export function writeGuestCompletionFlag(storage: Pick<Storage, 'setItem'> | undefined): void { if (!storage) return; try { storage.setItem(GUEST_COMPLETION_KEY, 'true'); } catch { /* best effort guest-only marker */ } }
