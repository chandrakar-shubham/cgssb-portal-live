import { Question, DifficultyLevel } from '../types';

export type SourceType =
  | 'government'
  | 'pib'
  | 'janman'
  | 'rojgaar'
  | 'budget'
  | 'economic_survey'
  | 'rbi'
  | 'sebi'
  | 'niti_aayog'
  | 'isro'
  | 'international_organization'
  | 'official_report'
  | 'news'
  | 'other'
  | string;

export type SourceRegion = 'chhattisgarh' | 'india' | 'international' | 'combined' | string;

export type VerificationStatus = 'verified' | 'unverified' | 'pending' | string;

export type ContentStatus = 'draft' | 'validated' | 'approved' | 'published' | 'archived' | string;

export type CurrentAffairsQuestion = Question;

export interface CurrentAffairSource {
  id: string;
  name: string;
  organization: string;
  type?: SourceType;
  url?: string;
  publicationDate?: string;
  region?: SourceRegion;
  verificationStatus?: VerificationStatus;
  verificationDate?: string;
  priority?: string;
  evidenceSummary?: string;
  category?: SourceRegion;
  enabled?: boolean;
  description?: string;
  [key: string]: any;
}

export type CurrentAffairsSourceRegistryItem = CurrentAffairSource;

export interface CurrentAffairsTopic {
  id: string;
  date: string; // YYYY-MM-DD
  region?: SourceRegion;
  titleEn: string;
  titleHindi: string;
  whyInNews?: any;
  background?: any;
  keyFacts?: any;
  currentDevelopment?: string;
  staticConnection?: string;
  chhattisgarhConnection?: string;
  budgetConnection?: string;
  economicSurveyConnection?: string;
  examAngle?: any;
  importantTerms?: any;
  possibleQuestionAreas?: string[];
  examTakeaways?: string[];
  importance?: string;
  syllabusMapping?: string | string[];
  linkedQuestionIds?: string[];
  sourceIds?: string[];
  status?: ContentStatus;
  needsHumanReview?: boolean;
  knowledgeTarget?: string;
  slug?: string;
  monthYear?: string;
  exams?: string | string[];
  subjects?: string | string[];
  keywords?: string | string[];
  tags?: string | string[];
  difficulty?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export type CurrentAffairTopic = CurrentAffairsTopic;

export interface DailyDigestItem {
  topicId: string;
  headlineEn: string;
  headlineHindi: string;
  whatHappenedEn: string;
  whatHappenedHindi: string;
  whyImportantEn: string;
  whyImportantHindi: string;
  keyFactsEn: string[];
  keyFactsHindi: string[];
  staticConnectionEn: string;
  staticConnectionHindi: string;
  examAngleEn: string;
  examAngleHindi: string;
  sourceIds: string[];
}

export interface DailyDigest {
  id?: string;
  date?: string;
  titleEn?: string;
  titleHindi?: string;
  introEn?: string;
  introHindi?: string;
  headlines?: string[];
  chhattisgarhFocus?: DailyDigestItem[];
  indiaFocus?: DailyDigestItem[];
  internationalFocus?: DailyDigestItem[];
  economyPolityScienceEnvironment?: DailyDigestItem[];
  importantNumbers?: string[];
  examAlert?: string[];
  quickRevision?: string[];
  status?: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface DailyEdition {
  id?: string;
  date?: string; // YYYY-MM-DD
  title?: string;
  digest?: DailyDigest;
  digestSummaryEn?: string;
  digestSummaryHi?: string;
  topicIds?: string[];
  questionIds?: string[];
  quizId?: string;
  chhattisgarhQuestionCount?: number;
  indiaWorldQuestionCount?: number;
  status?: ContentStatus;
  needsHumanReview?: boolean;
  generationAudit?: {
    sourcesDiscovered?: number;
    sourcesVerified?: number;
    primarySources?: number;
    secondarySources?: number;
    verifiedUrls?: string[];
    warnings?: string[];
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface MonthlyEditionSection {
  chapterTitleEn: string;
  chapterTitleHindi: string;
  summaryEn: string;
  summaryHindi: string;
  topics: CurrentAffairsTopic[];
}

export interface MonthlyEdition {
  id?: string; // e.g., "2026-03"
  year?: number;
  month?: number; // 1-12
  titleEn?: string;
  titleHindi?: string;
  title?: string;
  region?: SourceRegion;
  yearMonth?: string;
  coverImage?: string;
  howToUseEn?: string;
  howToUseHindi?: string;
  monthAtAGlance?: string[];
  sections?: MonthlyEditionSection[];
  hundredImportantFacts?: string[];
  highValueAreas?: string[];
  megaQuizId?: string;
  status?: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}
