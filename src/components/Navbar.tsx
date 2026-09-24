import React, { useState } from 'react';
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

  const studentNav = [
    { id: 'tests', label: 'All Mocks', icon: BookOpen },
    { id: 'cgpsc', label: 'CGPSC Hub', icon: Award, highlightColor: 'text-rose-400' },
    { id: 'cgssb', label: 'CGSSB Hub', icon: Sparkles, highlightColor: 'text-teal-400' },
    { id: 'pyp', label: 'PYP Bank', icon: FileText },
    { id: 'mistakes', label: 'Mistakes', icon: AlertTriangle, badge: mistakesCount > 0 ? mistakesCount : undefined, highlightColor: 'text-rose-400' },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, highlightColor: 'text-amber-400' },
    { id: 'chhattisgarh-deck', label: 'CG Flashcards', icon: Sparkles, highlightColor: 'text-teal-300' },
    { id: 'pass', label: 'Pass Pro', icon: Crown, isProBadge: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Brand Identity - Candidate / Student Portal */}
          <div
            className="flex items-center space-x-2.5 cursor-pointer shrink-0 select-none py-1 group"
            onClick={() => {
              setActiveTab('tests');
              setIsMobileMenuOpen(false);
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-base tracking-wider group-hover:scale-105 transition-transform">
              CG
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                  CGSSB <span className="text-emerald-400">Test</span>
                </span>
                {user?.hasProPass && (
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded-md text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Crown className="w-2.5 h-2.5 mr-0.5 fill-amber-400" />
                    PASS PRO
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium hidden sm:block leading-none mt-0.5">
                CGPSC & Vyapam Test Series
              </span>
            </div>
          </div>

          {/* Student Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
            {studentNav.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? item.id === 'pass'
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                        : item.id === 'cgpsc'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
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
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                      {item.badge}
                    </span>
                  )}
                  {item.isProBadge && !isActive && (
                    <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      PRO
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls for Students */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* Quick Test Pass Button */}
            {!user?.hasProPass && (
              <button
                onClick={() => setActiveTab('pass')}
                className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-400 text-xs font-bold transition cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Get Pass ₹99</span>
              </button>
            )}

            {/* Credits Display */}
            {user && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-700/40 text-emerald-300 text-xs font-bold">
                <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                <span>{user.credits} <span className="hidden xl:inline font-normal text-slate-400">Pts</span></span>
              </div>
            )}

            {/* User Session Action with Profile Click */}
            {user ? (
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  title="View & Edit Profile Target Exam, District, Goals"
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/50 text-xs text-slate-200 transition cursor-pointer group"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="font-bold max-w-[90px] truncate group-hover:text-emerald-300">{user.name}</span>
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
                className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition flex items-center space-x-1 shadow-sm cursor-pointer"
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
          <div className="lg:hidden border-t border-slate-800 py-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {studentNav.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between ${
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
        )}
      </div>
    </header>
  );
};
