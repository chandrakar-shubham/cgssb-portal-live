import React, { useState, useRef, useEffect } from 'react';
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
  Layers
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuthModal: () => void;
  onOpenProfile?: () => void;
  mistakesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenProfile,
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
                  <span className="hidden xl:inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
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
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Quick Test Pass Pill (only on large+ screens when no pro pass) */}
            {!user?.hasProPass && (
              <button
                onClick={() => setActiveTab('pass')}
                className="hidden xl:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-500/25 text-xs font-bold transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>₹99 Pass</span>
              </button>
            )}

            {/* Credits Display */}
            {user && (
              <div className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.2 rounded-lg bg-emerald-950/50 border border-emerald-700/40 text-emerald-300 text-xs font-bold">
                <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>{user.credits} <span className="hidden sm:inline font-normal text-slate-400">Pts</span></span>
              </div>
            )}

            {/* User Session Action with Profile Click */}
            {user ? (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  title="View & Edit Profile Target Exam, District, Goals"
                  className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 text-xs text-slate-200 transition cursor-pointer group"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="font-bold max-w-[70px] sm:max-w-[95px] truncate group-hover:text-emerald-300">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
                <button
                  onClick={logout}
                  title="Logout student session"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
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
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Primary Section */}
            <div className="space-y-1">
              <div className="px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Exam Sections
              </div>
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
                        ? item.id === 'pass'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : item.id === 'cgpsc'
                          ? 'bg-rose-600 text-white'
                          : 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.badge != null && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.isProBadge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Secondary Tools Section */}
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <div className="px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Tools & Revision
              </div>
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
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'text-slate-300 hover:bg-slate-800'
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
        )}
      </div>
    </header>
  );
};
