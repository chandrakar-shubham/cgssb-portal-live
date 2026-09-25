import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  EXAM_PATTERNS,
  HIERARCHY_TREE,
} from './src/mockData';
import {
  Question,
  MockTest,
  PreviousYearPaper,
  TestAttempt,
  SectorAnalysis,
  ExamCategory,
  PYQAppearance
} from './src/types';
import {
  getAllQuestions,
  getQuestionById,
  saveQuestion,
  deleteQuestion,
  getAllMockTests,
  getMockTestById,
  saveMockTest,
  deleteMockTest,
  getAllPypPapers,
  savePypPaper,
  getAllTestAttempts,
  getTestAttemptById,
  saveTestAttempt,
  getDatabaseCounts,
  saveLocalJsonDb,
  getAllCmsPages,
  getCmsPageBySlug,
  saveCmsPage,
  deleteCmsPage,
  getAllCmsPosts,
  getCmsPostBySlug,
  saveCmsPost,
  deleteCmsPost,
  getAllCmsSeriesPacks,
  saveCmsSeriesPack,
  deleteCmsSeriesPack,
  getCmsSettings,
  saveCmsSettings,
} from './server/db/repository';
import { bootstrapAndMigrate } from './server/db/migrator';
import { dbConfig, isMysqlActive } from './server/db/connection';

dotenv.config();

const getFilename = () => {
  try {
    return fileURLToPath(import.meta.url);
  } catch {
    return typeof __filename !== 'undefined' ? __filename : '';
  }
};
const getDirname = () => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  }
};
const appFilename = getFilename();
const appDirname = getDirname();

const SERVER_BOOT_TIME = new Date().toISOString();

function getBuildInfo() {
  let commitSha = process.env.GITHUB_SHA || 'unknown';
  let buildTime = process.env.BUILD_TIME || 'unknown';

  const versionCandidates = [
    path.join(process.cwd(), 'dist', 'version.json'),
    path.join(process.cwd(), 'version.json'),
    path.join(appDirname, 'version.json'),
  ];
  for (const f of versionCandidates) {
    if (fs.existsSync(f)) {
      try {
        const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
        if (raw.commitSha && commitSha === 'unknown') commitSha = raw.commitSha;
        if (raw.buildTime && buildTime === 'unknown') buildTime = raw.buildTime;
        break;
      } catch (_) {}
    }
  }
  return { commitSha, buildTime };
}

// Gemini Client initialization (server-side only)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper: Classify a question into Subject, Topic (Chapter), and Subtopic based on text content & taxonomy
function autoClassifyChapter(text: string, defaultSubject: string, defaultTopic: string) {
  const lower = text.toLowerCase();

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
    lower.includes('गोधन न्याय') || lower.includes('सुराजी गांव') || lower.includes('महतारी वंदन') ||
    lower.includes('मैनपाट') || lower.includes('सामरीपाट') || lower.includes('गौरलाटा') ||
    lower.includes('दंतेवाड़ा') || lower.includes('कांकेर') || lower.includes('सुकमा') || lower.includes('धमतरी') ||
    lower.includes('कवर्धा') || lower.includes('दुर्ग') || lower.includes('कोरबा') || lower.includes('रायगढ़') ||
    lower.includes('जशपुर') || lower.includes('राजनांदगांव') || lower.includes('जांजगीर') || lower.includes('कोरिया') ||
    lower.includes('बलरामपुर') || lower.includes('सूरजपुर') || lower.includes('बेमेतरा') || lower.includes('बालोद') ||
    lower.includes('गरियाबंद') || lower.includes('महासमुंद') || lower.includes('मुंगेली') || lower.includes('गौरेला') ||
    lower.includes('मोहला') || lower.includes('सारंगढ़') || lower.includes('खैरागढ़') || lower.includes('मनेंद्रगढ़') ||
    lower.includes('सक्ती') || lower.includes('दल्ली राजहरा') || lower.includes('बैलाडीला');

  const hasIndiaIdentifier =
    lower.includes('भारत') || lower.includes('india') || lower.includes('indian') ||
    lower.includes('भारतीय') || lower.includes('राष्ट्रीय') || lower.includes('national') ||
    lower.includes('केंद्र') || lower.includes('central') || lower.includes('union') ||
    lower.includes('संसद') || lower.includes('parliament') || lower.includes('लोकसभा') ||
    lower.includes('राज्यसभा') || lower.includes('राष्ट्रपति') || lower.includes('supreme court') ||
    lower.includes('हड़प्पा') || lower.includes('सिंधु घाटी') || lower.includes('मौर्य') ||
    lower.includes('मुगल') || lower.includes('गांधी') || lower.includes('हिमालय') ||
    lower.includes('गंगा') || lower.includes('यमुना') || lower.includes('ब्रह्मपुत्र') ||
    lower.includes('आरबीआई') || lower.includes('rbi') || lower.includes('इसरो') || lower.includes('isro');

  if (hasCGIdentifier) {
    if (
      lower.includes('कलचुरी') || lower.includes('kalchuri') ||
      lower.includes('रतनपुर') || lower.includes('तुम्माण') ||
      lower.includes('मराठा') || lower.includes('भूमकाल') || lower.includes('काकतीय') ||
      lower.includes('विद्रोह') || lower.includes('revolt') || lower.includes('गठन') ||
      lower.includes('राज्य स्थापना') || lower.includes('रियासत') || lower.includes('वीर नारायण') ||
      lower.includes('सोनाखान') || lower.includes('गुंडाधूर') || lower.includes('सत्याग्रह')
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
      lower.includes('महानदी') || lower.includes('इंद्रावती') || lower.includes('शिवनाथ') || lower.includes('हसदेव') ||
      lower.includes('चित्रकोट') || lower.includes('तीरथगढ़') || lower.includes('मैनपाट') || lower.includes('सामरीपाट') ||
      lower.includes('खनिज') || lower.includes('mineral') || lower.includes('कोयला') || lower.includes('लौह अयस्क') ||
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
      lower.includes('दशहरा') || lower.includes('बस्तर') || lower.includes('नृत्य') || lower.includes('dance') ||
      lower.includes('करमा') || lower.includes('पंथी') || lower.includes('राउत') || lower.includes('पंडवानी') ||
      lower.includes('दंतेश्वरी') || lower.includes('मड़ई') || lower.includes('हरेली') || lower.includes('पोला') ||
      lower.includes('छेरछेरा') || lower.includes('घोटुल') || lower.includes('मेला')
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
    lower.includes('संविधान संशोधन') || lower.includes('amendment') ||
    lower.includes('न्यायपालिका') || lower.includes('judiciary')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'Indian Polity & Constitution',
      chapterName: 'Indian Polity & Constitution (भारतीय संविधान एवं राजव्यवस्था)',
      subtopic: lower.includes('अनुच्छेद') || lower.includes('मौलिक अधिकार') ? 'Fundamental Rights & Articles' : 'Parliament & Governance'
    };
  }

  if (
    lower.includes('हड़प्पा') || lower.includes('harappa') ||
    lower.includes('सिंधु घाटी') || lower.includes('indus valley') ||
    lower.includes('मोहनजोदड़ो') || lower.includes('वैदिक काल') || lower.includes('vedic') ||
    lower.includes('ऋग्वेद') || lower.includes('महाजनपद') ||
    lower.includes('बौद्ध धर्म') || lower.includes('buddhism') || lower.includes('जैन धर्म') || lower.includes('jainism') ||
    lower.includes('मौर्य') || lower.includes('maurya') || lower.includes('अशोक') || lower.includes('ashoka') ||
    lower.includes('गुप्त काल') || lower.includes('gupta') || lower.includes('समुद्रगुप्त') ||
    lower.includes('दिल्ली सल्तनत') || lower.includes('delhi sultanate') || lower.includes('खिलजी') || lower.includes('तुगलक') ||
    lower.includes('मुगल') || lower.includes('mughal') || lower.includes('बाबर') || lower.includes('अकबर') ||
    lower.includes('शाहजहां') || lower.includes('औरंगजेब') || lower.includes('शिवाजी') ||
    lower.includes('1857') || lower.includes('सिपाही विद्रोह') ||
    lower.includes('कांग्रेस') || lower.includes('inc') ||
    lower.includes('गांधी') || lower.includes('gandhi') ||
    lower.includes('चंपारण') || lower.includes('असहयोग') || lower.includes('सविनय अवज्ञा') || lower.includes('भारत छोड़ो') ||
    lower.includes('सुभाष चंद्र बोस') || lower.includes('भगत सिंह') || lower.includes('आजाद हिंद') ||
    lower.includes('ईस्ट इंडिया कंपनी') || lower.includes('प्लासी') || lower.includes('बक्सर') ||
    lower.includes('वायसराय') || lower.includes('गवर्नर जनरल')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'Indian History & National Movement',
      chapterName: 'Indian History & National Movement (भारतीय इतिहास एवं राष्ट्रीय आंदोलन)',
      subtopic: lower.includes('1857') || lower.includes('गांधी') || lower.includes('कांग्रेस') ? 'Freedom Struggle & National Movement' : 'Ancient & Medieval History'
    };
  }

  if (
    lower.includes('हिमालय') || lower.includes('himalaya') ||
    lower.includes('गंगा नदी') || lower.includes('ganga') ||
    lower.includes('यमुना') || lower.includes('ब्रह्मपुत्र') || lower.includes('brahmaputra') ||
    lower.includes('सिंधु नदी') || lower.includes('indus river') ||
    lower.includes('गोदावरी') || lower.includes('कावेरी') || lower.includes('कृष्णा नदी') ||
    lower.includes('नर्मदा') || lower.includes('ताप्ती') ||
    lower.includes('पश्चिमी घाट') || lower.includes('western ghats') ||
    lower.includes('पूर्वी घाट') || lower.includes('मानसून') || lower.includes('monsoon') ||
    lower.includes('कर्क रेखा') || lower.includes('tropic of cancer') ||
    lower.includes('अंडमान') || lower.includes('andaman') || lower.includes('निकोबार') ||
    lower.includes('लक्षद्वीप') || lower.includes('lakshadweep') || lower.includes('थार मरुस्थल') ||
    lower.includes('नीलगिरी') || lower.includes('सुंदरवन') || lower.includes('अरावली')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'Physical & Economic Geography of India',
      chapterName: 'Geography of India (भारत का भूगोल)',
      subtopic: lower.includes('हिमालय') || lower.includes('पर्वत') ? 'Himalayas & Physiography' : 'River Systems & Climate'
    };
  }

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

  if (
    lower.includes('नोबेल') || lower.includes('nobel') ||
    lower.includes('भारत रत्न') || lower.includes('bharat ratna') ||
    lower.includes('पद्म') || lower.includes('padma') ||
    lower.includes('इसरो') || lower.includes('isro') || lower.includes('चंद्रयान') || lower.includes('chandrayaan') ||
    lower.includes('डीआरडीओ') || lower.includes('drdo') ||
    lower.includes('संयुक्त राष्ट्र') || lower.includes('united nations') ||
    lower.includes('g20') || lower.includes('brics') ||
    lower.includes('विश्व बैंक') || lower.includes('world bank') ||
    lower.includes('ओलंपिक') || lower.includes('olympic')
  ) {
    return {
      subject: 'India General Studies',
      topic: 'National Current Affairs & General Knowledge',
      chapterName: 'Current Affairs & GK (समसामयिक घटनाएं एवं सामान्य ज्ञान)',
      subtopic: lower.includes('isro') ? 'Space & Science Missions' : 'Awards & International Affairs'
    };
  }

  if (hasIndiaIdentifier) {
    return {
      subject: 'India General Studies',
      topic: 'National Current Affairs & General Knowledge',
      chapterName: 'Current Affairs & GK (समसामयिक घटनाएं एवं सामान्य ज्ञान)',
      subtopic: 'General India Studies'
    };
  }

  let normalizedDefaultSubject = 'Chhattisgarh General Studies';
  if (defaultSubject) {
    const clean = defaultSubject.trim();
    if (clean.includes('Central') || clean.includes('CENTRAL') || clean.includes('India GS') || clean.includes('National')) {
      normalizedDefaultSubject = 'India General Studies';
    } else if (clean.includes('CGPSC') || clean.includes('Special Knowledge') || clean.includes('Chhattisgarh')) {
      normalizedDefaultSubject = 'Chhattisgarh General Studies';
    } else {
      normalizedDefaultSubject = clean
        .replace('General Science & Computer Knowledge', 'General Science')
        .replace('General Mental Ability & Reasoning', 'Quantitative Aptitude')
        .replace('General Hindi & Chhattisgarhi Language', 'General Hindi')
        .replace('General Mental Ability', 'Quantitative Aptitude');
    }
  }

  return {
    subject: normalizedDefaultSubject,
    topic: defaultTopic,
    chapterName: defaultTopic,
    subtopic: 'General Chapter Topic'
  };
}

function findSimilarOrRepeatedQuestion(newText: string, currentQuestions: Question[], currentId: string) {
  if (!newText || newText.length < 15) return null;
  const clean = (s: string) => s.replace(/[^\w\u0900-\u097F]/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim();
  const target = clean(newText);
  const targetWords = new Set(target.split(' ').filter(w => w.length > 3));

  if (targetWords.size < 3) return null;

  for (const q of currentQuestions) {
    if (q.id === currentId) continue;
    const compText = clean(q.questionHindi || q.questionText || '');
    if (!compText) continue;

    if (target.includes(compText) || compText.includes(target)) {
      return q;
    }

    const compWords = compText.split(' ').filter(w => w.length > 3);
    let matchCount = 0;
    for (const cw of compWords) {
      if (targetWords.has(cw)) matchCount++;
    }
    const similarity = matchCount / Math.max(targetWords.size, compWords.length);
    if (similarity >= 0.70) {
      return q;
    }
  }
  return null;
}

async function startServer() {
  // Bootstrap & Auto-migrate database tables and initial snapshot
  await bootstrapAndMigrate();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // CORS support for Android clients connecting over network
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health & Android Status Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: 'CGSSB Test (cgssbtest.com)',
      version: '1.0.0',
      database: {
        mode: dbConfig.mode,
        isMysqlActive: isMysqlActive(),
      },
      timestamp: new Date().toISOString(),
      androidCompatibility: {
        minSdkVersion: 24,
        targetSdkVersion: 34,
        supportsOfflineSync: true,
      },
    });
  });

  // 1b. Version & Deployment Verification Endpoint
  app.get('/api/version', async (req, res) => {
    const { commitSha, buildTime } = getBuildInfo();
    const counts = await getDatabaseCounts();
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      commitSha,
      buildTime,
      serverStartedAt: SERVER_BOOT_TIME,
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
      databaseMode: dbConfig.mode,
      isMysqlActive: isMysqlActive(),
      counts,
    });
  });

  // 2. Exam Patterns
  app.get('/api/patterns', (req, res) => {
    res.json({ success: true, patterns: EXAM_PATTERNS });
  });

  // 3. Question Bank Hierarchy Tree
  app.get('/api/hierarchy', (req, res) => {
    res.json({ success: true, hierarchy: HIERARCHY_TREE });
  });

  // 4. Questions CRUD
  app.get('/api/questions', async (req, res) => {
    try {
      const { subject, topic, subtopic, difficulty, category, search } = req.query;
      const questionsList = await getAllQuestions({
        subject: subject as string,
        topic: topic as string,
        subtopic: subtopic as string,
        difficulty: difficulty as string,
        category: category as string,
        search: search as string,
      });
      res.json({ success: true, total: questionsList.length, questions: questionsList });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/questions', async (req, res) => {
    try {
      const qData = req.body;
      const newQuestion: Question = {
        id: qData.id || `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        subject: qData.subject || 'Chhattisgarh Special Knowledge',
        topic: qData.topic || 'General',
        subtopic: qData.subtopic || 'General',
        difficulty: qData.difficulty || 'Medium',
        category: qData.category || 'CGSSB',
        questionText: qData.questionText || '',
        questionHindi: qData.questionHindi || '',
        options: qData.options || [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ],
        correctOption: qData.correctOption || 'A',
        marks: Number(qData.marks) || 1.0,
        negativeMarks: Number(qData.negativeMarks) || 0.333,
        explanation: qData.explanation || '',
        explanationHindi: qData.explanationHindi || '',
        pypSource: qData.pypSource || '',
        pypAppearances: qData.pypAppearances || [],
        createdAt: new Date().toISOString().split('T')[0],
      };

      await saveQuestion(newQuestion);
      res.status(201).json({ success: true, question: newQuestion });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/questions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await getQuestionById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      const updated: Question = { ...existing, ...req.body, id };
      await saveQuestion(updated);
      res.json({ success: true, question: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/questions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await deleteQuestion(id);
      res.json({ success: true, message: 'Question deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4b. Bulk Questions Ingestion Endpoint
  app.post('/api/questions/bulk', async (req, res) => {
    try {
      const { questions: incomingList } = req.body;
      const list = Array.isArray(incomingList) ? incomingList : (Array.isArray(req.body) ? req.body : []);

      if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing or empty questions array in request body.'
        });
      }

      let inserted = 0;
      let updated = 0;
      const savedQuestions: Question[] = [];

      for (const rawQ of list) {
        if (!rawQ) continue;
        const qId = String(rawQ.id || `q-${Date.now()}-${Math.floor(Math.random() * 10000)}`);
        const existing = await getQuestionById(qId);

        const formattedQ: Question = {
          ...rawQ,
          id: qId,
          subject: rawQ.subject || 'Chhattisgarh General Studies',
          topic: rawQ.topic || 'General',
          questionType: rawQ.questionType || 'mcq',
          subjectCategory: rawQ.subjectCategory || 'gs_reasoning',
          questionLanguage: rawQ.questionLanguage || 'bilingual',
          question: rawQ.question || rawQ.questionText || '',
          questionText: rawQ.questionText || rawQ.question || '',
          questionHindi: rawQ.questionHindi || '',
          options: (rawQ.options || []).map((opt: any, oIdx: number) => {
            const lbl = (opt.label || opt.id || ['A', 'B', 'C', 'D'][oIdx] || 'A') as 'A' | 'B' | 'C' | 'D';
            return {
              id: lbl,
              label: lbl,
              text: opt.text || '',
              textHindi: opt.textHindi || '',
            };
          }),
          correctOption: rawQ.correctOption || rawQ.correctAnswer || 'A',
          correctAnswer: rawQ.correctAnswer || rawQ.correctOption || 'A',
          idealTimeSeconds: Number(rawQ.idealTimeSeconds) || (rawQ.difficulty === 'Easy' ? 35 : rawQ.difficulty === 'Hard' ? 75 : 50),
          marks: Number(rawQ.marks) || 1.0,
          negativeMarks: Number(rawQ.negativeMarks) || 0.333,
        };

        await saveQuestion(formattedQ);
        if (existing) updated++;
        else inserted++;
        savedQuestions.push(formattedQ);
      }

      res.status(200).json({
        success: true,
        inserted,
        updated,
        total: list.length,
        questions: savedQuestions,
      });
    } catch (err: any) {
      console.error('Error in /api/questions/bulk:', err);
      res.status(500).json({ success: false, error: err.message || 'Bulk questions import failed' });
    }
  });

  // 5. Mock Tests CRUD
  app.get('/api/tests', async (req, res) => {
    try {
      const { category, publishedOnly } = req.query;
      const list = await getAllMockTests({
        category: category as string,
        publishedOnly: publishedOnly === 'true',
      });
      res.json({ success: true, tests: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/tests/:id', async (req, res) => {
    try {
      const test = await getMockTestById(req.params.id);
      if (!test) {
        return res.status(404).json({ success: false, error: 'Test not found' });
      }

      const allQIds: string[] = [];
      test.sections.forEach(s => {
        s.questionIds.forEach(qid => {
          if (!allQIds.includes(qid)) allQIds.push(qid);
        });
      });

      const allQuestionsList = await getAllQuestions();
      const testQuestions = allQuestionsList.filter(q => allQIds.includes(q.id));

      res.json({
        success: true,
        test,
        questions: testQuestions,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/tests/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await getMockTestById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Test not found' });
      }
      const updated: MockTest = {
        ...existing,
        ...req.body,
        id,
      };
      await saveMockTest(updated);
      res.json({ success: true, test: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/tests/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await deleteMockTest(id);
      res.json({
        success: true,
        deleted,
        message: 'Test deleted successfully',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/tests', async (req, res) => {
    try {
      const data = req.body;
      const pattern = EXAM_PATTERNS[data.category as ExamCategory] || EXAM_PATTERNS.CGSSB;

      const newTest: MockTest = {
        id: `test-${Date.now()}`,
        title: data.title || 'New Mock Test',
        category: data.category || 'CGSSB',
        description: data.description || '',
        durationMinutes: Number(data.durationMinutes) || pattern.durationMinutes,
        totalMarks: Number(data.totalMarks) || pattern.totalQuestions * pattern.marksPerCorrect,
        marksPerQuestion: Number(data.marksPerQuestion) || pattern.marksPerCorrect,
        negativeMarksPerQuestion: Number(data.negativeMarksPerQuestion) || pattern.negativeMarksPerWrong,
        sections: data.sections || [
          {
            id: 'sec-1',
            name: 'Section 1',
            questionIds: data.questionIds || [],
          },
        ],
        questionCount: data.questionCount || (data.questionIds ? data.questionIds.length : 10),
        attemptsCount: 0,
        passingPercentage: data.passingPercentage || 45,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      await saveMockTest(newTest);
      res.status(201).json({ success: true, test: newTest });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 6. Test Submission & Analytics Evaluation Engine
  app.post('/api/tests/:id/submit', async (req, res) => {
    try {
      const { id } = req.params;
      const {
        userId = 'u-student-01',
        userName = 'Aspirant Student',
        timeTakenSeconds = 600,
        responses = {},
        questionStatuses = {},
      } = req.body;

      const test = await getMockTestById(id);
      if (!test) {
        return res.status(404).json({ success: false, error: 'Test not found' });
      }

      const allQIds: string[] = [];
      test.sections.forEach(s => {
        s.questionIds.forEach(qid => {
          if (!allQIds.includes(qid)) allQIds.push(qid);
        });
      });

      const allQuestionsList = await getAllQuestions();
      const testQuestions = allQuestionsList.filter(q => allQIds.includes(q.id));

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let markedForReviewCount = 0;
      let rawScore = 0;
      let negativeMarksDeducted = 0;

      const sectorMap: Record<string, {
        total: number;
        correct: number;
        incorrect: number;
        unattempted: number;
        score: number;
        maxScore: number;
      }> = {};

      testQuestions.forEach(q => {
        const markedOption = responses[q.id];
        const status = questionStatuses[q.id];
        if (status === 'marked_for_review' || status === 'answered_and_marked') {
          markedForReviewCount++;
        }

        if (!sectorMap[q.subject]) {
          sectorMap[q.subject] = {
            total: 0,
            correct: 0,
            incorrect: 0,
            unattempted: 0,
            score: 0,
            maxScore: 0,
          };
        }
        sectorMap[q.subject].total++;
        sectorMap[q.subject].maxScore += q.marks;

        if (!markedOption) {
          unattemptedCount++;
          sectorMap[q.subject].unattempted++;
        } else if (markedOption === q.correctOption) {
          correctCount++;
          rawScore += q.marks;
          sectorMap[q.subject].correct++;
          sectorMap[q.subject].score += q.marks;
        } else {
          incorrectCount++;
          const penalty = q.negativeMarks || (q.marks * (1 / 3));
          rawScore -= penalty;
          negativeMarksDeducted += penalty;
          sectorMap[q.subject].incorrect++;
          sectorMap[q.subject].score -= penalty;
        }
      });

      const totalAttempted = correctCount + incorrectCount;
      const accuracy = totalAttempted > 0 ? (correctCount / totalAttempted) * 100 : 0;
      const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
      const maxPossibleScore = testQuestions.reduce((sum, q) => sum + q.marks, 0);
      const percentage = maxPossibleScore > 0 ? (finalScore / maxPossibleScore) * 100 : 0;

      const totalParticipants = (test.attemptsCount || 1200) + 1;
      test.attemptsCount = totalParticipants;
      await saveMockTest(test);

      const percentile = Math.min(99.9, Math.max(15.0, parseFloat((percentage * 0.95 + (accuracy * 0.05)).toFixed(1))));
      const simulatedRank = Math.max(1, Math.round(totalParticipants * (1 - percentile / 100)));

      const sectorAnalysis: SectorAnalysis[] = Object.keys(sectorMap).map(subj => {
        const s = sectorMap[subj];
        const subAttempts = s.correct + s.incorrect;
        return {
          subject: subj,
          total: s.total,
          correct: s.correct,
          incorrect: s.incorrect,
          unattempted: s.unattempted,
          accuracy: subAttempts > 0 ? parseFloat(((s.correct / subAttempts) * 100).toFixed(1)) : 0,
          score: parseFloat(s.score.toFixed(2)),
          maxScore: parseFloat(s.maxScore.toFixed(2)),
          timeSpentSeconds: Math.round(timeTakenSeconds / Math.max(1, Object.keys(sectorMap).length)),
        };
      });

      const attemptResult: TestAttempt = {
        id: `att-${Date.now()}`,
        userId,
        userName,
        testId: test.id,
        testTitle: test.title,
        category: test.category,
        submittedAt: new Date().toISOString(),
        timeTakenSeconds,
        totalDurationSeconds: test.durationMinutes * 60,
        responses,
        questionStatuses,
        score: finalScore,
        maxScore: maxPossibleScore,
        percentage: parseFloat(percentage.toFixed(1)),
        accuracy: parseFloat(accuracy.toFixed(1)),
        correctCount,
        incorrectCount,
        unattemptedCount,
        markedForReviewCount,
        negativeMarksDeducted: parseFloat(negativeMarksDeducted.toFixed(2)),
        simulatedRank,
        totalParticipants,
        percentile,
        sectorAnalysis,
      };

      await saveTestAttempt(attemptResult);

      res.json({
        success: true,
        attempt: attemptResult,
        solutions: testQuestions,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Attempts History
  app.get('/api/attempts', async (req, res) => {
    try {
      const { userId } = req.query;
      const list = await getAllTestAttempts(userId as string);
      res.json({ success: true, attempts: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/attempts/:id', async (req, res) => {
    try {
      const attempt = await getTestAttemptById(req.params.id);
      if (!attempt) {
        return res.status(404).json({ success: false, error: 'Attempt not found' });
      }
      const test = await getMockTestById(attempt.testId);
      let testQuestions: Question[] = [];
      if (test) {
        const qids: string[] = [];
        test.sections.forEach(s => qids.push(...s.questionIds));
        const allQuestionsList = await getAllQuestions();
        testQuestions = allQuestionsList.filter(q => qids.includes(q.id));
      }
      res.json({ success: true, attempt, questions: testQuestions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Previous Year Papers (PYP)
  app.get('/api/pyp', async (req, res) => {
    try {
      const { category } = req.query;
      const list = await getAllPypPapers(category as string);
      res.json({ success: true, pypPapers: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/pyp', async (req, res) => {
    try {
      const data = req.body;
      const newPyp: PreviousYearPaper = {
        id: `pyp-${Date.now()}`,
        title: data.title || 'Official Previous Year Paper',
        examCategory: data.examCategory || 'CGSSB',
        year: Number(data.year) || new Date().getFullYear() - 1,
        totalQuestions: Number(data.totalQuestions) || 100,
        durationMinutes: Number(data.durationMinutes) || 120,
        marks: Number(data.marks) || 100,
        negativeMarkingRatio: data.negativeMarkingRatio || '-⅓rd (0.33 Marks)',
        paperSummary: data.paperSummary || 'Official Solved Archive paper with detailed weightage.',
        subjectsWeightage: data.subjectsWeightage || [
          { subject: 'Chhattisgarh Special Knowledge', questionCount: 40, percentage: 40 },
          { subject: 'General Mental Ability & Reasoning', questionCount: 30, percentage: 30 },
          { subject: 'Language & Computers', questionCount: 30, percentage: 30 },
        ],
        downloadFileName: data.downloadFileName || `${data.title ? data.title.replace(/\s+/g, '_') : 'PYP_Paper'}.pdf`,
        fileSize: '3.2 MB',
      };

      await savePypPaper(newPyp);
      res.status(201).json({ success: true, pyp: newPyp });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 8b. PYP Bulk Ingestion (JSON & CSV Bulk Import)
  app.post('/api/pyp/bulk-import', async (req, res) => {
    try {
      const { questions: incomingList, paperConfig, createMockTest = true } = req.body;
      if (!Array.isArray(incomingList) || incomingList.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing or empty "questions" array in request body.'
        });
      }

      let inserted = 0;
      let updated = 0;
      const processedQuestions: Question[] = [];

      const defaultExamName = paperConfig?.title || incomingList[0]?.Examname || 'CG Exam';
      const defaultYear = Number(paperConfig?.year || incomingList[0]?.Year || 2024);
      const targetCategory: ExamCategory = paperConfig?.examCategory || (
        String(defaultExamName).toLowerCase().includes('psc') ? 'CGPSC' :
        String(defaultExamName).toLowerCase().includes('central') || String(defaultExamName).toLowerCase().includes('ssc') ? 'CENTRAL_EXAMS' :
        'CGSSB'
      );

      const catPrefix = targetCategory === 'CGPSC' ? 'CGPSC' : targetCategory === 'CENTRAL_EXAMS' ? 'CENTRAL' : 'CGSSB';
      const existingAllQuestions = await getAllQuestions();

      for (let idx = 0; idx < incomingList.length; idx++) {
        const item = incomingList[idx];
        const rawExamname = String(item.Examname || item.examname || defaultExamName).trim();
        const examname = rawExamname.toLowerCase();
        const year = Number(item.Year || item.year || defaultYear);
        const sno = Number(item['S.No.'] || item.sno || item.sNo || (idx + 1));

        const questionHindi = String(item['Question(Hindi)'] || item.questionHindi || '').trim();
        const questionEnglish = String(item['Question(english)'] || item.questionEnglish || '').trim();
        const optionA = String(item.option_A ?? '');
        const optionB = String(item.option_B ?? '');
        const optionC = String(item.option_C ?? '');
        const optionD = String(item.option_D ?? '');
        const rawAns = String(item.answer || 'A').trim().toUpperCase();
        const answer: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(rawAns)
          ? (rawAns as 'A' | 'B' | 'C' | 'D')
          : (rawAns.includes('B') ? 'B' : rawAns.includes('C') ? 'C' : rawAns.includes('D') ? 'D' : 'A');
        const explanation = String(item.explaination || item.explanation || '').trim();

        const generatedUniqueId = `${catPrefix}-${year}-Q${String(sno).padStart(3, '0')}`;
        const uniqueKey = String(item.uniqueQuestionId || generatedUniqueId).trim();
        const questionId = item.id || `q-bulk-${catPrefix.toLowerCase()}-${year}-${sno}`;

        const isCgpsc = targetCategory === 'CGPSC';

        const defaultSubj = targetCategory === 'CGPSC'
          ? 'Chhattisgarh General Studies'
          : targetCategory === 'CENTRAL_EXAMS'
          ? 'India General Studies'
          : 'Chhattisgarh General Studies';
        const defaultTopic = `${rawExamname} (${year}) Official`;

        const combinedText = `${questionHindi} ${questionEnglish} ${explanation}`;
        const classification = autoClassifyChapter(combinedText, defaultSubj, defaultTopic);

        const rawSubj = String(item.subject || '').trim();
        const assignedSubject = rawSubj ? (
          rawSubj.includes('Central') || rawSubj.includes('CENTRAL') || rawSubj.includes('India GS') ? 'India General Studies' :
          rawSubj.includes('CGPSC') || rawSubj.includes('Special Knowledge') || rawSubj.includes('Chhattisgarh') ? 'Chhattisgarh General Studies' :
          rawSubj.replace('General Science & Computer Knowledge', 'General Science')
                 .replace('General Mental Ability & Reasoning', 'Quantitative Aptitude')
                 .replace('General Hindi & Chhattisgarhi Language', 'General Hindi')
                 .replace('General Mental Ability', 'Quantitative Aptitude')
        ) : classification.subject;
        const assignedTopic = String(item.topic || classification.topic);
        const assignedChapterName = String(item.chapterName || item.chapter || classification.chapterName || assignedTopic);
        const assignedSubtopic = String(item.subtopic || classification.subtopic || `Question #${sno}`);

        const currentAppearance: PYQAppearance = { examName: rawExamname, year, shift: 'Official' };

        const similarQuestion = findSimilarOrRepeatedQuestion(questionHindi || questionEnglish, existingAllQuestions, questionId);

        let appearancesList: PYQAppearance[] = [currentAppearance];
        if (similarQuestion?.pypAppearances && Array.isArray(similarQuestion.pypAppearances)) {
          const merged: PYQAppearance[] = [...similarQuestion.pypAppearances];
          if (!merged.some(a => a.examName.toLowerCase() === examname && a.year === year)) {
            merged.push(currentAppearance);
          }
          appearancesList = merged;
          similarQuestion.pypAppearances = merged;
          similarQuestion.repeatedInExams = merged.map(a => `${a.examName} (${a.year})`);
        }

        if (item.repeatedInExams) {
          const rawRep = Array.isArray(item.repeatedInExams) ? item.repeatedInExams : String(item.repeatedInExams).split(',');
          for (const rep of rawRep) {
            const trimmed = String(rep).trim();
            if (trimmed && !appearancesList.some(a => a.examName.toLowerCase() === trimmed.toLowerCase())) {
              appearancesList.push({ examName: trimmed, year: year, shift: 'Official' });
            }
          }
        }

        const formattedQuestion: Question = {
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
          text: questionEnglish || questionHindi,
          questionHindi: questionHindi,
          textHindi: questionHindi,
          options: [
            { id: 'A', text: optionA },
            { id: 'B', text: optionB },
            { id: 'C', text: optionC },
            { id: 'D', text: optionD },
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

        const existingIdx = existingAllQuestions.findIndex(q =>
          (q.uniqueQuestionId && q.uniqueQuestionId === uniqueKey) ||
          q.id === questionId ||
          (q.category === targetCategory && q.pypAppearances?.some(p => p.examName.toLowerCase() === examname && p.year === year) && q.subtopic === `Question #${sno}`)
        );

        if (existingIdx !== -1) {
          const prior = existingAllQuestions[existingIdx];
          if (prior.pypAppearances && formattedQuestion.pypAppearances) {
            for (const app of prior.pypAppearances) {
              if (!formattedQuestion.pypAppearances.some(a => a.examName.toLowerCase() === app.examName.toLowerCase() && a.year === app.year)) {
                formattedQuestion.pypAppearances.push(app);
              }
            }
            formattedQuestion.repeatedInExams = formattedQuestion.pypAppearances.map(a => `${a.examName} (${a.year})`);
          }
          await saveQuestion(formattedQuestion);
          updated++;
        } else {
          await saveQuestion(formattedQuestion);
          inserted++;
        }
        processedQuestions.push(formattedQuestion);
      }

      const paperTitle = paperConfig?.title || `${defaultExamName} ${defaultYear} Official Solved Paper`;
      const paperYear = Number(paperConfig?.year || defaultYear);
      const paperDuration = Number(paperConfig?.durationMinutes || (targetCategory === 'CGPSC' ? 120 : 180));
      const paperMarks = Number(paperConfig?.marks || (targetCategory === 'CGPSC' ? processedQuestions.length * 2 : processedQuestions.length));
      const paperNegRatio = paperConfig?.negativeMarkingRatio || (targetCategory === 'CGPSC' ? '-⅓rd (0.667 Marks per wrong answer)' : '-⅓rd (0.33 Marks)');
      const paperSummary = paperConfig?.paperSummary || `Official question paper archive for ${paperTitle} containing ${processedQuestions.length} bilingual questions, official key, and detailed solutions.`;

      const allPypPapersList = await getAllPypPapers();
      const existingPaper = allPypPapersList.find(p => p.year === paperYear && p.title.toLowerCase().includes(paperTitle.toLowerCase()));
      const paperId = existingPaper?.id || `pyp-${catPrefix.toLowerCase()}-${paperYear}-${Date.now()}`;

      const subjMap: Record<string, number> = {};
      processedQuestions.forEach(q => {
        subjMap[q.subject] = (subjMap[q.subject] || 0) + 1;
      });
      const computedWeightages = Object.entries(subjMap).map(([subject, count]) => ({
        subject,
        questionCount: count,
        percentage: Math.round((count / (processedQuestions.length || 1)) * 100),
      })).sort((a, b) => b.questionCount - a.questionCount);

      const updatedOrNewPaper: PreviousYearPaper = {
        id: paperId,
        title: paperTitle,
        examCategory: targetCategory,
        year: paperYear,
        totalQuestions: processedQuestions.length,
        durationMinutes: paperDuration,
        marks: paperMarks,
        negativeMarkingRatio: paperNegRatio,
        paperSummary: paperSummary,
        subjectsWeightage: (paperConfig?.subjectsWeightage && paperConfig.subjectsWeightage.length > 0)
          ? paperConfig.subjectsWeightage
          : computedWeightages,
        downloadFileName: `${paperTitle.replace(/\s+/g, '_')}.pdf`,
        fileSize: '3.5 MB',
        isOfficialPaper: true,
        linkedQuestionIds: processedQuestions.map(q => q.id),
      };

      await savePypPaper(updatedOrNewPaper);

      let createdMockTest: MockTest | null = null;
      if (createMockTest) {
        const mockTestId = `test-from-${updatedOrNewPaper.id}`;

        createdMockTest = {
          id: mockTestId,
          title: `${paperTitle} (Real Exam Simulation)`,
          category: targetCategory,
          description: paperSummary,
          durationMinutes: paperDuration,
          questionCount: processedQuestions.length,
          marksPerQuestion: targetCategory === 'CGPSC' ? 2.0 : 1.0,
          negativeMarksPerQuestion: targetCategory === 'CGPSC' ? 0.667 : 0.333,
          isPYP: true,
          pypYear: paperYear,
          pypExamName: paperTitle,
          sections: [
            {
              id: `sec-${updatedOrNewPaper.id}`,
              name: 'Official Question Paper',
              questionIds: processedQuestions.map(q => q.id),
            },
          ],
          attemptsCount: 0,
          isPublished: true,
          difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
          createdAt: new Date().toISOString().split('T')[0],
        };

        await saveMockTest(createdMockTest);
        updatedOrNewPaper.linkedMockTestId = createdMockTest.id;
        await savePypPaper(updatedOrNewPaper);
      }

      return res.status(200).json({
        success: true,
        inserted,
        updated,
        total: incomingList.length,
        paper: updatedOrNewPaper,
        mockTest: createdMockTest,
        questions: processedQuestions,
      });
    } catch (err: any) {
      console.error('Error in /api/pyp/bulk-import:', err);
      return res.status(500).json({ success: false, error: err.message || 'Bulk import failed' });
    }
  });

  // 9. AI-Powered Smart Mock Test Creator
  app.post('/api/ai/generate-test', async (req, res) => {
    try {
      const examCategory = (req.body.examCategory || req.body.category || 'CGSSB') as ExamCategory;
      const targetSubjects: string[] = req.body.targetSubjects || req.body.subjects || [];
      const pypReferenceId = req.body.pypReferenceId || req.body.referencePYPId;
      const questionCount = Number(req.body.questionCount || 10);
      const testTitle = req.body.testTitle || req.body.title;

      const pattern = EXAM_PATTERNS[examCategory as ExamCategory] || EXAM_PATTERNS.CGSSB;
      const allPypPapersList = await getAllPypPapers();
      const referencedPyp = pypReferenceId ? allPypPapersList.find(p => p.id === pypReferenceId) : null;

      const allQuestionsList = await getAllQuestions();
      let candidatePool = allQuestionsList.filter(q => {
        const catMatch = q.category === examCategory || q.category === 'CGSSB';
        const subjMatch = targetSubjects.length === 0 || targetSubjects.includes(q.subject);
        return catMatch && subjMatch;
      });

      if (candidatePool.length < questionCount) {
        candidatePool = [...allQuestionsList];
      }

      const ai = getGeminiClient();
      let generatedFreshQuestions: Question[] = [];

      if (ai) {
        try {
          const prompt = `You are a senior question paper setter for ${pattern.name}.
We are assembling an authentic mock test matching the historical pattern of: ${referencedPyp ? referencedPyp.title : pattern.name}.
Target Subjects: ${targetSubjects.length > 0 ? targetSubjects.join(', ') : 'India General Studies, Chhattisgarh General Studies, Quantitative Aptitude, Reasoning Ability, General Science, Computer Knowledge, General Hindi, Chhattisgarhi Language, General English'}.
IMPORTANT SUBJECT RULES:
- "India General Studies" and "Chhattisgarh General Studies" are strictly separate subjects.
- Do NOT combine subjects with '&'. Separate subjects cleanly: General Science, Computer Knowledge, Quantitative Aptitude, Reasoning Ability, General Hindi, Chhattisgarhi Language.
Exam Pattern Rules:
- Marks per right question: ${pattern.marksPerCorrect}
- Negative marking per wrong answer: ${pattern.negativeMarksPerWrong}
- Number of fresh questions needed: ${Math.min(questionCount, 5)}
- Bilingual: Provide both English and Hindi text for each question, options, and explanation.

Respond strictly with a JSON object having key "questions" containing an array of objects matching:
{
  "subject": string,
  "topic": string,
  "subtopic": string,
  "difficulty": "Easy" | "Medium" | "Hard",
  "questionText": string,
  "questionHindi": string,
  "options": [{"id": "A", "text": string, "textHindi": string}, ...],
  "correctOption": "A" | "B" | "C" | "D",
  "explanation": string,
  "explanationHindi": string
}`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              temperature: 0.4,
            },
          });

          const jsonText = response.text?.trim() || '{}';
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed.questions)) {
            generatedFreshQuestions = parsed.questions.map((item: any, idx: number) => {
              const rawSubj = String(item.subject || '').trim();
              const cleanSubj = rawSubj.includes('Central') || rawSubj.includes('India GS') || rawSubj.includes('National')
                ? 'India General Studies'
                : rawSubj.includes('CGPSC') || rawSubj.includes('Special Knowledge') || rawSubj.includes('Chhattisgarh')
                ? 'Chhattisgarh General Studies'
                : rawSubj.replace('General Science & Computer Knowledge', 'General Science')
                    .replace('General Mental Ability & Reasoning', 'Quantitative Aptitude')
                    .replace('General Hindi & Chhattisgarhi Language', 'General Hindi')
                    .replace('General Mental Ability', 'Quantitative Aptitude')
                    || 'Chhattisgarh General Studies';

              return {
                id: `q-ai-${Date.now()}-${idx}`,
                subject: cleanSubj,
                topic: item.topic || 'General Topic',
                subtopic: item.subtopic || 'General Subtopic',
                difficulty: (['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : 'Medium') as any,
                category: examCategory as ExamCategory,
                questionText: item.questionText || 'Sample competitive question',
                questionHindi: item.questionHindi || '',
                options: Array.isArray(item.options) && item.options.length === 4 ? item.options : [
                  { id: 'A', text: 'Option A' },
                  { id: 'B', text: 'Option B' },
                  { id: 'C', text: 'Option C' },
                  { id: 'D', text: 'Option D' },
                ],
                correctOption: item.correctOption || 'A',
                marks: pattern.marksPerCorrect,
                negativeMarks: pattern.negativeMarksPerWrong,
                explanation: item.explanation || 'Detailed analysis step.',
                explanationHindi: item.explanationHindi || '',
                pypSource: `AI PYP Synthesizer (${referencedPyp ? referencedPyp.year : '2024'})`,
                createdAt: new Date().toISOString().split('T')[0],
              };
            });
            for (const gq of generatedFreshQuestions) {
              await saveQuestion(gq);
            }
          }
        } catch (geminiError) {
          console.warn('Gemini API call skipped or fell back to tagged question bank synthesis:', geminiError);
        }
      }

      const finalSelectedQuestions: Question[] = [...generatedFreshQuestions];
      const neededFromBank = questionCount - finalSelectedQuestions.length;

      const shuffledBank = [...candidatePool].sort(() => 0.5 - Math.random());
      for (const q of shuffledBank) {
        if (finalSelectedQuestions.length >= questionCount) break;
        if (!finalSelectedQuestions.find(x => x.id === q.id)) {
          finalSelectedQuestions.push(q);
        }
      }

      const sec1Questions = finalSelectedQuestions.slice(0, Math.ceil(finalSelectedQuestions.length / 2));
      const sec2Questions = finalSelectedQuestions.slice(Math.ceil(finalSelectedQuestions.length / 2));

      const newTest: MockTest = {
        id: `test-ai-${Date.now()}`,
        title: testTitle || `AI Smart Mock: ${pattern.shortName} Balanced Test`,
        category: examCategory as ExamCategory,
        description: `Automated AI-synthesized mock test aligned with ${referencedPyp ? referencedPyp.title : pattern.name} historical trends.`,
        durationMinutes: Math.min(120, questionCount * 1.5),
        totalMarks: finalSelectedQuestions.reduce((s, q) => s + q.marks, 0),
        marksPerQuestion: pattern.marksPerCorrect,
        negativeMarksPerQuestion: pattern.negativeMarksPerWrong,
        sections: [
          {
            id: 'sec-ai-1',
            name: 'Section 1: Core Subject Specialization',
            questionIds: sec1Questions.map(q => q.id),
          },
          {
            id: 'sec-ai-2',
            name: 'Section 2: Aptitude, Reasoning & Language',
            questionIds: sec2Questions.map(q => q.id),
          },
        ],
        questionCount: finalSelectedQuestions.length,
        attemptsCount: 0,
        passingPercentage: 45,
        isPublished: true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      await saveMockTest(newTest);

      res.status(201).json({
        success: true,
        test: newTest,
        questions: finalSelectedQuestions,
        assembledQuestionCount: finalSelectedQuestions.length,
        aiGeneratedCount: generatedFreshQuestions.length,
        bankRetrievedCount: finalSelectedQuestions.length - generatedFreshQuestions.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Android App Connectivity & Sync Endpoints
  app.get('/api/android/info', (req, res) => {
    const host = req.headers.host || 'cgssbtest.com';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const baseUrl = `${protocol}://${host}`;

    res.json({
      success: true,
      platform: 'CGSSB Test Android Integration Hub',
      version: 'v1.4.0',
      baseUrl,
      database: {
        mode: dbConfig.mode,
        isMysqlActive: isMysqlActive(),
      },
      apiDocumentation: {
        authentication: {
          endpoint: 'POST /api/auth/login',
          description: 'Authenticate mobile user & obtain authorization token',
        },
        testsList: {
          endpoint: 'GET /api/tests?category=CGSSB',
          description: 'Fetch list of available active mock tests for mobile catalog',
        },
        testDetails: {
          endpoint: 'GET /api/tests/{testId}',
          description: 'Download full test paper with questions and options',
        },
        submitTest: {
          endpoint: 'POST /api/tests/{testId}/submit',
          description: 'Submit candidate responses and receive instant Rank, Accuracy & Solutions',
        },
        pypList: {
          endpoint: 'GET /api/pyp',
          description: 'Fetch Previous Year Papers archive with PDF download endpoints',
        },
        offlineSync: {
          endpoint: 'GET /api/android/sync',
          description: 'One-click full sync of categories, questions, and tests',
        },
      },
    });
  });

  // 11. Android Offline Full Sync Endpoint
  app.get('/api/android/sync', async (req, res) => {
    try {
      const questionsList = await getAllQuestions();
      const mockTestsList = await getAllMockTests();
      const pypPapersList = await getAllPypPapers();

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        patterns: EXAM_PATTERNS,
        hierarchy: HIERARCHY_TREE,
        tests: mockTestsList,
        questions: questionsList,
        pypPapers: pypPapersList,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 12. NO-CODE CMS ENDPOINTS (Pages, Posts, Series, Settings)
  app.get('/api/cms/pages', async (req, res) => {
    try {
      const pages = await getAllCmsPages();
      res.json({ success: true, pages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cms/pages/:slug', async (req, res) => {
    try {
      const page = await getCmsPageBySlug(req.params.slug);
      if (!page) return res.status(404).json({ success: false, error: 'Page not found' });
      res.json({ success: true, page });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/cms/pages', async (req, res) => {
    try {
      const saved = await saveCmsPage(req.body);
      res.json({ success: true, page: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/cms/pages/:id', async (req, res) => {
    try {
      const deleted = await deleteCmsPage(req.params.id);
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cms/posts', async (req, res) => {
    try {
      const posts = await getAllCmsPosts();
      res.json({ success: true, posts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cms/posts/:slug', async (req, res) => {
    try {
      const post = await getCmsPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ success: false, error: 'Post not found' });
      res.json({ success: true, post });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/cms/posts', async (req, res) => {
    try {
      const saved = await saveCmsPost(req.body);
      res.json({ success: true, post: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/cms/posts/:id', async (req, res) => {
    try {
      const deleted = await deleteCmsPost(req.params.id);
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cms/series', async (req, res) => {
    try {
      const series = await getAllCmsSeriesPacks();
      res.json({ success: true, series });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/cms/series', async (req, res) => {
    try {
      const saved = await saveCmsSeriesPack(req.body);
      res.json({ success: true, pack: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/cms/series/:id', async (req, res) => {
    try {
      const deleted = await deleteCmsSeriesPack(req.params.id);
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cms/settings', async (req, res) => {
    try {
      const settings = await getCmsSettings();
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/cms/settings', async (req, res) => {
    try {
      const saved = await saveCmsSettings(req.body);
      res.json({ success: true, settings: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Mount Vite middleware for dev or static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // In dev mode, serve index.source.html via vite transform so root index.html
    // stays permanently compiled for direct Hostinger Git sync without going blank!
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      if (req.method === 'GET' && (req.headers.accept?.includes('text/html') || req.path === '/' || req.path.endsWith('.html'))) {
        try {
          const sourcePath = fs.existsSync(path.resolve('index.source.html'))
            ? path.resolve('index.source.html')
            : path.resolve('index.html');
          const rawTemplate = fs.readFileSync(sourcePath, 'utf-8');
          const transformedHtml = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(transformedHtml);
          return;
        } catch (e) {
          return next(e);
        }
      }
      next();
    });
  } else {
    // Dynamic static directory discovery:
    // Handles cases where dist is a subfolder, OR where dist contents were deployed directly into the web root
    const possibleStaticDirs = [
      path.join(process.cwd(), 'dist'),
      process.cwd(),
      appDirname,
      path.join(appDirname, 'dist'),
    ];

    const staticDir = possibleStaticDirs.find(d =>
      fs.existsSync(path.join(d, 'index.html')) && fs.existsSync(path.join(d, 'assets'))
    ) || possibleStaticDirs.find(d =>
      fs.existsSync(path.join(d, 'index.html'))
    ) || path.join(process.cwd(), 'dist');

    console.log(`📁 Serving static files from: ${staticDir}`);

    if (!fs.existsSync(staticDir)) {
      console.error(`❌ Static folder NOT FOUND at ${staticDir}`);
    }

    // Explicitly serve hashed assets with 1-year immutable caching
    const assetsPath = path.join(staticDir, 'assets');
    if (fs.existsSync(assetsPath)) {
      app.use('/assets', express.static(assetsPath, {
        maxAge: '1y',
        immutable: true,
      }));
    }

    // Serve all other static files, ensuring HTML files are NEVER cached
    app.use(express.static(staticDir, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    }));

    // SPA fallback — serve index.html for any non-API route with anti-caching headers
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: 'API route not found' });
      }
      const indexPath = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(indexPath);
      } else {
        res.status(500).send('Frontend not built. index.html not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    const counts = await getDatabaseCounts();
    console.log(`🚀 CGSSB Test Server running on port ${PORT}`);
    console.log(`🔌 Database Mode: [${dbConfig.mode.toUpperCase()}] (MySQL Active: ${isMysqlActive()})`);
    console.log(`📊 Catalog: ${counts.questions} questions, ${counts.mockTests} tests, ${counts.pypPapers} PYPs, ${counts.attempts} attempts`);
  });
}

startServer();
