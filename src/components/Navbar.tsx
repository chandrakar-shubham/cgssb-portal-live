import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  FileText,
  BarChart3,
  Zap,
  LogOut,
  LogIn,
  Menu,
  X,
  User as UserIcon,
  Crown,
  Award,
  Sparkles,
  AlertTriangle,
  Bookmark,
  ChevronDown,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Trophy
} from 'lucide-react';
import { calculateDaysRemaining, isUserPassActive } from '../utils/devicePassManager';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuthModal: () => void;
  onOpenProfile?: () => void;
  onNavigateToAdmin?: () => void;
  mistakesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenProfile,
  onNavigateToAdmin,
  mistakesCount = 0,
}) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const primaryNav = [
    { id: 'tests', label: 'All Mocks', icon: BookOpen },
    { id: 'cgpsc', label: 'CGPSC Hub', icon: Award, highlightColor: 'text-rose-400' },
    { id: 'cgssb', label: 'CGSSB Hub', icon: Sparkles, highlightColor: 'text-teal-400' },
    { id: 'pyp', label: 'PYP Bank', icon: FileText },
    { id: 'mistakes', label: 'Mistakes', icon: AlertTriangle, badge: mistakesCount > 0 ? mistakesCount : undefined, highlightColor: 'text-rose-400' },
    { id: 'pass', label: 'Pass Pro', icon: Crown, isProBadge: true, highlightColor: 'text-amber-400' },
  ];

  const secondaryNav = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, highlightColor: 'text-amber-400', desc: 'State-wide live merit ranks' },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, highlightColor: 'text-amber-400', desc: 'Starred questions & notes' },
    { id: 'chhattisgarh-deck', label: 'CG Flashcards', icon: Sparkles, highlightColor: 'text-teal-300', desc: 'Bhasha & CG GK cards' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, highlightColor: 'text-indigo-400', desc: 'Rank & strength insights' },
  ];

  const isSecondaryActive = secondaryNav.some(item => item.id === activeTab);
  const activeSecondaryItem = secondaryNav.find(item => item.id === activeTab);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md font-sans">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-15 sm:h-16 gap-2">
          
          {/* Brand Identity - Candidate / Student Portal */}
          <div
            className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer shrink-0 select-none py-1 group"
            onClick={() => {
              setActiveTab('tests');
              setIsMobileMenuOpen(false);
            }}
          >
            <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-sm sm:text-base tracking-wider group-hover:scale-105 transition-transform">
              CG
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white">
                  CGSSB <span className="text-emerald-400">Test</span>
                </span>
                {user?.hasProPass && (
                  <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Crown className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                    PRO
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block leading-none mt-0.5">
                CGPSC & Vyapam Portal
              </span>
            </div>
          </div>

          {/* Student Desktop Navigation Links - Responsive & Overflow-Safe */}
          <div className="hidden lg:flex items-center min-w-0 justify-center px-1">
            <nav className="flex items-center space-x-0.5 xl:space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/90 shadow-inner">
              {primaryNav.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? item.id === 'pass'
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                          : item.id === 'cgpsc'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                          : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive
                          ? 'text-current'
                          : item.isProBadge
                          ? 'text-amber-400'
                          : item.highlightColor || 'text-emerald-400'
                      }`}
                    />
                    <span>{item.label}</span>
                    {item.badge != null && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white ml-0.5">
                        {item.badge}
                      </span>
                    )}
                    {item.isProBadge && !isActive && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}

              {/* 2XL Direct Links vs LG/XL 'More' Dropdown */}
              <div className="hidden 2xl:flex items-center space-x-1 pl-0.5 border-l border-slate-800/80">
                {secondaryNav.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-current' : item.highlightColor}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* More Dropdown for LG & XL Screens */}
            <div className="relative 2xl:hidden" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 whitespace-nowrap shrink-0 cursor-pointer ${
                  isSecondaryActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSecondaryActive && activeSecondaryItem ? activeSecondaryItem.label : 'More'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1">
                    Tools & Study Aids
                  </div>
                  {secondaryNav.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMoreMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-lg text-left transition flex items-center space-x-2.5 cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : item.highlightColor}`} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate">{item.label}</span>
                          <span className={`text-[10px] truncate ${isActive ? 'text-slate-900/80' : 'text-slate-400'}`}>
                            {item.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Action Controls for Students */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">

          {/* Unified Pass Status Pill (Replaces Credits System) */}
          {user && (
            isUserPassActive(user) ? (
              <button
                type="button"
                onClick={() => setActiveTab('pass')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-extrabold transition shadow-sm cursor-pointer whitespace-nowrap"
                title={`All-Access Pass Active (${calculateDaysRemaining(user.passExpiresAt)} Days Left)`}
              >
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>
                  {calculateDaysRemaining(user.passExpiresAt) > 0
                    ? `${calculateDaysRemaining(user.passExpiresAt)}d Left`
                    : 'Pass Active'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('pass')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 text-xs font-black transition shadow-md shadow-amber-950/30 cursor-pointer whitespace-nowrap"
                title="Unlock All Exams with Monthly or Yearly Pass"
              >
                <Crown className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
                <span>Get Pass (₹199)</span>
              </button>
            )
          )}

          {/* User Session Action with Profile Click */}
          {user ? (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                title="Open Candidate Sidebar & Profile"
                className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 text-xs text-slate-200 transition cursor-pointer group shrink-0"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-5.5 h-5.5 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/50" />
                ) : (
                  <div className="w-5.5 h-5.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="font-bold hidden sm:inline max-w-[85px] truncate group-hover:text-emerald-300">
                  {user.name.split(' ')[0]}
                </span>
              </button>
              <button
                onClick={logout}
                title="Logout student session"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer shrink-0 hidden sm:block"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition flex items-center space-x-1 shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden transition border border-slate-700/60"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  </header>

    {/* Slide-Over Mobile & Desktop Candidate Sidebar Drawer */}
    {isMobileMenuOpen && (
      <div className="fixed inset-0 z-50 overflow-hidden font-sans">
        {/* Dark Translucent Backdrop */}
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        />

        <div className="fixed inset-y-0 left-0 max-w-full flex">
          <div className="w-80 sm:w-96 max-w-[88vw] bg-slate-900 border-r border-slate-800/90 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-50 animate-in slide-in-from-left duration-250 selection:bg-emerald-500 selection:text-slate-950">
            
            <div className="space-y-5">
              {/* Sidebar Header Row with Brand & Close Button */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-slate-950 text-sm shadow-md">
                    CG
                  </div>
                  <span className="font-black text-base text-white">
                    CGSSB <span className="text-emerald-400">Portal</span>
                  </span>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* CANDIDATE PROFILE CARD AT TOP OF SIDEBAR */}
              {user ? (
                <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>

                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="relative shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-500/50" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/30 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-lg shadow-md">
                          {user.name ? user.name[0].toUpperCase() : 'A'}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm text-white truncate">
                        {user.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email || 'Aspirant Candidate'}
                      </p>
                      <div className="mt-1 flex items-center space-x-1">
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md truncate">
                          Target: {user.targetExam || 'CG Teacher 2026'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pass Status Banner in Sidebar */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-bold">
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className={isUserPassActive(user) ? 'text-amber-300' : 'text-slate-400'}>
                        {isUserPassActive(user) ? `${calculateDaysRemaining(user.passExpiresAt)}d Pass Active` : 'Free Access Tier'}
                      </span>
                    </div>

                    {onOpenProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="text-[11px] font-extrabold text-emerald-400 hover:text-emerald-300 underline decoration-dotted cursor-pointer"
                      >
                        Edit Profile & Goals
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Guest Candidate</h4>
                  <p className="text-[11px] text-slate-400">Sign in to save test history and rank analytics.</p>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAuthModal();
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-md"
                  >
                    Sign In to Account
                  </button>
                </div>
              )}

              {/* NAVIGABLE SECTIONS IN SIDEBAR */}
              <div className="space-y-4">
                {/* Section 1: Main Portals */}
                <div className="space-y-1">
                  <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Official Portals & Mocks
                  </span>
                  {primaryNav.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                            : 'text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : item.highlightColor || 'text-emerald-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge != null && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Section 2: Study Aids & Revision */}
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    Revision & Performance Tools
                  </span>
                  {secondaryNav.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isActive
                            ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                            : 'text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : item.highlightColor}`} />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Bottom Footer */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {user && (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-800/40 font-bold text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout Account</span>
                </button>
              )}

              <div className="text-[10px] text-slate-500 text-center space-y-0.5">
                <p className="font-semibold text-slate-400">TCS iON CBT Exam Engine Standard</p>
                <p>CGSSB & CGPSC Test Portal v{APP_BUILD_INFO.version}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    )}

    {/* Persistent Native Mobile Bottom Navigation Bar (Thumb Zone) */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            activeTab === 'tests'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${activeTab === 'tests' ? 'bg-emerald-500/15' : ''}`}>
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] mt-0.5 tracking-tight">Mocks</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pyp')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            activeTab === 'pyp'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${activeTab === 'pyp' ? 'bg-emerald-500/15' : ''}`}>
            <FileText className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] mt-0.5 tracking-tight">PYPs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mistakes')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[50px] relative ${
            activeTab === 'mistakes'
              ? 'text-rose-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors relative ${activeTab === 'mistakes' ? 'bg-rose-500/15' : ''}`}>
            <AlertTriangle className="w-4.5 h-4.5" />
            {mistakesCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 min-w-[13px] h-[13px] rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center leading-none">
                {mistakesCount}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 tracking-tight">Mistakes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pass')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            activeTab === 'pass'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-amber-300 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${activeTab === 'pass' ? 'bg-amber-500/15' : ''}`}>
            <Crown className={`w-4.5 h-4.5 ${activeTab === 'pass' ? 'fill-amber-400' : ''}`} />
          </div>
          <span className="text-[9px] mt-0.5 tracking-tight">Pass Pro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            activeTab === 'analytics'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-indigo-500/15' : ''}`}>
            <BarChart3 className="w-4.5 h-4.5" />
          </div>
          <span className="text-[9px] mt-0.5 tracking-tight">Analytics</span>
        </button>

        {/* Profile / Menu Drawer Trigger */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-emerald-400 hover:text-emerald-300 font-medium transition-all cursor-pointer min-w-[50px]"
          title="Open Profile & Menu Sidebar"
        >
          <div className="p-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-4.5 h-4.5 rounded-full object-cover" />
            ) : (
              <UserIcon className="w-4.5 h-4.5 text-emerald-400" />
            )}
          </div>
          <span className="text-[9px] mt-0.5 tracking-tight font-bold">Profile</span>
        </button>
      </div>
    </div>
    </>
  );
};
