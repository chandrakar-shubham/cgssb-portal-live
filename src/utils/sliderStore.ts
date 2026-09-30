import { SliderBanner } from '../types';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { subscribeToSliderBanners } from '../firebase/firestoreService';

let sliderCache: SliderBanner[] = [];

// Auto-subscribe to Firestore real-time banner updates across devices
if (typeof window !== 'undefined') {
  try {
    subscribeToSliderBanners((remoteBanners) => {
      if (Array.isArray(remoteBanners)) {
        const sorted = [...remoteBanners].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        sliderCache = sorted;
        window.dispatchEvent(new CustomEvent('cgtest-slider-updated', { detail: sorted }));
      }
    });
  } catch {}
}

export const DEFAULT_SLIDER_BANNERS: SliderBanner[] = [
  {
    id: 'referral-invite-offer',
    category: 'STUDENT REFERRAL PROGRAM',
    categoryIcon: 'Gift',
    categoryColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
    badge: '🎁 INVITE & EARN · +1 MONTH FREE PRO PASS',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Invite & Earn (+1 Mo Free): 1 Month Free Pass for You & Your Friend',
    subtitle: 'Share your personal invite link with fellow aspirants. When a friend signs up, both of you instantly get +30 days of All-Access Pro Pass added to your account for free!',
    highlights: [
      'Instant +30 Days Pro Pass Extension for Referrer & Friend',
      'Stackable Rewards: Invite 5 friends = 5 extra months of free pass',
      'Quick 1-tap WhatsApp, Telegram & Direct Link sharing',
    ],
    primaryActionLabel: 'Invite & Earn (+1 Mo Free)',
    primaryActionType: 'open_referral',
    secondaryActionLabel: 'View Referral Rules',
    secondaryActionType: 'open_referral',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
    borderAccent: 'border-amber-500/40 hover:border-amber-500/60',
    accentGlow: 'bg-amber-500/10',
    isPublished: true,
    displayOrder: 1,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'free-3months-pass-offer',
    category: 'SPECIAL STUDENT LAUNCH OFFER',
    categoryIcon: 'Gift',
    categoryColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
    badge: '🎁 3 MONTHS FREE PASS · 100% UNLOCKED',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Get 3 Months of Free Pro Pass on cgtest.in',
    subtitle: 'Attempt 1 Free Diagnostic Test first, sign up to claim 1 Month Free Pass immediately, and complete 5 mock tests to unlock 2 additional months free!',
    highlights: [
      'Attempt 1 Free Mock Test with 0 Login Friction',
      'Instant 1-Month Free All-Access Pass on 1-Click Signup',
      'Complete 5 Tests to Unlock +2 Months (60 Days Extra Free)',
    ],
    primaryActionLabel: 'Claim 1st Month Free',
    primaryActionType: 'explore_pass',
    secondaryActionLabel: 'Attempt Free Test Now',
    secondaryActionType: 'start_test',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
    borderAccent: 'border-amber-500/50 hover:border-amber-500/70',
    accentGlow: 'bg-amber-500/10',
    isPublished: true,
    displayOrder: 2,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'teacher-hot-series',
    category: 'HOT TEST SERIES',
    categoryIcon: 'Flame',
    categoryColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: '5,000+ Posts Announced',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    title: 'CG शिक्षक भर्ती 2026 महा-अभ्यास श्रृंखला',
    subtitle: 'सहायक शिक्षक (1-5), शिक्षक (6-8) एवं व्याख्याता (9-12) के लिए पूर्ण 15 Full Mocks + 20 विषयवार टेस्ट।',
    highlights: [
      '150 Questions · Authentic -¼ Negative Marking',
      'Real TCS iON Computer-Based CBT Interface',
      'Detailed Bilingual Explanations & Performance Review',
    ],
    primaryActionLabel: 'Open Teacher Bundle',
    primaryActionType: 'open_bundle',
    primaryActionTarget: 'assistant-teacher-2026',
    secondaryActionLabel: 'Try Free Diagnostic Mock',
    secondaryActionType: 'start_test',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
    borderAccent: 'border-amber-500/40 hover:border-amber-500/60',
    accentGlow: 'bg-amber-500/10',
    isPublished: true,
    displayOrder: 3,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'pass-pro-offer',
    category: 'SPECIAL PASS OFFER',
    categoryIcon: 'Crown',
    categoryColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
    badge: 'FLAT 50% OFF · YEARLY PASS @ ₹599',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: 'Unified All-Access Pass: Unrestricted Access to All 42+ Mocks & Bundles',
    subtitle: 'One pass for all exams. Yearly All-Access at ₹599 (was ₹1,199) or Monthly at ₹199 (was ₹299). 100% full validity with zero ads.',
    highlights: [
      'Unlocks ALL Teacher Cadres, CGPSC & Vyapam Tests',
      'One Device One Pass Account Protection',
      'Printable Bilingual Question PDFs & Rank Benchmark',
    ],
    couponCode: 'CGPASS50',
    primaryActionLabel: 'Get All-Access Pass (From ₹199)',
    primaryActionType: 'explore_pass',
    secondaryActionLabel: 'View Plan Details',
    secondaryActionType: 'explore_pass',
    bgGradient: 'from-indigo-950/50 via-slate-900 to-slate-950',
    borderAccent: 'border-indigo-500/40 hover:border-indigo-500/60',
    accentGlow: 'bg-indigo-500/10',
    isPublished: true,
    displayOrder: 4,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'cgpsc-master-series',
    category: 'HIGH-YIELD PORTAL',
    categoryIcon: 'Award',
    categoryColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    badge: 'State Service Prelims 2026',
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    title: 'CGPSC SSE Prelims 2026: GS Paper 1 + CSAT Paper 2 Series',
    subtitle: 'Complete 100 Qs GS-1 (Chhattisgarh Special GK) and 100 Qs CSAT Paper 2 with official -0.667 negative evaluation.',
    highlights: [
      '200 Marks Per Paper · Official Exam Timing & Marks',
      'Deep Chhattisgarh Geography, History, Tribes & Current',
      'Interpersonal Skills & Logical Aptitude Section',
    ],
    primaryActionLabel: 'Explore CGPSC Bundle',
    primaryActionType: 'open_bundle',
    primaryActionTarget: 'cgpsc-pre-2026',
    secondaryActionLabel: 'Free CSAT Mock Test',
    secondaryActionType: 'start_test',
    bgGradient: 'from-rose-950/30 via-slate-900 to-slate-950',
    borderAccent: 'border-rose-500/40 hover:border-rose-500/60',
    accentGlow: 'bg-rose-500/10',
    isPublished: true,
    displayOrder: 5,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'si-recruitment-series',
    category: 'HOT TEST SERIES',
    categoryIcon: 'Zap',
    categoryColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    badge: 'Police Sub-Inspector 2026',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    title: 'CG Police Sub-Inspector (SI) 2026: 10 Full Length Mocks',
    subtitle: '300 Marks Prelims & Mains booster series with 50 Qs Chhattisgarh Special GK and General Science.',
    highlights: [
      '100 Qs · 300 Marks · 120 Minutes Real Timer',
      'Detailed Scorecard & Sectional Speed Analytics',
      'Includes Official 2023 SI Question Paper Simulation',
    ],
    primaryActionLabel: 'View SI 2026 Bundle',
    primaryActionType: 'open_bundle',
    primaryActionTarget: 'cgssb-si-2026',
    secondaryActionLabel: 'Start Free Sample Test',
    secondaryActionType: 'start_test',
    bgGradient: 'from-cyan-950/40 via-slate-900 to-slate-950',
    borderAccent: 'border-cyan-500/40 hover:border-cyan-500/60',
    accentGlow: 'bg-cyan-500/10',
    isPublished: true,
    displayOrder: 6,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'leaderboard-challenge',
    category: 'STATE-WIDE MERIT',
    categoryIcon: 'Trophy',
    categoryColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    badge: 'PERFORMANCE DASHBOARD',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'Performance Dashboard: Review Your Mock-Test Performance',
    subtitle: 'Review your score, accuracy and time-management breakdown after completing eligible mock tests.',
    highlights: [
      'Personal Score & Accuracy Analysis',
      'Review your own performance trends across completed tests',
      'Detailed subject-wise performance analysis',
    ],
    primaryActionLabel: 'Open Performance Dashboard',
    primaryActionType: 'open_leaderboard',
    secondaryActionLabel: 'Attempt Flagship Mock',
    secondaryActionType: 'start_test',
    bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
    borderAccent: 'border-emerald-500/40 hover:border-emerald-500/60',
    accentGlow: 'bg-emerald-500/10',
    isPublished: true,
    displayOrder: 7,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

/**
 * Retrieve the current slider banners from the in-memory Firestore snapshot.
 * Firestore is authoritative; an empty collection is a valid production state.
 */
export function getStoredSliderBanners(): SliderBanner[] {
  return [...sliderCache].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
}

/**
 * Update the local UI cache and persist through Firestore Security Rules.
 */
export async function saveSliderBanners(banners: SliderBanner[]): Promise<void> {
  const sorted = [...banners].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  // Update the UI immediately, but make persistence awaitable so callers can
  // confirm the Firestore write before showing a success state.
  sliderCache = sorted;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cgtest-slider-updated', { detail: sorted }));
  }
  await syncBannersToFirestore(sorted);
}

/**
 * Sync all banners to Firestore collection `slider_banners`
 */
async function syncBannersToFirestore(banners: SliderBanner[]): Promise<void> {
  const snapshot = await getDocs(collection(db, 'slider_banners'));
  const existingIds = new Set(snapshot.docs.map(d => d.id));
  const desiredIds = new Set(banners.map(b => b.id));

  await Promise.all(banners.map(banner =>
    setDoc(doc(db, 'slider_banners', banner.id), banner, { merge: true })
  ));

  const staleIds = [...existingIds].filter(id => !desiredIds.has(id));
  await Promise.all(staleIds.map(id => deleteDoc(doc(db, 'slider_banners', id))));
}

/**
 * Fetch the authoritative slider banner collection from Firestore.
 */
export async function syncSliderFromFirestore(): Promise<SliderBanner[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'slider_banners'));
    const remoteBanners: SliderBanner[] = [];
    snap.forEach(d => remoteBanners.push(d.data() as SliderBanner));
    sliderCache = remoteBanners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cgtest-slider-updated', { detail: sliderCache }));
    }
    return [...sliderCache];
  } catch (err) {
    console.warn('[SliderStore] Failed to read from Firestore:', err);
    return [];
  }
}

/**
 * Toggle publish status of a banner
 */
export function togglePublishBanner(id: string): SliderBanner[] {
  const current = getStoredSliderBanners();
  const updated = current.map(b => {
    if (b.id === id) {
      return {
        ...b,
        isPublished: !b.isPublished,
        updatedAt: new Date().toISOString(),
      };
    }
    return b;
  });
  saveSliderBanners(updated);
  return updated;
}

/**
 * Update an existing banner
 */
export function updateBanner(id: string, updates: Partial<SliderBanner>): SliderBanner[] {
  const current = getStoredSliderBanners();
  const updated = current.map(b => {
    if (b.id === id) {
      return {
        ...b,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }
    return b;
  });
  saveSliderBanners(updated);
  return updated;
}

/**
 * Create a new banner
 */
export function createBanner(banner: Omit<SliderBanner, 'id' | 'createdAt' | 'updatedAt'>): SliderBanner {
  const current = getStoredSliderBanners();
  const id = `slide-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const newBanner: SliderBanner = {
    ...banner,
    id,
    displayOrder: banner.displayOrder ?? (current.length + 1),
    createdAt: now,
    updatedAt: now,
  };
  const updated = [...current, newBanner];
  saveSliderBanners(updated);
  return newBanner;
}

/**
 * Delete a banner
 */
export function deleteBanner(id: string): SliderBanner[] {
  const current = getStoredSliderBanners();
  const updated = current.filter(b => b.id !== id);
  saveSliderBanners(updated);

  return updated;
}

/**
 * Reorder banners by providing an array of IDs in the desired order
 */
export function reorderBanners(orderedIds: string[]): SliderBanner[] {
  const current = getStoredSliderBanners();
  const map = new Map(current.map(b => [b.id, b]));
  const updated: SliderBanner[] = [];

  orderedIds.forEach((id, index) => {
    const banner = map.get(id);
    if (banner) {
      updated.push({
        ...banner,
        displayOrder: index + 1,
        updatedAt: new Date().toISOString(),
      });
      map.delete(id);
    }
  });

  // Append any banners that weren't in orderedIds
  map.forEach(banner => {
    updated.push({
      ...banner,
      displayOrder: updated.length + 1,
      updatedAt: new Date().toISOString(),
    });
  });

  saveSliderBanners(updated);
  return updated;
}

/**
 * Reset all banners to factory defaults
 */
export function resetBannersToDefault(): SliderBanner[] {
  if (!import.meta.env.DEV) {
    return getStoredSliderBanners();
  }
  saveSliderBanners(DEFAULT_SLIDER_BANNERS);
  return [...DEFAULT_SLIDER_BANNERS];
}
