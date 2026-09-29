import { User, StudentReferralRecord } from '../types';
import { getRegisteredStudents, upsertStudentInRegistry } from './studentStore';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

const REFERRALS_STORAGE_KEY = 'cgtest_referral_records';
const PENDING_REF_KEY = 'cgtest_pending_referral_code';

// Default starter seed records to show realistic activity in dashboard
const SEED_REFERRAL_RECORDS: StudentReferralRecord[] = [
  {
    id: 'ref-seed-1',
    referrerId: 'u-std-101',
    referrerName: 'Pooja Verma',
    referrerCode: 'CG-POOJ-1122',
    refereeId: 'u-std-103',
    refereeName: 'Shreya Tiwari',
    refereeEmail: 'shreya.tiwari@outlook.com',
    status: 'completed',
    rewardMonths: 1,
    createdAt: '2026-03-10'
  },
  {
    id: 'ref-seed-2',
    referrerId: 'u-std-102',
    referrerName: 'Anil Kumar Sahu',
    referrerCode: 'CG-ANIL-4567',
    refereeId: 'u-std-104',
    refereeName: 'Mahesh Bhagat',
    refereeEmail: 'mahesh.bhagat@gmail.com',
    status: 'completed',
    rewardMonths: 1,
    createdAt: '2026-04-18'
  }
];

/**
 * Generates an intuitive, readable referral code for a student
 * Example: CG-RAME-9812
 */
export function generateReferralCode(user: { id: string; name?: string; email?: string }): string {
  const namePart = (user.name || 'STUDENT')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 4)
    .toUpperCase() || 'ASP';
  
  const idPart = (user.id || Date.now().toString())
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-4)
    .toUpperCase();

  return `CG-${namePart}-${idPart}`;
}

export function getReferralRecords(): StudentReferralRecord[] {
  try {
    const raw = localStorage.getItem(REFERRALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return SEED_REFERRAL_RECORDS;
}

export function saveReferralRecords(records: StudentReferralRecord[]): void {
  try {
    localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.warn('Could not save referral records to local storage', err);
  }
}

/**
 * Manages pending referral code captured from URL query params: ?ref=CG-XXXX
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
 * Sync referral record to Firestore for persistent cloud record
 */
async function syncReferralToFirestore(record: StudentReferralRecord): Promise<void> {
  try {
    if (!db) return;
    await setDoc(doc(db, 'referrals', record.id), record, { merge: true });
  } catch (err) {
    console.warn('Firestore referral sync note:', err);
  }
}

/**
 * Finds a student by their referral code
 */
export function findStudentByReferralCode(code: string): User | undefined {
  const cleanCode = code.trim().toUpperCase();
  const students = getRegisteredStudents();
  return students.find(s => {
    const userCode = s.referralCode || generateReferralCode(s);
    return userCode.toUpperCase() === cleanCode;
  });
}

/**
 * Applies a referral code for a referee:
 * - Grants +1 month (30 days) of Pro Pass to referee
 * - Grants +1 month (30 days) of Pro Pass to referrer
 * - Records the transaction
 */
export function applyReferralBonus(
  refereeUser: User,
  rawCode: string
): { success: boolean; message: string; updatedUser?: User; referrerName?: string } {
  const cleanCode = rawCode.trim().toUpperCase();
  if (!cleanCode) {
    return { success: false, message: 'Please enter a valid referral code.' };
  }

  const myCode = refereeUser.referralCode || generateReferralCode(refereeUser);
  if (myCode.toUpperCase() === cleanCode) {
    return { success: false, message: 'You cannot use your own referral code!' };
  }

  if (refereeUser.referredBy) {
    return { success: false, message: `You have already claimed a referral bonus with code ${refereeUser.referredBy}.` };
  }

  // Look up referrer in candidate database
  const referrer = findStudentByReferralCode(cleanCode);
  if (!referrer) {
    return { success: false, message: 'Referral code not found. Please verify with your friend.' };
  }

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // 1. Reward Referee (+1 Month Pro Pass)
  const refereeBaseTime = refereeUser.passExpiresAt ? new Date(refereeUser.passExpiresAt).getTime() : now;
  const refereeNewExpiry = new Date(Math.max(now, refereeBaseTime) + THIRTY_DAYS_MS).toISOString();
  const refereeNewDuration = (refereeUser.passDurationDays || 30) + 30;
  const refereeBonusMonths = (refereeUser.referralBonusMonths || 0) + 1;

  const updatedReferee: User = {
    ...refereeUser,
    hasProPass: true,
    proPassPlan: refereeUser.hasProPass
      ? `${refereeUser.proPassPlan || 'Pro Pass'} (+1 Mo Referral Bonus)`
      : '1-Month Pro Pass (Referral Reward)',
    passDurationDays: refereeNewDuration,
    passExpiresAt: refereeNewExpiry,
    referredBy: cleanCode,
    referralBonusMonths: refereeBonusMonths,
    referralCode: myCode,
  };

  // 2. Reward Referrer (+1 Month Pro Pass)
  const referrerBaseTime = referrer.passExpiresAt ? new Date(referrer.passExpiresAt).getTime() : now;
  const referrerNewExpiry = new Date(Math.max(now, referrerBaseTime) + THIRTY_DAYS_MS).toISOString();
  const referrerNewDuration = (referrer.passDurationDays || 30) + 30;
  const referrerNewCount = (referrer.referralCount || 0) + 1;
  const referrerNewBonusMonths = (referrer.referralBonusMonths || 0) + 1;

  const updatedReferrer: User = {
    ...referrer,
    hasProPass: true,
    proPassPlan: referrer.hasProPass
      ? `${referrer.proPassPlan || 'Pro Pass'} (+1 Mo Referral Bonus)`
      : '1-Month Pro Pass (Referral Reward)',
    passDurationDays: referrerNewDuration,
    passExpiresAt: referrerNewExpiry,
    referralCount: referrerNewCount,
    referralBonusMonths: referrerNewBonusMonths,
    referralCode: referrer.referralCode || cleanCode,
  };

  // Save updated referrer into registry
  upsertStudentInRegistry(updatedReferrer);
  upsertStudentInRegistry(updatedReferee);

  // 3. Create and save ReferralRecord
  const record: StudentReferralRecord = {
    id: `ref-${now}-${Math.random().toString(36).slice(2, 7)}`,
    referrerId: referrer.id,
    referrerName: referrer.name,
    referrerCode: cleanCode,
    refereeId: refereeUser.id,
    refereeName: refereeUser.name,
    refereeEmail: refereeUser.email,
    status: 'completed',
    rewardMonths: 1,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const existingRecords = getReferralRecords();
  const updatedRecords = [record, ...existingRecords];
  saveReferralRecords(updatedRecords);
  syncReferralToFirestore(record).catch(() => null);

  clearPendingReferralCode();

  return {
    success: true,
    message: `Success! You and ${referrer.name} have both received +1 Month (30 Days) of All-Access Pro Pass!`,
    updatedUser: updatedReferee,
    referrerName: referrer.name,
  };
}

/**
 * Auto-processes referral bonus when a newly registered student signs up with a referral code
 */
export function processSignupReferral(newStudent: User, referralCode?: string): User {
  const codeToUse = referralCode || getPendingReferralCode();
  if (!codeToUse) return newStudent;

  const result = applyReferralBonus(newStudent, codeToUse);
  if (result.success && result.updatedUser) {
    return result.updatedUser;
  }
  return newStudent;
}
