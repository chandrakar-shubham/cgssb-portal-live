import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Zap,
  CheckCircle2,
  Smartphone,
  Sparkles,
  X
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, loginWithGoogle, loginWithPhoneOtp } = useAuth();
  
  // Auth Modes: 'google' | 'phone_otp' | 'email'
  const [authMethod, setAuthMethod] = useState<'google' | 'phone_otp' | 'email'>('google');
  
  // Phone OTP States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Email States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  if (!isOpen) return null;

  // Google Login Handler
  const handleGoogleSignIn = () => {
    loginWithGoogle({
      email: 'student.candidate@gmail.com',
      name: 'Priya Sharma (CG Aspirant)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    });
    onClose();
  };

  // Send OTP
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpError('');
    setIsOtpSent(true);
  };

  // Verify OTP
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setOtpError('Please enter a valid OTP code');
      return;
    }
    loginWithPhoneOtp(phoneNumber, otpCode, `Aspirant ${phoneNumber.slice(-4)}`);
    onClose();
  };

  // Email Submit
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email, 'student', name || 'Candidate Student');
    onClose();
  };

  // Demo Accounts
  const handleQuickDemo = (role: UserRole) => {
    if (role === 'student') {
      login('rameshwar@cgssbtest.com', 'student', 'Rameshwar Dewangan');
    } else {
      login('admin@cgssbtest.com', 'admin', 'Exam Authority Admin');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header & Close */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-sm">
              CG
            </div>
            <div>
              <span className="font-extrabold text-sm text-white">
                CGSSB <span className="text-emerald-400">Test Portal</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Student & Candidate Account
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Method Tabs (Google / Mobile OTP / Email) */}
        <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('google');
              setIsOtpSent(false);
              setOtpError('');
            }}
            className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
              authMethod === 'google'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Google
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone_otp');
              setIsOtpSent(false);
              setOtpError('');
            }}
            className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
              authMethod === 'phone_otp'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mobile OTP
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setIsOtpSent(false);
              setOtpError('');
            }}
            className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
              authMethod === 'email'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email
          </button>
        </div>

        {/* TAB 1: GOOGLE SIGN IN */}
        {authMethod === 'google' && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              Sign in with your Google account to automatically sync your test attempts, bookmarks, and mock test scores.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center space-x-3 shadow-lg shadow-white/10 transition cursor-pointer active:scale-95"
            >
              {/* Google 4-color SVG logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant sign-in • 500 bonus test practice credits credited!</span>
            </div>
          </div>
        )}

        {/* TAB 2: MOBILE OTP LOGIN */}
        {authMethod === 'phone_otp' && (
          <div className="space-y-4 py-1">
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number (India)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {otpError && (
                  <p className="text-[11px] text-rose-400">{otpError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  Send OTP via SMS
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">OTP sent to +91 {phoneNumber}</span>
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="text-emerald-400 hover:underline text-[11px]"
                  >
                    Edit Number
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 block text-center mt-1">
                    (Use test OTP: <strong className="text-slate-400">123456</strong>)
                  </span>
                </div>

                {otpError && (
                  <p className="text-[11px] text-rose-400">{otpError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  Verify & Start Practicing
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: EMAIL / PASSWORD LOGIN */}
        {authMethod === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3 py-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Candidate Full Name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="aspirant@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Sign In with Email
            </button>
          </form>
        )}

        {/* Quick Demo Student Account */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Quick Access:</span>
          <button
            type="button"
            onClick={() => handleQuickDemo('student')}
            className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] transition"
          >
            1-Click Candidate Demo
          </button>
        </div>
      </div>
    </div>
  );
};
