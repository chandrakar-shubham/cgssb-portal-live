export function hasGuestUsedFreeTest(storedValue: string | null): boolean {
  return storedValue === 'true';
}
export function requiresProPass(isProTest: boolean | undefined, passIsActive: boolean): boolean {
  return Boolean(isProTest) && !passIsActive;
}
