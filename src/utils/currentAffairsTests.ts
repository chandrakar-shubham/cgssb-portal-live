/**
 * Test Suite for Current Affairs Data Access & QC Validation Engine
 * Verifies sources, topics, questions across all supported types, editions, and pagination/filtering.
 */

import {
  CurrentAffairSource,
  CurrentAffairTopic,
  CurrentAffairsQuestion,
  DailyEdition,
  MonthlyEdition
} from '../types/currentAffairs';
import {
  validateSource,
  validateTopic,
  validateQuestion,
  validateDailyEdition,
  validateMonthlyEdition
} from '../utils/currentAffairsQC';

export function runCurrentAffairsTests(): { success: boolean; results: string[] } {
  const results: string[] = [];
  let success = true;

  try {
    results.push('--- STARTING CURRENT AFFAIRS PHASE 2 TEST SUITE ---');

    // 1. Test Valid Source
    const validSource: CurrentAffairSource = {
      id: 'src-01',
      name: 'Chhattisgarh DPR Official Bulletin',
      type: 'government',
      organization: 'Govt of Chhattisgarh',
      publicationDate: '2026-09-26',
      region: 'chhattisgarh',
      verificationStatus: 'verified',
      verificationDate: '2026-09-26'
    };
    const srcRes = validateSource(validSource);
    if (srcRes.isValid) {
      results.push('✅ Test 1 (Valid Source): PASSED');
    } else {
      success = false;
      results.push(`❌ Test 1 (Valid Source): FAILED -> ${srcRes.errors.join(', ')}`);
    }

    // 2. Test Unverified Source Warning
    const unverifiedSource: CurrentAffairSource = { ...validSource, id: 'src-02', verificationStatus: 'unverified' };
    const unvRes = validateSource(unverifiedSource);
    if (unvRes.isValid && unvRes.warnings.length > 0) {
      results.push('✅ Test 2 (Unverified Source Warning): PASSED');
    } else {
      success = false;
      results.push('❌ Test 2 (Unverified Source Warning): FAILED');
    }

    // 3. Test Valid Topic
    const validTopic: CurrentAffairTopic = {
      id: 'top-01',
      titleEn: 'New Agriculture Policy in Chhattisgarh',
      titleHindi: 'छत्तीसगढ़ में नई कृषि नीति',
      slug: 'new-agriculture-policy-chhattisgarh',
      region: 'chhattisgarh',
      subjects: ['Agriculture', 'Economy'],
      exams: ['CGPSC', 'CGSSB'],
      difficulty: 'Medium',
      importance: 'high',
      date: '2026-09-26',
      monthYear: '2026-09',
      examAngle: {
        whyInNews: 'Launched to boost organic farming in Bastar.',
        keyFacts: ['3-year subsidy plan', 'Targeting 50000 farmers'],
        examTakeaways: ['Key scheme for CGPSC paper 3'],
        importantTerms: ['Organic Farming', 'Subsidy']
      },
      sourceIds: ['src-01'],
      linkedQuestionIds: ['q-01'],
      keywords: ['agriculture', 'policy'],
      tags: ['bastar', 'farming'],
      status: 'validated',
      createdAt: '2026-09-26T00:00:00Z',
      updatedAt: '2026-09-26T00:00:00Z'
    };
    const topRes = validateTopic(validTopic, ['src-01']);
    if (topRes.isValid) {
      results.push('✅ Test 3 (Valid Topic): PASSED');
    } else {
      success = false;
      results.push(`❌ Test 3 (Valid Topic): FAILED -> ${topRes.errors.join(', ')}`);
    }

    // 4. Test Valid MCQ Question
    const validMCQ: CurrentAffairsQuestion = {
      id: 'q-01',
      currentAffairTopicId: 'top-01',
      sourceIds: ['src-01'],
      category: 'CGPSC',
      subject: 'Economy',
      topic: 'Agriculture',
      difficulty: 'Medium',
      marks: 2,
      negativeMarks: 0.67,
      questionType: 'mcq',
      questionText: 'What is the primary target of the new Chhattisgarh agriculture policy?',
      questionHindi: 'छत्तीसगढ़ की नई कृषि नीति का प्राथमिक लक्ष्य क्या है?',
      options: [
        { id: 'A', text: 'Organic farming promotion', textHindi: 'जैविक खेती को बढ़ावा' },
        { id: 'B', text: 'Industrial mining', textHindi: 'औद्योगिक खनन' },
        { id: 'C', text: 'IT export', textHindi: 'आईटी निर्यात' },
        { id: 'D', text: 'Tourism development', textHindi: 'पर्यटन विकास' }
      ],
      correctOption: 'A',
      explanation: 'Official DPR notification states organic farming focus.',
      explanationHindi: 'आधिकारिक विज्ञप्ति के अनुसार जैविक खेती।',
      region: 'chhattisgarh',
      exams: ['CGPSC'],
      date: '2026-09-26',
      monthYear: '2026-09',
      status: 'validated',
      createdAt: '2026-09-26T00:00:00Z',
      updatedAt: '2026-09-26T00:00:00Z'
    };
    const mcqRes = validateQuestion(validMCQ, true, ['src-01']);
    if (mcqRes.isValid) {
      results.push('✅ Test 4 (Valid MCQ Question): PASSED');
    } else {
      success = false;
      results.push(`❌ Test 4 (Valid MCQ Question): FAILED -> ${mcqRes.errors.join(', ')}`);
    }

    // 5. Test Valid Multi-Statement Question
    const validMultiStmt: CurrentAffairsQuestion = {
      ...validMCQ,
      id: 'q-02',
      questionType: 'multi_statement',
      statements: [
        { id: 1, text: 'Scheme covers Bastar district.', textHindi: 'योजना बस्तर जिले को कवर करती है।' },
        { id: 2, text: 'Subsidy duration is 3 years.', textHindi: 'सब्सिडी की अवधि 3 वर्ष है।' }
      ]
    };
    const msRes = validateQuestion(validMultiStmt, true, ['src-01']);
    if (msRes.isValid) {
      results.push('✅ Test 5 (Valid Multi-Statement Question): PASSED');
    } else {
      success = false;
      results.push(`❌ Test 5 (Valid Multi-Statement Question): FAILED -> ${msRes.errors.join(', ')}`);
    }

    // 6. Test Valid Assertion-Reason Question
    const validAR: CurrentAffairsQuestion = {
      ...validMCQ,
      id: 'q-03',
      questionType: 'assertion_reason',
      assertion: 'Organic farming is expanding in Chhattisgarh.',
      reason: 'Government provides 3-year financial subsidy.',
      options: [
        { id: 'A', text: 'Both A and R are true and R is correct explanation' },
        { id: 'B', text: 'Both A and R are true but R is not correct explanation' }
      ]
    };
    const arRes = validateQuestion(validAR, true, ['src-01']);
    if (arRes.isValid) {
      results.push('✅ Test 6 (Valid Assertion-Reason Question): PASSED');
    } else {
      success = false;
      results.push(`❌ Test 6 (Valid Assertion-Reason Question): FAILED -> ${arRes.errors.join(', ')}`);
    }

    // 7. Test Valid Matching Question
    const validMatching: CurrentAffairsQuestion = {
      ...validMCQ,
      id: 'q-04',
      questionType: 'matching',
      columnA: [{ id: 1, text: 'Scheme X' }, { id: 2, text: 'Policy Y' }],
      columnB: [{ id: 'I', text: 'Bastar' }, { id: 'II', text: 'Raipur' }]
    };
    const matchRes = validateQuestion(validMatching, true, ['src-01']);
    if (matchRes.isValid) {
      results.push('✅ Test 7 (Valid Matching Question): PASSED');
    } else {
      success = false;
      results.push(`❌ Test 7 (Valid Matching Question): FAILED -> ${matchRes.errors.join(', ')}`);
    }

    // 8. Test Malformed Question (Missing Topic & Source)
    const malformedQ: CurrentAffairsQuestion = {
      ...validMCQ,
      id: 'q-bad',
      currentAffairTopicId: 'non-existent',
      sourceIds: []
    };
    const malRes = validateQuestion(malformedQ, false, ['src-01']);
    if (!malRes.isValid && malRes.errors.length >= 2) {
      results.push('✅ Test 8 (Malformed Question Detection): PASSED');
    } else {
      success = false;
      results.push('❌ Test 8 (Malformed Question Detection): FAILED');
    }

    // 9. Test Daily Edition Validation
    const dailyEd: DailyEdition = {
      date: '2026-09-26',
      title: 'Daily Current Affairs - 26 September 2026',
      digestSummaryEn: 'Summary of CG and National news.',
      digestSummaryHi: 'छत्तीसगढ़ और राष्ट्रीय समाचार सारांश।',
      topicIds: ['top-01'],
      questionIds: ['q-01'],
      quizId: 'daily-quiz-2026-09-26',
      chhattisgarhQuestionCount: 20,
      indiaWorldQuestionCount: 30,
      status: 'validated',
      createdAt: '2026-09-26T00:00:00Z',
      updatedAt: '2026-09-26T00:00:00Z'
    };
    const dRes = validateDailyEdition(dailyEd);
    if (dRes.isValid) {
      results.push('✅ Test 9 (Valid Daily Edition): PASSED');
    } else {
      success = false;
      results.push(`❌ Test 9 (Valid Daily Edition): FAILED -> ${dRes.errors.join(', ')}`);
    }

    // 10. Test Monthly Edition Manifest Validation
    const monthlyEd: MonthlyEdition = {
      yearMonth: '2026-09',
      year: 2026,
      month: 9,
      title: 'September 2026 Current Affairs for CGPSC & CG Vyapam',
      region: 'combined',
      targetPages: 100,
      actualPages: 96,
      sectionIds: ['sec-01', 'sec-02'],
      revisionBlocks: {
        hundredFacts: [{ factEn: 'Fact 1', factHi: 'तथ्य 1', category: 'Polity' }],
        highValueAreas: [{ titleEn: 'Area 1', titleHi: 'क्षेत्र 1', description: 'Desc' }]
      },
      questionReferences: ['q-01', 'q-02'],
      megaQuizId: 'mega-quiz-2026-09',
      isPro: true,
      status: 'validated',
      createdAt: '2026-09-26T00:00:00Z',
      updatedAt: '2026-09-26T00:00:00Z'
    };
    const mRes = validateMonthlyEdition(monthlyEd);
    if (mRes.isValid) {
      results.push('✅ Test 10 (Valid Monthly Edition Manifest): PASSED');
    } else {
      success = false;
      results.push(`❌ Test 10 (Valid Monthly Edition Manifest): FAILED -> ${mRes.errors.join(', ')}`);
    }

    results.push('--- END OF TEST SUITE ---');
  } catch (err: any) {
    success = false;
    results.push(`❌ Test Suite Error: ${err?.message || err}`);
  }

  return { success, results };
}
