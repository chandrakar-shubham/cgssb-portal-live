import type { MockTest } from '../types.ts';

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
  authorityId: string;
  programId: string;
  postId?: string;
  seriesId?: string;
  seriesType?: 'full_mock' | 'chapter_test' | 'subject_test' | 'pyp' | 'live_test' | 'practice' | 'mixed';

  // Legacy display fields are retained only inside the content document for compatibility.
  // They are not used to determine canonical hierarchy.
  authority?: string;
  targetPost?: string;
  targetYear?: number;

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
  isPublished?: boolean;
  seoMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}