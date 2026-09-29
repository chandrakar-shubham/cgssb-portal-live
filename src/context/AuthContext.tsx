import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AdminPermissions } from '../types';
import { getOrCreateDeviceId, createPassTenure } from '../utils/devicePassManager';
import { syncUserProfileToFirestore } from '../firebase/firestoreService';
import { 
  signInAnonymously, 
  signInWithPopup, 
  onAuthStateChanged,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase/config';
import { upsertStudentInRegistry, getRegisteredStudents, saveRegisteredStudents, getAdminMembers } from '../utils/studentStore';

interface AuthContextType {
  // Student Auth
  user: User | null;
  isStudentBlocked: boolean;
  login: (email: string, role?: UserRole, name?: string) => void;
  registerStudent: (details: {
    name: string;
    email: string;
    phone?: string;
    targetExam?: string;
    district?: string;
    medium?: 'Hindi' | 'English';
    categoryReservation?: 'UR' | 'OBC' | 'SC' | 'ST' | 'EWS';
  }) => void;
  loginWithGoogle: (googleData: { email: string; name: string; avatar?: string }) => Promise<void>;
  loginWithPhoneOtp: (phone: string, otp: string, name?: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  activateProPass: (planType: 'monthly' | 'yearly' | string, customName?: string) => void;
  transferPassDevice: () => void;

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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cgssb_student_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch {
      // ignore
    }
    return null; // Clean guest mode by default
  });

  // Admin Auth State (Strictly separated)
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cgssb_admin_session');
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
      localStorage.setItem('cgssb_student_user', JSON.stringify(user));
      upsertStudentInRegistry(user);
      syncUserProfileToFirestore(user).catch(() => null);
    } else {
      localStorage.removeItem('cgssb_student_user');
    }
  }, [user]);

  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('cgssb_admin_session', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('cgssb_admin_session');
    }
  }, [adminUser]);

  const isStudentBlocked = Boolean(user?.isBlocked || user?.status === 'blocked');

  // Student Registration with Onboarding Data
  const registerStudent = (details: {
    name: string;
    email: string;
    phone?: string;
    targetExam?: string;
    district?: string;
    medium?: 'Hindi' | 'English';
    categoryReservation?: 'UR' | 'OBC' | 'SC' | 'ST' | 'EWS';
  }) => {
    const newUser: User = {
      id: `std-${Date.now()}`,
      name: details.name.trim(),
      email: details.email.trim().toLowerCase(),
      phone: details.phone?.trim() || '',
      role: 'student',
      status: 'active',
      isBlocked: false,
      hasProPass: false,
      registeredAt: new Date().toISOString().split('T')[0],
      lastLoginAt: new Date().toISOString().split('T')[0],
      targetExam: details.targetExam || 'CG Teacher 2026 (शिक्षक भर्ती)',
      targetYear: 2026,
      district: details.district || 'Raipur',
      medium: details.medium || 'Hindi',
      categoryReservation: details.categoryReservation || 'UR',
      token: `jwt-std-${Date.now()}`,
    };
    setUser(newUser);
  };

  // Student Login
  const login = (email: string, role: UserRole = 'student', name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = getRegisteredStudents().find(s => s.email.toLowerCase() === cleanEmail);
    
    if (existing) {
      const updated = { ...existing, lastLoginAt: new Date().toISOString().split('T')[0] };
      setUser(updated);
      return;
    }

    const newUser: User = {
      id: `std-${Date.now()}`,
      name: name || 'Aspirant Student',
      email: cleanEmail,
      role: 'student',
      status: 'active',
      isBlocked: false,
      hasProPass: false,
      registeredAt: new Date().toISOString().split('T')[0],
      lastLoginAt: new Date().toISOString().split('T')[0],
      targetExam: 'CG Teacher 2026 (शिक्षक भर्ती)',
      district: 'Raipur',
      medium: 'Hindi',
      token: `jwt-student-${Date.now()}`,
    };
    setUser(newUser);
  };

  const loginWithGoogle = async (googleData: { email: string; name: string; avatar?: string }) => {
    let fbUserUid = `g-${Date.now()}`;
    let fbName = googleData.name;
    let fbEmail = googleData.email;
    let fbAvatar = googleData.avatar;

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result && result.user) {
        fbUserUid = result.user.uid;
        fbName = result.user.displayName || fbName;
        fbEmail = result.user.email || fbEmail;
        fbAvatar = result.user.photoURL || fbAvatar;
      }
    } catch {
      // Popup blocked or offline fallback
    }

    const cleanEmail = fbEmail.trim().toLowerCase();
    const existing = getRegisteredStudents().find(s => s.email.toLowerCase() === cleanEmail);

    if (existing) {
      setUser({
        ...existing,
        avatar: fbAvatar || existing.avatar,
        lastLoginAt: new Date().toISOString().split('T')[0]
      });
      return;
    }

    const newUser: User = {
      id: fbUserUid,
      name: fbName || 'Google Aspirant',
      email: cleanEmail,
      role: 'student',
      status: 'active',
      isBlocked: false,
      hasProPass: false,
      avatar: fbAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      registeredAt: new Date().toISOString().split('T')[0],
      lastLoginAt: new Date().toISOString().split('T')[0],
      targetExam: 'CG Teacher 2026 (शिक्षक भर्ती)',
      district: 'Raipur',
      medium: 'Hindi',
      token: `jwt-google-${Date.now()}`,
    };
    setUser(newUser);
  };

  const loginWithPhoneOtp = (phone: string, _otp: string, name?: string) => {
    const cleanPhone = phone.trim();
    const cleanEmail = `${cleanPhone}@student.cgssbtest.com`;
    const existing = getRegisteredStudents().find(s => s.phone === cleanPhone || s.email === cleanEmail);

    if (existing) {
      setUser({ ...existing, lastLoginAt: new Date().toISOString().split('T')[0] });
      return;
    }

    const newUser: User = {
      id: `std-p-${Date.now()}`,
      name: name || `Candidate ${cleanPhone.slice(-4)}`,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'student',
      status: 'active',
      isBlocked: false,
      hasProPass: false,
      registeredAt: new Date().toISOString().split('T')[0],
      lastLoginAt: new Date().toISOString().split('T')[0],
      targetExam: 'CG Teacher 2026 (शिक्षक भर्ती)',
      district: 'Raipur',
      medium: 'Hindi',
      token: `jwt-phone-${Date.now()}`,
    };
    setUser(newUser);
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
      const newUser: User = {
        id: `std-${Date.now()}`,
        name: 'Enrolled Aspirant',
        email: 'aspirant@cgssbtest.com',
        role: 'student',
        status: 'active',
        isBlocked: false,
        hasProPass: true,
        proPassPlan: finalPlanName,
        passDurationDays: tenure.days,
        passExpiresAt: tenure.expiresAt,
        boundDeviceId: device.id,
        boundDeviceName: device.name,
        registeredAt: new Date().toISOString().split('T')[0],
        lastLoginAt: new Date().toISOString().split('T')[0],
      };
      setUser(newUser);
    }
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
    localStorage.removeItem('cgssb_student_user');
  };

  // Admin Login with Role Support
  const adminLogin = async (usernameOrEmail: string, passwordOrPasskey?: string): Promise<{ success: boolean; error?: string }> => {
    const identifier = usernameOrEmail.trim().toLowerCase();
    const pass = (passwordOrPasskey || '').trim();

    // 1. Check registered admin team members
    const adminStaff = getAdminMembers();
    const matchedMember = adminStaff.find(a => a.email.toLowerCase() === identifier || a.id.toLowerCase() === identifier);

    // Standard password checks
    const isValidPass = pass === 'admin123' || pass === 'cgssb2024' || pass === 'cgssb_admin_2026' || pass === 'admin' || pass === 'controller';

    if (matchedMember && isValidPass) {
      setAdminUser(matchedMember);
      localStorage.setItem('cgssb_admin_session', JSON.stringify(matchedMember));
      return { success: true };
    }

    // Default Super Admin credentials
    const isSuperAdminUser = identifier === 'admin' || identifier === 'admin@cgssbtest.com' || identifier === 'controller';
    if (isSuperAdminUser && isValidPass) {
      const superAdmin: User = {
        id: 'adm-super-01',
        name: 'Executive Super Admin',
        email: identifier.includes('@') ? identifier : 'admin@cgssbtest.com',
        role: 'superadmin',
        registeredAt: '2024-01-01',
        status: 'active',
        token: `adm_${Date.now()}_auth`,
        adminPermissions: {
          manageStudents: true,
          manageAdmins: true,
          manageTests: true,
          manageQuestions: true,
          manageCMS: true,
          managePayments: true,
          manageSystem: true,
        }
      };
      setAdminUser(superAdmin);
      localStorage.setItem('cgssb_admin_session', JSON.stringify(superAdmin));
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid admin credentials. Please verify your email/username and password.',
    };
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isStudentBlocked,
        login,
        registerStudent,
        loginWithGoogle,
        loginWithPhoneOtp,
        updateUserProfile,
        activateProPass,
        transferPassDevice,
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
