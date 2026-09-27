/**
 * Current Affairs Quality Control (QC) & Structural Validation Engine
 * Validates sources, topics, questions, and editions against business rules
 * and ensures 100% compatibility with existing ExamEngine and Question architecture.
 */

import {
  CurrentAffairSource,
  CurrentAffairTopic,
  CurrentAffairsQuestion,
  DailyEdition,
  MonthlyEdition
} from '../types/currentAffairs';

export interface QCResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
}

/**
 * Validates a Current Affair Source record
 */
export function validateSource(source: CurrentAffairSource): QCResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  if (!source.id) errors.push('Source ID is missing.');
  if (!source.name || source.name.trim().length < 3) errors.push('Source name is too short or missing.');
  if (!source.organization) errors.push('Source organization is missing.');
  if (!source.publicationDate || !/^\d{4}-\d{2}-\d{2}$/.test(source.publicationDate)) {
    errors.push('Publication date must be in YYYY-MM-DD format.');
  }
  if (!['government', 'pib', 'janman', 'rojgaar', 'budget', 'economic_survey', 'news', 'isro', 'rbi', 'niti_aayog'].includes(source.type || '')) {
    errors.push('Invalid source type classification.');
  }
  if (source.verificationStatus === 'unverified') {
    warnings.push('Source is currently unverified. Official primary sources are recommended for high-stakes exams.');
  } else {
    infos.push('Source verified successfully.');
  }

  return { isValid: errors.length === 0, errors, warnings, infos };
}

/**
 * Validates a Current Affair Topic record
 */
export function validateTopic(topic: CurrentAffairTopic, availableSourceIds: string[]): QCResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  if (!topic.id) errors.push('Topic ID is missing.');
  if (!topic.titleEn || topic.titleEn.trim().length < 5) errors.push('English title is required (min 5 chars).');
  if (!topic.titleHindi || topic.titleHindi.trim().length < 3) warnings.push('Hindi title is missing or too short.');
  if (!topic.slug) errors.push('Topic slug is required.');

  if (!topic.date || !/^\d{4}-\d{2}-\d{2}$/.test(topic.date)) {
    errors.push('Topic date must be in YYYY-MM-DD format.');
  }
  if (!topic.monthYear || !/^\d{4}-\d{2}$/.test(topic.monthYear)) {
    errors.push('Topic monthYear must be in YYYY-MM format (e.g., 2026-09).');
  }

  // Source Traceability Check
  if (!topic.sourceIds || topic.sourceIds.length === 0) {
    errors.push('Topic must be linked to at least one verified source (sourceIds is empty).');
  } else {
    for (const sId of topic.sourceIds) {
      if (!availableSourceIds.includes(sId)) {
        errors.push(`Referenced source ID "${sId}" does not exist in the source repository.`);
      }
    }
  }

  if (!topic.examAngle || !topic.examAngle.whyInNews) {
    warnings.push('Exam angle "Why in News" is recommended for high-value revision.');
  }

  return { isValid: errors.length === 0, errors, warnings, infos };
}

/**
 * Validates a Current Affairs Question strictly against existing ExamEngine & Question architecture
 */
export function validateQuestion(question: CurrentAffairsQuestion, topicExists: boolean, availableSourceIds: string[]): QCResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  if (!question.id) errors.push('Question ID is missing.');
  if (!question.currentAffairTopicId) {
    errors.push('Question must be linked to a canonical currentAffairTopicId.');
  } else if (!topicExists) {
    errors.push(`Linked topic ID "${question.currentAffairTopicId}" does not exist.`);
  }

  // Source Traceability
  if (!question.sourceIds || question.sourceIds.length === 0) {
    errors.push('Question must have direct source traceability via sourceIds.');
  } else {
    for (const sId of question.sourceIds) {
      if (!availableSourceIds.includes(sId)) {
        errors.push(`Question source ID "${sId}" does not exist.`);
      }
    }
  }

  if (!question.questionText && !question.questionHindi) {
    errors.push('Question stem (English or Hindi) is required.');
  }
  if (!question.questionHindi) {
    warnings.push('Hindi question stem is missing. Bilingual rendering is standard for CGPSC/CGSSB.');
  }

  // Question Type & Structural Answer Validation compatible with existing ExamEngine
  const qType = question.questionType || 'mcq';

  if (qType === 'mcq') {
    if (!question.options || question.options.length < 2) {
      errors.push('MCQ questions must have at least 2 options.');
    }
    if (!question.correctOption || !['A', 'B', 'C', 'D'].includes(question.correctOption)) {
      errors.push('Valid correctOption ("A", "B", "C", or "D") is required for MCQ.');
    }
  } else if (qType === 'multi_statement') {
    if (!question.statements || question.statements.length === 0) {
      errors.push('Multi-statement question requires at least one statement.');
    }
    if (!question.options || question.options.length < 2) {
      errors.push('Multi-statement question requires combination options.');
    }
  } else if (qType === 'assertion_reason') {
    if (!question.assertion || !question.reason) {
      errors.push('Assertion-Reason question requires both assertion and reason text.');
    }
    if (!question.options || question.options.length < 2) {
      errors.push('Assertion-Reason requires standard evaluation options.');
    }
  } else if (qType === 'matching') {
    if (!question.columnA || !question.columnB) {
      errors.push('Matching question requires both columnA and columnB structures.');
    }
  }

  if (!question.explanation && !question.explanationHindi) {
    warnings.push('Explanation is recommended for all exam questions.');
  }

  return { isValid: errors.length === 0, errors, warnings, infos };
}

/**
 * Validates a Daily Edition
 */
export function validateDailyEdition(edition: DailyEdition): QCResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  if (!edition.date || !/^\d{4}-\d{2}-\d{2}$/.test(edition.date)) {
    errors.push('Daily edition date must be in YYYY-MM-DD format.');
  }
  if (!edition.title) errors.push('Daily edition title is required.');
  if (!edition.quizId) errors.push('Daily edition must be linked to a quizId for the ExamEngine.');

  const totalQ = (edition.chhattisgarhQuestionCount || 0) + (edition.indiaWorldQuestionCount || 0);
  if (totalQ > 0 && totalQ !== 50) {
    warnings.push(`Target question count is 50 (Current count: ${totalQ}). Ensure quality takes priority over artificial filling.`);
  }

  return { isValid: errors.length === 0, errors, warnings, infos };
}

/**
 * Validates a Monthly Edition Manifest
 */
export function validateMonthlyEdition(edition: MonthlyEdition): QCResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  if (!edition.yearMonth || !/^\d{4}-\d{2}$/.test(edition.yearMonth)) {
    errors.push('Monthly edition yearMonth canonical identifier must be in YYYY-MM format.');
  }
  if (!edition.title) errors.push('Monthly edition title is required.');
  if (!edition.region || !['chhattisgarh', 'national', 'combined'].includes(edition.region)) {
    errors.push('Monthly edition region classification is required.');
  }
  if (!edition.megaQuizId) errors.push('Monthly edition must be linked to a megaQuizId for the ExamEngine.');

  return { isValid: errors.length === 0, errors, warnings, infos };
}
