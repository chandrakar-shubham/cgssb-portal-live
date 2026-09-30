import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AdminPermissions } from '../types';
import { getOrCreateDeviceId, createPassTenure } from '../utils/devicePassManager';
import { syncUserProfileToFirestore, fetchUserProfileFromFirestore } from '../firebase/firestoreService';
import { 
  signInAnonymously, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase/config';
import { getAdminMembers } from '../utils/studentStore';
import { api } from '../utils/apiClient';
import { 
  generateReferralCode, 
  getPendingReferralCode, 
  setPendingReferralCode, 
  applyReferralBonus, 
  processSignupReferral 
} from '../utils/referralStore';

interface AuthContextType {
  // Student Auth
  user: User | null;
  isStudentBlocked: boolean;
  login: (email: string, role?: UserRole, name?: string, password?: string) => Promise<void>;
  registerStudent: (details: {
    name: string;
    email: string;
    phone?: string;
    targetExam?: string;
    district?: string;
    medium?: 'Hindi' | 'English';
    categoryReservation?: 'UR' | 'OBC' | 'SC' | 'ST' | 'EWS';
    referralCode?: string;
  }, password?: string) => Promise<void>;
  loginWithGoogle: (googleData: { email: string; name: string; avatar?: string }) => Promise<void>;
  loginWithPhoneOtp: (phone: string, otp: string, name?: string) => void;
  loginWithWhatsApp: (phone: string, tokenOrOtp?: string, name?: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  activateProPass: (planType: 'monthly' | 'yearly' | string, customName?: string) => void;
  transferPassDevice: () => void;
  recordTestCompletion: () => { unlockedBonus: boolean; newCount: number };
  applyReferralCode: (code: string) => { success: boolean; message: string; referrerName?: string };
  userReferralCode: string;

  // Admin Auth & RBAC
  adminUser: User | null;
  isAdminAuthenticated: boolean;
  adminRole: UserRole | null;
  adminPermissions: AdminPermissions | null;
  adminLogin: (usernameOrEmail: string, passwordOrPasskey?: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Student Auth State - Defaults to NULL for clean guest preview mode!
  const [user, setUser] = useState<User | null>(null);

  // Admin Auth State (Strictly separated)
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('cgssb_admin_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'admin' || parsed.role === 'superadmin' || parsed.role === 'content_manager' || parsed.role === 'support')) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Capture referral code from URL if candidate visits via an invite link ?ref=CG-XXXX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('ref') || urlParams.get('referral');
        if (refParam) {
          setPendingReferralCode(refParam);
        }
      } catch {
        // ignore url parsing errors
      }
    }
  }, []);

  // Auto-connect with Firebase Auth for Firestore rules authorization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        console.log('Firebase Auth session verified:', fbUser.uid);
      } else {
        try {
          await signInAnonymously(auth);
        } catch {
          // Offline fallback
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      syncUserProfileToFirestore(user).catch(() => null);
    }
  }, [user]);

  useEffect(() => {
    if (adminUser) {
      sessionStorage.setItem('cgssb_admin_session', JSON.stringify(adminUser));
    } else {
      sessionStorage.removeItem('cgssb_admin_session');
    }
  }, [adminUser]);

  const isStudentBlocked = Boolean(user?.isBlocked || user?.status === 'blocked');

  // Helper: Generates default 1-Month Free Pro Pass for every newly registered/onboarded student
  const createInitialProPassDetails = () => {
    const device = getOrCreateDeviceId();
    const now = Date.now();
    const thirtyDaysExpiry = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
    const guestTookTest = typeof window !== 'undefined' && localStorage.getItem('cgtest_guest_test_completed') === 'true';
    return {
      hasProPass: true,
      proPassPlan: '1-Month Free Welcome Pass (30 Days)',
      passDurationDays: 30,
      passExpiresAt: thirtyDaysExpiry,
      boundDeviceId: device.id,
      boundDeviceName: device.name,
      completedTestsCount: guestTookTest ? 1 : 0,
      freePassStage: '1_month_active' as const,
      unlockedMilestoneBonus: false,
    };
  };

  // Student Registration with Onboarding Data & Automatic 1-Month Free Pro Pass (+1 Month extra if referred)
  const registerStudent = async (details: {
    name: string; email: string; phone?: string; targetExam?: string; district?: string;
    medium?: 'Hindi' | 'English'; categoryReservation?: 'UR' | 'OBC' | 'SC' | 'ST' | 'EWS'; referralCode?: string;
  }, password = '') => {
    if (password.length < 6) throw new Error('Password must be at least 6 characters long.');
    const credential = await createUserWithEmailAndPassword(auth, details.email.trim().toLowerCase(), password);
    const studentId = credential.user.uid;
    const passDetails = createInitialProPassDetails();
    const initialUser: User = {
      id: studentId, name: details.name.trim(), email: details.email.trim().toLowerCase(), phone: details.phone?.trim() || '',
      role: 'student', status: 'active', isBlocked: false,
      registeredAt: new Date().toISOString().split('T')[0], lastLoginAt: new Date().toISOString().split('T')[0],
      targetExam: details.targetExam || 'CG Teacher 2026 (शिक्षक भर्ती)', targetYear: 2026,
      district: details.district || 'Raipur', medium: details.medium || 'Hindi',
      categoryReservation: details.categoryReservation || 'UR',
      referralCode: generateReferralCode({ id: studentId, name: details.name.trim(), email: details.email }),
      referralCount: 0, referralBonusMonths: 0, ...passDetails,
    };
    const finalUser = processSignupReferral(initialUser, details.referralCode);
    await syncUserProfileToFirestore(finalUser);
    setUser(finalUser);
  };

  // Student Login
  const login = async (email: string, _role: UserRole = 'student', name?: string, password = '') => {
    if (!password) throw new Error('Password is required.');
    const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const existing = await fetchUserProfileFromFirestore();
    const today = new Date().toISOString().split('T')[0];
    const profile: User = existing ? { ...existing, id: credential.user.uid, email: credential.user.email || existing.email, lastLoginAt: today } : {
      id: credential.user.uid, name: name || credential.user.displayName || 'Aspirant Student',
      email: credential.user.email || email.trim().toLowerCase(), role: 'student', status: 'active', isBlocked: false,
      registeredAt: today, lastLoginAt: today, targetExam: 'CG Teacher 2026 (शिक्षक भर्ती)', district: 'Raipur', medium: 'Hindi',
      ...createInitialProPassDetails(),
    };
    setUser(profile);
    await syncUserProfileToFirestore(profile);
  };


  const loginWithGoogle = async (_googleData: { email: string; name: string; avatar?: string }) => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const fbUser = result.user;
    const existing = await fetchUserProfileFromFirestore();
    const today = new Date().toISOString().split('T')[0];

    if (existing) {
      const updated = {
        ...existing,
        id: fbUser.uid,
        email: fbUser.email || existing.email,
        name: fbUser.displayName || existing.name,
        avatar: fbUser.photoURL || existing.avatar,
        lastLoginAt: today,
      };
      await syncUserProfileToFirestore(updated);
      setUser(updated);
      return;
    }

    const newUser: User = {
      id: fbUser.uid,
      name: fbUser.displayName || 'Google Aspirant',
      email: fbUser.email || '',
      role: 'student',
      status: 'active',
      isBlocked: false,
      avatar: fbUser.photoURL || undefined,
      registeredAt: today,
      lastLoginAt: today,
      targetExam: 'CG Teacher 2026 (शिक्षक भर्ती)',
      district: 'Raipur',
      medium: 'Hindi',
      ...createInitialProPassDetails(),
    };
    await syncUserProfileToFirestore(newUser);
    setUser(newUser);
  };

  const loginWithPhoneOtp = (_phone: string, _otp: string, _name?: string) => {
    throw new Error('Phone OTP authentication is not enabled yet. Please use email/password or Google sign-in.');
  };

  const loginWithWhatsApp = (_phone: string, _tokenOrOtp?: string, _name?: string) => {
    throw new Error('WhatsApp authentication is not enabled yet. Please use email/password or Google sign-in.');
  };

  const activateProPass = (planTypeOrName: 'monthly' | 'yearly' | string, customName?: string) => {
    const isMonthly = planTypeOrName.toLowerCase().includes('monthly') || planTypeOrName === 'monthly';
    const planKey = isMonthly ? 'monthly' : 'yearly';
    const tenure = createPassTenure(planKey);
    const device = getOrCreateDeviceId();
    const finalPlanName = customName || (isMonthly ? 'Monthly All-Access Pass (30 Days)' : 'Yearly All-Access Pass (365 Days)');

    if (user) {
      setUser({
        ...user,
        hasProPass: true,
        proPassPlan: finalPlanName,
        passDurationDays: tenure.days,
        passExpiresAt: tenure.expiresAt,
        boundDeviceId: device.id,
        boundDeviceName: device.name,
      });
    } else {
      console.warn('Cannot activate a pass before student authentication.');
    }
  };

  // Milestone Test Completion Hook (+2 Months Free on 5 Tests)
  const recordTestCompletion = (): { unlockedBonus: boolean; newCount: number } => {
    if (!user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cgtest_guest_test_completed', 'true');
      }
      return { unlockedBonus: false, newCount: 1 };
    }

    const currentCount = user.completedTestsCount || 0;
    const newCount = currentCount + 1;
    const shouldUnlockBonus = newCount >= 5 && !user.unlockedMilestoneBonus;

    let updatedExpiresAt = user.passExpiresAt;
    let updatedDurationDays = user.passDurationDays || 30;
    let updatedPlan = user.proPassPlan || '1-Month Free Welcome Pass (30 Days)';
    let updatedStage = user.freePassStage || '1_month_active';

    if (shouldUnlockBonus) {
      const baseTime = user.passExpiresAt ? new Date(user.passExpiresAt).getTime() : Date.now();
      const extendedTime = Math.max(Date.now(), baseTime) + 60 * 24 * 60 * 60 * 1000; // +60 days (2 months)
      updatedExpiresAt = new Date(extendedTime).toISOString();
      updatedDurationDays = updatedDurationDays + 60;
      updatedPlan = '3-Month Milestone Pro Pass (90 Days Total)';
      updatedStage = '3_months_unlocked';
    }

    const updatedUser: User = {
      ...user,
      hasProPass: true,
      completedTestsCount: newCount,
      unlockedMilestoneBonus: Boolean(user.unlockedMilestoneBonus || shouldUnlockBonus),
      freePassStage: updatedStage,
      proPassPlan: updatedPlan,
      passDurationDays: updatedDurationDays,
      passExpiresAt: updatedExpiresAt,
    };

    setUser(updatedUser);
    return { unlockedBonus: shouldUnlockBonus, newCount };
  };

  const transferPassDevice = () => {
    if (!user) return;
    const currentDevice = getOrCreateDeviceId();
    setUser({
      ...user,
      boundDeviceId: currentDevice.id,
      boundDeviceName: currentDevice.name,
    });
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (!user) return;
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates,
      };
    });
  };

  const logout = () => {
    setUser(null);
    void firebaseSignOut(auth).catch(() => null);
  };


  // Admin Login: credentials are verified only by the server. Never ship the admin secret to the browser.
  const adminLogin = async (usernameOrEmail: string, passwordOrPasskey?: string): Promise<{ success: boolean; error?: string }> => {
    const identifier = usernameOrEmail.trim();
    const pass = (passwordOrPasskey || '').trim();

    if (!identifier || !pass) {
      return { success: false, error: 'Admin username and password are required.' };
    }

    try {
      const result = await api.post<{ success: boolean; token?: string; user?: User; error?: string }>(
        '/api/auth/admin-login',
        { username: identifier, password: pass }
      );

      if (!result.success || !result.token || !result.user) {
        return { success: false, error: result.error || 'Invalid admin credentials.' };
      }

      const authenticatedUser = { ...result.user, token: result.token } as User;
      setAdminUser(authenticatedUser);
      sessionStorage.setItem('cgssb_admin_session', JSON.stringify(authenticatedUser));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Admin authentication failed.' };
    }
  };

  const adminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('cgssb_admin_session');
  };

  const deductCredits = (amount: number): boolean => {
    if (!user) return false;
    const currentCredits = user.credits ?? 0;
    if (currentCredits < amount) return false;
    setUser({ ...user, credits: currentCredits - amount });
    return true;
  };

  const addCredits = (amount: number) => {
    if (!user) return;
    setUser({ ...user, credits: (user.credits ?? 0) + amount });
  };

  const applyReferralCode = (code: string): { success: boolean; message: string; referrerName?: string } => {
    if (!user) {
      return { success: false, message: 'Please create an account or sign in to claim your referral bonus!' };
    }
    const result = applyReferralBonus(user, code);
    if (result.success && result.updatedUser) {
      setUser(result.updatedUser);
    }
    return {
      success: result.success,
      message: result.message,
      referrerName: result.referrerName,
    };
  };

  const userReferralCode = user?.referralCode || (user ? generateReferralCode(user) : '');

  return (
    <AuthContext.Provider
      value={{
        user,
        isStudentBlocked,
        login,
        registerStudent,
        loginWithGoogle,
        loginWithPhoneOtp,
        loginWithWhatsApp,
        updateUserProfile,
        activateProPass,
        transferPassDevice,
        recordTestCompletion,
        applyReferralCode,
        userReferralCode,
        logout,
        deductCredits,
        addCredits,
        adminUser,
        isAdminAuthenticated: !!adminUser && (adminUser.role === 'admin' || adminUser.role === 'superadmin' || adminUser.role === 'content_manager' || adminUser.role === 'support'),
        adminRole: adminUser?.role || null,
        adminPermissions: adminUser?.adminPermissions || null,
        adminLogin,
        adminLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
