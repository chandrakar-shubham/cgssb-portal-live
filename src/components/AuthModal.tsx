import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Mail,
  Lock,
  User as UserIcon,
  Smartphone,
  Sparkles,
  X,
  MapPin,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  Zap,
  ArrowRight
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
  const { login, registerStudent, loginWithGoogle, loginWithPhoneOtp, loginWithWhatsApp } = useAuth();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'whatsapp' | 'phone_otp' | 'google'>('email');
  
  // Visual Loading Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up / Registration Form States
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [targetExam, setTargetExam] = useState(CHHATTISGARH_EXAMS[0]);
  const [district, setDistrict] = useState('Raipur');
  const [medium, setMedium] = useState<'Hindi' | 'English'>('Hindi');
  const [category, setCategory] = useState<'UR' | 'OBC' | 'SC' | 'ST' | 'EWS'>('UR');

  // Phone OTP States
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('4826');
  const [resendTimer, setResendTimer] = useState(0);

  // WhatsApp Auth States
  const [waPhone, setWaPhone] = useState('');
  const [waMode, setWaMode] = useState<'direct_chat' | 'otp'>('direct_chat');
  const [waHandshakeCode, setWaHandshakeCode] = useState(() => `WA-CG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isWaOtpSent, setIsWaOtpSent] = useState(false);
  const [waGeneratedOtp, setWaGeneratedOtp] = useState('7392');
  const [waOtpCode, setWaOtpCode] = useState('');

  // Sync mode with initialMode prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setSuccessMsg('');
      setIsLoading(false);
      setLoadingStepText('');
      setWaHandshakeCode(`WA-CG-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [isOpen, initialMode]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // ==========================================
  // REAL-TIME FORM VALIDATION HELPERS
  // ==========================================
  const isEmailValid = useMemo(() => {
    const emailToTest = mode === 'signin' ? signInEmail : signUpEmail;
    if (!emailToTest) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToTest.trim());
  }, [mode, signInEmail, signUpEmail]);

  const passwordValidation = useMemo(() => {
    const pwd = signUpPassword;
    const hasMinLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (hasMinLength) score += 1;
    if ((hasUpper && hasLower) || hasNumber) score += 1;
    if (hasSpecial && hasNumber && hasMinLength) score += 1;

    let strengthLabel = 'Too Weak';
    let strengthColor = 'bg-rose-500 text-rose-400';
    if (score === 2) {
      strengthLabel = 'Fair';
      strengthColor = 'bg-amber-500 text-amber-400';
    } else if (score === 3) {
      strengthLabel = 'Good';
      strengthColor = 'bg-blue-500 text-blue-400';
    } else if (score >= 4) {
      strengthLabel = 'Strong';
      strengthColor = 'bg-emerald-500 text-emerald-400';
    }

    return {
      score,
      strengthLabel,
      strengthColor,
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isAcceptable: pwd.length >= 6
    };
  }, [signUpPassword]);

  if (!isOpen) return null;

  // Google Sign In
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setLoadingStepText('Connecting to Google Identity Services...');
    setErrorMsg('');
    try {
      await loginWithGoogle({
        email: 'candidate.student@gmail.com',
        name: 'Aspirant Candidate',
      });
      setLoadingStepText('Synchronizing candidate profile...');
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg('Successfully authenticated with Google!');
        setTimeout(() => onClose(), 600);
      }, 500);
    } catch {
      setIsLoading(false);
      setErrorMsg('Google Sign-in was cancelled or encountered a network error.');
    }
  };

  // Phone OTP Send
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number (e.g. 9827012345).');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    setLoadingStepText('Dispatching SMS verification code via OTP gateway...');

    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomCode);

    setTimeout(() => {
      setIsLoading(false);
      setIsOtpSent(true);
      setResendTimer(30);
      setSuccessMsg(`Simulated SMS sent! Your OTP is ${randomCode}`);
    }, 600);
  };

  // Phone OTP Verify
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 4) {
      setErrorMsg('Please enter the 4-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setLoadingStepText('Verifying OTP & activating candidate session...');
    setTimeout(() => {
      loginWithPhoneOtp(phone.trim(), cleanCode, fullName || `Candidate ${phone.slice(-4)}`);
      setIsLoading(false);
      setSuccessMsg('Phone verified successfully! Redirecting...');
      setTimeout(() => onClose(), 500);
    }, 500);
  };

  // Auto-fill OTP Helper
  const handleAutoFillOtp = () => {
    setOtpCode(generatedOtp);
    setErrorMsg('');
  };

  // Email Sign In Submit
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || isEmailValid === false) {
      setErrorMsg('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }
    if (!signInPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    setLoadingStepText('Authenticating credentials & loading your enrolled test series...');

    setTimeout(() => {
      login(signInEmail, 'student');
      setLoadingStepText('Synchronizing state ranks & analytics...');
      setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg('Welcome back, Candidate! Loading dashboard...');
        setTimeout(() => onClose(), 600);
      }, 400);
    }, 500);
  };

  // Email Sign Up / Registration Submit
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full candidate name.');
      return;
    }
    if (!signUpEmail.trim() || isEmailValid === false) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);
    setLoadingStepText('Registering student profile in CG State Candidate Registry...');

    setTimeout(() => {
      setLoadingStepText('Allocating syllabus tracks & free CBT mock passes...');
      registerStudent({
        name: fullName,
        email: signUpEmail,
        phone: signUpPhone.trim(),
        targetExam,
        district,
        medium,
        categoryReservation: category,
      });

      setTimeout(() => {
        setIsLoading(false);
        setSuccessMsg('Account created successfully! Welcome to CGSSB Test Portal.');
        setTimeout(() => onClose(), 700);
      }, 500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-100 relative overflow-hidden">
        
        {/* Loading Overlay with Dynamic Progress Feedback */}
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h4 className="font-extrabold text-sm text-white mb-1">
              {mode === 'signup' ? 'Setting Up Your Candidate Account' : 'Signing You In'}
            </h4>
            <p className="text-xs text-slate-300 font-medium max-w-xs animate-pulse">
              {loadingStepText || 'Please wait while we secure your session...'}
            </p>
          </div>
        )}

        {/* Header with Title & Close Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20">
              CG
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                {mode === 'signup' ? 'Create Free Student Account' : 'Candidate Sign In'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {mode === 'signup' 
                  ? 'Access CBT Mocks, Free PYQs & State Ranks' 
                  : 'Access your test series, test history & analytics'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close Auth Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================ */}
        {/* CLEAR TOGGLE BETWEEN 'SIGN IN' AND 'SIGN UP' */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 ${
              mode === 'signin'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-2 ${
              mode === 'signup'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create New Account</span>
          </button>
        </div>

        {/* Alerts: Error & Success Messages */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => { setAuthMethod('email'); setErrorMsg(''); }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center flex items-center justify-center space-x-1 ${
              authMethod === 'email'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('whatsapp'); setErrorMsg(''); }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center flex items-center justify-center space-x-1 ${
              authMethod === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('phone_otp'); setErrorMsg(''); setIsOtpSent(false); }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center flex items-center justify-center space-x-1 ${
              authMethod === 'phone_otp'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS OTP</span>
          </button>

          <button
            type="button"
            onClick={() => { setAuthMethod('google'); setErrorMsg(''); }}
            className={`py-1.5 rounded-xl transition cursor-pointer text-center flex items-center justify-center space-x-1 ${
              authMethod === 'google'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Google</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* METHOD 1: EMAIL & PASSWORD (WITH FORM VALIDATION) */}
        {/* ============================================================ */}
        {authMethod === 'email' && (
          <div>
            {mode === 'signin' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Registered Email Address *</label>
                    {isEmailValid !== null && (
                      <span className={`text-[10px] font-bold ${isEmailValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isEmailValid ? '✓ Valid format' : 'Invalid email'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={e => setSignInEmail(e.target.value)}
                      placeholder="e.g. aspirant@gmail.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border focus:outline-none text-white text-xs ${
                        isEmailValid === false
                          ? 'border-rose-500/60 focus:border-rose-500'
                          : isEmailValid === true
                          ? 'border-emerald-500/60 focus:border-emerald-500'
                          : 'border-slate-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Password *</label>
                    <button
                      type="button"
                      onClick={() => setSuccessMsg('Password reset hint: If you forgot your password, you can register or sign in with SMS/WhatsApp.')}
                      className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={e => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer mt-3 shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Candidate Dashboard</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Full Candidate Name *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Rameshwar Dewangan"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Mobile / WhatsApp No.</label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={signUpPhone}
                        onChange={e => setSignUpPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="98270XXXXX"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Email with validation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Email Address *</label>
                    {isEmailValid !== null && (
                      <span className={`text-[10px] font-bold ${isEmailValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isEmailValid ? '✓ Valid format' : 'Invalid email format'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={e => setSignUpEmail(e.target.value)}
                      placeholder="aspirant@gmail.com"
                      className={`w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border focus:outline-none text-white text-xs ${
                        isEmailValid === false
                          ? 'border-rose-500/60 focus:border-rose-500'
                          : isEmailValid === true
                          ? 'border-emerald-500/60 focus:border-emerald-500'
                          : 'border-slate-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Password with Strength Meter & Requirement Checks */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Create Password *</label>
                    {signUpPassword && (
                      <span className={`text-[10px] font-bold ${passwordValidation.strengthColor.split(' ')[1]}`}>
                        Strength: {passwordValidation.strengthLabel}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signUpPassword}
                      onChange={e => setSignUpPassword(e.target.value)}
                      placeholder="Min 6 characters (8+ recommended)"
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Visual 4-Segment Strength Bar */}
                  {signUpPassword && (
                    <div className="space-y-1.5 pt-1.5">
                      <div className="grid grid-cols-4 gap-1">
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${passwordValidation.score >= 1 ? 'bg-rose-500' : 'bg-slate-800'}`} />
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${passwordValidation.score >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${passwordValidation.score >= 3 ? 'bg-blue-500' : 'bg-slate-800'}`} />
                        <div className={`h-1.5 rounded-full transition-all duration-300 ${passwordValidation.score >= 4 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                      </div>

                      {/* Password Criteria Chips */}
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${passwordValidation.hasMinLength ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-slate-950 text-slate-400'}`}>
                          {passwordValidation.hasMinLength ? <Check className="w-2.5 h-2.5" /> : <span>•</span>}
                          <span>8+ chars</span>
                        </span>
                        <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${passwordValidation.hasNumber ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-slate-950 text-slate-400'}`}>
                          {passwordValidation.hasNumber ? <Check className="w-2.5 h-2.5" /> : <span>•</span>}
                          <span>Numbers</span>
                        </span>
                        <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${(passwordValidation.hasUpper && passwordValidation.hasLower) ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-slate-950 text-slate-400'}`}>
                          {(passwordValidation.hasUpper && passwordValidation.hasLower) ? <Check className="w-2.5 h-2.5" /> : <span>•</span>}
                          <span>A-z Mixed</span>
                        </span>
                        <span className={`px-1.5 py-0.5 rounded flex items-center space-x-1 ${passwordValidation.hasSpecial ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60' : 'bg-slate-950 text-slate-400'}`}>
                          {passwordValidation.hasSpecial ? <Check className="w-2.5 h-2.5" /> : <span>•</span>}
                          <span>Special (!@#)</span>
                        </span>
                      </div>
                    </div>
                  )}
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
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer mt-2 shadow-lg shadow-emerald-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Create Account & Start Free Mocks</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* METHOD 2: WHATSAPP AUTH (DIRECT HANDSHAKE & WHATSAPP OTP) */}
        {/* ============================================================ */}
        {authMethod === 'whatsapp' && (
          <div className="space-y-3.5 py-1">
            <div className="flex items-center space-x-2 p-1 bg-slate-950/80 rounded-xl border border-emerald-900/40 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => { setWaMode('direct_chat'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  waMode === 'direct_chat' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
                }`}
              >
                1-Click WhatsApp Chat
              </button>
              <button
                type="button"
                onClick={() => { setWaMode('otp'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer text-center ${
                  waMode === 'otp' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
                }`}
              >
                WhatsApp OTP Code
              </button>
            </div>

            {waMode === 'direct_chat' ? (
              <div className="space-y-3 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <MessageSquare className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-white">Instant WhatsApp Handshake Login</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Verify via your official WhatsApp without remembering any password.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">Handshake Token:</span>
                  <span className="font-black text-emerald-400">{waHandshakeCode}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={`https://wa.me/919827011223?text=VERIFY_CGSSB_ASPIRANT_${waHandshakeCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-600/20"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLoading(true);
                      setLoadingStepText('Validating WhatsApp handshake key & opening portal...');
                      setTimeout(() => {
                        const simulatedNumber = waPhone || '9827011223';
                        loginWithWhatsApp(simulatedNumber, waHandshakeCode, fullName || 'WhatsApp Aspirant');
                        setIsLoading(false);
                        setSuccessMsg('WhatsApp handshake verified! Welcome to portal.');
                        setTimeout(() => onClose(), 600);
                      }, 500);
                    }}
                    disabled={isLoading}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>⚡ Verify & Log In</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!isWaOtpSent ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const clean = waPhone.replace(/\D/g, '');
                      if (clean.length < 10) {
                        setErrorMsg('Please enter a valid 10-digit WhatsApp number.');
                        return;
                      }
                      setErrorMsg('');
                      setIsLoading(true);
                      setLoadingStepText('Dispatching WhatsApp Cloud message template...');
                      const code = Math.floor(1000 + Math.random() * 9000).toString();
                      setWaGeneratedOtp(code);
                      setTimeout(() => {
                        setIsLoading(false);
                        setIsWaOtpSent(true);
                        setSuccessMsg(`WhatsApp Message dispatched! OTP: ${code}`);
                      }, 500);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        WhatsApp Number (10 Digits)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                          +91
                        </span>
                        <input
                          type="tel"
                          maxLength={10}
                          required
                          value={waPhone}
                          onChange={e => setWaPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="98270XXXXX"
                          className="w-full pl-13 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-sm font-mono font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send WhatsApp OTP Code</span>
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!waOtpCode || waOtpCode.length < 4) {
                        setErrorMsg('Please enter the 4-digit OTP code.');
                        return;
                      }
                      setIsLoading(true);
                      setLoadingStepText('Verifying WhatsApp token...');
                      setTimeout(() => {
                        loginWithWhatsApp(waPhone, waOtpCode, fullName || `WhatsApp Candidate (${waPhone.slice(-4)})`);
                        setIsLoading(false);
                        setSuccessMsg('WhatsApp verified! Loading tests...');
                        setTimeout(() => onClose(), 600);
                      }, 400);
                    }}
                    className="space-y-3"
                  >
                    <div className="p-3 rounded-2xl bg-[#0b2b26] border border-emerald-700/50 text-emerald-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-bold text-emerald-300">
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                          <span>💬 WhatsApp Cloud Message</span>
                        </div>
                        <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-400 font-mono">
                          +91 {waPhone}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          Your Login Code: <span className="font-mono text-base font-black text-emerald-300 tracking-wider">{waGeneratedOtp}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setWaOtpCode(waGeneratedOtp)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition cursor-pointer"
                        >
                          ⚡ Auto-Fill
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-300">Enter WhatsApp OTP</label>
                        <button
                          type="button"
                          onClick={() => { setIsWaOtpSent(false); setWaOtpCode(''); }}
                          className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Change Number
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={waOtpCode}
                        onChange={e => setWaOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 7392"
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-center tracking-widest font-mono text-xl font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify WhatsApp & Enter</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* METHOD 3: PHONE NUMBER OTP */}
        {/* ============================================================ */}
        {authMethod === 'phone_otp' && (
          <div className="space-y-4 py-1">
            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98270XXXXX"
                      className="w-full pl-13 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-sm font-mono font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    An instant verification OTP code will be sent to this number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Verification OTP</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-700/60 text-indigo-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 font-bold text-indigo-300">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span>SMS / WhatsApp OTP Alert</span>
                    </div>
                    <span className="text-[10px] bg-indigo-900 px-2 py-0.5 rounded text-indigo-300 font-mono">
                      +91 {phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      Your OTP is: <span className="font-mono text-base font-black text-emerald-400 tracking-wider">{generatedOtp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFillOtp}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] transition cursor-pointer shadow-sm"
                    >
                      ⚡ Auto-Fill Code
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">Enter 4-Digit OTP Code</label>
                    <button
                      type="button"
                      onClick={() => { setIsOtpSent(false); setOtpCode(''); }}
                      className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Change Number
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4826"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-white text-center tracking-widest font-mono text-xl font-bold"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Didn't receive OTP?</span>
                  {resendTimer > 0 ? (
                    <span className="text-slate-500 font-mono">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Login to Portal</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* METHOD 4: GOOGLE 1-TAP LOGIN */}
        {/* ============================================================ */}
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
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* FOOTER SWITCHER (Sign In <-> Sign Up) */}
        {/* ============================================================ */}
        <div className="border-t border-slate-800 pt-3 text-center text-xs text-slate-400">
          {mode === 'signup' ? (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setAuthMethod('email'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer ml-1 inline-flex items-center space-x-1"
              >
                <span>Sign In to Your Account</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </p>
          ) : (
            <p>
              New candidate?{' '}
              <button
                type="button"
                onClick={() => { setMode('signup'); setAuthMethod('email'); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-emerald-400 font-bold hover:underline cursor-pointer ml-1 inline-flex items-center space-x-1"
              >
                <span>Create Free Student Account</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
