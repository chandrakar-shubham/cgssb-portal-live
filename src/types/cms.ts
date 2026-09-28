export type BlockType =
  | 'hero'
  | 'heading'
  | 'paragraph'
  | 'features'
  | 'faq'
  | 'test_series_widget'
  | 'exam_notification_box'
  | 'syllabus_table'
  | 'checkpoint_quiz'
  | 'key_takeaways'
  | 'cta'
  | 'raw_html'
  | 'image_banner'
  | 'ad_slot';

export type PageThemeArchetype =
  | 'hero_landing'
  | 'cbt_exam_focused'
  | 'editorial_magazine'
  | 'institutional_trust';

export type PostThemeArchetype =
  | 'exam_notification'
  | 'daily_current_affairs'
  | 'study_material_guide'
  | 'topper_strategy';

export interface ThemeTokens {
  themeId: string;
  name: string;
  description: string;
  archetype: PageThemeArchetype | PostThemeArchetype;
  accentColor: string; // e.g. '#6366f1' or 'emerald'
  accentGradient: string; // e.g. 'from-indigo-600 to-purple-600'
  surfaceBg: string; // e.g. 'bg-slate-950'
  cardBg: string; // e.g. 'bg-slate-900/80'
  cardStyle: 'glassmorphism' | 'bordered_solid' | 'minimal_clean' | 'high_contrast';
  borderColor: string; // e.g. 'border-slate-800'
  borderRadius: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
  headingFont: string;
  badgeStyle: 'subtle_glow' | 'solid_tag' | 'minimal_pill';
  headerLayout: 'hero_banner' | 'magazine_clean' | 'compact_split' | 'official_header';
  showBreadcrumbs: boolean;
  showSocialShare: boolean;
  showRelatedTests: boolean;
  adDensity: 'none' | 'light' | 'standard' | 'high';
}

export const DEFAULT_PAGE_THEME_TOKENS: Record<PageThemeArchetype, ThemeTokens> = {
  hero_landing: {
    themeId: 'page_hero_landing',
    name: 'High-Conversion Hero Landing Theme',
    description: 'Dynamic gradient mesh, live stats ticker, social proof, and prominent test bundle showcase.',
    archetype: 'hero_landing',
    accentColor: '#6366f1',
    accentGradient: 'from-indigo-600 via-purple-600 to-pink-600',
    surfaceBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardStyle: 'glassmorphism',
    borderColor: 'border-indigo-500/30',
    borderRadius: 'rounded-3xl',
    headingFont: 'font-black tracking-tight',
    badgeStyle: 'subtle_glow',
    headerLayout: 'hero_banner',
    showBreadcrumbs: false,
    showSocialShare: true,
    showRelatedTests: true,
    adDensity: 'light',
  },
  cbt_exam_focused: {
    themeId: 'page_cbt_exam_focused',
    name: 'CBT Exam Series Focus Theme',
    description: 'High contrast, zero distraction, timer HUD aesthetics, and quick-launch test buttons.',
    archetype: 'cbt_exam_focused',
    accentColor: '#0d9488',
    accentGradient: 'from-teal-600 to-emerald-600',
    surfaceBg: 'bg-slate-950',
    cardBg: 'bg-slate-900',
    cardStyle: 'high_contrast',
    borderColor: 'border-teal-500/40',
    borderRadius: 'rounded-2xl',
    headingFont: 'font-black',
    badgeStyle: 'solid_tag',
    headerLayout: 'compact_split',
    showBreadcrumbs: true,
    showSocialShare: true,
    showRelatedTests: true,
    adDensity: 'none',
  },
  editorial_magazine: {
    themeId: 'page_editorial_magazine',
    name: 'Editorial & Current Affairs Theme',
    description: 'Magazine readability, sticky table of contents, high typography contrast, and quick takeaways.',
    archetype: 'editorial_magazine',
    accentColor: '#0284c7',
    accentGradient: 'from-sky-600 to-blue-700',
    surfaceBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/70',
    cardStyle: 'bordered_solid',
    borderColor: 'border-slate-800',
    borderRadius: 'rounded-2xl',
    headingFont: 'font-extrabold',
    badgeStyle: 'minimal_pill',
    headerLayout: 'magazine_clean',
    showBreadcrumbs: true,
    showSocialShare: true,
    showRelatedTests: true,
    adDensity: 'standard',
  },
  institutional_trust: {
    themeId: 'page_institutional_trust',
    name: 'Official Institutional & Syllabus Theme',
    description: 'Government portal authority style, structured tables, verified trust badges, and legal clarity.',
    archetype: 'institutional_trust',
    accentColor: '#f59e0b',
    accentGradient: 'from-amber-600 to-orange-600',
    surfaceBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardStyle: 'minimal_clean',
    borderColor: 'border-amber-500/30',
    borderRadius: 'rounded-2xl',
    headingFont: 'font-bold',
    badgeStyle: 'solid_tag',
    headerLayout: 'official_header',
    showBreadcrumbs: true,
    showSocialShare: false,
    showRelatedTests: true,
    adDensity: 'light',
  },
};

export const DEFAULT_POST_THEME_TOKENS: Record<PostThemeArchetype, ThemeTokens> = {
  exam_notification: {
    themeId: 'post_exam_notification',
    name: 'Official Job & Exam Alert Theme',
    description: 'Urgent notification badge, deadline countdown, vacancy table, and direct PDF download.',
    archetype: 'exam_notification',
    accentColor: '#ef4444',
    accentGradient: 'from-rose-600 to-red-700',
    surfaceBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardStyle: 'bordered_solid',
    borderColor: 'border-rose-500/30',
    borderRadius: 'rounded-2xl',
    headingFont: 'font-black',
    badgeStyle: 'subtle_glow',
    headerLayout: 'hero_banner',
    showBreadcrumbs: true,
    showSocialShare: true,
    showRelatedTests: true,
    adDensity: 'standard',
  },
  daily_current_affairs: {
    themeId: 'post_daily_current_affairs',
    name: 'Daily Current Affairs & News Digest',
    description: 'Quick bullets, bilingual switch, "Question of the Day" interactive MCQ checkpoint, and topic tags.',
    archetype: 'daily_current_affairs',
    accentColor: '#059669',
    accentGradient: 'from-emerald-600 to-teal-700',
    surfaceBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/80',
    cardStyle: 'glassmorphism',
    borderColor: 'border-emerald-500/30',
    borderRadius: 'rounded-2xl',
    headingFont: 'font-extrabold',
    badgeStyle: 'minimal_pill',
    headerLayout: 'magazine_clean',
    showBreadcrumbs: true,
    showSocialShare: true,
    showRelatedTests: true,
    adDensity: 'standard',
  },
  study_material_guide: {
    themeId: 'post_study_material_guide',
    name: 'Subject Deep-Dive & Study Guide Theme',
    description: 'Multi-chapter sidebar, collapsible deep dive boxes, formula cheat-sheets, and practice quizzes.',
    archetype: 'study_material_guide',
    accentColor: '#8b5cf6',
    accentGradient: 'from-purple-600 to-indigo-700',
    surfaceBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardStyle: 'bordered_solid',
    borderColor: 'border-purple-500/30',
    borderRadius: 'rounded-2xl',
    headingFont: 'font-bold',
    badgeStyle: 'solid_tag',
    headerLayout: 'magazine_clean',
    showBreadcrumbs: true,
    showSocialShare: true,
    showRelatedTests: true,
    adDensity: 'light',
  },
  topper_strategy: {
    themeId: 'post_topper_strategy',
    name: 'Topper Strategy & Cut-Off Analysis Theme',
    description: 'Yearly cutoff trend charts, merit mark distribution, and live rank percentile widget.',
    archetype: 'topper_strategy',
    accentColor: '#f59e0b',
    accentGradient: 'from-amber-500 to-yellow-600',
    surfaceBg: 'bg-slate-950',
    cardBg: 'bg-slate-900/90',
    cardStyle: 'glassmorphism',
    borderColor: 'border-amber-500/40',
    borderRadius: 'rounded-3xl',
    headingFont: 'font-black',
    badgeStyle: 'subtle_glow',
    headerLayout: 'compact_split',
    showBreadcrumbs: true,
    showSocialShare: true,
    showRelatedTests: true,
    adDensity: 'high',
  },
};

export interface MonetizationAdSettings {
  adSensePublisherId: string; // e.g. "ca-pub-1234567890123456"
  enableAds: boolean;
  disableAdsForProUsers: boolean; // Auto-bypass for Test Pass holders
  enableMockupPreview: boolean; // Shows sleek placeholder in dev
  slots: {
    topLeaderboard: { enabled: boolean; slotId?: string };
    inContent: { enabled: boolean; slotId?: string; frequencyParagraphs: number };
    sidebar: { enabled: boolean; slotId?: string; sticky: boolean };
    postFooter: { enabled: boolean; slotId?: string };
  };
}

export const DEFAULT_AD_SETTINGS: MonetizationAdSettings = {
  adSensePublisherId: 'ca-pub-9988776655443322',
  enableAds: true,
  disableAdsForProUsers: true,
  enableMockupPreview: true,
  slots: {
    topLeaderboard: { enabled: true, slotId: '1001234567' },
    inContent: { enabled: true, slotId: '2001234567', frequencyParagraphs: 3 },
    sidebar: { enabled: true, slotId: '3001234567', sticky: true },
    postFooter: { enabled: true, slotId: '4001234567' },
  },
};

export interface PageBlock {
  id: string;
  type: BlockType;
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  items?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  faqList?: Array<{
    question: string;
    answer: string;
  }>;
  categoryFilter?: string;
  // Enhanced FAANG Blocks:
  notificationMeta?: {
    examName: string;
    authority: string;
    applicationStartDate?: string;
    applicationEndDate?: string;
    examDate?: string;
    totalVacancies?: string;
    eligibilityBrief?: string;
    officialPdfUrl?: string;
    applyOnlineUrl?: string;
  };
  syllabusData?: {
    subjectHeaders: string[];
    rows: Array<{
      subject: string;
      topics: string;
      weightageMarks: string;
    }>;
  };
  checkpointQuiz?: {
    question: string;
    questionHindi?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  keyTakeaways?: string[];
  testSeriesEmbed?: {
    bundleId?: string;
    mockTestId?: string;
    customTitle?: string;
    customCtaText?: string;
  };
  adSlotConfig?: {
    slotType: 'leaderboard' | 'rectangle' | 'in_feed';
    customLabel?: string;
  };
}

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  isPublished: boolean;
  themeArchetype?: PageThemeArchetype;
  themeOverride?: Partial<ThemeTokens>;
  blocks: PageBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface CMSPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  featuredImage?: string;
  excerpt: string;
  content: string;
  tags: string[];
  author: string;
  isPublished: boolean;
  publishedAt: string;
  updatedAt: string;
  themeArchetype?: PostThemeArchetype;
  themeOverride?: Partial<ThemeTokens>;
  blocks?: PageBlock[];
  notificationMeta?: {
    examName?: string;
    applicationEndDate?: string;
    examDate?: string;
    totalVacancies?: string;
    officialPdfUrl?: string;
    applyOnlineUrl?: string;
  };
  checkpointQuiz?: {
    question: string;
    questionHindi?: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface CMSTestSeriesPack {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  badge: string;
  price: number;
  isPro: boolean;
  mockTestIds: string[];
  bannerUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  url: string;
  isExternal?: boolean;
}

export interface CMSSiteSettings {
  siteName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  copyrightText?: string;
  primaryColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan';
  announcementBar: {
    enabled: boolean;
    message: string;
    buttonText?: string;
    buttonLink?: string;
  };
  navMenu: NavMenuItem[];
  footerLinks: Array<{
    title: string;
    links: Array<{ label: string; url: string }>;
  }>;
  // Dynamic Theming & Monetization Extensions:
  pageThemes: Record<PageThemeArchetype, ThemeTokens>;
  postThemes: Record<PostThemeArchetype, ThemeTokens>;
  adSettings: MonetizationAdSettings;
}
