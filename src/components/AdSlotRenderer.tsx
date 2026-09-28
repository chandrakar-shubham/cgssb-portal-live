import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MonetizationAdSettings, ThemeTokens } from '../types/cms';
import { ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

interface AdSlotRendererProps {
  slotType: 'topLeaderboard' | 'inContent' | 'sidebar' | 'postFooter';
  adSettings?: MonetizationAdSettings;
  theme?: ThemeTokens;
  customLabel?: string;
  className?: string;
}

export const AdSlotRenderer: React.FC<AdSlotRendererProps> = ({
  slotType,
  adSettings,
  theme,
  customLabel = 'Sponsored / विज्ञापन',
  className = '',
}) => {
  const { user } = useAuth();

  // 1. If ads are disabled globally
  if (!adSettings?.enableAds) return null;

  // 2. If user is a Pro Pass holder and pro-ad bypass is enabled
  if (adSettings.disableAdsForProUsers && user?.hasProPass) return null;

  // 3. If this specific slot is disabled
  const slotConfig = adSettings.slots?.[slotType];
  if (slotConfig && !slotConfig.enabled) return null;

  // 4. Check if theme sets ad density to 'none'
  if (theme && theme.adDensity === 'none') return null;

  // Style variations based on slot type
  const isLeaderboard = slotType === 'topLeaderboard';
  const isSidebar = slotType === 'sidebar';
  const isPostFooter = slotType === 'postFooter';

  return (
    <div
      className={`relative my-6 transition-all duration-300 ${
        isSidebar ? 'w-full max-w-[320px] mx-auto' : 'w-full'
      } ${className}`}
    >
      {/* Label */}
      <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <span className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <span>{customLabel}</span>
        </span>
        <span className="text-slate-600 font-mono text-[9px]">Google AdSense / Official</span>
      </div>

      {/* Ad Container Box (Prevents Layout Shifts - Zero CLS) */}
      <div
        className={`relative overflow-hidden rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center p-4 text-center transition hover:border-slate-700 ${
          isLeaderboard
            ? 'min-h-[90px] sm:min-h-[110px]'
            : isSidebar
            ? 'min-h-[250px]'
            : isPostFooter
            ? 'min-h-[120px]'
            : 'min-h-[100px]'
        }`}
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none" />

        {/* Ad Mockup Content / AdSense Placeholder */}
        <div className="relative z-10 max-w-lg space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black border border-indigo-500/20">
            <Sparkles className="w-3 h-3" />
            <span>CGSSB Official Mock Test Pass</span>
          </div>

          <p className="text-xs sm:text-sm font-black text-white">
            Unlock 1,200+ Solved Questions & All 2026 CGPSC / Vyapam CBT Test Series
          </p>

          <p className="text-[11px] text-slate-400 leading-snug">
            Real TCS iON simulator, negative marking calculation & state-wide topper rank analysis.
          </p>

          <div className="pt-1">
            <a
              href="/pass"
              onClick={e => {
                // Smooth in-app navigation if desired
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              <span>Explore Unlimited Test Pass (₹499/Year)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Pro Badge Indicator */}
        <div className="absolute bottom-2 right-2 text-[9px] text-slate-600 flex items-center space-x-1">
          <ShieldCheck className="w-3 h-3 text-slate-500" />
          <span>Pro Pass users enjoy 100% ad-free experience</span>
        </div>
      </div>
    </div>
  );
};
