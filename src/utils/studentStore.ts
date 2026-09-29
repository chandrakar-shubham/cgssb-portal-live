import { User, DiscountCoupon, MarketingCampaign, AdminPermissions } from '../types';
import { db } from '../firebase/config';
import { doc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';

const STUDENTS_STORAGE_KEY = 'cgssb_registered_students_crm';
const COUPONS_STORAGE_KEY = 'cgssb_discount_coupons';
const ADMINS_STORAGE_KEY = 'cgssb_admin_members';

// Default starter seed for CRM if completely empty
const INITIAL_STUDENTS: User[] = [
  {
    id: 'u-std-101',
    name: 'Pooja Verma',
    email: 'pooja.verma@gmail.com',
    phone: '9827011223',
    role: 'student',
    status: 'active',
    isBlocked: false,
    hasProPass: true,
    proPassPlan: 'Yearly All-Access Pass',
    passDurationDays: 365,
    passExpiresAt: new Date(Date.now() + 300 * 86400000).toISOString(),
    registeredAt: '2026-01-12',
    lastLoginAt: '2026-09-28',
    targetExam: 'CG Teacher 2026 (शिक्षक भर्ती)',
    district: 'Raipur',
    medium: 'Hindi',
    categoryReservation: 'OBC',
    notes: 'Enrolled via WhatsApp Teacher Campaign'
  },
  {
    id: 'u-std-102',
    name: 'Anil Kumar Sahu',
    email: 'anil.sahu@gmail.com',
    phone: '9425234567',
    role: 'student',
    status: 'active',
    isBlocked: false,
    hasProPass: false,
    registeredAt: '2026-02-04',
    lastLoginAt: '2026-09-29',
    targetExam: 'CG Police Sub-Inspector (SI)',
    district: 'Bilaspur',
    medium: 'Hindi',
    categoryReservation: 'OBC',
    notes: 'Completed 6 Free Mock Tests'
  },
  {
    id: 'u-std-103',
    name: 'Shreya Tiwari',
    email: 'shreya.tiwari@outlook.com',
    phone: '9752098765',
    role: 'student',
    status: 'active',
    isBlocked: false,
    hasProPass: true,
    proPassPlan: 'Monthly All-Access Pass',
    passDurationDays: 30,
    passExpiresAt: new Date(Date.now() + 18 * 86400000).toISOString(),
    registeredAt: '2026-03-10',
    lastLoginAt: '2026-09-29',
    targetExam: 'CGPSC State Service Prelims 2026',
    district: 'Durg',
    medium: 'English',
    categoryReservation: 'UR'
  },
  {
    id: 'u-std-104',
    name: 'Mahesh Bhagat',
    email: 'mahesh.bhagat@gmail.com',
    phone: '9179456789',
    role: 'student',
    status: 'active',
    isBlocked: false,
    hasProPass: false,
    registeredAt: '2026-04-18',
    lastLoginAt: '2026-09-25',
    targetExam: 'CG Vyapam Hostel Warden',
    district: 'Surguja',
    medium: 'Hindi',
    categoryReservation: 'ST'
  }
];

const INITIAL_COUPONS: DiscountCoupon[] = [
  {
    id: 'c-cg2026',
    code: 'CGTEACHER50',
    discountPercentage: 50,
    maxDiscountAmount: 300,
    applicablePlan: 'all',
    validUntil: '2026-12-31',
    usageCount: 48,
    maxUses: 500,
    isActive: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'c-top100',
    code: 'TOPPER100',
    discountPercentage: 30,
    maxDiscountAmount: 200,
    applicablePlan: 'yearly',
    validUntil: '2026-11-30',
    usageCount: 19,
    maxUses: 200,
    isActive: true,
    createdAt: '2026-02-15'
  }
];

const INITIAL_ADMINS: User[] = [
  {
    id: 'adm-super-01',
    name: 'Executive Super Admin',
    email: 'admin@cgtest.in',
    role: 'superadmin',
    registeredAt: '2024-01-01',
    status: 'active',
    adminPermissions: {
      manageStudents: true,
      manageAdmins: true,
      manageTests: true,
      manageQuestions: true,
      manageCMS: true,
      managePayments: true,
      manageSystem: true,
    }
  },
  {
    id: 'adm-faculty-01',
    name: 'Academic Content Lead',
    email: 'faculty@cgtest.in',
    role: 'content_manager',
    registeredAt: '2025-06-01',
    status: 'active',
    adminPermissions: {
      manageStudents: false,
      manageAdmins: false,
      manageTests: true,
      manageQuestions: true,
      manageCMS: true,
      managePayments: false,
      manageSystem: false,
    }
  },
  {
    id: 'adm-support-01',
    name: 'Student Support & Telecaller',
    email: 'support@cgtest.in',
    role: 'support',
    registeredAt: '2025-09-10',
    status: 'active',
    adminPermissions: {
      manageStudents: true,
      manageAdmins: false,
      manageTests: false,
      manageQuestions: false,
      manageCMS: false,
      managePayments: true,
      manageSystem: false,
    }
  }
];

// ==========================================
// STUDENT CRM API
// ==========================================
export function getRegisteredStudents(): User[] {
  try {
    const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_STUDENTS;
}

export function saveRegisteredStudents(students: User[]): void {
  try {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  } catch (err) {
    console.warn('Could not save students to local storage', err);
  }
}

export function upsertStudentInRegistry(student: User): void {
  const current = getRegisteredStudents();
  const index = current.findIndex(s => s.id === student.id || s.email === student.email);
  let updated: User[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...student };
  } else {
    updated = [student, ...current];
  }
  saveRegisteredStudents(updated);
}

// ==========================================
// DISCOUNT COUPON API
// ==========================================
export function getCoupons(): DiscountCoupon[] {
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_COUPONS;
}

export function saveCoupons(coupons: DiscountCoupon[]): void {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
  } catch (err) {
    console.warn('Could not save coupons to local storage', err);
  }
}

export function validateCoupon(code: string, planType: string): { valid: boolean; coupon?: DiscountCoupon; error?: string } {
  const coupons = getCoupons();
  const found = coupons.find(c => c.code.trim().toUpperCase() === code.trim().toUpperCase() && c.isActive);
  if (!found) {
    return { valid: false, error: 'Invalid or inactive promo code.' };
  }
  if (new Date(found.validUntil).getTime() < Date.now()) {
    return { valid: false, error: 'Promo code has expired.' };
  }
  if (found.usageCount >= found.maxUses) {
    return { valid: false, error: 'Promo code usage limit exceeded.' };
  }
  if (found.applicablePlan !== 'all' && found.applicablePlan !== planType) {
    return { valid: false, error: `This code is only applicable on ${found.applicablePlan} passes.` };
  }
  return { valid: true, coupon: found };
}

// ==========================================
// ADMIN STAFF & RBAC API
// ==========================================
export function getAdminMembers(): User[] {
  try {
    const raw = localStorage.getItem(ADMINS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return INITIAL_ADMINS;
}

export function saveAdminMembers(admins: User[]): void {
  try {
    localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins));
  } catch (err) {
    console.warn('Could not save admins to local storage', err);
  }
}
