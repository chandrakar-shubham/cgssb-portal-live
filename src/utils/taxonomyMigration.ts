import { Question, TestAttempt, SectorAnalysis } from '../types';
import { autoClassifyChapter } from './pypEngine';

/**
 * Normalizes any legacy or combined subject string into the official separated taxonomy:
 * - "General Mental Ability & Reasoning" -> "Quantitative Aptitude" or "Reasoning" (Per directive: General Mental Ability must be Quantitative Aptitude)
 * - "General Science & Computer Knowledge" -> "Computer Knowledge" or "General Science"
 * - "General Hindi & Chhattisgarhi Language" -> "General Hindi" or "Chhattisgarhi Language"
 * - "General Hindi & English" -> "General Hindi" or "General English"
 * - "Chhattisgarh Special Knowledge" -> "Chhattisgarh General Studies"
 * - "General Studies & Aptitude (Central)" -> "India General Studies"
 * - Strictly distinguishes between "India General Studies" and "Chhattisgarh General Studies"
 */
export function normalizeSubjectName(rawSubject: string, contextText: string = ''): string {
  if (!rawSubject) return 'Chhattisgarh General Studies';
  const s = rawSubject.trim();
  const lower = s.toLowerCase();
  const lowerContext = contextText.toLowerCase();

  // 1. Combined: Science & Computer
  if (lower.includes('science') && (lower.includes('computer') || lower.includes('कंप्यूटर'))) {
    if (
      lowerContext.includes('computer') || lowerContext.includes('कंप्यूटर') ||
      lowerContext.includes('software') || lowerContext.includes('hardware') ||
      lowerContext.includes('internet') || lowerContext.includes('cpu') ||
      lowerContext.includes('ram') || lowerContext.includes('rom') ||
      lowerContext.includes('ms word') || lowerContext.includes('excel') ||
      lowerContext.includes('browser') || lowerContext.includes('malware')
    ) {
      return 'Computer Knowledge';
    }
    return 'General Science';
  }

  // 2. Combined: Mental Ability & Reasoning / Maths & Reasoning
  if (
    (lower.includes('mental') || lower.includes('aptitude') || lower.includes('गणित') || lower.includes('math')) &&
    (lower.includes('reasoning') || lower.includes('तर्कशक्ति') || lower.includes('रीजनिंग'))
  ) {
    if (
      lowerContext.includes('कोडिंग') || lowerContext.includes('coding') ||
      lowerContext.includes('रक्त संबंध') || lowerContext.includes('blood') ||
      lowerContext.includes('दिशा') || lowerContext.includes('direction') ||
      lowerContext.includes('कथन') || lowerContext.includes('निष्कर्ष') ||
      lowerContext.includes('syllogism') || lowerContext.includes('seating')
    ) {
      return 'Reasoning';
    }
    // Default per directive: General Mental Ability must be Quantitative Aptitude
    return 'Quantitative Aptitude';
  }

  // Direct: General Mental Ability -> Quantitative Aptitude per directive
  if (
    lower === 'general mental ability' ||
    lower === 'mental ability' ||
    lower.includes('मानसिक योग्यता') ||
    lower.includes('मानसिक क्षमता') ||
    lower === 'maths & mental ability'
  ) {
    if (
      lowerContext.includes('कोडिंग') || lowerContext.includes('coding') ||
      lowerContext.includes('रक्त संबंध') || lowerContext.includes('blood') ||
      lowerContext.includes('दिशा') || lowerContext.includes('direction')
    ) {
      return 'Reasoning';
    }
    return 'Quantitative Aptitude';
  }

  // 3. Combined: Hindi & Chhattisgarhi Language
  if (lower.includes('hindi') && (lower.includes('chhattisgarhi') || lower.includes('छत्तीसगढ़ी'))) {
    if (
      lowerContext.includes('हाना') || lowerContext.includes('जनउला') ||
      lowerContext.includes('छत्तीसगढ़ी') || lowerContext.includes('chhattisgarhi') ||
      lowerContext.includes('भाखा') || lowerContext.includes('हलबी') || lowerContext.includes('गोंडी')
    ) {
      return 'Chhattisgarhi Language';
    }
    return 'General Hindi';
  }

  // Combined: Hindi & English
  if (lower.includes('hindi') && lower.includes('english')) {
    if (
      lowerContext.includes('synonym') || lowerContext.includes('antonym') ||
      lowerContext.includes('tense') || lowerContext.includes('preposition') ||
      lowerContext.includes('comprehension') || lowerContext.includes('english')
    ) {
      return 'General English';
    }
    return 'General Hindi';
  }

  // Combined: Language & Computers
  if (lower.includes('language') && lower.includes('computer')) {
    return 'Computer Knowledge';
  }

  // 4. Distinction between India GS and Chhattisgarh GS
  // Explicit India GS aliases
  if (
    lower === 'india general studies' ||
    lower === 'india gs' ||
    lower === 'indian gs' ||
    lower === 'general studies & aptitude (central)' ||
    lower === 'central exams general studies' ||
    lower === 'current affairs & national gk' ||
    lower === 'national gk' ||
    lower === 'indian polity & constitution' ||
    lower === 'indian history & national movement' ||
    lower === 'geography of india' ||
    lower === 'indian economy & development' ||
    lower === 'national current affairs'
  ) {
    return 'India General Studies';
  }

  // Explicit CG GS aliases
  if (
    lower === 'chhattisgarh general studies' ||
    lower === 'chhattisgarh general studies (cgpsc)' ||
    lower === 'chhattisgarh special knowledge' ||
    lower === 'chhattisgarh special' ||
    lower === 'cg special knowledge' ||
    lower === 'cg special' ||
    lower === 'chhattisgarh gs' ||
    lower === 'cg gs' ||
    lower === 'chhattisgarh history & culture' ||
    lower === 'chhattisgarh geography & economy' ||
    lower === 'chhattisgarh special & land laws' ||
    lower === 'cg knowledge & culture'
  ) {
    return 'Chhattisgarh General Studies';
  }

  // Science variants
  if (
    lower === 'general science & tech' ||
    lower === 'general science & technology' ||
    lower === 'science & technology' ||
    lower === 'science'
  ) {
    return 'General Science';
  }

  // Pedagogy variants
  if (
    lower.includes('pedagogy') ||
    lower.includes('child development') ||
    lower.includes('teaching aptitude')
  ) {
    return 'Child Pedagogy & Teaching Methodology';
  }

  // English variants
  if (lower === 'english' || lower === 'general english' || lower.includes('english language')) {
    return 'General English';
  }

  // Hindi variants
  if (lower === 'hindi' || lower === 'general hindi') {
    return 'General Hindi';
  }

  // Chhattisgarhi variants
  if (lower === 'chhattisgarhi' || lower === 'chhattisgarhi language' || lower.includes('छत्तीसगढ़ी भाषा')) {
    return 'Chhattisgarhi Language';
  }

  // Computer variants
  if (lower === 'computer' || lower === 'computer applications' || lower === 'computer awareness' || lower === 'computer knowledge') {
    return 'Computer Knowledge';
  }

  // Aptitude / Maths variants
  if (lower === 'quantitative aptitude' || lower === 'mathematics' || lower === 'maths' || lower === 'math') {
    return 'Quantitative Aptitude';
  }

  // Reasoning variants
  if (lower === 'reasoning' || lower === 'reasoning ability' || lower === 'logical reasoning') {
    return 'Reasoning';
  }

  // Context-based fallback if rawSubject is generic "General Studies" or "General Knowledge"
  if (lower === 'general studies' || lower === 'general knowledge' || lower === 'gk' || lower === 'gs') {
    if (
      lowerContext.includes('छत्तीसगढ़') || lowerContext.includes('chhattisgarh') ||
      lowerContext.includes('बस्तर') || lowerContext.includes('कलचुरी') ||
      lowerContext.includes('महानदी') || lowerContext.includes('रायपुर')
    ) {
      return 'Chhattisgarh General Studies';
    }
    return 'India General Studies';
  }

  return s;
}

/**
 * Migrates a legacy question to the clean, non-conjoined taxonomy
 */
export function migrateLegacyQuestion(q: Question): Question {
  const combinedText = `${q.questionHindi || ''} ${q.questionText || ''} ${q.topic || ''} ${q.subtopic || ''} ${q.chapterName || ''}`;

  // If question subject is still combined or legacy, re-classify
  const currentSubj = q.subject || '';
  const isCombined =
    currentSubj.includes('&') ||
    currentSubj.includes('Special Knowledge') ||
    currentSubj.includes('Central') ||
    currentSubj === 'General Mental Ability';

  if (isCombined) {
    const classification = autoClassifyChapter(combinedText, currentSubj, q.topic || 'General Topic');
    return {
      ...q,
      subject: classification.subject,
      topic: q.topic || classification.topic,
      chapterName: q.chapterName || classification.chapterName,
      subtopic: q.subtopic || classification.subtopic,
    };
  }

  return {
    ...q,
    subject: normalizeSubjectName(currentSubj, combinedText),
  };
}

/**
 * Migrates or reconstructs SectorAnalysis for a TestAttempt so that
 * no combined legacy subjects exist and all sectors match the current question bank.
 */
export function migrateLegacyAttempt(attempt: TestAttempt, allQuestions: Question[] = []): TestAttempt {
  // If we have access to the question bank, recalculate sector analysis directly
  const questionMap = new Map<string, Question>();
  allQuestions.forEach(q => questionMap.set(q.id, q));

  // Check if any existing sector has conjoined subject with '&'
  const hasLegacySectors = attempt.sectorAnalysis?.some(s =>
    s.subject.includes('&') ||
    s.subject.includes('Special Knowledge') ||
    s.subject === 'General Mental Ability'
  );

  if ((!attempt.sectorAnalysis || attempt.sectorAnalysis.length === 0 || hasLegacySectors) && attempt.responses) {
    const attemptedQIds = Object.keys(attempt.responses);
    const relevantQs = attemptedQIds
      .map(id => questionMap.get(id))
      .filter((q): q is Question => q != null);

    if (relevantQs.length > 0) {
      const subjectMap: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; marksPerQ: number; negMarksPerQ: number }> = {};

      relevantQs.forEach(q => {
        const cleanSubject = normalizeSubjectName(q.subject, `${q.questionHindi || ''} ${q.questionText || ''}`);
        if (!subjectMap[cleanSubject]) {
          subjectMap[cleanSubject] = {
            total: 0,
            correct: 0,
            incorrect: 0,
            unattempted: 0,
            marksPerQ: q.marks || 1.0,
            negMarksPerQ: q.negativeMarks || 0.333,
          };
        }
        subjectMap[cleanSubject].total += 1;

        const candidateAnswer = attempt.responses[q.id];
        if (candidateAnswer == null) {
          subjectMap[cleanSubject].unattempted += 1;
        } else if (candidateAnswer === q.correctOption) {
          subjectMap[cleanSubject].correct += 1;
        } else {
          subjectMap[cleanSubject].incorrect += 1;
        }
      });

      const recalculatedSectors: SectorAnalysis[] = Object.entries(subjectMap).map(([subj, data]) => {
        const maxScore = Number((data.total * data.marksPerQ).toFixed(2));
        const rawScore = data.correct * data.marksPerQ;
        const deductions = data.incorrect * data.negMarksPerQ;
        const netScore = Number(Math.max(0, rawScore - deductions).toFixed(2));
        const attempted = data.correct + data.incorrect;
        const accuracy = attempted > 0 ? Math.round((data.correct / attempted) * 100) : 0;

        return {
          subject: subj,
          total: data.total,
          correct: data.correct,
          incorrect: data.incorrect,
          unattempted: data.unattempted,
          accuracy,
          score: netScore,
          maxScore,
        };
      });

      return {
        ...attempt,
        sectorAnalysis: recalculatedSectors,
      };
    }
  }

  // Fallback: If questions are not available, map sector names cleanly
  if (attempt.sectorAnalysis && attempt.sectorAnalysis.length > 0) {
    const updatedSectors = attempt.sectorAnalysis.map(sec => ({
      ...sec,
      subject: normalizeSubjectName(sec.subject),
    }));

    return {
      ...attempt,
      sectorAnalysis: updatedSectors,
    };
  }

  return attempt;
}

/**
 * Runs localStorage migration safely on app boot
 */
export function runTaxonomyMigration(defaultQuestions: Question[], defaultAttempts: TestAttempt[]) {
  try {
    // 1. Migrate Questions
    const rawQuestions = localStorage.getItem('cgssb_questions');
    if (rawQuestions) {
      try {
        const parsed: Question[] = JSON.parse(rawQuestions);
        if (Array.isArray(parsed)) {
          const migrated = parsed.map(migrateLegacyQuestion);
          localStorage.setItem('cgssb_questions', JSON.stringify(migrated));
        }
      } catch (e) {
        console.warn('Could not parse stored questions for migration:', e);
      }
    }

    // 2. Migrate Attempts
    const rawAttempts = localStorage.getItem('cgssb_attempts');
    if (rawAttempts) {
      try {
        const parsed: TestAttempt[] = JSON.parse(rawAttempts);
        if (Array.isArray(parsed)) {
          const migrated = parsed.map(a => migrateLegacyAttempt(a, defaultQuestions));
          localStorage.setItem('cgssb_attempts', JSON.stringify(migrated));
        }
      } catch (e) {
        console.warn('Could not parse stored attempts for migration:', e);
      }
    }
  } catch (err) {
    console.warn('Taxonomy migration encountered harmless storage issue:', err);
  }
}
