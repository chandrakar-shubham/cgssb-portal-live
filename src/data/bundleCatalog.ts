import { MockTest } from '../types';

export interface BundleSyllabusSection {
  subject: string;
  subjectHindi: string;
  marks: number;
  questionCount: number;
  weightagePercentage: number;
  topics: string[];
  isMandatoryQualifying?: boolean;
}

export interface BundleExamPattern {
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  markingScheme: string;
  negativeMarkPenalty: string;
  language: string;
  cadre: string;
  passingCriteria?: string;
  keyRules: string[];
}

export interface BundleTestItem {
  id: string;
  title: string;
  titleHindi?: string;
  type: 'full_mock' | 'sectional' | 'pyp' | 'live_test';
  questionCount: number;
  durationMinutes: number;
  marks: number;
  isFreePreview: boolean;
  isLocked?: boolean;
  statusText?: string;
  attemptsCount: number;
  mockTestRef?: MockTest;
}

export interface BundleImportantDates {
  notificationDate?: string;
  formStartDate?: string;
  formEndDate?: string;
  admitCardDate?: string;
  examDate?: string;
  resultDate?: string;
  correctionLastDate?: string;
  status?: 'upcoming' | 'ongoing' | 'admit_card_out' | 'exam_completed' | 'result_declared';
}

export interface BundleEligibility {
  minAge?: number;
  maxAge?: number;
  ageRelaxation?: string;
  qualification?: string;
  domicile?: string;
  experience?: string;
  otherRules?: string[];
}

export interface BundleOfficialLinks {
  applyUrl?: string;
  notificationPdfUrl?: string;
  officialWebsiteUrl?: string;
  syllabusPdfUrl?: string;
}

export interface TestSeriesBundle {
  id: string;
  slug: string;
  title: string;
  titleHindi: string;
  authority: 'CGSSB' | 'CGPSC';
  targetPost: string;
  targetYear: number;
  badge: string;
  badgeColor: 'emerald' | 'rose' | 'amber' | 'blue' | 'purple';
  shortDescription: string;
  fullDescription: string;
  price: number;
  originalPrice: number;
  isProOnly: boolean;
  totalTestsCount: number;
  freeTestsCount: number;
  enrolledStudentsCount: number;
  rating: number;
  validity: string;
  languageDisplay: string;
  examPattern: BundleExamPattern;
  syllabusBreakdown: BundleSyllabusSection[];
  features: string[];
  testItems: BundleTestItem[];
  faqs: Array<{ question: string; answer: string }>;
  importantDates?: BundleImportantDates;
  eligibility?: BundleEligibility;
  officialLinks?: BundleOfficialLinks;
  chapterTests?: BundleTestItem[];
  pypTests?: BundleTestItem[];
  mockTests?: BundleTestItem[];
  isDraft?: boolean;
  seoMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export const OFFICIAL_BUNDLES_CATALOG: TestSeriesBundle[] = [
  // =========================================================================
  // 1. CGSSB: Assistant Teacher 2026 Test Series (सहायक शिक्षक भर्ती 2026)
  // =========================================================================
  {
    id: 'bundle-cgssb-asst-teacher-2026',
    slug: 'assistant-teacher-2026',
    title: 'Assistant Teacher 2026 Test Series',
    titleHindi: 'सहायक शिक्षक (वर्ग-3 प्राथमिक) भर्ती परीक्षा 2026',
    authority: 'CGSSB',
    targetPost: 'Assistant Teacher (Primary Cadre Class 1 to 5)',
    targetYear: 2026,
    badge: 'Newly Launched',
    badgeColor: 'emerald',
    shortDescription: 'Complete 150-Marks official pattern test series for CG Vyapam Assistant Teacher (Primary Cadre Classes 1-5). Includes Child Pedagogy, Hindi, English, Maths, EVS, and Computer.',
    fullDescription: 'Strictly drafted as per Chhattisgarh School Education Department & CG Vyapam latest blueprint. Features 15 Full-Length Mocks + 8 Sectional Subject Tests with bilingual explanations, 1/4th negative marking calculation, and state-level rank analysis.',
    price: 149,
    originalPrice: 499,
    isProOnly: false,
    totalTestsCount: 15,
    freeTestsCount: 2,
    enrolledStudentsCount: 4280,
    rating: 4.9,
    validity: 'Till Exam Date 2026',
    languageDisplay: 'द्विभाषी (Hindi + English)',
    examPattern: {
      totalQuestions: 150,
      totalMarks: 150,
      durationMinutes: 150,
      markingScheme: '+1.0 Mark for correct answer',
      negativeMarkPenalty: '-0.25 (¼th) Negative Marking per incorrect response',
      language: 'Bilingual (Hindi / English)',
      cadre: 'Class 1 to 5 Primary Teacher',
      keyRules: [
        'Each question carries 1.0 mark with equal weightage.',
        '0.25 mark penalty is deducted for every incorrect option.',
        'Questions are provided in both Hindi and English for maximum comprehension.',
        'TCS iON styled interface with Question Palette tracking and section switching.',
      ],
    },
    syllabusBreakdown: [
      {
        subject: 'Child Development & Pedagogy',
        subjectHindi: 'बाल विकास एवं शिक्षाशास्त्र',
        marks: 30,
        questionCount: 30,
        weightagePercentage: 20,
        topics: [
          'Childhood and Development stages (Physical, Cognitive, Social)',
          'Learning theories: Piaget, Vygotsky, Kohlberg',
          'Inclusive education & children with special needs (CWSN)',
          'Learning styles, motivation and classroom interaction',
          'Assessment and evaluation techniques (CCE & NEP 2020)',
        ],
      },
      {
        subject: 'General Hindi',
        subjectHindi: 'सामान्य हिन्दी',
        marks: 25,
        questionCount: 25,
        weightagePercentage: 16.7,
        topics: [
          'वर्ण विचार: स्वर, व्यंजन, वर्तनी व संधि',
          'शब्द रचना: उपसर्ग, प्रत्यय, समास',
          'शब्द प्रकार: तत्सम, तद्भव, देशज, विदेशी',
          'संज्ञा, सर्वनाम, क्रिया, विशेषण, कारक, लिंग, वचन',
          'पर्यायवाची, विलोम, मुहावरे एवं लोकोक्तियां (छत्तीसगढ़ी हाना सहित)',
        ],
      },
      {
        subject: 'General English',
        subjectHindi: 'सामान्य अंग्रेजी',
        marks: 25,
        questionCount: 25,
        weightagePercentage: 16.7,
        topics: [
          'Reading Comprehension & Unseen Passages',
          'Grammar: Tenses, Prepositions, Articles, Active/Passive Voice',
          'Direct and Indirect Speech, Modal Auxiliaries',
          'Vocabulary: Synonyms, Antonyms, One Word Substitution',
          'Pedagogy of English Language Teaching (Class 1-5)',
        ],
      },
      {
        subject: 'Mathematics',
        subjectHindi: 'गणित',
        marks: 30,
        questionCount: 30,
        weightagePercentage: 20,
        topics: [
          'संख्या प्रणाली (Number System) एवं भिन्न',
          'वर्गमूल, घनमूल, ल.स.प. एवं म.स.प. (LCM & HCF)',
          'प्रतिशत, लाभ-हानि, साधारण एवं चक्रवृद्धि ब्याज',
          'अनुपात-समानुपात, समय एवं कार्य, चाल-दूरी-समय',
          'ज्यामिति: कोण, त्रिभुज, चतुर्भुज एवं वृत्त',
          'क्षेत्रफल एवं परिमाप (Mensuration 2D/3D)',
          'गणित शिक्षण विधियां (Maths Pedagogy)',
        ],
      },
      {
        subject: 'Environmental Studies (EVS)',
        subjectHindi: 'पर्यावरण अध्ययन',
        marks: 20,
        questionCount: 20,
        weightagePercentage: 13.3,
        topics: [
          'स्वयं के पर्यावरण को समझना व परिवेशीय अध्ययन',
          'पारिस्थितिकी तंत्र (Ecosystem), जैव विविधता एवं संरक्षण',
          'पर्यावरण प्रदूषण एवं निवारण के उपाय',
          'छत्तीसगढ़ की नदियां, जलप्रपात, वन एवं राष्ट्रीय उद्यान',
          'पर्यावरण अध्ययन शिक्षण विधियां (EVS Pedagogy)',
        ],
      },
      {
        subject: 'Computer General Knowledge',
        subjectHindi: 'कंप्यूटर संबंधी सामान्य ज्ञान',
        marks: 10,
        questionCount: 10,
        weightagePercentage: 6.7,
        topics: [
          'Computer Hardware & Architecture (CPU, RAM, ROM)',
          'Input and Output Devices (Printer, Scanner, OCR)',
          'Operating Systems (Windows, Linux, Android)',
          'Internet, Email, Search Engines, MS Office (Word, Excel)',
          'Cyber Security, Virus and Antivirus Fundamentals',
        ],
      },
      {
        subject: 'General Knowledge',
        subjectHindi: 'सामान्य ज्ञान (छत्तीसगढ़ एवं भारत)',
        marks: 10,
        questionCount: 10,
        weightagePercentage: 6.7,
        topics: [
          'छत्तीसगढ़ का इतिहास, संस्कृति, प्रमुख मेले एवं त्यौहार',
          'छत्तीसगढ़ के प्रमुख व्यक्तित्व एवं प्रशासनिक ढांचा',
          'भारतीय संविधान एवं मौलिक अधिकार',
          'प्रमुख समसामयिक घटनाएं (Current Affairs)',
        ],
      },
    ],
    features: [
      '15 Total Tests: 10 Full-Length Mocks + 5 Subject-wise Sectional Tests',
      '2 Free Full-Length Tests available to attempt without sign-in barrier',
      'Realistic TCS iON Simulation with bilingual Hindi & English question views',
      'Live State-wide simulated rank and percentile comparison with thousands of peers',
      'Integrated Mistake Notebook to bookmark and re-test weak pedagogical concepts',
      'Comprehensive step-by-step Hindi explanations for every maths and pedagogy question',
    ],
    testItems: [
      {
        id: 'test-cg-shikshak-paper1-01',
        title: 'Assistant Teacher 2026 Official Mock 01 (Full Length)',
        titleHindi: 'सहायक शिक्षक 2026 संपूर्ण मॉक टेस्ट 01',
        type: 'full_mock',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 3120,
      },
      {
        id: 'test-asst-teacher-02',
        title: 'Assistant Teacher 2026 High-Yield Mock 02',
        titleHindi: 'सहायक शिक्षक 2026 मॉडल टेस्ट 02',
        type: 'full_mock',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 2480,
      },
      {
        id: 'test-asst-teacher-sec-cdp',
        title: 'Sectional: Child Development & Pedagogy (30 Qs Booster)',
        titleHindi: 'विभागीय: बाल विकास एवं शिक्षाशास्त्र स्पेशल 30 प्रश्न',
        type: 'sectional',
        questionCount: 30,
        durationMinutes: 30,
        marks: 30,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1890,
      },
      {
        id: 'test-asst-teacher-sec-maths',
        title: 'Sectional: Mathematics & Pedagogy Core Test',
        titleHindi: 'विभागीय: प्राथमिक गणित एवं शिक्षणशास्त्र',
        type: 'sectional',
        questionCount: 30,
        durationMinutes: 35,
        marks: 30,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1720,
      },
      {
        id: 'test-asst-teacher-pyp-2023',
        title: 'Official Solved Paper: CG Assistant Teacher 2023 Shift 1',
        titleHindi: 'आधिकारिक हल प्रश्नपत्र: सहायक शिक्षक भर्ती 2023',
        type: 'pyp',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 3450,
      },
    ],
    faqs: [
      {
        question: 'Is this test series completely according to the 2026 syllabus?',
        answer: 'Yes, every test is modeled directly on the latest 150-mark pattern established by the Chhattisgarh School Education Department and CG Vyapam.',
      },
      {
        question: 'Are questions available in both Hindi and English?',
        answer: 'Yes! The entire exam engine features an instant Hindi/English language toggle so you can view questions and solutions in your preferred language.',
      },
      {
        question: 'Can I re-attempt questions I got wrong?',
        answer: 'Yes! All incorrectly answered questions are automatically added to your personal "Mistake Notebook" where you can launch dedicated re-tests.',
      },
    ],
    importantDates: {
      notificationDate: '15 Jan 2026',
      formStartDate: '01 Feb 2026',
      formEndDate: '28 Feb 2026',
      correctionLastDate: '03 Mar 2026',
      admitCardDate: '10 Apr 2026',
      examDate: '26 Apr 2026',
      resultDate: '30 May 2026',
      status: 'ongoing'
    },
    eligibility: {
      minAge: 21,
      maxAge: 35,
      ageRelaxation: 'Up to 5 years for SC/ST/OBC & Women candidates as per Chhattisgarh state reservation norms (Max 40-45 years).',
      qualification: 'Higher Secondary (10+2) with min 50% marks + 2-year D.El.Ed / B.El.Ed / D.Ed (Special Education) + Qualified CG-TET or CTET (Paper 1).',
      domicile: 'Candidate must be a Bonafide Resident / Domicile of Chhattisgarh State.',
      experience: 'Not mandatory. Fresh graduates and teachers eligible.',
      otherRules: [
        'CG-TET / CTET Paper-1 passing certificate is strictly required at document verification.',
        'Age calculation baseline is 1st January of the recruitment year.',
        'Candidates awaiting final semester D.El.Ed results must present passing marksheet prior to counseling.'
      ]
    },
    officialLinks: {
      applyUrl: 'https://vyapam.cgstate.gov.in/online-application',
      notificationPdfUrl: 'https://vyapam.cgstate.gov.in/notifications/assistant-teacher-2026.pdf',
      officialWebsiteUrl: 'https://vyapam.cgstate.gov.in',
      syllabusPdfUrl: 'https://vyapam.cgstate.gov.in/syllabus/assistant-teacher-detailed.pdf'
    },
    chapterTests: [
      {
        id: 'test-ch-cdp-01',
        title: 'Chapter 01: Child Growth, Genetics & Heredity Principles',
        titleHindi: 'अध्याय 01: बाल विकास की अवधारणा एवं अधिगम से उसका संबंध',
        type: 'sectional',
        questionCount: 20,
        durationMinutes: 20,
        marks: 20,
        isFreePreview: true,
        attemptsCount: 1420
      },
      {
        id: 'test-ch-math-01',
        title: 'Chapter 02: Number System, LCM, HCF & Primary Fractions',
        titleHindi: 'अध्याय 02: संख्या प्रणाली, लघुत्तम समापवर्त्य एवं भिन्न',
        type: 'sectional',
        questionCount: 20,
        durationMinutes: 25,
        marks: 20,
        isFreePreview: false,
        attemptsCount: 980
      },
      {
        id: 'test-ch-evs-01',
        title: 'Chapter 03: Ecosystem, Biodiversity & Chhattisgarh Flora',
        titleHindi: 'अध्याय 03: पर्यावरण अध्ययन, पारिस्थितिकी तंत्र एवं छत्तीसगढ़ की वनस्पति',
        type: 'sectional',
        questionCount: 20,
        durationMinutes: 20,
        marks: 20,
        isFreePreview: false,
        attemptsCount: 840
      }
    ],
    pypTests: [
      {
        id: 'pyp-asst-teacher-2023',
        title: 'CG Vyapam Assistant Teacher (SEAT) 2023 Official Paper',
        titleHindi: 'छत्तीसगढ़ सहायक शिक्षक भर्ती परीक्षा 2023 मूल प्रश्नपत्र',
        type: 'pyp',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        attemptsCount: 5210
      },
      {
        id: 'pyp-asst-teacher-2019',
        title: 'CG Vyapam Assistant Teacher (SEAT) 2019 Official Paper',
        titleHindi: 'छत्तीसगढ़ सहायक शिक्षक भर्ती परीक्षा 2019 मूल प्रश्नपत्र',
        type: 'pyp',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: false,
        attemptsCount: 3840
      }
    ]
  },

  // =========================================================================
  // 2. CGSSB: Teacher English 2026 Test Series (शिक्षक अंग्रेजी भर्ती 2026)
  // =========================================================================
  {
    id: 'bundle-cgssb-teacher-english-2026',
    slug: 'teacher-english-2026',
    title: 'Teacher English 2026 Test Series',
    titleHindi: 'शिक्षक अंग्रेजी (वर्ग-2 माध्यमिक) भर्ती परीक्षा 2026',
    authority: 'CGSSB',
    targetPost: 'Subject Teacher English (Middle School Classes 6 to 8)',
    targetYear: 2026,
    badge: 'High Yield',
    badgeColor: 'blue',
    shortDescription: 'Dedicated exam bundle for CG Vyapam English Teacher Recruitment (Class 6-8). Deep coverage of English Language, Literature, Pedagogy, CDP, and Science/Maths.',
    fullDescription: 'Engineered specifically for candidates targeting Teacher (English Cadre) in Chhattisgarh Government Schools. Features rigorous grammar drills, pedagogical methodologies, unseen poetry & prose analysis, paired with standard child development and general science sections.',
    price: 149,
    originalPrice: 499,
    isProOnly: false,
    totalTestsCount: 14,
    freeTestsCount: 2,
    enrolledStudentsCount: 3610,
    rating: 4.8,
    validity: 'Till Exam Date 2026',
    languageDisplay: 'द्विभाषी (English + Hindi)',
    examPattern: {
      totalQuestions: 150,
      totalMarks: 150,
      durationMinutes: 150,
      markingScheme: '+1.0 Mark per question',
      negativeMarkPenalty: '-0.25 (¼th) Negative Marking',
      language: 'Bilingual with specialized English section',
      cadre: 'Class 6 to 8 Subject Teacher',
      keyRules: [
        '150 Questions for 150 Marks with 1/4th negative deduction.',
        'High emphasis on English Language & Literature Pedagogy (35 Marks).',
        'Includes Child Development & Educational Psychology (30 Marks).',
      ],
    },
    syllabusBreakdown: [
      {
        subject: 'English Language & Pedagogy (Specialized Core)',
        subjectHindi: 'अंग्रेजी भाषा एवं शिक्षणशास्त्र (विशेष मुख्य विषय)',
        marks: 35,
        questionCount: 35,
        weightagePercentage: 23.3,
        topics: [
          'Advanced English Grammar: Syntax, Clauses, Subject-Verb Agreement',
          'Transformation of Sentences, Voice, Narration, Modals & Conditionals',
          'Vocabulary Enrichment: Idioms, Phrasal Verbs, Collocations, Etymology',
          'Unseen Passages & Poetry Comprehension with literary devices',
          'Methods of Teaching English: Direct Method, Bilingual Method, CLT',
          'Teaching of Listening, Speaking, Reading, Writing (LSRW Skills)',
          'Remedial Teaching & Error Analysis in English Classrooms',
        ],
      },
      {
        subject: 'Child Development & Pedagogy',
        subjectHindi: 'बाल विकास एवं शिक्षण शास्त्र',
        marks: 30,
        questionCount: 30,
        weightagePercentage: 20,
        topics: [
          'Adolescence and development characteristics of middle school learners',
          'Theories of Intelligence (Gardner, Sternberg) and Personality',
          'Constructivism, Experiential Learning & Problem-Solving approaches',
          'Inclusive Education and assessment of learning outcomes',
        ],
      },
      {
        subject: 'General Hindi',
        subjectHindi: 'सामान्य हिन्दी',
        marks: 25,
        questionCount: 25,
        weightagePercentage: 16.7,
        topics: [
          'संधि, समास, रस, छंद, अलंकार',
          'शब्द शुद्धि, वाक्य शुद्धि, मुहावरे व लोकोक्तियां',
          'अपठित गद्यांश एवं पद्यांश',
        ],
      },
      {
        subject: 'Mathematics & Science',
        subjectHindi: 'गणित एवं विज्ञान',
        marks: 30,
        questionCount: 30,
        weightagePercentage: 20,
        topics: [
          'General Science: Motion, Force, Energy, Living Organisms, Human Body',
          'Basic Mathematics: Algebra, Mensuration, Statistics, Percentage',
        ],
      },
      {
        subject: 'Social Studies & General Awareness',
        subjectHindi: 'सामाजिक अध्ययन एवं सामान्य ज्ञान',
        marks: 15,
        questionCount: 15,
        weightagePercentage: 10,
        topics: [
          'Indian History, National Movement & Constitution',
          'Chhattisgarh Special Knowledge: Geography, Rivers, History & Culture',
        ],
      },
      {
        subject: 'Computer Knowledge',
        subjectHindi: 'कम्प्यूटर सामान्य ज्ञान',
        marks: 15,
        questionCount: 15,
        weightagePercentage: 10,
        topics: [
          'Operating Systems, MS Word/PowerPoint, ICT in Education',
          'Internet tools, Online teaching apps, and Cyber security',
        ],
      },
    ],
    features: [
      '14 Curated Tests: 8 Full Mocks + 6 Sectional English & Pedagogy Drills',
      '2 Free Tests with full TCS iON computer based interface',
      'Exhaustive literary devices and grammar explanations for every question',
      'Simulated Percentile & State-Wide Ranking among English teacher aspirants',
      'Custom speed & accuracy analytics highlighting grammar vs pedagogy speed',
    ],
    testItems: [
      {
        id: 'test-teacher-eng-01',
        title: 'Teacher English 2026 Full-Length Mock 01',
        titleHindi: 'शिक्षक अंग्रेजी 2026 संपूर्ण मॉक टेस्ट 01',
        type: 'full_mock',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 2890,
      },
      {
        id: 'test-teacher-eng-02',
        title: 'Teacher English 2026 Full-Length Mock 02',
        titleHindi: 'शिक्षक अंग्रेजी 2026 संपूर्ण मॉक टेस्ट 02',
        type: 'full_mock',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 2140,
      },
      {
        id: 'test-teacher-eng-sec-pedagogy',
        title: 'Sectional: English ELT Pedagogy & Methodology Special',
        titleHindi: 'विभागीय: अंग्रेजी शिक्षण विधियां एवं शिक्षणशास्त्र',
        type: 'sectional',
        questionCount: 35,
        durationMinutes: 35,
        marks: 35,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1640,
      },
      {
        id: 'test-teacher-eng-sec-grammar',
        title: 'Sectional: Advanced Grammar, Syntax & Vocabulary Drill',
        titleHindi: 'विभागीय: एडवांस्ड व्याकरण एवं शब्दावली',
        type: 'sectional',
        questionCount: 35,
        durationMinutes: 35,
        marks: 35,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1580,
      },
    ],
    faqs: [
      {
        question: 'Does this test series cover both literature and grammar?',
        answer: 'Yes, it provides comprehensive coverage of Advanced Grammar, Vocabulary, Literary Devices, as well as English Teaching Methods (ELT Pedagogy).',
      },
      {
        question: 'Are solutions provided for comprehension passages?',
        answer: 'Yes, full sentence-by-sentence explanations with vocabulary definitions and grammatical context are included for every passage.',
      },
    ],
  },

  // =========================================================================
  // 3. CGSSB: Teacher Maths 2026 Test Series (शिक्षक गणित भर्ती 2026)
  // =========================================================================
  {
    id: 'bundle-cgssb-teacher-maths-2026',
    slug: 'teacher-maths-2026',
    title: 'Teacher Maths 2026 Test Series',
    titleHindi: 'शिक्षक गणित (वर्ग-2 माध्यमिक) भर्ती परीक्षा 2026',
    authority: 'CGSSB',
    targetPost: 'Subject Teacher Mathematics & Science (Classes 6 to 8)',
    targetYear: 2026,
    badge: 'Popular',
    badgeColor: 'amber',
    shortDescription: 'Comprehensive test bundle for CG Vyapam Mathematics Teacher Recruitment. 150-mark pattern focusing heavily on Middle School Algebra, Geometry, Arithmetic, Science, and CDP.',
    fullDescription: 'Designed by expert faculty for mathematics aspirants. Includes step-by-step formula derivations, shortcut tricks for competitive time management, conceptual science questions, and full child development pedagogy modules.',
    price: 149,
    originalPrice: 499,
    isProOnly: false,
    totalTestsCount: 15,
    freeTestsCount: 2,
    enrolledStudentsCount: 3950,
    rating: 4.9,
    validity: 'Till Exam Date 2026',
    languageDisplay: 'द्विभाषी (Hindi + English)',
    examPattern: {
      totalQuestions: 150,
      totalMarks: 150,
      durationMinutes: 150,
      markingScheme: '+1.0 Mark per question',
      negativeMarkPenalty: '-0.25 (¼th) Negative Marking',
      language: 'Bilingual (Hindi / English)',
      cadre: 'Class 6 to 8 Subject Teacher',
      keyRules: [
        '150 Questions, 150 Marks, 150 Minutes duration.',
        'Core Mathematics & Science section carries high weightage (40 Marks).',
        '0.25 negative marks deducted for each incorrect attempt.',
      ],
    },
    syllabusBreakdown: [
      {
        subject: 'Mathematics & Science Core',
        subjectHindi: 'गणित एवं विज्ञान मुख्य विषय',
        marks: 40,
        questionCount: 40,
        weightagePercentage: 26.7,
        topics: [
          'बीजगणित (Algebra): बहुपद, रैखिक समीकरण, द्विघात समीकरण, गुणनखंड',
          'अंकगणित: प्रतिशतता, लाभ-हानि, अनुपात, साधारण व चक्रवृद्धि ब्याज, समय-दूरी',
          'ज्यामिति एवं त्रिकोणमिति: त्रिभुज, वृत्त, निर्देशांक ज्यामिति, त्रिकोणमितीय अनुपात',
          'क्षेत्रमिति एवं सांख्यिकी: 2D/3D आकृतियों का आयतन व पृष्ठीय क्षेत्रफल, माध्य-माध्यिका',
          'भौतिकी: गति, बल, कार्य-ऊर्जा, ध्वनि, प्रकाश, विद्युत एवं चुंबकत्व',
          'रसायन विज्ञान: पदार्थ की अवस्थाएं, परमाणु संरचना, रासायनिक अभिक्रियाएं व अम्ल-क्षार',
          'जीव विज्ञान: कोशिका संरचना, मानव तंत्र, पादप पोषण एवं आनुवंशिकी',
          'गणित एवं विज्ञान शिक्षण विधियां (Subject Pedagogy)',
        ],
      },
      {
        subject: 'Child Development & Pedagogy',
        subjectHindi: 'बाल विकास एवं शिक्षण शास्त्र',
        marks: 30,
        questionCount: 30,
        weightagePercentage: 20,
        topics: [
          'Child growth principles, cognitive and moral development',
          'Pedagogical strategies in STEM subjects',
          'Diagnostic testing, remedial instruction and continuous evaluation',
        ],
      },
      {
        subject: 'General Hindi',
        subjectHindi: 'सामान्य हिन्दी',
        marks: 25,
        questionCount: 25,
        weightagePercentage: 16.7,
        topics: [
          'संधि, समास, प्रत्यय, उपसर्ग, शब्द भेद',
          'वाक्य रचना, मुहावरे, लोकोक्तियां एवं अपठित गद्यांश',
        ],
      },
      {
        subject: 'General English',
        subjectHindi: 'सामान्य अंग्रेजी',
        marks: 25,
        questionCount: 25,
        weightagePercentage: 16.7,
        topics: [
          'Grammar, Tenses, Prepositions, Voice, Narration',
          'Vocabulary, One Word Substitution & Reading Comprehension',
        ],
      },
      {
        subject: 'Social Studies & State GK',
        subjectHindi: 'सामाजिक अध्ययन व छत्तीसगढ़ सामान्य ज्ञान',
        marks: 15,
        questionCount: 15,
        weightagePercentage: 10,
        topics: [
          'छत्तीसगढ़ का सामान्य ज्ञान, भौगोलिक विशेषताएं, खनिज व नदियां',
          'भारतीय इतिहास एवं संवैधानिक व्यवस्था',
        ],
      },
      {
        subject: 'Computer Awareness',
        subjectHindi: 'कंप्यूटर सामान्य ज्ञान',
        marks: 15,
        questionCount: 15,
        weightagePercentage: 10,
        topics: [
          'Computer fundamentals, Operating Systems, Office packages & Internet',
        ],
      },
    ],
    features: [
      '15 Tests: 10 Full Mocks + 5 Dedicated Mathematics & Science Drills',
      'Step-by-step mathematical solutions with alternate shortcut techniques',
      'Bilingual interface with complete TCS iON CBT exam simulation',
      'Detailed time-spent analytics per calculation question to optimize speed',
      'Unlimited re-attempts for incorrectly answered mathematics problems',
    ],
    testItems: [
      {
        id: 'test-teacher-maths-01',
        title: 'Teacher Maths 2026 Full-Length Mock 01',
        titleHindi: 'शिक्षक गणित 2026 संपूर्ण मॉक टेस्ट 01',
        type: 'full_mock',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 3120,
      },
      {
        id: 'test-teacher-maths-02',
        title: 'Teacher Maths 2026 Full-Length Mock 02',
        titleHindi: 'शिक्षक गणित 2026 संपूर्ण मॉक टेस्ट 02',
        type: 'full_mock',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 2540,
      },
      {
        id: 'test-teacher-maths-sec-algebra',
        title: 'Sectional: Algebra, Geometry & Mensuration Master Test',
        titleHindi: 'विभागीय: बीजगणित, ज्यामिति एवं क्षेत्रमिति',
        type: 'sectional',
        questionCount: 30,
        durationMinutes: 40,
        marks: 30,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1980,
      },
      {
        id: 'test-teacher-maths-sec-science',
        title: 'Sectional: General Science Core (Physics, Chem, Biology)',
        titleHindi: 'विभागीय: सामान्य विज्ञान (भौतिकी, रसायन, जीव विज्ञान)',
        type: 'sectional',
        questionCount: 30,
        durationMinutes: 30,
        marks: 30,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1870,
      },
    ],
    faqs: [
      {
        question: 'Are mathematical formulas and steps explained in solutions?',
        answer: 'Yes! Every solution includes clear step-by-step mathematical reasoning, formulas used, and alternate shortcut techniques where applicable.',
      },
      {
        question: 'Does it cover Class 9 and 10 level mathematics?',
        answer: 'Yes, questions align strictly with standard CG Board and NCERT Class 6 to 10 syllabus standards as expected in the recruitment exam.',
      },
    ],
  },

  // =========================================================================
  // 4. CGSSB: Lecturer English 2026 Test Series (व्याख्याता अंग्रेजी 2026)
  // =========================================================================
  {
    id: 'bundle-cgssb-lecturer-english-2026',
    slug: 'lecturer-english-2026',
    title: 'Lecturer English 2026 Test Series',
    titleHindi: 'व्याख्याता अंग्रेजी (वर्ग-1 उच्चतर माध्यमिक) परीक्षा 2026',
    authority: 'CGSSB',
    targetPost: 'Lecturer English (Higher Secondary Classes 9 to 12 / PGT)',
    targetYear: 2026,
    badge: 'PGT Level',
    badgeColor: 'purple',
    shortDescription: 'Advanced Postgraduate-level test series for CG Vyapam English Lecturer (Class 9-12). In-depth British & Indian English Literature, Criticism, Linguistics, and Educational Psychology.',
    fullDescription: 'Tailored for postgraduate aspirants preparing for CG School Education Lecturer (English) posts. Covers Shakespearean drama, Romantic and Victorian poetry, Modern prose, Literary terms and criticism, Phonetics and Linguistics, along with 30 marks of Educational Pedagogy.',
    price: 149,
    originalPrice: 499,
    isProOnly: false,
    totalTestsCount: 12,
    freeTestsCount: 2,
    enrolledStudentsCount: 2890,
    rating: 4.9,
    validity: 'Till Exam Date 2026',
    languageDisplay: 'अंग्रेजी (English Core) + हिन्दी',
    examPattern: {
      totalQuestions: 150,
      totalMarks: 150,
      durationMinutes: 150,
      markingScheme: '+1.0 Mark per question',
      negativeMarkPenalty: '-0.25 (¼th) Negative Marking',
      language: 'English for Subject Core, Bilingual for Pedagogy/GK',
      cadre: 'Class 9 to 12 Higher Secondary Lecturer (PGT)',
      keyRules: [
        'Total 150 Questions for 150 Marks with 1/4th negative deduction.',
        '100 Marks exclusively dedicated to English Subject Knowledge & Literature.',
        '30 Marks for Educational Psychology, Pedagogy & Teaching Methodology.',
        '20 Marks for General Knowledge and Computer Awareness.',
      ],
    },
    syllabusBreakdown: [
      {
        subject: 'English Subject Core & Literature',
        subjectHindi: 'अंग्रेजी मुख्य विषय एवं साहित्य (100 अंक)',
        marks: 100,
        questionCount: 100,
        weightagePercentage: 66.7,
        topics: [
          'British Literature: Elizabethan, Romantic, Victorian, and 20th Century Periods',
          'Shakespearean Tragedies, Comedies, Historical Plays and Sonnets',
          'Major Poets: Milton, Wordsworth, Keats, Shelley, Tennyson, T.S. Eliot',
          'Indian Writing in English: R.K. Narayan, Mulk Raj Anand, Nissim Ezekiel, Kamala Das',
          'Literary Forms, Movements, Criticism and Theory (Aristotle to Postmodernism)',
          'Advanced Linguistics, Phonetics, IPA Symbols, Stress and Intonation',
          'Advanced English Grammar, Rhetoric, Stylistics and Syntax Analysis',
        ],
      },
      {
        subject: 'Educational Psychology & Pedagogy',
        subjectHindi: 'शैक्षिक मनोविज्ञान एवं शिक्षण शास्त्र (30 अंक)',
        marks: 30,
        questionCount: 30,
        weightagePercentage: 20,
        topics: [
          'Psychology of adolescent learners (Classes 9-12)',
          'Learning theories, motivation, retention and higher-order thinking (HOTs)',
          'Curriculum development, ICT integration, and National Education Policy (NEP 2020)',
          'Measurement and evaluation in secondary and higher secondary education',
        ],
      },
      {
        subject: 'General Knowledge & Computer Awareness',
        subjectHindi: 'सामान्य ज्ञान एवं कंप्यूटर जागरूकता (20 अंक)',
        marks: 20,
        questionCount: 20,
        weightagePercentage: 13.3,
        topics: [
          'Chhattisgarh Special GK: History, Heritage, Demographics and Current Events',
          'Computer Hardware, MS Office, Educational Tech and Internet applications',
        ],
      },
    ],
    features: [
      '12 Comprehensive Tests: 8 Full-Length Mocks + 4 Literature Special Sectionals',
      '2 Free Tests available immediately without payment barrier',
      'Detailed literary notes, biographical context, and poem/play citations in solutions',
      'Realistic TCS iON CBT exam simulation with bilingual toggle for pedagogy',
      'Simulated Rank among state postgraduate candidates across Chhattisgarh',
    ],
    testItems: [
      {
        id: 'test-lecturer-eng-01',
        title: 'Lecturer English 2026 Full-Length Mock 01',
        titleHindi: 'व्याख्याता अंग्रेजी 2026 संपूर्ण मॉक टेस्ट 01',
        type: 'full_mock',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 2210,
      },
      {
        id: 'test-lecturer-eng-02',
        title: 'Lecturer English 2026 Full-Length Mock 02',
        titleHindi: 'व्याख्याता अंग्रेजी 2026 संपूर्ण मॉक टेस्ट 02',
        type: 'full_mock',
        questionCount: 150,
        durationMinutes: 150,
        marks: 150,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 1840,
      },
      {
        id: 'test-lecturer-eng-sec-lit',
        title: 'Sectional: British & Indian Literature, Drama & Poetry Drill',
        titleHindi: 'विभागीय: ब्रिटिश एवं भारतीय साहित्य, नाटक व कविता',
        type: 'sectional',
        questionCount: 50,
        durationMinutes: 50,
        marks: 50,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1420,
      },
      {
        id: 'test-lecturer-eng-sec-phonetics',
        title: 'Sectional: Linguistics, Phonetics, IPA Symbols & Advanced Grammar',
        titleHindi: 'विभागीय: भाषाविज्ञान, ध्वनिविज्ञान एवं उन्नत व्याकरण',
        type: 'sectional',
        questionCount: 50,
        durationMinutes: 50,
        marks: 50,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1310,
      },
    ],
    faqs: [
      {
        question: 'Does this test series cover the exact PG Literature syllabus?',
        answer: 'Yes, questions are curated strictly based on postgraduate English literature syllabus prescribed by Chhattisgarh Higher Secondary Education.',
      },
      {
        question: 'Are quotes and literary context explained in the solutions?',
        answer: 'Yes! Every literary question features the full work reference, character breakdown, and thematic analysis in the solution pane.',
      },
    ],
  },

  // =========================================================================
  // 5. CGSSB: CGSSB SI 2026 Test Series (छत्तीसगढ़ सब इंस्पेक्टर 2026)
  // =========================================================================
  {
    id: 'bundle-cgssb-si-2026',
    slug: 'cgssb-si-2026',
    title: 'CGSSB SI 2026 Test Series',
    titleHindi: 'छत्तीसगढ़ पुलिस सब इंस्पेक्टर (SI / सूबेदार) भर्ती 2026',
    authority: 'CGSSB',
    targetPost: 'Sub-Inspector (SI), Subedar & Platoon Commander',
    targetYear: 2026,
    badge: 'Recruitment 2026',
    badgeColor: 'emerald',
    shortDescription: 'Official 300-Marks pattern test series for CG Police Sub-Inspector (SI / Platoon Commander). Heavy weightage on Chhattisgarh GK, Indian GS, Aptitude, and Science.',
    fullDescription: 'The most authoritative test series for police aspirants in Chhattisgarh. Modeled on the authentic CG Police SI Prelims & Mains examination standards, featuring 100 questions carrying 300 total marks, covering state history, tribes, crime laws, reasoning, and mental ability.',
    price: 149,
    originalPrice: 499,
    isProOnly: false,
    totalTestsCount: 16,
    freeTestsCount: 2,
    enrolledStudentsCount: 5120,
    rating: 4.9,
    validity: 'Till Exam Date 2026',
    languageDisplay: 'द्विभाषी (Hindi + English)',
    examPattern: {
      totalQuestions: 100,
      totalMarks: 300,
      durationMinutes: 120,
      markingScheme: '+3.0 Marks for each correct answer',
      negativeMarkPenalty: 'No negative marking in Prelims (0.0)',
      language: 'Bilingual (Hindi / English)',
      cadre: 'Police & Defense Cadre',
      keyRules: [
        '100 Objective Questions carrying 3.0 marks each (Total 300 Marks).',
        'Exam duration is 2 Hours (120 Minutes).',
        'No negative marking in Preliminary phase.',
        '50% of the questions focus directly on Chhattisgarh Special General Knowledge.',
      ],
    },
    syllabusBreakdown: [
      {
        subject: 'General Studies & Chhattisgarh GK',
        subjectHindi: 'सामान्य अध्ययन एवं छत्तीसगढ़ सामान्य ज्ञान (150 अंक)',
        marks: 150,
        questionCount: 50,
        weightagePercentage: 50,
        topics: [
          'छत्तीसगढ़ का इतिहास, स्वतंत्रता संग्राम, कलचुरी व मराठा काल, प्रमुख रियासतें',
          'छत्तीसगढ़ का भूगोल: नदियां, जलप्रपात, वन, खनिज, राष्ट्रीय उद्यान व अभयारण्य',
          'जनजातियां, लोक कला, संस्कृति, तीजा-पोरा, बस्तर दशहरा, लोकगीत व नृत्य',
          'छत्तीसगढ़ की अर्थव्यवस्था, कृषि, सिंचाई एवं प्रमुख सरकारी जनकल्याणकारी योजनाएं',
          'भारतीय इतिहास, भूगोल, भारतीय राजव्यवस्था, संविधान, पंचायती राज एवं समसामयिकी',
        ],
      },
      {
        subject: 'Aptitude, Reasoning & Mental Ability',
        subjectHindi: 'तर्कशक्ति, गणित एवं मानसिक अभियोग्यता (100 अंक)',
        marks: 100,
        questionCount: 35,
        weightagePercentage: 33.3,
        topics: [
          'तार्किक क्षमता (Logical Reasoning), कोडिंग-डिकोडिंग, रक्त संबंध, दिशा ज्ञान',
          'श्रृंखला (Series), वेन आरेख, सादृश्यता (Analogy), कथन एवं निष्कर्ष',
          'अंकगणितीय क्षमता: प्रतिशत, अनुपात, कार्य-समय, औसत, चाल-समय-दूरी',
          'डेटा इंटरप्रिटेशन (DI) एवं बुनियादी संख्यात्मक विश्लेषण',
        ],
      },
      {
        subject: 'General Science & Computer Knowledge',
        subjectHindi: 'सामान्य विज्ञान एवं कम्प्यूटर ज्ञान (50 अंक)',
        marks: 50,
        questionCount: 15,
        weightagePercentage: 16.7,
        topics: [
          'दैनिक जीवन में विज्ञान: भौतिकी, रसायन, मानव शरीर विज्ञान एवं स्वास्थ्य',
          'पर्यावरण एवं पारिस्थितिकी, साइबर सुरक्षा, इंटरनेट व कंप्यूटर अनुप्रयोग',
        ],
      },
    ],
    features: [
      '16 Total Tests: 10 Full-Length Prelims Mocks + 6 Sectional Drills',
      '2 Free Full-Length Tests available to attempt anytime without logging in',
      'Exact CG Police SI marking: +3.0 Marks per question with authentic timer',
      'Simulated State Rank & Cut-off predictor modeled on previous recruitment cycles',
      'Bilingual switch with instant question bookmarking and Mistake Notebook sync',
    ],
    testItems: [
      {
        id: 'test-cg-police-si-01',
        title: 'CG Police Sub-Inspector (SI) Official Prelims Mock 01',
        titleHindi: 'छत्तीसगढ़ पुलिस सब-इंस्पेक्टर ऑफिशियल प्रीलिम्स मॉक 01',
        type: 'full_mock',
        questionCount: 100,
        durationMinutes: 120,
        marks: 300,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 3890,
      },
      {
        id: 'test-cg-police-si-02',
        title: 'CG Police Sub-Inspector (SI) High-Yield Mock 02',
        titleHindi: 'छत्तीसगढ़ पुलिस सब-इंस्पेक्टर मॉडल टेस्ट 02',
        type: 'full_mock',
        questionCount: 100,
        durationMinutes: 120,
        marks: 300,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 2940,
      },
      {
        id: 'test-si-sec-cggk',
        title: 'Sectional: Chhattisgarh GK & Tribal Heritage 50 Qs Booster',
        titleHindi: 'विभागीय: छत्तीसगढ़ सामान्य ज्ञान व जनजातीय संस्कृति',
        type: 'sectional',
        questionCount: 50,
        durationMinutes: 60,
        marks: 150,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 2210,
      },
      {
        id: 'test-si-sec-aptitude',
        title: 'Sectional: Police Aptitude, Reasoning & Logic Mastery',
        titleHindi: 'विभागीय: मानसिक अभियोग्यता एवं तर्कशक्ति',
        type: 'sectional',
        questionCount: 35,
        durationMinutes: 45,
        marks: 105,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 1980,
      },
      {
        id: 'test-si-pyp-2023',
        title: 'Official Solved Paper: CG Police SI Prelims Exam 2023',
        titleHindi: 'आधिकारिक हल प्रश्नपत्र: छत्तीसगढ़ पुलिस सब-इंस्पेक्टर 2023',
        type: 'pyp',
        questionCount: 100,
        durationMinutes: 120,
        marks: 300,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 4210,
      },
    ],
    faqs: [
      {
        question: 'Is this test series based on the latest 300-marks SI pattern?',
        answer: 'Yes! It strictly adheres to the official CG Police recruitment standard of 100 questions carrying 3 marks each, totaling 300 marks.',
      },
      {
        question: 'Is there negative marking in the SI Prelims mock tests?',
        answer: 'No, as per official police notification guidelines, the preliminary exam has no negative marking, and the simulation reflects this exactly.',
      },
    ],
  },

  // =========================================================================
  // 6. CGPSC: CGPSC PRE 2026 Test series (राज्य सेवा प्रारंभिक परीक्षा 2026)
  // =========================================================================
  {
    id: 'bundle-cgpsc-pre-2026',
    slug: 'cgpsc-pre-2026',
    title: 'CGPSC PRE 2026 Test series',
    titleHindi: 'CGPSC राज्य सेवा प्रारंभिक परीक्षा (SSE Prelims) 2026 टेस्ट सीरीज',
    authority: 'CGPSC',
    targetPost: 'Deputy Collector, DSP, Accounts Officer, Sub-Registrar & State Cadres',
    targetYear: 2026,
    badge: 'State PSC Flagship',
    badgeColor: 'rose',
    shortDescription: 'The definitive test series for CGPSC State Service Preliminary Exam 2026. Full coverage of Paper 1 (General Studies 200 Marks) & Paper 2 (CSAT / Aptitude 200 Marks) with -0.667 negative marking.',
    fullDescription: 'Meticulously crafted by top CGPSC rankers and subject experts. Features standard +2.0 / -0.667 negative marking calculation, bilingual questions in Hindi and English, 100% authentic state culture and history questions, and 12 years of solved past papers (2012-2024).',
    price: 199,
    originalPrice: 699,
    isProOnly: false,
    totalTestsCount: 25,
    freeTestsCount: 3,
    enrolledStudentsCount: 6450,
    rating: 4.95,
    validity: 'Till CGPSC Prelims Exam 2026',
    languageDisplay: 'द्विभाषी (Hindi + English)',
    examPattern: {
      totalQuestions: 100,
      totalMarks: 200,
      durationMinutes: 120,
      markingScheme: '+2.0 Marks for each correct answer',
      negativeMarkPenalty: '-0.667 (⅓rd of 2 marks) Negative Marking per incorrect response',
      language: 'Bilingual (Hindi / English)',
      cadre: 'Class I & II State Administrative Services',
      passingCriteria: 'Paper 1 determines Merit list. Paper 2 CSAT is qualifying (33% for General, 23% for Reserved).',
      keyRules: [
        'Paper 1 (General Studies): 100 Questions, 200 Marks, 2 Hours. Merit deciding.',
        'Paper 2 (CSAT Aptitude): 100 Questions, 200 Marks, 2 Hours. Qualifying only.',
        'Negative marking: 1/3rd penalty (-0.667 marks) for every wrong answer.',
        '50% of Paper 1 is composed of Chhattisgarh Special Knowledge (50 Qs / 100 Marks).',
      ],
    },
    syllabusBreakdown: [
      {
        subject: 'Paper 1 Part A: General Studies of India',
        subjectHindi: 'प्रश्नपत्र 1 भाग 1: भारत का सामान्य अध्ययन (100 अंक)',
        marks: 100,
        questionCount: 50,
        weightagePercentage: 25,
        topics: [
          'History of India and Indian National Movement',
          'Physical, Social & Economic Geography of India',
          'Constitution of India & Polity, Panchayati Raj, Public Administration',
          'Indian Economy, Planning, Banking & Sustainable Development',
          'General Science & Technology, Environment and Ecology',
          'Current Affairs of National and International Importance, Sports',
        ],
      },
      {
        subject: 'Paper 1 Part B: Chhattisgarh General Knowledge',
        subjectHindi: 'प्रश्नपत्र 1 भाग 2: छत्तीसगढ़ का सामान्य ज्ञान (100 अंक)',
        marks: 100,
        questionCount: 50,
        weightagePercentage: 25,
        topics: [
          'History of Chhattisgarh, Contribution in Freedom Movement, Major Dynasties',
          'Geography, Climate, Physical status, Rivers, Waterfalls, Forests & Minerals',
          'Literature, Music, Dance, Art and Culture, Idioms (Hana), Riddles (Janula)',
          'Tribes, Special Traditions, Teej and Festivals of Chhattisgarh',
          'Economy, Agriculture, Forest Produce, Administrative Structure & Panchayats',
          'Energy, Water & Mineral resources, Industry, Schemes & Current Affairs',
        ],
      },
      {
        subject: 'Paper 2: Aptitude Test & CSAT (Qualifying)',
        subjectHindi: 'प्रश्नपत्र 2: योग्यता परीक्षा / सीसैट (200 अंक - अर्हक)',
        marks: 200,
        questionCount: 100,
        weightagePercentage: 50,
        topics: [
          'Interpersonal Skills including Communication Skills',
          'Logical Reasoning and Analytical Ability',
          'Decision Making and Problem Solving',
          'General Mental Ability and Basic Numeracy (Numbers and relations - Class 10)',
          'Data Interpretation (Charts, graphs, tables - Class 10 level)',
          'Knowledge of Hindi Language (Class 10 level)',
          'Knowledge of Chhattisgarhi Language (Grammar, dialects & idioms)',
        ],
      },
    ],
    features: [
      '25 Total Tests: 15 Full Mocks (Paper 1 + Paper 2) + 10 Sectional Subject Tests',
      '3 Free Tests available to start instantly without login',
      'Exact CGPSC standard (+2.0 / -0.667) scoring calculation',
      'All-Chhattisgarh Simulated Rank, Percentile and Cut-off estimate',
      'Detailed analytical solutions with historical references and bilingual explanations',
      'Integrated Mistake Notebook to master weak areas in Chhattisgarhi and CSAT',
    ],
    testItems: [
      {
        id: 'test-cgpsc-01',
        title: 'CGPSC State Service Prelims Paper 1 Mock 01 (General Studies)',
        titleHindi: 'CGPSC राज्य सेवा प्रारंभिक परीक्षा प्रश्नपत्र-1 मॉक 01 (जीएस)',
        type: 'full_mock',
        questionCount: 100,
        durationMinutes: 120,
        marks: 200,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 4890,
      },
      {
        id: 'test-cgpsc-02',
        title: 'CGPSC State Service Prelims Paper 2 Mock 01 (CSAT Aptitude)',
        titleHindi: 'CGPSC राज्य सेवा प्रारंभिक परीक्षा प्रश्नपत्र-2 मॉक 01 (सीसैट)',
        type: 'full_mock',
        questionCount: 100,
        durationMinutes: 120,
        marks: 200,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 3650,
      },
      {
        id: 'test-cgpsc-forest-01',
        title: 'CGPSC State Forest Service (ACF / Ranger) Prelims Mock 01',
        titleHindi: 'CGPSC वन सेवा (एसीएफ/रेंजर) प्रारंभिक परीक्षा मॉक 01',
        type: 'full_mock',
        questionCount: 100,
        durationMinutes: 150,
        marks: 300,
        isFreePreview: true,
        statusText: 'Free Preview Available',
        attemptsCount: 1680,
      },
      {
        id: 'test-cgpsc-sec-cg-history',
        title: 'Sectional: CG History, Kalchuri Dynasty & Freedom Struggle',
        titleHindi: 'विभागीय: छत्तीसगढ़ इतिहास, कलचुरी वंश एवं स्वतंत्रता संग्राम',
        type: 'sectional',
        questionCount: 50,
        durationMinutes: 60,
        marks: 100,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 2420,
      },
      {
        id: 'test-cgpsc-sec-tribes',
        title: 'Sectional: CG Tribes, Culture, Bastar Dussehra & Dialects',
        titleHindi: 'विभागीय: छत्तीसगढ़ की जनजातियां, कला एवं संस्कृति',
        type: 'sectional',
        questionCount: 50,
        durationMinutes: 60,
        marks: 100,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 2280,
      },
      {
        id: 'pyp-cgpsc-2023',
        title: 'Official Solved Paper: CGPSC Prelims 2023 Paper 1 (General Studies)',
        titleHindi: 'आधिकारिक हल प्रश्नपत्र: CGPSC प्रारंभिक परीक्षा 2023 पेपर 1',
        type: 'pyp',
        questionCount: 100,
        durationMinutes: 120,
        marks: 200,
        isFreePreview: false,
        statusText: 'Pro Bundle',
        attemptsCount: 5120,
      },
    ],
    faqs: [
      {
        question: 'Does this bundle include both Paper 1 (GS) and Paper 2 (CSAT)?',
        answer: 'Yes! The series includes full-length simulations for both General Studies Paper 1 and CSAT Paper 2 with qualifying score metrics.',
      },
      {
        question: 'How is the negative marking calculated?',
        answer: 'The system deducts exactly 1/3rd of the marks assigned to each question (-0.667 marks for a 2-mark question), matching official CGPSC norms.',
      },
      {
        question: 'Are questions bilingual?',
        answer: 'Yes, both Hindi and English versions are displayed side-by-side with instantaneous toggling during the examination.',
      },
    ],
  },
];
