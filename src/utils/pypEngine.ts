import {
  Question,
  ExamCategory,
  PreviousYearPaper,
  MockTest,
  BulkImportQuestion,
  PYQAppearance
} from '../types';

export type ExamPreset = 'CGSSB' | 'CGPSC' | 'HOSTEL_WARDEN' | 'CG_TEACHER';

export interface ExamPresetConfig {
  name: string;
  category: ExamCategory;
  marksPerQ: number;
  negativeMarksPerQ: number;
  durationMinutes: number;
  defaultModule: string;
}

export const EXAM_PRESETS: Record<ExamPreset, ExamPresetConfig> = {
  CGSSB: {
    name: 'CGSSB / CG Vyapam Combined Exam Standard',
    category: 'CGSSB',
    marksPerQ: 1.0,
    negativeMarksPerQ: 0.33,
    durationMinutes: 180,
    defaultModule: 'cg_special'
  },
  CGPSC: {
    name: 'CGPSC State Service Prelims (Paper-I GS)',
    category: 'CGPSC',
    marksPerQ: 2.0,
    negativeMarksPerQ: 0.67,
    durationMinutes: 120,
    defaultModule: 'cg_special'
  },
  HOSTEL_WARDEN: {
    name: 'CGSSB Hostel Warden (छात्रावास अधीक्षक)',
    category: 'CGSSB',
    marksPerQ: 1.0,
    negativeMarksPerQ: 0.25,
    durationMinutes: 150,
    defaultModule: 'computer'
  },
  CG_TEACHER: {
    name: 'CG Teacher Eligibility / Atmanand Recruitment',
    category: 'SWAMI_ATMANAND',
    marksPerQ: 1.0,
    negativeMarksPerQ: 0.33,
    durationMinutes: 150,
    defaultModule: 'cdp_education'
  }
};

/**
 * Generates an official unique question identifier:
 * e.g. QID-CGSSB-2024-001 or QID-CGPSC-2023-042
 */
export function generateUniqueQuestionId(
  category: ExamCategory | string,
  year: number,
  sequenceNum: number
): string {
  let prefix = 'CGSSB';
  if (category.includes('CGPSC')) prefix = 'CGPSC';
  else if (category.includes('Teacher') || category.includes('TET') || category.includes('SWAMI')) prefix = 'CGTET';
  else if (category.includes('Police')) prefix = 'CGPOL';
  else if (category.includes('CENTRAL')) prefix = 'CENTRAL';

  const paddedNum = String(sequenceNum).padStart(3, '0');
  return `QID-${prefix}-${year}-${paddedNum}`;
}

/**
 * Calculates string similarity (Levenshtein-based token overlap) to detect repeated questions
 */
export function calculateQuestionSimilarity(q1Text: string, q2Text: string): number {
  if (!q1Text || !q2Text) return 0;
  
  const cleanTokens = (t: string) => 
    t.toLowerCase()
      .replace(/[^\w\s\u0900-\u097F]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

  const tokens1 = cleanTokens(q1Text);
  const tokens2 = cleanTokens(q2Text);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set2 = new Set(tokens2);
  let matchCount = 0;

  tokens1.forEach(t => {
    if (set2.has(t)) matchCount++;
  });

  const overlap1 = matchCount / tokens1.length;
  const overlap2 = matchCount / tokens2.length;
  return Math.round(((overlap1 + overlap2) / 2) * 100);
}

/**
 * Finds questions in existing question bank that match above threshold (70%+)
 */
export function findSimilarQuestions(
  newQuestionText: string,
  existingBank: Question[],
  thresholdPercent = 65
): Array<Question & { similarityScore: number }> {
  if (!newQuestionText || !existingBank || existingBank.length === 0) return [];

  const matches: Array<Question & { similarityScore: number }> = [];

  for (const q of existingBank) {
    const text1 = q.questionText || q.text || '';
    const textHindi1 = q.questionHindi || q.textHindi || '';
    const scoreEn = calculateQuestionSimilarity(newQuestionText, text1);
    const scoreHi = textHindi1 ? calculateQuestionSimilarity(newQuestionText, textHindi1) : 0;
    const maxScore = Math.max(scoreEn, scoreHi);

    if (maxScore >= thresholdPercent) {
      matches.push({
        ...q,
        similarityScore: maxScore
      });
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Classifies a question into Subject, Topic (Chapter), and Subtopic based on text content & taxonomy.
 * Accurately distinguishes between India General Studies and Chhattisgarh General Studies.
 * Ensures all subjects are cleanly separated without combining using 'and' or '&'.
 */
export function autoClassifyChapter(text: string, defaultSubject: string, defaultTopic: string) {
  const lower = text.toLowerCase();

  // 1. Chhattisgarhi Language (छत्तीसगढ़ी भाषा, व्याकरण, हाना एवं जनउला)
  if (
    lower.includes('हाना') || lower.includes('hana') ||
    lower.includes('जनउला') || lower.includes('janula') ||
    lower.includes('छत्तीसगढ़ी') || lower.includes('chhattisgarhi') ||
    lower.includes('भाखा') || lower.includes('हलबी बोली') || lower.includes('गोंडी बोली')
  ) {
    return {
      subject: 'Chhattisgarhi Language',
      topic: (lower.includes('हाना') || lower.includes('जनउला')) ? 'Chhattisgarhi Hana & Janula' : 'Chhattisgarhi Vyakaran',
      chapterName: (lower.includes('हाना') || lower.includes('जनउला')) ? 'Chhattisgarhi Hana & Janula (हाना एवं जनउला)' : 'Chhattisgarhi Vyakaran (छत्तीसगढ़ी व्याकरण)',
      subtopic: lower.includes('हाना') ? 'Prasiddha Hana (Idioms)' : lower.includes('जनउला') ? 'Janula (Riddles)' : 'Chhattisgarhi Shabdkosh'
    };
  }

  // 2. General Hindi (सामान्य हिन्दी व्याकरण)
  if (
    lower.includes('संधि') || lower.includes('समास') ||
    lower.includes('पर्यायवाची') || lower.includes('विलोम') ||
    lower.includes('उपसर्ग') || lower.includes('प्रत्यय') ||
    lower.includes('तत्सम') || lower.includes('तद्भव') ||
    lower.includes('मुहावरा') || lower.includes('मुहावरे') || lower.includes('लोकोक्ति') ||
    lower.includes('वर्तनी') || lower.includes('वाक्य शुद्धि') ||
    (lower.includes('संज्ञा') && !lower.includes('गोंड')) || lower.includes('सर्वनाम') ||
    lower.includes('विशेषण') || lower.includes('कारक') || lower.includes('अलंकार')
  ) {
    return {
      subject: 'General Hindi',
      topic: (lower.includes('संधि') || lower.includes('समास')) ? 'Sandhi & Samas' : 'Hindi Vyakaran & Varnamala',
      chapterName: 'General Hindi (सामान्य हिन्दी)',
      subtopic: lower.includes('संधि') ? 'Swar & Vyanjan Sandhi' : lower.includes('समास') ? 'Samas Bhed' : 'Vocabulary & Vyakaran'
    };
  }

  // 3. Computer Knowledge (कंप्यूटर ज्ञान)
  if (
    lower.includes('computer') || lower.includes('कंप्यूटर') ||
    lower.includes('cpu') || lower.includes('सीपीयू') ||
    lower.includes('ram') || lower.includes('rom') || lower.includes('रैम') || lower.includes('रोम') ||
    lower.includes('motherboard') || lower.includes('hardware') || lower.includes('हार्डवेयर') ||
    lower.includes('software') || lower.includes('सॉफ्टवेयर') ||
    lower.includes('operating system') || lower.includes('ऑपरेटिंग सिस्टम') ||
    lower.includes('ms word') || lower.includes('ms excel') || lower.includes('powerpoint') ||
    lower.includes('spreadsheet') || lower.includes('word processor') ||
    lower.includes('internet') || lower.includes('इंटरनेट') ||
    lower.includes('browser') || lower.includes('ब्राउज़र') ||
    lower.includes('firewall') || lower.includes('फायरवॉल') ||
    lower.includes('malware') || lower.includes('antivirus') || lower.includes('वायरस') ||
    lower.includes('ip address') || lower.includes('protocol') || lower.includes('binary') ||
    lower.includes('printer') || lower.includes('cache memory') || lower.includes('e-mail')
  ) {
    return {
      subject: 'Computer Knowledge',
      topic: (lower.includes('ms ') || lower.includes('operating') || lower.includes('word') || lower.includes('excel'))
        ? 'Operating Systems & Software'
        : (lower.includes('internet') || lower.includes('browser') || lower.includes('firewall') || lower.includes('malware'))
        ? 'Internet & Cybersecurity'
        : 'Computer Fundamentals',
      chapterName: 'Computer Knowledge (कंप्यूटर सामान्य ज्ञान)',
      subtopic: lower.includes('internet') ? 'Internet & Cybersecurity' : 'MS Office & Architecture'
    };
  }

  // 4. Quantitative Aptitude (गणित एवं अंकगणित - User specified: General Mental Ability must be Quantitative Aptitude)
  if (
    lower.includes('प्रतिशत') || lower.includes('percentage') ||
    lower.includes('अनुपात') || lower.includes('ratio') ||
    lower.includes('समानुपात') || lower.includes('proportion') ||
    lower.includes('लाभ') || lower.includes('हानि') || lower.includes('profit') || lower.includes('loss') ||
    lower.includes('क्रय मूल्य') || lower.includes('विक्रय मूल्य') ||
    lower.includes('बट्टा') || lower.includes('छूट') || lower.includes('discount') ||
    lower.includes('साधारण ब्याज') || lower.includes('simple interest') ||
    lower.includes('चक्रवृद्धि ब्याज') || lower.includes('compound interest') ||
    lower.includes('समय और कार्य') || lower.includes('time and work') ||
    lower.includes('चाल') || lower.includes('दूरी') || lower.includes('speed') || lower.includes('distance') ||
    lower.includes('औसत') || lower.includes('average') ||
    lower.includes('ल.स.') || lower.includes('म.स.') || lower.includes('lcm') || lower.includes('hcf') ||
    lower.includes('संख्या पद्धति') || lower.includes('number system') ||
    lower.includes('क्षेत्रफल') || lower.includes('आयतन') || lower.includes('mensuration') ||
    lower.includes('पाई चार्ट') || lower.includes('bar graph')
  ) {
    return {
      subject: 'Quantitative Aptitude',
      topic: 'Arithmetic & Commercial Mathematics',
      chapterName: 'Quantitative Aptitude (संख्यात्मक अभिक्षमता)',
      subtopic: lower.includes('प्रतिशत') || lower.includes('percentage') ? 'Percentages & Profit-Loss' : 'Ratio & Commercial Maths'
    };
  }

  // 5. Reasoning (तर्कशक्ति एवं मानसिक क्षमता)
  if (
    lower.includes('रीजनिंग') || lower.includes('reasoning') ||
    lower.includes('कोडिंग') || lower.includes('coding') || lower.includes('decoding') ||
    lower.includes('रक्त संबंध') || lower.includes('blood relation') ||
    lower.includes('दिशा ज्ञान') || lower.includes('direction sense') ||
    lower.includes('न्याय निगमन') || lower.includes('syllogism') ||
    lower.includes('कथन और निष्कर्ष') || lower.includes('statement and conclusion') ||
    lower.includes('कथन और पूर्वधारणा') || lower.includes('seating arrangement') || lower.includes('बैठक व्यवस्था') ||
    lower.includes('वेन आरेख') || lower.includes('venn diagram') ||
    lower.includes('पासा') || lower.includes('dice') ||
    lower.includes('कैलेंडर') || lower.includes('calendar') || lower.includes('घड़ी') || lower.includes('clock') ||
    lower.includes('दर्पण प्रतिबिंब') || lower.includes('mirror image') ||
    lower.includes('श्रृंखला') || lower.includes('number series') || lower.includes('missing number')
  ) {
    return {
      subject: 'Reasoning',
      topic: 'Verbal & Analytical Reasoning',
      chapterName: 'Analytical & Logical Reasoning (तर्कशक्ति)',
      subtopic: lower.includes('coding') ? 'Coding-Decoding' : lower.includes('blood') ? 'Blood Relations' : 'Logical Deductions'
    };
  }

  // 6. General Science (सामान्य विज्ञान: भौतिकी, रसायन एवं जीव विज्ञान)
  if (
    lower.includes('प्रकाश वर्ष') || lower.includes('light year') ||
    lower.includes('न्यूटन') || lower.includes('गुरुत्वाकर्षण') || lower.includes('gravity') ||
    lower.includes('विद्युत धारा') || lower.includes('आवर्त सारणी') || lower.includes('periodic table') ||
    lower.includes('परमाणु') || lower.includes('अणु') ||
    lower.includes('अम्ल') || lower.includes('acid') || lower.includes('क्षार') || lower.includes('base') ||
    lower.includes('कोशिका') || lower.includes('cell') ||
    lower.includes('माइटोकॉन्ड्रिया') || lower.includes('mitochondria') ||
    lower.includes('डीएनए') || lower.includes('dna') || lower.includes('आरएनए') ||
    lower.includes('प्रकाश संश्लेषण') || lower.includes('photosynthesis') ||
    lower.includes('रक्त समूह') || lower.includes('blood group') ||
    lower.includes('विटामिन') || lower.includes('vitamin') ||
    lower.includes('जीवाणु') || lower.includes('bacteria') || lower.includes('विषाणु') || lower.includes('virus') ||
    lower.includes('ओजोन') || lower.includes('ozone') || lower.includes('पारिस्थितिकी') || lower.includes('ecosystem')
  ) {
    return {
      subject: 'General Science',
      topic: (lower.includes('कोशिका') || lower.includes('डीएनए') || lower.includes('विटामिन') || lower.includes('जीवाणु') || lower.includes('photosynthesis'))
        ? 'Biology & Environmental Ecology'
        : (lower.includes('अम्ल') || lower.includes('आवर्त सारणी') || lower.includes('परमाणु'))
        ? 'Chemistry'
        : 'Physics',
      chapterName: 'General Science (सामान्य विज्ञान)',
      subtopic: 'Core Science Concepts'
    };
  }

  // 7. Child Pedagogy & Teaching Methodology (शिक्षण अभिरुचि)
  if (
    lower.includes('pedagogy') || lower.includes('बाल विकास') || lower.includes('शिक्षा शास्त्र') ||
    lower.includes('पियाजे') || lower.includes('piaget') ||
    lower.includes('वायगोत्स्की') || lower.includes('vygotsky') ||
    lower.includes('समावेशी शिक्षा') || lower.includes('cce') || lower.includes('nep 2020')
  ) {
    return {
      subject: 'Child Pedagogy & Teaching Methodology',
      topic: 'Educational Psychology',
      chapterName: 'Child Pedagogy & Methodology (बाल विकास एवं शिक्षा शास्त्र)',
      subtopic: 'Child Development & Learning'
    };
  }

  // 8. CHHATTISGARH GENERAL STUDIES (विशिष्ट छत्तीसगढ़ सामान्य ज्ञान)
  // Check for distinct Chhattisgarh identifiers
  const hasCGIdentifier =
    lower.includes('छत्तीसगढ़') || lower.includes('chhattisgarh') ||
    lower.includes('कलचुरी') || lower.includes('kalchuri') ||
    lower.includes('रतनपुर') || lower.includes('ratanpur') ||
    lower.includes('तुम्माण') || lower.includes('tumman') ||
    lower.includes('बस्तर') || lower.includes('bastar') ||
    lower.includes('सरगुजा') || lower.includes('surguja') ||
    lower.includes('रायपुर') || lower.includes('raipur') ||
    lower.includes('बिलासपुर') || lower.includes('bilaspur') ||
    lower.includes('महानदी') || lower.includes('mahanadi') ||
    lower.includes('इंद्रावती') || lower.includes('indravati') ||
    lower.includes('शिवनाथ') || lower.includes('shivnath') ||
    lower.includes('हसदेव') || lower.includes('hasdeo') ||
    lower.includes('चित्रकोट') || lower.includes('chitrakote') ||
    lower.includes('तीरथगढ़') || lower.includes('teerathgarh') ||
    lower.includes('कांगेर') || lower.includes('kanger') ||
    lower.includes('गोंड') || lower.includes('बैगा') || lower.includes('माड़िया') || lower.includes('मुरिया') ||
    lower.includes('हल्बा') || lower.includes('कमर') || lower.includes('भुंजिया') ||
    lower.includes('पंडवानी') || lower.includes('pandwani') ||
    lower.includes('पंथी') || lower.includes('panthi') ||
    lower.includes('करमा') || lower.includes('karma') ||
    lower.includes('राउत नाचा') || lower.includes('raut nacha') ||
    lower.includes('मड़ई') || lower.includes('madai') ||
    lower.includes('तीजा') || lower.includes('पोला') || lower.includes('हरेली') || lower.includes('छेरछेरा') ||
    lower.includes('भूमकाल') || lower.includes('bhumkal') ||
    lower.includes('तारापुर विद्रोह') || lower.includes('काकतीय') || lower.includes('kakatiya') ||
    lower.includes('गोधन न्याय') || lower.includes('सुराजी गांव') ||
    lower.includes('मैनपाट') || lower.includes('सामरीपाट') ||
    lower.includes('दंतेवाड़ा') || lower.includes('कांकेर') || lower.includes('सुकमा') || lower.includes('धमतरी') ||
    lower.includes('कवर्धा') || lower.includes('दुर्ग') || lower.includes('कोरबा') || lower.includes('रायगढ़') ||
    lower.includes('जशपुर') || lower.includes('राजनांदगांव') || lower.includes('जांजगीर');

  if (hasCGIdentifier) {
    if (
      lower.includes('कलचुरी') || lower.includes('kalchuri') ||
      lower.includes('रतनपुर') || lower.includes('तुम्माण') ||
      lower.includes('मराठा') || lower.includes('विद्रोह') || lower.includes('revolt') ||
      lower.includes('भूमकाल') || lower.includes('काकतीय') || lower.includes('गठन') ||
      lower.includes('राज्य स्थापना') || lower.includes('रियासत')
    ) {
      return {
        subject: 'Chhattisgarh General Studies',
        topic: 'History of Chhattisgarh',
        chapterName: 'History of Chhattisgarh (छत्तीसगढ़ का इतिहास)',
        subtopic: lower.includes('कलचुरी') ? 'Kalchuri Dynasty' : lower.includes('विद्रोह') ? 'Tribal Revolts & Freedom Struggle' : 'State Formation & History'
      };
    }
    if (
      lower.includes('जलप्रपात') || lower.includes('waterfall') ||
      lower.includes('नदी') || lower.includes('river') ||
      lower.includes('महानदी') || lower.includes('इंद्रावती') || lower.includes('शिवनाथ') ||
      lower.includes('चित्रकोट') || lower.includes('तीरथगढ़') ||
      lower.includes('खनिज') || lower.includes('mineral') ||
      lower.includes('अभयारण्य') || lower.includes('राष्ट्रीय उद्यान') || lower.includes('कांगेर घाटी')
    ) {
      return {
        subject: 'Chhattisgarh General Studies',
        topic: 'Geography & Natural Resources',
        chapterName: 'Geography & Natural Resources (छत्तीसगढ़ भूगोल एवं प्राकृतिक संसाधन)',
        subtopic: lower.includes('जलप्रपात') || lower.includes('चित्रकोट') ? 'Waterfalls & River Basins' : 'Minerals & Forests'
      };
    }
    if (
      lower.includes('जनजाति') || lower.includes('tribe') ||
      lower.includes('गोंड') || lower.includes('बैगा') || lower.includes('माड़िया') || lower.includes('मुरिया') ||
      lower.includes('दशहरा') || lower.includes('बस्तर') || lower.includes('नृत्य') ||
      lower.includes('करमा') || lower.includes('पंथी') || lower.includes('राउत') ||
      lower.includes('दंतेश्वरी') || lower.includes('मड़ई') || lower.includes('हरेली') || lower.includes('पोला')
    ) {
      return {
        subject: 'Chhattisgarh General Studies',
        topic: 'Culture, Tribes & Tourism',
        chapterName: 'Culture, Tribes & Tourism (छत्तीसगढ़ संस्कृति, जनजातियाँ एवं पर्यटन)',
        subtopic: lower.includes('दशहरा') || lower.includes('मड़ई') ? 'Bastar Dussehra & Fairs' : lower.includes('नृत्य') ? 'Folk Dances' : 'Tribal Traditions'
      };
    }
    return {
      subject: 'Chhattisgarh General Studies',
      topic: 'Administration & Economy',
      chapterName: 'Administration & Economy (छत्तीसगढ़ प्रशासन एवं अर्थव्यवस्था)',
      subtopic: lower.includes('पंचायत') ? 'Panchayati Raj in CG' : 'State Governance & Schemes'
    };
  }

  // 9. INDIA GENERAL STUDIES (भारत का सामान्य अध्ययन: इतिहास, संविधान, भूगोल, अर्थव्यवस्था)
  // Check for Indian Polity & Constitution
  if (
    lower.includes('संविधान') || lower.includes('constitution') ||
    lower.includes('अनुच्छेद') || lower.includes('article ') ||
    lower.includes('संसद') || lower.includes('parliament') ||
    lower.includes('लोकसभा') || lower.includes('lok sabha') ||
    lower.includes('राज्यसभा') || lower.includes('rajya sabha') ||
    lower.includes('राष्ट्रपति') || lower.includes('president of india') ||
    lower.includes('उपराष्ट्रपति') || lower.includes('प्रधानमंत्री') || lower.includes('prime minister') ||
    lower.includes('सर्वोच्च न्यायालय') || lower.includes('supreme court') ||
    lower.includes('उच्च न्यायालय') || lower.includes('high court') ||
    lower.includes('मौलिक अधिकार') || lower.includes('fundamental rights') ||
    lower.includes('मौलिक कर्तव्य') || lower.includes('fundamental duties') ||
    lower.includes('नीति निदेशक') || lower.includes('dpsp') ||
    lower.includes('प्रस्तावना') || lower.includes('preamble') ||
    lower.includes('निर्वाचन आयोग') || lower.includes('election commission') ||
    lower.includes('नियंत्रक एवं महालेखा') || lower.includes('cag') ||
    lower.includes('संघ लोक सेवा') || lower.includes('upsc') ||
    lower.includes('वित्त आयोग') || lower.includes('finance commission') ||
    lower.includes('संविधान संशोधन') || lower.includes('amendment')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'Indian Polity & Constitution',
      chapterName: 'Indian Polity & Constitution (भारतीय संविधान एवं राजव्यवस्था)',
      subtopic: lower.includes('अनुच्छेद') || lower.includes('मौलिक अधिकार') ? 'Fundamental Rights & Articles' : 'Parliament & Governance'
    };
  }

  // Check for Indian History & National Movement
  if (
    lower.includes('हड़प्पा') || lower.includes('harappa') ||
    lower.includes('सिंधु घाटी') || lower.includes('indus valley') ||
    lower.includes('मोहनजोदड़ो') || lower.includes('वैदिक काल') ||
    lower.includes('ऋग्वेद') || lower.includes('महाजनपद') ||
    lower.includes('बौद्ध धर्म') || lower.includes('जैन धर्म') ||
    lower.includes('मौर्य') || lower.includes('maurya') || lower.includes('अशोक') || lower.includes('ashoka') ||
    lower.includes('गुप्त काल') || lower.includes('gupta') || lower.includes('समुद्रगुप्त') ||
    lower.includes('दिल्ली सल्तनत') || lower.includes('delhi sultanate') || lower.includes('खिलजी') ||
    lower.includes('मुगल') || lower.includes('mughal') || lower.includes('बाबर') || lower.includes('अकबर') ||
    lower.includes('शाहजहां') || lower.includes('औरंगजेब') ||
    lower.includes('1857') || lower.includes('सिपाही विद्रोह') ||
    lower.includes('कांग्रेस') || lower.includes('inc') ||
    lower.includes('गांधी') || lower.includes('gandhi') ||
    lower.includes('चंपारण') || lower.includes('असहयोग') || lower.includes('सविनय अवज्ञा') || lower.includes('भारत छोड़ो') ||
    lower.includes('सुभाष चंद्र बोस') || lower.includes('भगत सिंह') ||
    lower.includes('ईस्ट इंडिया कंपनी') || lower.includes('प्लासी') || lower.includes('बक्सर')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'Indian History & National Movement',
      chapterName: 'Indian History & National Movement (भारतीय इतिहास एवं राष्ट्रीय आंदोलन)',
      subtopic: lower.includes('1857') || lower.includes('गांधी') || lower.includes('कांग्रेस') ? 'Freedom Struggle & National Movement' : 'Ancient & Medieval History'
    };
  }

  // Check for Indian Geography & River Systems
  if (
    lower.includes('हिमालय') || lower.includes('himalaya') ||
    lower.includes('गंगा नदी') || lower.includes('ganga') ||
    lower.includes('यमुना') || lower.includes('ब्रह्मपुत्र') || lower.includes('सिंधु नदी') ||
    lower.includes('गोदावरी') || lower.includes('कावेरी') || lower.includes('कृष्णा नदी') ||
    lower.includes('नर्मदा') || lower.includes('ताप्ती') ||
    lower.includes('पश्चिमी घाट') || lower.includes('western ghats') ||
    lower.includes('पूर्वी घाट') || lower.includes('मानसून') || lower.includes('monsoon') ||
    lower.includes('कर्क रेखा') || lower.includes('tropic of cancer') ||
    lower.includes('अंडमान') || lower.includes('andaman') || lower.includes('निकोबार') ||
    lower.includes('लक्षद्वीप') || lower.includes('थार मरुस्थल') || lower.includes('नीलगिरी') || lower.includes('सुंदरवन')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'Physical & Economic Geography of India',
      chapterName: 'Geography of India (भारत का भूगोल)',
      subtopic: lower.includes('हिमालय') || lower.includes('पर्वत') ? 'Himalayas & Physiography' : 'River Systems & Climate'
    };
  }

  // Check for Indian Economy & Institutions
  if (
    lower.includes('रिजर्व बैंक') || lower.includes('rbi') ||
    lower.includes('रेपो रेट') || lower.includes('repo rate') ||
    lower.includes('मौद्रिक नीति') || lower.includes('monetary policy') ||
    lower.includes('पंचवर्षीय योजना') || lower.includes('five year plan') ||
    lower.includes('नीति आयोग') || lower.includes('niti aayog') ||
    lower.includes('सकल घरेलू उत्पाद') || lower.includes('gdp') ||
    lower.includes('मुद्रास्फीति') || lower.includes('inflation') ||
    lower.includes('राजकोषीय घाटा') || lower.includes('fiscal deficit') ||
    lower.includes('सेबी') || lower.includes('sebi') || lower.includes('नाबार्ड') || lower.includes('nabard')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'Indian Economy & Development',
      chapterName: 'Indian Economy & Development (भारतीय अर्थव्यवस्था)',
      subtopic: lower.includes('rbi') || lower.includes('बैंक') ? 'Banking & Monetary Policy' : 'Economic Planning & Indicators'
    };
  }

  // Check for Current Affairs & National Organizations
  if (
    lower.includes('नोबेल') || lower.includes('nobel') ||
    lower.includes('भारत रत्न') || lower.includes('bharat ratna') ||
    lower.includes('पद्म') || lower.includes('padma') ||
    lower.includes('इसरो') || lower.includes('isro') || lower.includes('चंद्रयान') || lower.includes('chandrayaan') ||
    lower.includes('डीआरडीओ') || lower.includes('drdo') ||
    lower.includes('संयुक्त राष्ट्र') || lower.includes('united nations') ||
    lower.includes('g20') || lower.includes('brics') ||
    lower.includes('विश्व बैंक') || lower.includes('ओलंपिक') || lower.includes('olympic')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'National Current Affairs & General Knowledge',
      chapterName: 'Current Affairs & GK (समसामयिक घटनाएं एवं सामान्य ज्ञान)',
      subtopic: lower.includes('isro') ? 'Space & Science Missions' : 'Awards & International Affairs'
    };
  }

  // Clean Default fallback without conjoined names
  let normalizedDefaultSubject = 'Chhattisgarh General Studies';
  if (defaultSubject) {
    if (defaultSubject.includes('Central') || defaultSubject.includes('CENTRAL') || defaultSubject.includes('Aptitude')) {
      normalizedDefaultSubject = 'India General Studies';
    } else if (defaultSubject.includes('CGPSC') || defaultSubject.includes('Special Knowledge')) {
      normalizedDefaultSubject = 'Chhattisgarh General Studies';
    } else {
      normalizedDefaultSubject = defaultSubject
        .replace('General Science & Computer Knowledge', 'General Science')
        .replace('General Mental Ability & Reasoning', 'Quantitative Aptitude')
        .replace('General Hindi & Chhattisgarhi Language', 'General Hindi');
    }
  }

  return {
    subject: normalizedDefaultSubject,
    topic: defaultTopic,
    chapterName: defaultTopic,
    subtopic: 'General Chapter Topic'
  };
}

export interface ClientSideBulkImportParams {
  questions: BulkImportQuestion[];
  paperConfig: {
    title: string;
    examCategory: ExamCategory;
    year: number;
    durationMinutes: number;
    marks: number;
    negativeMarkingRatio: string;
    paperSummary: string;
    subjectsWeightage: { subject: string; questionCount: number; percentage: number }[];
  };
  existingQuestions?: Question[];
}

/**
 * High-performance client-side ingestion engine
 * Converts BulkImportQuestion[] to full Question[], PreviousYearPaper, and MockTest
 * Works completely offline or in static web hosting environments (like Hostinger)
 */
export function processBulkImportClientSide({
  questions: incomingList,
  paperConfig,
  existingQuestions = []
}: ClientSideBulkImportParams): {
  paper: PreviousYearPaper;
  mockTest: MockTest;
  questions: Question[];
} {
  const targetCategory: ExamCategory = paperConfig.examCategory || 'CGPSC';
  const catPrefix = targetCategory === 'CGPSC' ? 'CGPSC' : targetCategory === 'CENTRAL_EXAMS' ? 'CENTRAL' : 'CGSSB';
  const isCgpsc = targetCategory === 'CGPSC';
  const year = Number(paperConfig.year || 2024);
  const paperTitle = paperConfig.title || `${catPrefix} ${year} Official Paper`;

  const processedQuestions: Question[] = [];

  for (let idx = 0; idx < incomingList.length; idx++) {
    const item = incomingList[idx];
    const sno = Number(item['S.No.'] || idx + 1);
    const rawExamname = String(item.Examname || paperTitle).trim();
    const uniqueKey = item.uniqueQuestionId || `${catPrefix}-${year}-Q${String(sno).padStart(3, '0')}`;
    const questionId = `q-pyp-${uniqueKey.toLowerCase()}`;

    const questionHindi = String(item['Question(Hindi)'] || '').trim();
    const questionEnglish = String(item['Question(english)'] || '').trim();

    const optA = String(item.option_A || 'Option A').trim();
    const optB = String(item.option_B || 'Option B').trim();
    const optC = String(item.option_C || 'Option C').trim();
    const optD = String(item.option_D || 'Option D').trim();

    let answer: 'A' | 'B' | 'C' | 'D' = 'A';
    const rawAnswer = String(item.answer || 'A').toUpperCase().trim();
    if (['A', 'B', 'C', 'D'].includes(rawAnswer)) {
      answer = rawAnswer as 'A' | 'B' | 'C' | 'D';
    } else if (rawAnswer.includes('B')) {
      answer = 'B';
    } else if (rawAnswer.includes('C')) {
      answer = 'C';
    } else if (rawAnswer.includes('D')) {
      answer = 'D';
    }

    const explanation = String(item.explaination || `Official Answer: Option (${answer})`).trim();

    // Taxonomy & Chapter
    const defaultSubj = targetCategory === 'CGPSC'
      ? 'Chhattisgarh General Studies'
      : targetCategory === 'CENTRAL_EXAMS'
      ? 'India General Studies'
      : 'Chhattisgarh General Studies';
    const defaultTopic = `${rawExamname} (${year}) Official`;

    const combinedText = `${questionHindi} ${questionEnglish} ${explanation}`;
    const classification = autoClassifyChapter(combinedText, defaultSubj, defaultTopic);

    const assignedSubject = String(item.subject || classification.subject);
    const assignedTopic = String(item.topic || classification.topic);
    const assignedChapterName = String(item.chapterName || item.chapter || classification.chapterName || assignedTopic);
    const assignedSubtopic = String(item.subtopic || classification.subtopic || `Question #${sno}`);

    const appearancesList: PYQAppearance[] = [{ examName: rawExamname, year, shift: 'Official' }];
    if (item.repeatedInExams) {
      const reps = Array.isArray(item.repeatedInExams) ? item.repeatedInExams : String(item.repeatedInExams).split(',');
      for (const r of reps) {
        const trimmed = String(r).trim();
        if (trimmed && !appearancesList.some(a => a.examName.toLowerCase() === trimmed.toLowerCase())) {
          appearancesList.push({ examName: trimmed, year, shift: 'Official' });
        }
      }
    }

    const formattedQ: Question = {
      id: questionId,
      uniqueQuestionId: uniqueKey,
      subject: assignedSubject,
      topic: assignedTopic,
      subtopic: assignedSubtopic,
      chapter: assignedChapterName,
      chapterName: assignedChapterName,
      chapterId: assignedChapterName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      difficulty: 'Medium',
      category: targetCategory,
      questionText: questionEnglish || questionHindi,
      questionHindi: questionHindi || questionEnglish,
      questionEnglish: questionEnglish || questionHindi,
      options: [
        { id: 'A', text: optA, textHindi: optA },
        { id: 'B', text: optB, textHindi: optB },
        { id: 'C', text: optC, textHindi: optC },
        { id: 'D', text: optD, textHindi: optD },
      ],
      correctOption: answer,
      correctAnswer: answer,
      marks: isCgpsc ? 2.0 : 1.0,
      negativeMarks: isCgpsc ? 0.667 : 0.333,
      explanation: explanation,
      explanationHindi: explanation,
      pypSource: `${rawExamname} ${year} (Q${sno})`,
      pypAppearances: appearancesList,
      repeatedInExams: appearancesList.map(a => `${a.examName} (${a.year})`),
      createdAt: new Date().toISOString().split('T')[0],
    };

    processedQuestions.push(formattedQ);
  }

  // Dynamically compute accurate subjectsWeightage from processed questions
  const subjMap: Record<string, number> = {};
  processedQuestions.forEach(q => {
    subjMap[q.subject] = (subjMap[q.subject] || 0) + 1;
  });
  const computedWeightages = Object.entries(subjMap).map(([subject, count]) => ({
    subject,
    questionCount: count,
    percentage: Math.round((count / (processedQuestions.length || 1)) * 100),
  })).sort((a, b) => b.questionCount - a.questionCount);

  // Create Paper
  const paperId = `pyp-${catPrefix.toLowerCase()}-${year}-${Date.now()}`;
  const paper: PreviousYearPaper = {
    id: paperId,
    title: paperTitle,
    examCategory: targetCategory,
    year: year,
    totalQuestions: processedQuestions.length,
    durationMinutes: paperConfig.durationMinutes || (isCgpsc ? 120 : 180),
    marks: paperConfig.marks || (isCgpsc ? processedQuestions.length * 2 : processedQuestions.length),
    negativeMarkingRatio: paperConfig.negativeMarkingRatio || (isCgpsc ? '-⅓rd (0.667 Marks)' : '-⅓rd (0.33 Marks)'),
    paperSummary: paperConfig.paperSummary || `Official question paper archive for ${paperTitle} containing ${processedQuestions.length} bilingual questions.`,
    subjectsWeightage: (paperConfig.subjectsWeightage && paperConfig.subjectsWeightage.length > 0)
      ? paperConfig.subjectsWeightage
      : computedWeightages,
    downloadFileName: `${paperTitle.replace(/\s+/g, '_')}.pdf`,
    fileSize: '3.5 MB',
    isOfficialPaper: true,
    linkedQuestionIds: processedQuestions.map(q => q.id),
    linkedMockTestId: `test-from-${paperId}`,
  };

  // Create Mock Test
  const mockTest: MockTest = {
    id: `test-from-${paperId}`,
    title: `${paperTitle} (Real Exam Simulation)`,
    category: targetCategory,
    description: paper.paperSummary,
    durationMinutes: paper.durationMinutes,
    questionCount: processedQuestions.length,
    marksPerQuestion: isCgpsc ? 2.0 : 1.0,
    negativeMarksPerQuestion: isCgpsc ? 0.667 : 0.333,
    isPYP: true,
    pypYear: year,
    pypExamName: paperTitle,
    sections: [
      {
        id: `sec-${paperId}`,
        name: 'Official Question Paper',
        questionIds: processedQuestions.map(q => q.id),
      },
    ],
    attemptsCount: 0,
    isPublished: true,
    difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
    createdAt: new Date().toISOString().split('T')[0],
  };

  return {
    paper,
    mockTest,
    questions: processedQuestions,
  };
}

