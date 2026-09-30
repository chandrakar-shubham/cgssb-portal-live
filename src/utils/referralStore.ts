import { User, StudentReferralRecord } from '../types';
import { api } from './apiClient';

const PENDING_REF_KEY = 'cgtest_pending_referral_code';

/**
 * Generates a deterministic, readable referral code.
 * Example: CG-RAME-AB12
 */
export function generateReferralCode(user: { id: string; name?: string; email?: string }): string {
  const namePart = (user.name || 'STUDENT')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase() || 'ASP';

  const idPart = (user.id || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-4)
    .toUpperCase();

  return `CG-${namePart}-${idPart}`;
}

export async function getReferralRecords(): Promise<StudentReferralRecord[]> {
  const result = await api.get<{ success: boolean; records?: StudentReferralRecord[] }>(
    '/api/user/referrals',
    { requireAuth: true }
  );
  return Array.isArray(result.records) ? result.records : [];
}

/**
 * Pending referral code is intentionally client-side because it is transient
 * attribution state, not authoritative account/referral data.
 */
export function getPendingReferralCode(): string | null {
  try {
    return localStorage.getItem(PENDING_REF_KEY) || sessionStorage.getItem(PENDING_REF_KEY) || null;
  } catch {
    return null;
  }
}

export function setPendingReferralCode(code: string): void {
  try {
    const clean = code.trim().toUpperCase();
    if (clean) {
      localStorage.setItem(PENDING_REF_KEY, clean);
      sessionStorage.setItem(PENDING_REF_KEY, clean);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearPendingReferralCode(): void {
  try {
    localStorage.removeItem(PENDING_REF_KEY);
    sessionStorage.removeItem(PENDING_REF_KEY);
  } catch {
    // ignore
  }
}

/**
 * Applies a referral code through the authenticated server transaction.
 * The server is authoritative and atomically updates both users and the referral record.
 */
export async function applyReferralBonus(
  _refereeUser: User,
  rawCode: string
): Promise<{ success: boolean; message: string; updatedUser?: User; referrerName?: string }> {
  const cleanCode = rawCode.trim().toUpperCase();
  if (!cleanCode) return { success: false, message: 'Please enter a valid referral code.' };

  try {
    const result = await api.post<{
      success: boolean;
      message: string;
      updatedUser?: User;
      referrerName?: string;
      error?: string;
    }>('/api/user/referrals/claim', { code: cleanCode }, { requireAuth: true });

    if (result.success) clearPendingReferralCode();

    return {
      success: result.success,
      message: result.message || result.error || 'Referral request completed.',
      updatedUser: result.updatedUser,
      referrerName: result.referrerName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Could not process the referral code. Please try again.',
    };
  }
}

/**
 * Auto-processes a referral after the newly created Firebase/Firestore profile exists.
 */
export async function processSignupReferral(newStudent: User, referralCode?: string): Promise<User> {
  const codeToUse = referralCode || getPendingReferralCode();
  if (!codeToUse) return newStudent;

  const result = await applyReferralBonus(newStudent, codeToUse);
  return result.success && result.updatedUser ? result.updatedUser : newStudent;
}
