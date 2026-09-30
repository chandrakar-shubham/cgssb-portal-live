import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Crown, 
  Send, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getReferralRecords } from '../utils/referralStore';
import { calculateDaysRemaining } from '../utils/devicePassManager';

interface StudentReferralProps {
  onOpenAuthModal?: () => void;
  className?: string;
}

export const StudentReferral: React.FC<StudentReferralProps> = ({ 
  onOpenAuthModal,
  className = ''
}) => {
  const { user, userReferralCode, applyReferralCode } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [referralHistory, setReferralHistory] = useState<any[]>([]);
  const [claimStatus, setClaimStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setReferralHistory([]);
      return;
    }
    getReferralRecords()
      .then(records => {
        if (!cancelled) setReferralHistory(records);
      })
      .catch(() => {
        if (!cancelled) setReferralHistory([]);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Compute Referral Link
  const inviteUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cgtest.in';
    const code = userReferralCode || 'CGTEST';
    return `${origin}/?ref=${code}`;
  }, [userReferralCode]);

  // Copy referral code to clipboard
  const handleCopyCode = async () => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    try {
      await navigator.clipboard.writeText(userReferralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Copy full invite URL to clipboard
  const handleCopyLink = async () => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  // Share to WhatsApp with compelling bilingual message
  const handleWhatsAppShare = () => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    const message = `🎯 *cgtest.in - CGPSC & CG Vyapam Mock Test Portal*\n\n` +
      `नमस्ते! मैंने छत्तीसगढ़ राज्य प्रतियोगी परीक्षाओं (CG Teacher, CGPSC Prelims, CG Vyapam) के लिए *cgtest.in* पर CBT मॉक टेस्ट शुरू किया है।\n\n` +
      `🎁 *विशेष ऑफर:* मेरे referral link से sign-up करने पर आपको मिलेगा *2 महीने (60 दिन)* का All-Access Pro Pass बिल्कुल मुफ्त!\n\n` +
      `🔑 *मेरा Referral Code:* ${userReferralCode}\n` +
      `🔗 *अभी फ्री पास एक्टिव करें:* ${inviteUrl}\n\n` +
      `_आइए साथ में तैयारी करें और अपना चयन सुनिश्चित करें!_`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Share to Telegram
  const handleTelegramShare = () => {
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }
    const text = `🎯 cgtest.in - CGPSC, CG Teacher & CG Vyapam CBT Mock Test Portal\n\nSign up with my code ${userReferralCode} to get 2 Months of All-Access Pro Pass Free!`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  // Claim friend's referral code
  const handleClaimCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    if (!inputCode.trim()) return;

    setClaimStatus({ loading: true });
    applyReferralCode(inputCode.trim())
      .then(result => {
        setClaimStatus({
          loading: false,
          success: result.success,
          message: result.message,
        });
        if (result.success) {
          setInputCode('');
          return getReferralRecords();
        }
        return null;
      })
      .then(records => {
        if (records) setReferralHistory(records);
      })
      .catch(error => {
        setClaimStatus({
          loading: false,
          success: false,
          message: error?.message || 'Could not process the referral code.',
        });
      });
  };

  // Filter referral history for this user
  const userReferralHistory = useMemo(() => {
    if (!user) return [];
    return referralHistory.filter(r => r.referrerId === user.id || r.referrerCode === userReferralCode || r.refereeId === user.id);
  }, [user, userReferralCode]);

  const daysLeft = user?.passExpiresAt ? calculateDaysRemaining(user.passExpiresAt) : 0;
  const totalInvitedCount = user?.referralCount || 0;
  const bonusMonthsEarned = user?.referralBonusMonths || 0;

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/20 rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden text-slate-100 ${className}`}>
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header Badge & Title */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wide uppercase mb-2">
            <Gift className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span>Student Referral Program • 100% Free Pro Pass</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
            <span>Invite Friends, Study Together</span>
            <span className="text-emerald-400">• Both Get 1 Month FREE!</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Invite fellow aspirants preparing for CG Teacher 2026, CGPSC SSE, or CG Vyapam. 
            When they sign up with your code, <strong className="text-emerald-300 font-semibold">both of you receive +30 Days (+1 Month)</strong> of 
            unlimited Pro Pass access instantly!
          </p>
        </div>

        {/* Live Reward Value Pill */}
        <div className="shrink-0 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4 text-center sm:text-right min-w-[180px]">
          <span className="text-[11px] text-slate-400 font-semibold block">Bonus Pass Earned</span>
          <div className="text-lg sm:text-xl font-black text-amber-300 flex items-center justify-center sm:justify-end space-x-1 mt-0.5">
            <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>+{bonusMonthsEarned} {bonusMonthsEarned === 1 ? 'Month' : 'Months'} Free</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">
            {totalInvitedCount} Friends Joined
          </span>
        </div>
      </div>

      {/* Main Grid: Code & Share Actions (Left) + Stats & Claim (Right) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mt-6">
        
        {/* Left Col: Referral Box & Share Buttons (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Personal Referral Code Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Unique Referral Code</span>
              </span>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Unlimited Invites Allowed
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-2">
              <div className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 font-mono font-black text-lg sm:text-xl text-emerald-400 tracking-wider flex items-center justify-between shadow-inner">
                <span className="select-all">{user ? userReferralCode : 'SIGN-UP-FIRST'}</span>
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-800">
                  CODE
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-850 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-slate-700 shrink-0 cursor-pointer shadow-sm"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Invite Link Row */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-slate-400 truncate text-[11px]">
                <span className="font-semibold text-slate-300">Invite Link: </span>
                <span className="font-mono text-slate-400 select-all">{inviteUrl}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* 1-Click Share Triggers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Share on WhatsApp (+1 Mo)</span>
            </button>

            <button
              type="button"
              onClick={handleTelegramShare}
              className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-sky-600/25 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Share on Telegram</span>
            </button>
          </div>

          {/* 3 Step Visual Explainer */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center space-x-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>How the Referral Reward Works</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] flex items-center justify-center mb-1.5">
                  1
                </span>
                <span className="font-bold text-white block mb-0.5">Share Your Link</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Send your referral code or WhatsApp link to your study group or fellow candidates.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[10px] flex items-center justify-center mb-1.5">
                  2
                </span>
                <span className="font-bold text-white block mb-0.5">Friend Registers</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Friend creates an account and automatically receives <strong className="text-emerald-300">2 Months Free</strong> Pro Pass.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-black text-[10px] flex items-center justify-center mb-1.5">
                  3
                </span>
                <span className="font-bold text-white block mb-0.5">You Get +1 Month</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Your Pro Pass is automatically extended by 30 days per friend. No limits on invites!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Claim Friend's Code & Live Referral Stats (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Friends Joined
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {totalInvitedCount}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium mt-0.5 block">
                {totalInvitedCount > 0 ? 'Active Study Network' : 'No friends yet'}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Your Pass Status
              </span>
              <span className="text-2xl font-black text-amber-300 mt-1 block">
                {daysLeft > 0 ? `${daysLeft}d` : 'Active'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block truncate">
                {user?.passExpiresAt ? `Until ${user.passExpiresAt.split('T')[0]}` : 'Free Welcome'}
              </span>
            </div>
          </div>

          {/* Have a Friend's Referral Code? Claim Section */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center space-x-2 mb-2">
              <Gift className="w-4 h-4 text-emerald-400" />
              <h3 className="font-black text-sm text-white">Have a Friend's Referral Code?</h3>
            </div>
            
            {user?.referredBy ? (
              <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold block">Referral Bonus Claimed!</span>
                  <span className="text-[11px] text-emerald-400/80">
                    You received +30 Days Free Pro Pass with code <strong>{user.referredBy}</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-3">
                  Did an aspirant invite you? Enter their referral code to instantly claim <strong className="text-emerald-300 font-semibold">+1 Extra Month Free Pro Pass</strong>!
                </p>

                <form onSubmit={handleClaimCode} className="space-y-2.5">
                  <div className="relative">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={e => setInputCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CG-POOJ-1122"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:outline-none text-white text-xs font-mono font-bold tracking-wider"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={claimStatus.loading || !inputCode.trim()}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:from-emerald-600 text-slate-950 font-black text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{claimStatus.loading ? 'Verifying...' : 'Claim +1 Month Free Pass'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {claimStatus.message && (
                  <div className={`mt-2.5 p-2.5 rounded-xl text-xs flex items-center space-x-2 border ${
                    claimStatus.success 
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80' 
                      : 'bg-rose-950/50 text-rose-300 border-rose-800/80'
                  }`}>
                    {claimStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <span>{claimStatus.message}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Referral Activity Feed */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Referral Activity Feed</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {userReferralHistory.length} Record(s)
              </span>
            </div>

            {userReferralHistory.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-slate-800 rounded-xl">
                <Users className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                <p className="text-xs text-slate-400 font-medium">No referral rewards claimed yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Share your code above to start earning free Pro Pass months!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {userReferralHistory.map(rec => (
                  <div 
                    key={rec.id} 
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        {rec.referrerId === user?.id ? rec.refereeName : rec.referrerName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {rec.referrerId === user?.id ? 'Joined using your code' : 'Referred you'} • {rec.createdAt}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      +1 Mo Added
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
