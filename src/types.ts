export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  credits?: number; // legacy optional (credit system removed in favor of tenure pass)
  hasProPass?: boolean;
  proPassPlan?: 'monthly' | 'yearly' | string;
  passExpiresAt?: string; // ISO date string of pass expiry
  passDurationDays?: number; // 30 or 365
  boundDeviceId?: string; // Device ID bound to this pass (One Device, One Pass)
  boundDeviceName?: string; // e.g. "Android Chrome", "Windows PC"
  avatar?: string;
  token?: string;
  registeredAt: string;
  // Extended Student Profile Fields
  targetExam?: string;             // e.g. "CGPSC State Service", "CG Vyapam Hostel Warden", "CG Shikshak 2026"
  targetYear?: number;             // e.g. 2026
  district?: string;               // e.g. "Raipur", "Bilaspur", "Durg", "Bastar", "Surguja"
  categoryReservation?: 'UR' | 'OBC' | 'SC' | 'ST' | 'EWS';
  gender?: 'Male' | 'Female' | 'Other';
  education?: string;              // e.g. "Graduate / B.Ed."
  medium?: 'Hindi' | 'English';
  bio?: string;                    // e.g. "Aspiring CGPSC Deputy Collector 2026"
  dailyGoalQuestions?: number;      // e.g. 50
}

export type ExamCategory = 'CGSSB' | 'CGPSC' | 'SWAMI_ATMANAND' | 'CENTRAL_EXAMS' | 'TEACHER_RECRUITMENT';

export interface ExamPatternConfig {
  id: ExamCategory;
  name: string;
  shortName: string;
  totalQuestions: number;
  durationMinutes: number;
  marksPerCorrect: number;
  negativeMarksRatio: number; // e.g. 1/3 = 0.333
  negativeMarksPerWrong: number; // calculated e.g. 0.33 for CGSSB, 0.67 for CGPSC
  description: string;
  color: string;
  badge: string;
  isComingSoon?: boolean;
}

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type QuestionType = 'mcq' | 'matching' | 'assertion_reason' | 'multi_statement';
export type SubjectCategory = 'language' | 'non_language';
export type QuestionLanguage = 'en' | 'hi' | 'both';

export interface QuestionOption {
  label?: 'A' | 'B' | 'C' | 'D' | string;
  id?: 'A' | 'B' | 'C' | 'D' | string; // Backwards compatibility alias
  text: string;               // English text
  textHindi?: string;         // Hindi text
}

export interface PYQAppearance {
  id?: string;
  examName: string;
  year: number;
  shift?: string;
}

export interface Question {
  id: string;                       // Unique, e.g., "CG-LECT-2026-EN-001" or "QID-CGSSB-2024-001"
  uniqueQuestionId?: string;
  authority?: string;                // e.g. "CGSSB", "CGPSC", "Central Exams"
  subCategory?: string;              // e.g. "Teacher Recruitment 2026", "Police Recruitment 2026"
  postName?: string;                 // e.g. "CG Lecturer 2026", "CG Teacher 2026"
  examName?: string;                 // e.g., "CG English Lecturer 2026"
  year?: number;                     // e.g., 2026
  category: ExamCategory | string;   // e.g., "CG Lecturer" or "CGSSB"
  subject: string;                  // e.g., "General English"
  topic: string;                    // e.g., "Prepositions"
  subtopic?: string;                // e.g., "Compound Prepositions"
  difficulty: DifficultyLevel;
  marks: number;                    // Usually 1
  negativeMarks: number;            // Usually 0.25 (or 0.33)

  // Advanced question rendering metadata
  questionType?: QuestionType;                      // 'mcq' | 'matching' | 'assertion_reason' | 'multi_statement'
  type?: QuestionType;                              // Backward-compatibility alias for questionType
  subjectCategory?: SubjectCategory;                // 'language' | 'non_language'
  questionLanguage?: QuestionLanguage;              // 'en' | 'hi' | 'both'

  // Question text (bilingual stems)
  question?: string;                 // English stem
  questionHindi?: string;            // Hindi stem
  questionText: string;              // Base question text (guaranteed string)
  text?: string;                     // Backward-compatibility alias
  questionEnglish?: string;          // Backward-compatibility alias
  textHindi?: string;                // Backward-compatibility alias

  // Structured multi-type components
  statements?: Array<{ id?: string | number; text?: string; textHindi?: string; [key: string]: any }>;
  columnA?: Array<{ id?: string | number; text?: string; textHindi?: string; [key: string]: any }>;
  columnB?: Array<{ id?: string | number; text?: string; textHindi?: string; [key: string]: any }>;
  assertion?: string;
  assertionHindi?: string;
  reason?: string;
  reasonHindi?: string;

  // Options (bilingual)
  options: QuestionOption[];

  correctOption: 'A' | 'B' | 'C' | 'D';
  correctAnswer?: 'A' | 'B' | 'C' | 'D'; // Backward-compatibility alias
  modelKey?: 'A' | 'B' | 'C' | 'D';      // Official preliminary model key
  finalAmendedKey?: 'A' | 'B' | 'C' | 'D'; // Final amended official key (e.g. CGPSC / Vyapam)
  isCancelled?: boolean;                 // Marked cancelled by board - bonus marks
  imageUrl?: string;                     // Diagram or geography map URL
  diagramSvg?: string;                   // Inline SVG diagram
  currentAffairTopicId?: string;
  exams?: string[];
  subjects?: string[];
  region?: string;
  sourceIds?: string[];
  date?: string;
  monthYear?: string;
  status?: string;
  explanation: string;              // English
  explanationHindi?: string;         // Hindi

  // Timings & analytics
  idealTimeSeconds?: number;        // Topper / benchmark time in seconds (e.g. 45s)

  // Provenance & PYQ relations
  originType?: 'mock' | 'pyq';
  pypSource?: string;
  examSource?: string;
  pypAppearances?: PYQAppearance[];
  repeatedInExams?: string[];
  similarQuestionIds?: string[];
  moduleId?: string;
  chapterId?: string;
  chapterName?: string;
  chapter?: string;
  keyFactHindi?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionBookmark {
  questionId: string;
  createdAt: string;
  note?: string;
  sourceTestTitle?: string;
  subject?: string;
}

export interface MistakeRecord {
  questionId: string;
  testId: string;
  testTitle: string;
  attemptDate: string;
  selectedOption: string | null;
  correctOption: string;
  subject: string;
  isSkipped: boolean;
  resolved?: boolean;
}

export type ExamPaper = MockTest;

export type QuestionPaletteStatus = 
  | 'not_visited' 
  | 'unanswered' 
  | 'answered' 
  | 'marked_for_review' 
  | 'answered_and_marked';

export interface MockTestSection {
  id: string;
  name: string;
  questionIds: string[];
}

export interface MockTest {
  id: string;
  title: string;
  titleHindi?: string;
  authority?: string;
  category: ExamCategory;
  subCategory?: string;
  postName?: string;
  examName?: string;
  testType?: string;
  subject?: string;
  topic?: string;
  description: string;
  durationMinutes: number;
  totalMarks?: number;
  marksPerQuestion: number;
  negativeMarksPerQuestion: number;
  isPYP?: boolean;
  originType?: 'pyq' | 'mock';
  isPro?: boolean;
  pypYear?: number;
  pypExamName?: string;
  sections: MockTestSection[];
  questionCount: number;
  attemptsCount: number;
  passingPercentage?: number;
  isPublished?: boolean;
  difficultyDistribution?: { easy: number; medium: number; hard: number };
  createdAt?: string;
}

export interface PreviousYearPaper {
  id: string;
  title: string;
  authority?: string;
  examCategory: ExamCategory;
  subCategory?: string;
  postName?: string;
  examName?: string;
  year: number;
  totalQuestions: number;
  durationMinutes: number;
  marks: number;
  negativeMarkingRatio: string;
  testId?: string; // If linked to playable test
  linkedMockTestId?: string;
  isOfficialPaper?: boolean;
  paperSummary: string;
  subjectsWeightage: { subject: string; questionCount: number; percentage: number }[];
  downloadFileName?: string;
  fileSize?: string;
  downloadUrl?: string;
  linkedQuestionIds?: string[];
  createdAt?: string;
}

export interface SectorAnalysis {
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  score: number;
  maxScore: number;
  timeSpentSeconds?: number;
}

export interface TestAttempt {
  id: string;
  userId: string;
  userName: string;
  testId: string;
  testTitle: string;
  category: ExamCategory;
  submittedAt: string;
  timeTakenSeconds: number;
  totalDurationSeconds: number;
  responses: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  questionStatuses: Record<string, QuestionPaletteStatus>;
  score: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  markedForReviewCount: number;
  negativeMarksDeducted: number;
  simulatedRank: number;
  totalParticipants: number;
  percentile: number;
  sectorAnalysis: SectorAnalysis[];
}

export interface HierarchicalSubjectNode {
  subject: string;
  topics: {
    name: string;
    subtopics: string[];
  }[];
}

export interface BulkImportQuestion {
  'S.No.': number | string;
  Examname: string;
  Year: number | string;
  'Question(Hindi)': string;
  'Question(english)': string;
  option_A: string;
  option_B: string;
  option_C: string;
  option_D: string;
  answer: string;
  explaination: string;
  uniqueQuestionId?: string;
  // Optional chapter linking & repeated metadata (can be supplied in JSON or auto-linked)
  chapterName?: string;
  chapter?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  timesRepeated?: number;
  repeatedInExams?: string[] | string;
}

// ==========================================
// SERVER-DRIVEN UI & REMOTE CONFIG (FAANG GRADE)
// ==========================================
export interface AppRemoteConfig {
  version: string;
  updatedAt: string;
  updatedBy?: string;
  featureFlags: {
    enableMistakeNotebook: boolean;
    enablePYPSection: boolean;
    enableChapterTests: boolean;
    enableLiveLeaderboard: boolean;
    enableCurrentAffairsAI: boolean;
    enableTestPassPaywall: boolean;
    enableChhattisgarhiRevision: boolean;
    enableSocialShareChallenges: boolean;
    enableAITestGenerator: boolean;
    enableStudentAnalytics: boolean;
    enableBookmarks: boolean;
    enableLanguageToggle: boolean;
  };
  maintenanceMode: {
    enabled: boolean;
    title: string;
    message: string;
    estimatedEndTime?: string;
  };
  globalAlertBanner: {
    enabled: boolean;
    message: string;
    messageHindi: string;
    type: 'info' | 'warning' | 'alert' | 'success';
    actionText?: string;
    actionLinkTab?: string;
    isDismissible: boolean;
  };
  examEngineRules: {
    enforceStrictFullscreen: boolean;
    disableCopyPaste: boolean;
    allowSectionSwitching: boolean;
    showWatermark: boolean;
    watermarkText: string;
    autoSubmitOnTimerExpiry: boolean;
    showRealtimeRemainingWarning: boolean;
  };
  pricingConfig: {
    annualPassPrice: number;
    quarterlyPassPrice: number;
    discountPercentage: number;
    signupBonusCredits: number;
    creditsPerAIGeneration: number;
    currencySymbol: string;
  };
  brandingConfig: {
    siteTitle: string;
    tagline: string;
    primaryExamCadre: string;
    supportContactPhone: string;
    supportContactEmail: string;
  };
}

export const DEFAULT_REMOTE_CONFIG: AppRemoteConfig = {
  version: '1.4.0',
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Default',
  featureFlags: {
    enableMistakeNotebook: true,
    enablePYPSection: true,
    enableChapterTests: true,
    enableLiveLeaderboard: true,
    enableCurrentAffairsAI: true,
    enableTestPassPaywall: true,
    enableChhattisgarhiRevision: true,
    enableSocialShareChallenges: true,
    enableAITestGenerator: true,
    enableStudentAnalytics: true,
    enableBookmarks: true,
    enableLanguageToggle: true,
  },
  maintenanceMode: {
    enabled: false,
    title: 'Platform Maintenance in Progress',
    message: 'We are performing scheduled server upgrades to ensure seamless live exam delivery. Portal will resume shortly.',
    estimatedEndTime: '15 mins',
  },
  globalAlertBanner: {
    enabled: true,
    message: 'CGSSB 2026 Official Test Series & PYP Solved Papers now live with instant state-wide ranking!',
    messageHindi: 'सीजीएसएसबी 2026 आधिकारिक टेस्ट सीरीज़ और पिछले वर्षों के हल प्रश्नपत्र अब लाइव हैं!',
    type: 'info',
    actionText: 'Explore Series',
    actionLinkTab: 'tests',
    isDismissible: true,
  },
  examEngineRules: {
    enforceStrictFullscreen: false,
    disableCopyPaste: true,
    allowSectionSwitching: true,
    showWatermark: true,
    watermarkText: 'CGSSB TEST OFFICIAL',
    autoSubmitOnTimerExpiry: true,
    showRealtimeRemainingWarning: true,
  },
  pricingConfig: {
    annualPassPrice: 499,
    quarterlyPassPrice: 299,
    discountPercentage: 60,
    signupBonusCredits: 50,
    creditsPerAIGeneration: 10,
    currencySymbol: '₹',
  },
  brandingConfig: {
    siteTitle: 'CGSSB & CGPSC Test Portal',
    tagline: 'Authentic State Examination Preparation & CBT Testing Platform',
    primaryExamCadre: 'CGSSB + CGPSC Combined Cadre',
    supportContactPhone: '+91 98765 43210',
    supportContactEmail: 'support@cgssbtest.com',
  },
};

