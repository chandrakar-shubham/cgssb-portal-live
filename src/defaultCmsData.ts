import type { CMSPage, CMSPost, CMSTestSeriesPack, CMSSiteSettings } from './types/cms.ts';

export const INITIAL_CMS_SETTINGS: CMSSiteSettings = {
  siteName: 'CGSSB Test Portal',
  tagline: 'Official Competitive Examination Simulation Platform for CGPSC & CG Vyapam',
  logoUrl: '',
  contactPhone: '+91 98765 43210',
  contactWhatsapp: '+91 98765 43210',
  contactEmail: 'support@cgssbtest.com',
  copyrightText: '© 2026 CGSSB Test Portal. All rights reserved.',
  primaryColor: 'indigo',
  announcementBar: {
    enabled: true,
    message: '🎉 CGPSC Prelims 2026 & Vyapam Hostel Warden New Mock Test Series Live! Free Pass Active.',
    buttonText: 'Attempt Free Tests',
    buttonLink: '/test-series',
  },
  navMenu: [
    { id: 'nav-1', label: 'All Test Series', url: '/test-series' },
    { id: 'nav-2', label: 'CGPSC Mock Tests', url: '/exams/cgpsc' },
    { id: 'nav-3', label: 'CG Vyapam & SSB', url: '/exams/cgssb' },
    { id: 'nav-4', label: 'Previous Year Papers', url: '/pyp' },
    { id: 'nav-5', label: 'Testbook Pass Pro', url: '/pass' },
    { id: 'nav-6', label: 'Latest News & Articles', url: '/posts' },
    { id: 'nav-7', label: 'Syllabus Guide', url: '/p/syllabus-guide' },
  ],
  footerLinks: [
    {
      title: 'Exam Series',
      links: [
        { label: 'CGPSC State Service Prelims', url: '/exams/cgpsc' },
        { label: 'Hostel Warden & Patwari', url: '/exams/cgssb' },
        { label: 'Revenue Inspector & Sub-Inspector', url: '/exams/cgssb' },
        { label: 'Previous Year Question Archives', url: '/pyp' },
      ],
    },
    {
      title: 'Study Tools',
      links: [
        { label: 'Mistake Notebook & Error Log', url: '/mistakes' },
        { label: 'Chhattisgarhi Revision Deck', url: '/chhattisgarhi-revision' },
        { label: 'Bookmarked Questions', url: '/bookmarks' },
        { label: 'Performance Analytics', url: '/analytics' },
      ],
    },
    {
      title: 'About & Support',
      links: [
        { label: 'About Exam Platform', url: '/p/about' },
        { label: 'Coaching Partner Guide', url: '/p/coaching-partner' },
        { label: 'Latest Exam Notifications', url: '/posts' },
        { label: 'Syllabus & Exam Pattern', url: '/p/syllabus-guide' },
      ],
    },
  ],
};

export const INITIAL_CMS_PAGES: CMSPage[] = [
  {
    id: 'page-about',
    slug: 'about',
    title: 'About CGSSB Test Platform',
    metaTitle: 'About CGSSB Test - Chhattisgarh Exam Simulation Engine',
    metaDescription: 'Learn about CGSSB Test, Chhattisgarh’s leading simulation engine for CGPSC and Vyapam exams.',
    isPublished: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-03-20',
    blocks: [
      {
        id: 'blk-1',
        type: 'hero',
        title: 'Empowering Aspirants Across Chhattisgarh',
        subtitle: 'Bilingual exam simulation platform matching official CGPSC and Vyapam TCS iON computer-based test formats.',
        buttonText: 'Explore All Test Series',
        buttonLink: '/test-series',
      },
      {
        id: 'blk-2',
        type: 'heading',
        title: 'Why Top Rankers Trust CGSSB Test',
        subtitle: 'Designed specifically for Chhattisgarhi General Knowledge, Hindi, Science, Aptitude, and Language requirements.',
      },
      {
        id: 'blk-3',
        type: 'features',
        items: [
          {
            title: '100% Real Exam Interface',
            description: 'Identical TCS iON palette with Answered, Marked for Review, and Not Attempted question statuses.',
          },
          {
            title: 'Bilingual Devnagari Support',
            description: 'Every question available in both Hindi (छत्तीसगढ़ी/हिन्दी) and English with clear explanations.',
          },
          {
            title: 'Rank & Cut-Off Predictor',
            description: 'Instant percentile, speed vs accuracy meter, and subject-wise accuracy distribution.',
          },
          {
            title: 'Negative Marking Simulation',
            description: 'Exact CGPSC (+2/-0.66) and Vyapam (+1/-0.33) marking calculation.',
          },
        ],
      },
      {
        id: 'blk-4',
        type: 'faq',
        title: 'Frequently Asked Questions',
        faqList: [
          {
            question: 'Are the mock tests based on latest CGPSC 2026 syllabus?',
            answer: 'Yes, all mock tests are updated regularly according to the latest CGPSC and Vyapam exam guidelines.',
          },
          {
            question: 'Can I access the platform on mobile?',
            answer: 'Yes, CGSSB Test is fully responsive on mobile devices and includes an Android REST API for offline app sync.',
          },
        ],
      },
    ],
  },
  {
    id: 'page-coaching-partner',
    slug: 'coaching-partner',
    title: 'Coaching Institute Partnership Program',
    metaTitle: 'Coaching Partner Program | CGSSB Test',
    metaDescription: 'Partner with CGSSB Test to bring online test series and PYP archives to your coaching institute students.',
    isPublished: true,
    createdAt: '2026-02-01',
    updatedAt: '2026-03-22',
    blocks: [
      {
        id: 'blk-cp-1',
        type: 'hero',
        title: 'Power Your Institute with Enterprise Online Test Series',
        subtitle: 'Provide your classroom students with custom white-label online mock exams and question bank access.',
        buttonText: 'Contact Partnership Team',
        buttonLink: '/p/about',
      },
      {
        id: 'blk-cp-2',
        type: 'features',
        items: [
          {
            title: 'Bulk Student Enrollment',
            description: 'Assign test passes to hundreds of institute students with 1-click administrative credentials.',
          },
          {
            title: 'Custom Test Creator',
            description: 'Use our AI generator or JSON importer to build institute-exclusive weekly test papers.',
          },
          {
            title: 'Detailed Leaderboards',
            description: 'Compare institute performance against statewide aspirant averages.',
          },
        ],
      },
    ],
  },
  {
    id: 'page-syllabus-guide',
    slug: 'syllabus-guide',
    title: 'CGPSC & Vyapam Syllabus & Exam Pattern Guide 2026',
    metaTitle: 'Syllabus & Marking Scheme Guide 2026 | CGSSB Test',
    metaDescription: 'Complete breakdown of marks, duration, subjects, and negative marking for CGPSC and Vyapam competitive exams.',
    isPublished: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-03-24',
    blocks: [
      {
        id: 'blk-sg-1',
        type: 'heading',
        title: 'Official Exam Pattern & Marking Scheme (2026)',
        subtitle: 'Understanding the structure of Chhattisgarh state competitive examinations.',
      },
      {
        id: 'blk-sg-2',
        type: 'faq',
        title: 'Pattern Summary by Exam Board',
        faqList: [
          {
            question: 'CGPSC State Service Prelims Exam Pattern',
            answer: 'Paper 1: General Studies (100 Questions, 200 Marks, 2 Hours, -0.667 Negative Marking). Paper 2: Aptitude Test (100 Questions, 200 Marks, Qualifying 33%).',
          },
          {
            question: 'CG Vyapam (Hostel Warden, Patwari, RI, ADEO) Pattern',
            answer: '150 Questions, 150 Marks, 3 Hours, -0.333 Negative Marking. Key subjects: Computer Knowledge (50 Qs), Chhattisgarhi Language & GK, General Hindi, General English, Aptitude & Reasoning.',
          },
        ],
      },
      {
        id: 'blk-sg-3',
        type: 'test_series_widget',
        title: 'Practice Matching Tests Now',
        categoryFilter: 'ALL',
      },
    ],
  },
];

export const INITIAL_CMS_POSTS: CMSPost[] = [
  {
    id: 'post-1',
    slug: 'cgpsc-prelims-2026-notification-released',
    title: 'CGPSC State Service Exam 2026 Official Notification & Post Breakdown',
    category: 'Exam Notifications',
    featuredImage: '',
    excerpt: 'Chhattisgarh Public Service Commission has announced official dates for State Service Prelims 2026. Read full eligibility, age relaxation, and syllabus details.',
    content: `### CGPSC Prelims 2026 Official Announcement

The **Chhattisgarh Public Service Commission (CGPSC)** has officially issued the notification for the State Service Examination 2026. Aspirants preparing for Deputy Collector, DSP, Accounts Officer, and Commercial Tax Officer posts can now start online registration.

#### Key Dates:
- **Online Application Start**: 1st December 2025
- **Last Date to Apply**: 30th December 2025
- **Preliminary Examination Date**: 8th February 2026
- **Admit Card Release**: 28th January 2026

#### Recommended Preparation Strategy:
1. **Focus heavily on Chhattisgarh GK & Chhattisgarhi Language** as 50% of Paper 1 consists of state-specific topics.
2. **Practice Previous Year Papers (2012–2024)** to understand repeating question themes.
3. Attempt full-length timed mock tests on **CGSSB Test Portal** to build time management and accuracy.`,
    tags: ['CGPSC', 'Notification', 'Prelims 2026', 'Syllabus'],
    author: 'CGSSB Academic Team',
    isPublished: true,
    publishedAt: '2026-03-15',
    updatedAt: '2026-03-20',
  },
  {
    id: 'post-2',
    slug: 'how-to-prepare-chhattisgarhi-language-vyakaran',
    title: 'Top 10 Chhattisgarhi Language (छत्तीसगढ़ी भाषा एवं हाना-जनउला) Tips for CG Vyapam',
    category: 'Study Material & Tips',
    featuredImage: '',
    excerpt: 'Master Chhattisgarhi Vyakaran, Hana (हाणा), Janula (जनउला), and Shabdkosh with our curated study guide.',
    content: `### Mastering Chhattisgarhi Language for CG Exams

In CG Vyapam and CGPSC examinations, **Chhattisgarhi Language (छत्तीसगढ़ी भाषा)** carries high weightage. Here is how to score 100% in this section:

1. **Understand Hana (हाणा) & Janula (जनउला)**: Riddles and idioms are frequently asked.
2. **Chhattisgarhi Grammar Rules**: Learn gender conversions (लिंग परिवर्तन), plurals (वचन), and pronouns (सर्वनाम).
3. **Practice Daily Flashcards**: Use our in-app Chhattisgarhi Revision Deck for quick daily revision.`,
    tags: ['Chhattisgarhi', 'Vyapam', 'Grammar', 'Study Tips'],
    author: 'Subject Expert (Chhattisgarhi)',
    isPublished: true,
    publishedAt: '2026-03-18',
    updatedAt: '2026-03-22',
  },
];

export const INITIAL_CMS_SERIES_PACKS: CMSTestSeriesPack[] = [
  {
    id: 'pack-cgpsc-master',
    slug: 'cgpsc-prelims-master-pass',
    title: 'CGPSC Prelims 2026 Master Test Series Bundle',
    category: 'CGPSC',
    description: 'Complete package of 15 Subject-wise Tests + 10 Full-Length Mock Exams + 12 Previous Year Papers with detailed solutions.',
    badge: 'Best Seller',
    price: 299,
    isPro: true,
    mockTestIds: ['test-cgpsc-1', 'test-cgpsc-2', 'test-cgpsc-3'],
    isPublished: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'pack-vyapam-all-in-one',
    slug: 'cg-vyapam-all-in-one-pack',
    title: 'CG Vyapam All-In-One Exam Pass (Hostel Warden, Patwari, RI)',
    category: 'CGSSB',
    description: 'Comprehensive test series for all Chhattisgarh Vyapam computer-based tests with 5,000+ bilingual questions.',
    badge: 'Popular',
    price: 199,
    isPro: true,
    mockTestIds: ['test-cgssb-1', 'test-cgssb-2'],
    isPublished: true,
    createdAt: '2026-01-05',
  },
];
