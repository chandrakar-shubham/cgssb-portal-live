import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getOrCreateDeviceId, createPassTenure } from '../utils/devicePassManager';

interface AuthContextType {
  // Student Auth
  user: User | null;
  login: (email: string, role?: UserRole, name?: string) => void;
  loginWithGoogle: (googleData: { email: string; name: string; avatar?: string }) => void;
  loginWithPhoneOtp: (phone: string, otp: string, name?: string) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  logout: () => void;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => void;
  activateProPass: (planType: 'monthly' | 'yearly' | string, customName?: string) => void;
  transferPassDevice: () => void;

  // Admin Auth (Strictly Separated)
  adminUser: User | null;
  isAdminAuthenticated: boolean;
  adminLogin: (usernameOrEmail: string, passwordOrPasskey?: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
}

const DEFAULT_STUDENT_USER: User = {
  id: 'u-student-01',
  name: 'Rameshwar Dewangan',
  email: 'rameshwar@cgssbtest.com',
  phone: '9827012345',
  role: 'student',
  credits: 350,
  hasProPass: true,
  proPassPlan: 'Yearly All-Access Pass (365 Days)',
  passDurationDays: 365,
  passExpiresAt: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString(), // Active with 320 days
  registeredAt: '2024-01-15',
  targetExam: 'CGPSC State Service 2026',
  targetYear: 2026,
  district: 'Raipur',
  categoryReservation: 'OBC',
  gender: 'Male',
  education: 'Graduate (B.Sc. / B.Ed.)',
  medium: 'Hindi',
  bio: 'Targeting Top 50 in CGPSC State Service 2026. Consistent daily mock practice!',
  dailyGoalQuestions: 50,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Student Auth State
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cgssb_student_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_STUDENT_USER;
  });

  // Admin Auth State (Separate key and state)
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('cgssb_admin_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role === 'admin') return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('cgssb_student_user', JSON.stringify(user));
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

  // Student Login
  const login = (email: string, role: UserRole = 'student', name?: string) => {
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: name || 'Aspirant Student',
      email,
      role: 'student', // Student login is always student
      credits: 350,
      hasProPass: user?.hasProPass || false,
      proPassPlan: user?.proPassPlan,
      registeredAt: new Date().toISOString().split('T')[0],
      token: `jwt-student-${Date.now()}`,
    };
    setUser(newUser);
  };

  const loginWithGoogle = (googleData: { email: string; name: string; avatar?: string }) => {
    const newUser: User = {
      id: `u-g-${Date.now()}`,
      name: googleData.name || 'Google Aspirant',
      email: googleData.email,
      role: 'student',
      credits: 500,
      hasProPass: user?.hasProPass || false,
      proPassPlan: user?.proPassPlan,
      avatar: googleData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      registeredAt: new Date().toISOString().split('T')[0],
      token: `jwt-google-${Date.now()}`,
    };
    setUser(newUser);
  };

  const loginWithPhoneOtp = (phone: string, otp: string, name?: string) => {
    const newUser: User = {
      id: `u-p-${Date.now()}`,
      name: name || `Candidate ${phone.slice(-4)}`,
      email: `${phone}@student.cgssbtest.com`,
      phone: phone,
      role: 'student',
      credits: 500,
      hasProPass: user?.hasProPass || false,
      proPassPlan: user?.proPassPlan,
      registeredAt: new Date().toISOString().split('T')[0],
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
        id: `u-${Date.now()}`,
        name: 'Pass Subscriber Aspirant',
        email: 'aspirant@cgssbtest.com',
        role: 'student',
        hasProPass: true,
        proPassPlan: finalPlanName,
        passDurationDays: tenure.days,
        passExpiresAt: tenure.expiresAt,
        boundDeviceId: device.id,
        boundDeviceName: device.name,
        registeredAt: new Date().toISOString().split('T')[0],
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
  };

  // Admin Login (Strictly separate credentials check)
  const adminLogin = async (usernameOrEmail: string, passwordOrPasskey?: string): Promise<{ success: boolean; error?: string }> => {
    const identifier = usernameOrEmail.trim().toLowerCase();
    const pass = (passwordOrPasskey || '').trim();

    // Verify admin credentials
    // Supported admin usernames: admin, admin@cgssbtest.com, controller
    // Supported passkeys: admin123, cgssb2024, or any non-empty pass for admin identifier
    const isValidIdentifier = identifier === 'admin' || identifier === 'admin@cgssbtest.com' || identifier === 'controller' || identifier.includes('admin');
    const isValidPass = pass === 'admin123' || pass === 'cgssb2024' || pass.length >= 4;

    if (isValidIdentifier && isValidPass) {
      const newAdmin: User = {
        id: 'u-admin-controller',
        name: 'Exam Controller Admin',
        email: identifier.includes('@') ? identifier : 'admin@cgssbtest.com',
        role: 'admin',
        credits: 99999,
        registeredAt: '2024-01-01',
        token: `jwt-admin-${Date.now()}`,
      };
      setAdminUser(newAdmin);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. Default: admin@cgssbtest.com / admin123',
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
        login,
        loginWithGoogle,
        loginWithPhoneOtp,
        updateUserProfile,
        activateProPass,
        transferPassDevice,
        logout,
        deductCredits,
        addCredits,
        adminUser,
        isAdminAuthenticated: !!adminUser && adminUser.role === 'admin',
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

