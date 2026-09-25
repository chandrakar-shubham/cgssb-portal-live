import React, { useState } from 'react';
import { TestAttempt } from '../types';
import {
  Share2,
  X,
  Copy,
  Check,
  Award,
  Trophy,
  Sparkles,
  Crown,
  Target,
  TrendingUp,
  Download,
  ExternalLink,
  MessageCircle,
  Send,
  Linkedin,
  Facebook,
  Twitter
} from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  attempt: TestAttempt;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  attempt,
}) => {
  const [copied, setCopied] = useState(false);
  const [customNote, setCustomNote] = useState('Targeting Top 50 in CGPSC & Vyapam 2026!');

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cgssbtest.com';
  const testTitle = attempt.testTitle || 'CGSSB Mock Test';
  const candidateName = attempt.userName || 'Candidate';
  const score = attempt.score;
  const maxScore = attempt.maxScore;
  const rank = attempt.simulatedRank || 15;
  const percentile = attempt.percentile || 98.4;
  const accuracy = attempt.accuracy || 88.5;

  const shareTitle = `🎯 ${candidateName}'s CGSSB Test Scorecard: ${score}/${maxScore} Marks!`;
  const shareText = `🏆 I scored ${score}/${maxScore} Marks (${accuracy}% Accuracy) in "${testTitle}" on CGSSB Test!\n📊 Simulated Rank: #${rank} | ${percentile}%ile\n💬 "${customNote}"\n\nPracticing for CGPSC & Vyapam 2026 exams on TCS iON CBT engine:`;
  const shareUrl = `${appUrl}/test-series`;

  const fullShareMessage = `${shareText}\n${shareUrl}`;

  const encodedText = encodeURIComponent(fullShareMessage);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  // Social Links
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const handleCopyLinkText = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullShareMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullShareMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLinkText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans text-slate-100">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Share Performance Card
              </h3>
              <p className="text-xs text-slate-400">
                Inspire fellow aspirants on WhatsApp, Telegram & Socials
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Performance Card Preview */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 shadow-inner space-y-4">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Top Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
                CG
              </div>
              <span className="font-black text-sm text-white tracking-tight">
                CGSSB <span className="text-emerald-400">Test</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center space-x-1">
              <Crown className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>Official Scorecard</span>
            </span>
          </div>

          {/* Test Name & Candidate Name */}
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {attempt.category || 'CGPSC / Vyapam'}
            </span>
            <h4 className="text-base font-black text-white mt-0.5 leading-snug">
              {testTitle}
            </h4>
            <span className="text-xs text-slate-300 font-medium block mt-1">
              Candidate: <strong className="text-emerald-300">{candidateName}</strong>
            </span>
          </div>

          {/* Key Metric Badges */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[9px] text-slate-400 block font-medium">Total Score</span>
              <span className="text-base font-black text-emerald-400 block mt-0.5">
                {score}<span className="text-[10px] text-slate-500 font-normal">/{maxScore}</span>
              </span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[9px] text-slate-400 block font-medium">State Rank</span>
              <span className="text-base font-black text-amber-300 block mt-0.5 flex items-center justify-center space-x-0.5">
                <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
                <span>#{rank}</span>
              </span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-center">
              <span className="text-[9px] text-slate-400 block font-medium">Accuracy</span>
              <span className="text-base font-black text-teal-300 block mt-0.5 flex items-center justify-center space-x-0.5">
                <TrendingUp className="w-3 h-3 text-teal-400 shrink-0" />
                <span>{accuracy}%</span>
              </span>
            </div>
          </div>

          {/* Custom Status Quote Input */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              Add Personal Note / Goal Caption:
            </label>
            <input
              type="text"
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              placeholder="e.g. Daily revision paying off! Target rank top 50."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-300 block">
            Direct Share to Platforms:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            {/* Telegram */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Telegram</span>
            </a>

            {/* X / Twitter */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Twitter className="w-4 h-4 text-sky-400" />
              <span>X / Twitter</span>
            </a>

            {/* LinkedIn */}
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Linkedin className="w-4 h-4 text-blue-400" />
              <span>LinkedIn</span>
            </a>

            {/* Facebook */}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Facebook className="w-4 h-4 text-indigo-400" />
              <span>Facebook</span>
            </a>

            {/* Native Mobile Web Share API */}
            <button
              type="button"
              onClick={handleNativeShare}
              className="p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>More Options</span>
            </button>
          </div>
        </div>

        {/* Copy Text / Link Action Row */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLinkText}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Scorecard Text Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Shareable Scorecard Text & Link</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
