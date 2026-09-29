import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  ArrowRight,
  Smartphone,
  Sparkles,
  X,
  MapPin,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const CHHATTISGARH_EXAMS = [
  'CG Teacher 2026 (शिक्षक भर्ती)',
  'CG Assistant Teacher 2026 (सहायक शिक्षक)',
  'CG Lecturer 2026 (व्याख्याता)',
  'CGPSC State Service Prelims 2026',
  'CG Police Sub-Inspector (SI) 2026',
  'CG Vyapam Hostel Warden (छात्रावास अधीक्षक)',
  'CG Vyapam Patwari / Revenue Inspector',
  'CG Forest Guard (वनरक्षक)',
  'Swami Atmanand English Medium Schools (SAGES)',
];

const CHHATTISGARH_DISTRICTS = [
  'Raipur', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Surguja (Ambikapur)',
  'Bastar (Jagdalpur)', 'Korba', 'Raigarh', 'Janjgir-Champa',
  'Kabirdham (Kawardha)', 'Mahasamund', 'Dhamtari', 'Kanker',
  'Dantewada', 'Balod', 'Bemetara', 'Baloda Bazar', 'Gariaband',
  'Mungeli', 'Surajpur', 'Balrampur', 'Sukma', 'Bijapur', 'Narayanpur',
  'Kondagaon', 'Gaurela-Pendra-Marwahi', 'Manendragarh', 'Mohla-Manpur',
  'Sakti', 'Sarangarh-Bilaigarh', 'Khairagarh'
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signup' }) => {
  const { login, registerStudent, loginWithGoogle, loginWithPhoneOtp } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'google' | 'phone_otp' | 'email'>('google');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up / Registration Form States
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [targetExam, setTargetExam] = useState(CHHATTISGARH_EXAMS[0]);
  const [district, setDistrict] = useState('Raipur');
  const [medium, setMedium] = useState<'Hindi' | 'English'>('Hindi');
  const [category, setCategory] = useState<'UR' | 'OBC' | 'SC' | 'ST' | 'EWS'>('UR');

  // Phone OTP States
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  if (!isOpen) return null;

  // Google Sign In
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle({
        email: 'candidate.student@gmail.com',
        name: 'Aspirant Candidate',
      });
      setIsLoading(false);
      onClose();
    } catch {
      setIsLoading(false);
      setErrorMsg('Google Sign-in was cancelled or encountered a network error.');
    }
  };

  // Phone OTP Send
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsOtpSent(true);
    }, 600);
  };

  // Phone OTP Verify
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('Please enter the 4-digit OTP sent to your phone (Demo: any 4 digits).');
      return;
    }
    loginWithPhoneOtp(phone.trim(), otpCode, fullName || `Candidate ${phone.slice(-4)}`);
    onClose();
  };

  // Email Sign In Submit
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }
    setErrorMsg('');
    login(signInEmail, 'student');
    onClose();
  };

  // Email Sign Up / Registration Submit
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signUpEmail.trim() || !signUpEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setErrorMsg('');
    registerStudent({
      name: fullName,
      email: signUpEmail,
      phone: phone.trim(),
      targetExam,
      district,
      medium,
      categoryReservation: category,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-100">
        
        {/* Header with Title & Mode Switch */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20">
              CG
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {mode === 'signup' ? 'Create Free Student Account' : 'Welcome Back, Candidate'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {mode === 'signup' 
                  ? 'Access CBT Mocks, Free PYQs & State Rank' 
                  : 'Sign in to access your test series & results'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth Method Selector */}
        <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setAuthMethod('google'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${
              authMethod === 'google'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('phone_otp'); setErrorMsg(''); setIsOtpSent(false); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${
              authMethod === 'phone_otp'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setErrorMsg(''); }}
            className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${
              authMethod === 'email'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email & Password
          </button>
        </div>

        {/* 1. GOOGLE 1-TAP LOGIN */}
        {authMethod === 'google' && (
          <div className="space-y-4 py-2 text-center">
            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in with your Google account for instant 1-tap verification and synchronized test results across all devices.
            </p>

            <button
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center space-x-3 transition shadow-lg shadow-white/10 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 2. PHONE NUMBER OTP */}
        {authMethod === 'phone_otp' && (
          <div className="space-y-4 py-1">
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98270XXXXX"
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-sm font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Login OTP</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Enter OTP Code</label>
                    <span className="text-[11px] text-emerald-400 font-mono">Sent to +91 {phone}</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="Enter 4-digit OTP"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-center tracking-widest font-mono text-base font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Start Practice</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* 3. EMAIL & PASSWORD (SIGN IN OR DETAILED SIGN UP) */}
        {authMethod === 'email' && (
          <div>
            {mode === 'signin' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={e => setSignInEmail(e.target.value)}
                    placeholder="aspirant@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={signInPassword}
                    onChange={e => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer mt-2"
                >
                  Sign In to Candidate Dashboard
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Full Candidate Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Rameshwar Dewangan"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Mobile / WhatsApp No.</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98270XXXXX"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={e => setSignUpEmail(e.target.value)}
                      placeholder="candidate@gmail.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Create Password *</label>
                    <input
                      type="password"
                      required
                      value={signUpPassword}
                      onChange={e => setSignUpPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                    />
                  </div>
                </div>

                {/* Target Examination Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center space-x-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Primary Target Exam</span>
                  </label>
                  <select
                    value={targetExam}
                    onChange={e => setTargetExam(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs font-semibold"
                  >
                    {CHHATTISGARH_EXAMS.map(exam => (
                      <option key={exam} value={exam}>{exam}</option>
                    ))}
                  </select>
                </div>

                {/* District & Medium */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Home District</span>
                    </label>
                    <select
                      value={district}
                      onChange={e => setDistrict(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                    >
                      {CHHATTISGARH_DISTRICTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Exam Medium</label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMedium('Hindi')}
                        className={`py-1 rounded-lg transition cursor-pointer text-center ${
                          medium === 'Hindi' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        हिंदी
                      </button>
                      <button
                        type="button"
                        onClick={() => setMedium('English')}
                        className={`py-1 rounded-lg transition cursor-pointer text-center ${
                          medium === 'English' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer mt-2 shadow-lg shadow-emerald-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Account & Start Free Mocks</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Toggle (Sign In <-> Sign Up) */}
        <div className="border-t border-slate-800 pt-3 text-center text-xs text-slate-400">
          {mode === 'signup' ? (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setAuthMethod('email'); setErrorMsg(''); }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New candidate?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setAuthMethod('email'); setErrorMsg(''); }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Create Free Account
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
