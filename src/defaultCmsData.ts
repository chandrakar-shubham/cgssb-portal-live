import type { CMSPage, CMSPost, CMSTestSeriesPack, CMSSiteSettings } from './types/cms.ts';
import { DEFAULT_PAGE_THEME_TOKENS, DEFAULT_POST_THEME_TOKENS, DEFAULT_AD_SETTINGS } from './types/cms.ts';

export const INITIAL_CMS_SETTINGS: CMSSiteSettings = {
  siteName: 'cgtest.in',
  tagline: 'Official Competitive Examination Simulation Platform for CGPSC & CG Vyapam',
  logoUrl: '',
  contactPhone: '+91 98765 43210',
  contactWhatsapp: '+91 98765 43210',
  contactEmail: 'support@cgtest.in',
  copyrightText: '© 2026 cgtest.in. All rights reserved.',
  primaryColor: 'indigo',
  announcementBar: {
    enabled: true,
    message: '🎉 Sign Up to Claim 1-Month Free Pro Pass + Unlock 2 Extra Months by attempting 5 Tests!',
    buttonText: 'Claim Free Pass',
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
  pageThemes: { ...DEFAULT_PAGE_THEME_TOKENS },
  postThemes: { ...DEFAULT_POST_THEME_TOKENS },
  adSettings: { ...DEFAULT_AD_SETTINGS },
};

export const INITIAL_CMS_PAGES: CMSPage[] = [
  {
    id: 'page-about',
    slug: 'about',
    title: 'About CGSSB Test Platform',
    metaTitle: 'About CGSSB Test - Chhattisgarh Exam Simulation Engine',
    metaDescription: 'Learn about CGSSB Test, Chhattisgarh’s leading simulation engine for CGPSC and Vyapam exams.',
    isPublished: true,
    themeArchetype: 'institutional_trust',
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
            description: 'Accurate 1/3rd or 1/4th penalty calculations per official commission rules.',
          },
        ],
      },
      {
        id: 'blk-4',
        type: 'faq',
        title: 'Frequently Asked Questions',
        faqList: [
          {
            question: 'Are the test questions based on the latest 2026 syllabus?',
            answer: 'Yes, all mock exams, chapter drills, and subject tests strictly follow the updated CGPSC State Service and CG Vyapam blueprints.',
          },
          {
            question: 'Can I download previous year question papers?',
            answer: 'Yes! Access our PYP Archive to practice in real test mode or download solved answer keys with detailed explanations.',
          },
        ],
      },
    ],
  },
  {
    id: 'page-syllabus-guide',
    slug: 'syllabus-guide',
    title: 'CGSSB & CGPSC Comprehensive Syllabus 2026',
    metaTitle: 'CGPSC & Vyapam Syllabus 2026 - Subject Wise Marks Weightage',
    metaDescription: 'Complete breakdown of CGPSC State Service Prelims, Hostel Warden, Patwari, and RI Exam syllabus.',
    isPublished: true,
    themeArchetype: 'institutional_trust',
    createdAt: '2026-02-01',
    updatedAt: '2026-03-22',
    blocks: [
      {
        id: 'syl-blk-1',
        type: 'hero',
        title: 'Complete 2026 Exam Pattern & Syllabus Guide',
        subtitle: 'Official subject-wise marks distribution and chapter weightage for upcoming Chhattisgarh State Recruitment Exams.',
        buttonText: 'Start Preparation Test',
        buttonLink: '/test-series',
      },
      {
        id: 'syl-blk-2',
        type: 'syllabus_table',
        title: 'CGPSC State Service Prelims - Paper I (General Studies)',
        syllabusData: {
          subjectHeaders: ['Subject Section', 'Key Topics Covered', 'Marks Weightage'],
          rows: [
            { subject: 'History & Culture of Chhattisgarh', topics: 'Dynasties, Freedom Movement, Tribes, Folk Dances & Festivals', weightageMarks: '25-30 Marks' },
            { subject: 'Geography of Chhattisgarh', topics: 'Rivers, Forests, Minerals, Agriculture & Industrial Development', weightageMarks: '15-20 Marks' },
            { subject: 'Chhattisgarhi Language & Literature', topics: 'Grammar, Hana, Janula, Idioms & Famous Authors', weightageMarks: '10-15 Marks' },
            { subject: 'Indian Polity & Economy', topics: 'Constitution, Panchayati Raj, 73rd/74th Amendments, Budget 2026', weightageMarks: '20-25 Marks' },
            { subject: 'Current Affairs & Sports', topics: 'Chhattisgarh State Initiatives, National & International Events', weightageMarks: '15-20 Marks' },
          ],
        },
      },
      {
        id: 'syl-blk-3',
        type: 'key_takeaways',
        title: 'Crucial Preparation Strategy Points',
        keyTakeaways: [
          'Minimum 50% weightage is allocated to Chhattisgarh General Knowledge and Chhattisgarhi Bhasha.',
          'Negative marking is strictly 1/3rd (0.67 marks deducted per incorrect attempt in CGPSC).',
          'Attempt timed CBT mock tests weekly to build speed and accuracy under simulated pressure.',
        ],
      },
      {
        id: 'syl-blk-4',
        type: 'cta',
        title: 'Ready to Test Your Knowledge?',
        subtitle: 'Join over 4,500 candidates preparing on the state’s #1 dedicated testing engine.',
        buttonText: 'Attempt Full Mock Now',
        buttonLink: '/test-series',
      },
    ],
  },
];

export const INITIAL_CMS_POSTS: CMSPost[] = [
  {
    id: 'post-1',
    slug: 'cg-vyapam-hostel-warden-2026-notification',
    title: 'CG Vyapam Hostel Warden (छात्रावास अधीक्षक) 2026 Official Notification & Exam Strategy',
    category: 'Exam Notifications',
    featuredImage: '',
    excerpt: 'Complete breakdown of eligibility, 300+ vacancies, Computer GK 50 marks compulsory passing rule, and syllabus.',
    content: `The Chhattisgarh Professional Examination Board (CG Vyapam) has released the recruitment notification for **Hostel Warden (Category D)**.

### Key Highlights
- **Total Posts:** 300+ Vacancies across state districts.
- **Pay Scale:** Level 6 Matrix.
- **Crucial Rule:** 50 Questions from Computer Knowledge are mandatory. Candidates must score at least 50% (25 marks) in Computer GK to qualify.

### Recommended Daily Schedule
1. Spend 2 hours daily on Computer Fundamentals (Hardware, MS Office, Viruses & Cyber Security).
2. Practice Chhattisgarhi Grammar, Hana, and Janula flashcards.
3. Solve at least one 100-question timed full mock test every Sunday.`,
    tags: ['Vyapam', 'Hostel Warden', 'Notification', 'Computer GK'],
    author: 'CGSSB Editorial Team',
    isPublished: true,
    publishedAt: '2026-03-24',
    updatedAt: '2026-03-25',
    themeArchetype: 'exam_notification',
    notificationMeta: {
      examName: 'CG Vyapam Hostel Warden Recruitment 2026',
      applicationEndDate: 'April 20, 2026',
      examDate: 'May 24, 2026',
      totalVacancies: '300 Posts',
      officialPdfUrl: 'https://vyapam.cgstate.gov.in',
      applyOnlineUrl: 'https://vyapam.cgstate.gov.in',
    },
    checkpointQuiz: {
      question: 'In CG Vyapam Hostel Warden exam, what is the minimum qualifying score required in the 50-mark Computer Knowledge section?',
      questionHindi: 'छात्रावास अधीक्षक परीक्षा में 50 अंकों के कंप्यूटर ज्ञान खंड में न्यूनतम कितने अंक अनिवार्य हैं?',
      options: ['15 Marks (30%)', '20 Marks (40%)', '25 Marks (50%)', '30 Marks (60%)'],
      correctIndex: 2,
      explanation: 'As per CG Vyapam rules for Hostel Warden, candidate must score at least 50% (25 out of 50 marks) in Computer Knowledge to have their remaining papers evaluated.',
    },
  },
  {
    id: 'post-2',
    slug: 'chhattisgarhi-bhasha-hana-janula-guide',
    title: 'Chhattisgarhi Bhasha: Top 50 Hana & Janula (हाना एवं जनउला) for CGPSC Prelims 2026',
    category: 'Study Material',
    featuredImage: '',
    excerpt: 'Master essential Chhattisgarhi proverbs (Hana) and riddles (Janula) with Hindi meanings and exam examples.',
    content: `Chhattisgarhi language questions carry high scoring potential in both CGPSC and CG Vyapam exams.

### 1. Important Janula (Riddles / पहेलियां)
- **"एक थारी म दू अण्डा, एक गरम एक ठण्डा"**
  - *उत्तर:* सुरुज अउ चन्दा (Sun and Moon)
- **"बीस बेंदरी के एक पूंछ"**
  - *उत्तर:* बिछिया (Toe Ring) or झाड़ू (Broom)
- **"नानकन टूरा, पेट म खीरा"**
  - *उत्तर:* मरिचा (Chili)

### 2. Frequently Asked Hana (Proverbs / कहावतें)
- **"हाथ के करगन ला आरसी का"**
  - *अर्थ:* प्रत्यक्ष को प्रमाण की आवश्यकता नहीं होती।
- **"जइसे बोही तइसे लूनी"**
  - *अर्थ:* जैसा कर्म करोगे वैसा फल मिलेगा।`,
    tags: ['Chhattisgarhi', 'Hana Janula', 'CGPSC', 'Language'],
    author: 'Prof. S. K. Verma (Language Faculty)',
    isPublished: true,
    publishedAt: '2026-03-20',
    updatedAt: '2026-03-22',
    themeArchetype: 'study_material_guide',
    checkpointQuiz: {
      question: 'What is the answer to the popular Chhattisgarhi Janula: "एक थारी म दू अण्डा, एक गरम एक ठण्डा"?',
      questionHindi: 'छत्तीसगढ़ी जनउला: "एक थारी म दू अण्डा, एक गरम एक ठण्डा" का सही उत्तर क्या है?',
      options: ['दिन और रात', 'सूरज और चंदा', 'आंख और पलक', 'आकाश और पाताल'],
      correctIndex: 1,
      explanation: 'सूरज (गरम) और चंदा (ठण्डा) आकाश रूपी थाली में स्थित हैं।',
    },
  },
  {
    id: 'post-3',
    slug: 'cg-current-affairs-march-2026-digest',
    title: 'Chhattisgarh Monthly Current Affairs Digest: Key Schemes, Budget & State Awards',
    category: 'Current Affairs',
    featuredImage: '',
    excerpt: 'Comprehensive summary of state government initiatives, industrial policies, sports accolades, and appointments.',
    content: `A concise compilation of key state events essential for all upcoming 2026 state examinations.

### Top State Developments
1. **Mahtari Vandan Yojana Expansion:** Financial empowerment scheme reaching over 70 lakh women across 33 districts.
2. **Bastariya Olympic Initiatives:** Grassroots sports talent scouting in tribal belts of Bastar and Surguja divisions.
3. **Mahanadi Water Conservation Projects:** New barrage modernizations approved for Raipur and Bilaspur agricultural zones.`,
    tags: ['Current Affairs', 'Budget 2026', 'Government Schemes'],
    author: 'Current Affairs Editorial Desk',
    isPublished: true,
    publishedAt: '2026-03-26',
    updatedAt: '2026-03-27',
    themeArchetype: 'daily_current_affairs',
  },
];

export const INITIAL_CMS_SERIES_PACKS: CMSTestSeriesPack[] = [
  {
    id: 'pack-cgpsc-2026',
    slug: 'cgpsc-state-service-2026',
    title: 'CGPSC State Service (SSE) Prelims 2026 Super Pack',
    category: 'CGPSC',
    description: '30 Full Mock Tests (Paper I + Paper II CSAT) with detailed bilingual explanations, state ranks, and previous 10-year solved papers.',
    badge: 'Best Seller',
    price: 499,
    isPro: true,
    mockTestIds: ['test-cgpsc-2026-mock-1', 'test-cgpsc-2026-mock-2'],
    isPublished: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'pack-vyapam-combo',
    slug: 'cg-vyapam-combo-pack',
    title: 'CG Vyapam All-in-One Super Test Pass 2026',
    category: 'CGSSB',
    description: 'Hostel Warden, Patwari, Revenue Inspector, Sub-Inspector, and Teacher Bharti complete test series collection.',
    badge: 'Mega Combo',
    price: 399,
    isPro: true,
    mockTestIds: ['test-hostel-warden-1', 'test-patwari-2026'],
    isPublished: true,
    createdAt: '2026-01-10',
  },
];
