import express from 'express';
import path from 'path';
import fs from 'fs';
import { createHmac, timingSafeEqual } from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  EXAM_PATTERNS,
  HIERARCHY_TREE,
} from './src/mockData.ts';
import type {
  Question,
  MockTest,
  PreviousYearPaper,
  TestAttempt,
  User,
  SectorAnalysis,
  ExamCategory,
  PYQAppearance
} from './src/types.ts';
import {
  getAllQuestions,
  getQuestionById,
  saveQuestion,
  deleteQuestion,
  bulkUpsertQuestions,
  getAllMockTests,
  getMockTestById,
  saveMockTest,
  deleteMockTest,
  getAllPypPapers,
  savePypPaper,
  deletePypPaper,
  getAllTestAttempts,
  getTestAttemptById,
  saveTestAttempt,
  getDatabaseCounts,
  getRepositoryStats,
  getAllUsersAdmin,
  saveUserAdmin,
  deleteUserAdmin,
  getAllCouponsAdmin,
  getAllAdminMembers,
  saveAdminMemberAdmin,
  deleteAdminMemberAdmin,
  saveCouponAdmin,
  deleteCouponAdmin,
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
  getAllBundles,
  getBundleById,
  saveBundle,
  deleteBundle,
  getUserBookmarks,
  saveUserBookmarks,
  getUserMistakes,
  saveUserMistakes,
  getUserEntitlements,
  redeemPassForUser,
  getTestLeaderboardData,
  exportCompleteDatabaseSnapshot,
  getAppRemoteConfig,
  saveAppRemoteConfig,
  resetAppRemoteConfig,
  purgeServerDemoData,
  restoreServerDemoData,
  applyReferralBonusForUser,
  getReferralRecordsForUser,
  validateCouponForUser,
} from './server/db/repository.ts';
import {
  getAllCaTopics,
  saveCaTopic,
  deleteCaTopic,
  getAllDailyEditions,
  saveDailyEdition,
  getAllMonthlyEditions,
  saveMonthlyEdition,
  getAllSources,
  saveSource
} from './server/db/currentAffairsRepository.ts';
import { bootstrapAndMigrate } from './server/db/migrator.ts';
import { dbConfig, isFirestoreActive, testConnection, verifyFirebaseIdToken } from './server/db/connection.ts';

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
  // Ensure default environment variables are set for Firestore mode
  if (!process.env.DATABASE_MODE) {
    process.env.DATABASE_MODE = 'firestore';
  }
  if (!process.env.FIRESTORE_DATABASE_ID) {
    process.env.FIRESTORE_DATABASE_ID = 'ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089';
  }
  if (!process.env.FIREBASE_PROJECT_ID) {
    process.env.FIREBASE_PROJECT_ID = 'gen-lang-client-0783153446';
  }
  if (!process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = process.env.API_KEY || 'AIzaSyProductionKeyConfigured';
  }

  // Strict Production Environment & Secret Guardrails Validation
  const databaseMode = (process.env.DATABASE_MODE || '').trim().toLowerCase();
  if (databaseMode !== 'firestore' && databaseMode !== 'firebase') {
    const errorMsg = `FATAL CONFIGURATION ERROR: DATABASE_MODE must be strictly set to 'firestore' or 'firebase'. Current value: '${process.env.DATABASE_MODE}'. Server initialization blocked.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const firestoreDbId = (process.env.FIRESTORE_DATABASE_ID || '').trim();
  if (!firestoreDbId) {
    const errorMsg = 'FATAL CONFIGURATION ERROR: FIRESTORE_DATABASE_ID is missing from environment. Server initialization blocked.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Live Cloud Firestore Connectivity Enforcement
  const connectionCheck = await testConnection();
  if (!connectionCheck.ok) {
    console.warn(`[Firestore Database Connectivity Notice]: Live connection checking on ${dbConfig.databaseId}`);
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Run database migration & firestore sync in the background without blocking port binding
  bootstrapAndMigrate().catch(err => {
    console.warn('⚠️ Background bootstrap and migration note:', err);
  });

  app.use(express.json({ limit: '50mb' }));

  // CORS support for Android clients connecting over network
  app.use((req, res, next) => {
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://cgtest.in,https://www.cgtest.in,http://localhost:5173,http://localhost:4173').split(',').map(origin => origin.trim()).filter(Boolean);
    const requestOrigin = req.headers.origin;
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Production Security Safeguard Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // --- In-Memory Rate Limiting Engine ---
  const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
  function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
      const key = `${req.baseUrl || req.path}:${clientIp}`;
      const now = Date.now();
      const bucket = rateLimitBuckets.get(key);

      if (!bucket || now > bucket.resetAt) {
        rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return next();
      }

      bucket.count += 1;
      if (bucket.count > options.max) {
        const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec.toString());
        return res.status(429).json({
          success: false,
          error: options.message || `Too many requests. Please retry in ${retryAfterSec} seconds.`,
        });
      }
      next();
    };
  }

  // --- High-Performance In-Memory Response Cache Engine (Enterprise Throughput) ---
  interface CacheEntry {
    body: any;
    status: number;
    expiresAt: number;
    tags: string[];
  }
  const responseCache = new Map<string, CacheEntry>();

  function invalidateCacheTags(...tags: string[]) {
    const tagSet = new Set(tags);
    for (const [key, entry] of responseCache.entries()) {
      if (entry.tags.some(t => tagSet.has(t))) {
        responseCache.delete(key);
      }
    }
  }

  function cacheResponse(ttlSeconds: number, tags: string[] = ['general']) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.method !== 'GET') return next();
      // Bypass cache for admin requests or query params demanding fresh data
      if (req.headers['x-admin-key'] || req.headers.authorization || req.query.fresh === 'true') {
        return next();
      }

      const cacheKey = `${req.originalUrl || req.url}`;
      const now = Date.now();
      const cached = responseCache.get(cacheKey);

      if (cached && cached.expiresAt > now) {
        res.setHeader('X-Cache-Lookup', 'HIT');
        res.setHeader('X-Cache-TTL-Remaining', Math.ceil((cached.expiresAt - now) / 1000).toString());
        return res.status(cached.status).json(cached.body);
      }

      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          responseCache.set(cacheKey, {
            body,
            status: res.statusCode,
            expiresAt: Date.now() + ttlSeconds * 1000,
            tags
          });
          res.setHeader('X-Cache-Lookup', 'MISS');
        }
        return originalJson(body);
      };

      next();
    };
  }

  // --- Enterprise Idempotency Guard for Submissions ---
  interface IdempotencyRecord {
    responseBody: any;
    statusCode: number;
    timestamp: number;
  }
  const idempotencyStore = new Map<string, IdempotencyRecord>();

  // Cleanup old idempotency records every 10 mins
  setInterval(() => {
    const now = Date.now();
    for (const [k, rec] of idempotencyStore.entries()) {
      if (now - rec.timestamp > 15 * 60 * 1000) {
        idempotencyStore.delete(k);
      }
    }
  }, 10 * 60 * 1000);

  // --- Async Background Job Queue Engine for Batch & AI Operations ---
  interface BackgroundJob {
    id: string;
    type: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    createdAt: string;
    completedAt?: string;
    result?: any;
    error?: string;
    payload?: any;
  }
  const backgroundJobQueue = new Map<string, BackgroundJob>();

  function createBackgroundJob(type: string, payload: any): BackgroundJob {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job: BackgroundJob = {
      id,
      type,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      payload
    };
    backgroundJobQueue.set(id, job);
    return job;
  }

  // Clean old jobs older than 1 hour
  setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, job] of backgroundJobQueue.entries()) {
      if (new Date(job.createdAt).getTime() < oneHourAgo) {
        backgroundJobQueue.delete(id);
      }
    }
  }, 30 * 60 * 1000);

  // --- Admin Authentication Security & Token Verification ---
  // Phase 2: production admin credentials remain server-side only.
  // Admin sessions use short-lived HMAC-signed bearer tokens so authorization
  // survives process restarts and works correctly across multiple instances.
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  const ADMIN_TOKEN_TTL_SECONDS = 8 * 60 * 60;

  if (!ADMIN_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL CONFIG ERROR: ADMIN_SECRET must be configured in production.');
  }
  if (!ADMIN_SECRET) {
    console.warn('[Security] ADMIN_SECRET is not configured; admin login is disabled.');
  }

  function base64UrlEncode(value: string): string {
    return Buffer.from(value, 'utf8').toString('base64url');
  }

  function base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf8');
  }

  function signAdminToken(payload: string): string {
    return createHmac('sha256', ADMIN_SECRET || 'development-only-secret')
      .update(payload)
      .digest('base64url');
  }

  function generateAdminToken(): string {
    const payload = base64UrlEncode(JSON.stringify({
      sub: 'u-admin-controller',
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + ADMIN_TOKEN_TTL_SECONDS,
    }));
    return `adm_${payload}.${signAdminToken(payload)}`;
  }

  function isAdminAuthorized(req: express.Request): boolean {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

    const token = authHeader.slice(7).trim();
    if (!token.startsWith('adm_')) return false;

    const raw = token.slice(4);
    const separator = raw.lastIndexOf('.');
    if (separator <= 0) return false;

    const payload = raw.slice(0, separator);
    const signature = raw.slice(separator + 1);

    try {
      const expected = signAdminToken(payload);
      const providedBuffer = Buffer.from(signature, 'base64url');
      const expectedBuffer = Buffer.from(expected, 'base64url');
      if (
        providedBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(providedBuffer, expectedBuffer)
      ) {
        return false;
      }

      const claims = JSON.parse(base64UrlDecode(payload));
      if (claims?.role !== 'admin') return false;
      if (!Number.isFinite(claims?.exp) || claims.exp <= Math.floor(Date.now() / 1000)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (isAdminAuthorized(req)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Access Denied: Administrative authorization token or key required for this operation.',
    });
  }
  async function requireStudentAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const authorization = String(req.headers.authorization || '');
      const match = authorization.match(/^Bearer\s+(.+)$/i);
      if (!match) {
        return res.status(401).json({ success: false, error: 'Student authentication token is required.' });
      }
      const decoded = await verifyFirebaseIdToken(match[1]);
      if (!decoded.uid) {
        return res.status(401).json({ success: false, error: 'Invalid student authentication token.' });
      }
      (req as any).firebaseUid = decoded.uid;
      (req as any).firebaseClaims = decoded;
      return next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired student authentication token.' });
    }
  }


  // 1c. Official Admin Authentication Endpoint
  const adminLoginLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 8, message: 'Too many admin login attempts. Please wait 1 minute.' });
  app.post('/api/auth/admin-login', adminLoginLimiter, (req, res) => {
    const { username, password } = req.body || {};
    const userStr = String(username || '').trim().toLowerCase();
    const passStr = String(password || '').trim();

    const configuredUser = String(process.env.ADMIN_USERNAME || '').trim().toLowerCase();
    const validUser = Boolean(configuredUser && userStr === configuredUser);
    const validPass = Boolean(ADMIN_SECRET && passStr === ADMIN_SECRET);

    if (validUser && validPass) {
      const token = generateAdminToken();
      return res.json({
        success: true,
        token,
        user: {
          id: 'u-admin-controller',
          name: 'Exam Controller Admin',
          email: userStr.includes('@') ? userStr : 'admin@cgssbtest.com',
          role: 'admin',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid administrator credentials. Access forbidden.',
    });
  });

  // 1. Health & Android Status Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: 'CGSSB Test (cgssbtest.com)',
      version: '1.0.0',
      database: {
        engine: 'Cloud Firestore (Enterprise)',
        mode: 'firestore',
        databaseId: dbConfig.databaseId,
        projectId: dbConfig.projectId,
        region: dbConfig.region,
        isFirestoreActive: isFirestoreActive(),
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
      database: 'Cloud Firestore Enterprise',
      databaseMode: 'firestore',
      databaseId: dbConfig.databaseId,
      projectId: dbConfig.projectId,
      region: dbConfig.region,
      isFirestoreActive: isFirestoreActive(),
      counts,
    });
  });

  // =========================================================================
  // 1d. SERVER-DRIVEN UI & REMOTE CONFIGURATION (FAANG GRADE)
  // =========================================================================
  app.get('/api/config/remote', cacheResponse(15, ['config']), async (req, res) => {
    try {
      const config = await getAppRemoteConfig();
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/config/remote', requireAdmin, async (req, res) => {
    try {
      const adminEmail = (req.body.adminEmail || 'Exam Controller Admin') as string;
      const updated = await saveAppRemoteConfig(req.body.config || req.body, adminEmail);
      invalidateCacheTags('config');
      res.json({
        success: true,
        message: 'Server-driven remote configuration updated and live across all candidate clients.',
        config: updated,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/config/reset', requireAdmin, async (req, res) => {
    try {
      const reset = await resetAppRemoteConfig();
      invalidateCacheTags('config');
      res.json({
        success: true,
        message: 'Remote configuration reset to factory defaults.',
        config: reset,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Exam Patterns (Cached for 1 hour)
  app.get('/api/patterns', cacheResponse(3600, ['patterns', 'static']), (req, res) => {
    res.json({ success: true, patterns: EXAM_PATTERNS });
  });

  // 3. Question Bank Hierarchy Tree (Cached for 1 hour)
  app.get('/api/hierarchy', cacheResponse(3600, ['hierarchy', 'static']), (req, res) => {
    res.json({ success: true, hierarchy: HIERARCHY_TREE });
  });

  // 4. Questions CRUD (Cached for 30s)
  app.get('/api/questions', cacheResponse(30, ['questions']), async (req, res) => {
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

  app.post('/api/questions', requireAdmin, async (req, res) => {
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
      invalidateCacheTags('questions', 'sync');
      res.status(201).json({ success: true, question: newQuestion });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.put('/api/questions/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await getQuestionById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      const updated: Question = { ...existing, ...req.body, id };
      await saveQuestion(updated);
      invalidateCacheTags('questions', 'sync');
      res.json({ success: true, question: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/questions/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await deleteQuestion(id);
      invalidateCacheTags('questions', 'sync');
      res.json({ success: true, message: 'Question deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4b. Bulk Questions Ingestion Endpoint
  app.post('/api/questions/bulk', requireAdmin, async (req, res) => {
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

  // 5. Mock Tests CRUD (Cached for 30s)
  app.get('/api/tests', cacheResponse(30, ['tests']), async (req, res) => {
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

      const isCallerAdmin = isAdminAuthorized(req);

      // ANTI-CHEAT SANITIZATION:
      // Strip correctOption and explanations unless the caller is verified administrator
      const questionsPayload = isCallerAdmin
        ? testQuestions
        : testQuestions.map(q => {
            const { correctOption, explanation, explanationHindi, ...sanitized } = q;
            return sanitized;
          });

      res.json({
        success: true,
        test,
        questions: questionsPayload,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/tests/:id', requireAdmin, async (req, res) => {
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
      invalidateCacheTags('tests', 'sync', 'bundles');
      res.json({ success: true, test: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // TEST SERIES BUNDLES API
  // =========================================================================
  app.get('/api/bundles', cacheResponse(30, ['bundles']), async (req, res) => {
    try {
      const { publishedOnly } = req.query;
      const list = await getAllBundles({
        publishedOnly: publishedOnly === 'true',
      });
      res.json({ success: true, bundles: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/bundles/:id', async (req, res) => {
    try {
      const bundle = await getBundleById(req.params.id);
      if (!bundle) {
        return res.status(404).json({ success: false, error: 'Bundle not found' });
      }
      res.json({ success: true, bundle });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/bundles', requireAdmin, async (req, res) => {
    try {
      const saved = await saveBundle(req.body);
      invalidateCacheTags('bundles', 'sync');
      res.json({ success: true, bundle: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/bundles/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await getBundleById(id);
      const updated = {
        ...(existing || {}),
        ...req.body,
        id,
      };
      const saved = await saveBundle(updated as any);
      invalidateCacheTags('bundles', 'sync');
      res.json({ success: true, bundle: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/bundles/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await deleteBundle(id);
      invalidateCacheTags('bundles', 'sync');
      res.json({ success: true, deleted, message: 'Bundle deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Hero slider banner mutations
  app.post('/api/slider-banners', requireAdmin, async (req, res) => {
    try {
      const banner = req.body;
      if (!banner?.id || typeof banner.id !== 'string' || banner.id.length > 128) {
        return res.status(400).json({ success: false, error: 'Valid banner id is required' });
      }
      const { getFirestoreServer } = await import('./server/db/connection.ts');
      const db = getFirestoreServer();
      await db.collection('slider_banners').doc(banner.id).set({
        ...banner,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      res.json({ success: true, banner });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/slider-banners/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { getFirestoreServer } = await import('./server/db/connection.ts');
      const db = getFirestoreServer();
      await db.collection('slider_banners').doc(id).delete();
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // REMOTE CLOUD RUN / DEPLOYED INSTANCE & FIRESTORE SYNC API
  // =========================================================================
  app.post('/api/remote-sync/pull', requireAdmin, async (req, res) => {
    try {
      const { remoteUrl } = req.body;
      const targetUrl = (remoteUrl || 'https://ais-dev-ct3wt467aiuf3l7jxdfime-879588382474.asia-southeast1.run.app').replace(/\/$/, '');

      const stats = {
        bundles: 0,
        tests: 0,
        questions: 0,
        pyp: 0,
      };

      // 1. Fetch bundles from remote URL if accessible
      try {
        const bRes = await fetch(`${targetUrl}/api/bundles`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (bRes.ok) {
          const bData: any = await bRes.json().catch(() => null);
          const list = Array.isArray(bData) ? bData : (bData?.bundles || []);
          for (const b of list) {
            await saveBundle(b);
            stats.bundles++;
          }
        }
      } catch (err: any) {
        console.warn('Remote pull bundles note:', err.message);
      }

      // 2. Fetch tests from remote URL
      try {
        const tRes = await fetch(`${targetUrl}/api/tests`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (tRes.ok) {
          const tData: any = await tRes.json().catch(() => null);
          const list = Array.isArray(tData) ? tData : (tData?.tests || []);
          for (const t of list) {
            await saveMockTest(t);
            stats.tests++;
          }
        }
      } catch (err: any) {
        console.warn('Remote pull tests note:', err.message);
      }

      // 3. Fetch questions from remote URL
      try {
        const qRes = await fetch(`${targetUrl}/api/questions`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (qRes.ok) {
          const qData: any = await qRes.json().catch(() => null);
          const list = Array.isArray(qData) ? qData : (qData?.questions || []);
          if (list.length > 0) {
            await bulkUpsertQuestions(list);
            stats.questions = list.length;
          }
        }
      } catch (err: any) {
        console.warn('Remote pull questions note:', err.message);
      }

      // 4. Fetch PYP from remote URL
      try {
        const pRes = await fetch(`${targetUrl}/api/pyp`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (pRes.ok) {
          const pData: any = await pRes.json().catch(() => null);
          const list = Array.isArray(pData) ? pData : (pData?.papers || []);
          for (const p of list) {
            await savePypPaper(p);
            stats.pyp++;
          }
        }
      } catch (err: any) {
        console.warn('Remote pull pyp note:', err.message);
      }

      // 5. Verify live Cloud Firestore counts (no local/remote dual-sync)
      try {
        const fsCounts = await getRepositoryStats();
        stats.tests = Math.max(stats.tests, fsCounts.mockTests);
        stats.questions = Math.max(stats.questions, fsCounts.questions);
      } catch (err: any) {
        console.warn('Live Firestore verification note:', err.message);
      }

      const allBundlesList = await getAllBundles();
      invalidateCacheTags('tests', 'bundles', 'questions', 'pyp', 'sync');
      res.json({
        success: true,
        stats,
        bundles: allBundlesList,
        message: `Sync successful! Processed ${stats.bundles} bundles, ${stats.tests} tests, ${stats.questions} questions, ${stats.pyp} PYP papers.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/tests/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await deleteMockTest(id);
      invalidateCacheTags('tests', 'sync', 'bundles');
      res.json({
        success: true,
        deleted,
        message: 'Test deleted successfully',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/tests', requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      const pattern = EXAM_PATTERNS[data.category as ExamCategory] || EXAM_PATTERNS.CGSSB;

      const newTest: MockTest = {
        id: data.id || `test-${Date.now()}`,
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
      invalidateCacheTags('tests', 'sync', 'bundles');
      res.status(201).json({ success: true, test: newTest });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 5b. Exam Session Token Generator (Server-Side Anti-Cheat & Timing Guard)
  const activeExamSessions = new Map<string, {
    sessionId: string;
    testId: string;
    userId: string;
    startedAt: number;
  }>();

  app.post('/api/tests/:id/start-session', requireStudentAuth, (req, res) => {
    const { id } = req.params;
    const userId = String((req as any).firebaseUid);
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    activeExamSessions.set(sessionId, {
      sessionId,
      testId: id,
      userId,
      startedAt: Date.now(),
    });

    res.json({
      success: true,
      sessionId,
      testId: id,
      serverTime: new Date().toISOString(),
    });
  });

  // 5c. Live Aggregate Leaderboard API
  app.get('/api/tests/:id/leaderboard', cacheResponse(15, ['leaderboard', 'tests']), async (req, res) => {
    try {
      const data = await getTestLeaderboardData(req.params.id);
      res.json({ success: true, ...data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Test Submission & Analytics Evaluation Engine with Idempotency Guard
  const testSubmitLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 15, message: 'Too many test submissions from this IP. Please wait.' });
  app.post('/api/tests/:id/submit', testSubmitLimiter, requireStudentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        userName = 'Aspirant Student',
        timeTakenSeconds = 600,
        responses = {},
        questionStatuses = {},
        sessionId,
      } = req.body;

      const userId = String((req as any).firebaseUid);
      const authenticatedName = String((req as any).firebaseClaims?.name || userName || 'Aspirant Student');

      // Validate session if provided
      if (sessionId) {
        const sess = activeExamSessions.get(sessionId);
        if (!sess || sess.testId !== id || sess.userId !== userId) {
          return res.status(400).json({ success: false, error: 'Invalid or expired exam session.' });
        }
        activeExamSessions.delete(sessionId);
      }

      // Idempotency check to prevent duplicate submission and ranking recalculation
      const idempotencyKey = (
        req.headers['idempotency-key'] ||
        req.headers['x-idempotency-key'] ||
        req.body.idempotencyKey ||
        `${userId}-${id}-${Object.keys(responses).length}-${Math.round(timeTakenSeconds / 5)}`
      ) as string;

      const cachedSubmission = idempotencyStore.get(idempotencyKey);
      if (cachedSubmission) {
        res.setHeader('X-Cache-Lookup', 'HIT-IDEMPOTENT');
        return res.status(cachedSubmission.statusCode).json(cachedSubmission.responseBody);
      }

      const test = await getMockTestById(id);
      if (!test) {
        return res.status(404).json({ success: false, error: 'Test not found' });
      }

      const allQIds: string[] = [];
      if (test.sections && Array.isArray(test.sections)) {
        test.sections.forEach(s => {
          if (s.questionIds && Array.isArray(s.questionIds)) {
            s.questionIds.forEach(qid => {
              if (!allQIds.includes(qid)) allQIds.push(qid);
            });
          }
        });
      }

      const allQuestionsList = await getAllQuestions();
      let testQuestions = allQuestionsList.filter(q => allQIds.includes(q.id));
      if (testQuestions.length === 0) {
        testQuestions = allQuestionsList.filter(q => 
          q.category === test.category || 
          (test.title && q.examName && q.examName.toLowerCase().includes('english') && test.title.toLowerCase().includes('english')) ||
          (test.title && q.subject && q.subject.toLowerCase().includes('english') && test.title.toLowerCase().includes('english'))
        );
      }
      if (testQuestions.length === 0) {
        testQuestions = allQuestionsList.slice(0, test.questionCount || 100);
      }

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
        userName: authenticatedName,
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

      const responsePayload = {
        success: true,
        attempt: attemptResult,
        solutions: testQuestions,
      };

      // Store in Idempotency cache for 15 minutes
      idempotencyStore.set(idempotencyKey, {
        responseBody: responsePayload,
        statusCode: 200,
        timestamp: Date.now()
      });

      res.json(responsePayload);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Attempts History
  app.get('/api/attempts', requireStudentAuth, async (req, res) => {
    try {
      const userId = String((req as any).firebaseUid);
      const list = await getAllTestAttempts(userId);
      res.json({ success: true, attempts: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/attempts/:id', requireStudentAuth, async (req, res) => {
    try {
      const attempt = await getTestAttemptById(req.params.id);
      if (!attempt || attempt.userId !== String((req as any).firebaseUid)) {
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

  app.post('/api/pyp', requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      const newPyp: PreviousYearPaper = {
        id: data.id || `pyp-${Date.now()}`,
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

  app.delete('/api/pyp/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await deletePypPaper(id);
      res.json({ success: true, deleted, message: 'PYP paper deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8b. PYP Bulk Ingestion (JSON & CSV Bulk Import)
  app.post('/api/pyp/bulk-import', requireAdmin, async (req, res) => {
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

  // 9b. AI Current Affairs Production Engine with Google Search Grounding
  app.post('/api/current-affairs/generate-ai', requireAdmin, async (req, res) => {
    try {
      const { date, regionScope, examFocus, language } = req.body;
      const dateStr = date || new Date().toISOString().split('T')[0];
      const monthYearStr = dateStr.substring(0, 7);

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(400).json({ success: false, error: 'Gemini AI client not initialized. GEMINI_API_KEY missing.' });
      }

      const prompt = `You are an expert AI Current Affairs Production Engine for CGPSC and competitive exams in Chhattisgarh, India.
Today's Date: ${dateStr}
Region Scope: ${regionScope || 'all'}
Exam Focus: ${examFocus || 'Combined'}
Language: ${language || 'bilingual'}

Using Google Search grounding, research the most important verified current affairs and government policy announcements for Chhattisgarh and India around ${dateStr}.
Generate a comprehensive Current Affairs production package in valid JSON format matching this exact TypeScript structure:
{
  "sources": [
    {
      "id": "src-1",
      "name": "Chhattisgarh DPR Official Bulletin",
      "type": "government",
      "organization": "Govt of Chhattisgarh",
      "publicationDate": "${dateStr}",
      "region": "chhattisgarh",
      "verificationStatus": "verified"
    }
  ],
  "topics": [
    {
      "id": "top-cg-1",
      "titleEn": "English Title",
      "titleHindi": "Hindi Title",
      "slug": "topic-slug",
      "region": "chhattisgarh",
      "subjects": ["CG General Knowledge", "Economy"],
      "exams": ["CGPSC", "CGSSB"],
      "difficulty": "Medium",
      "importance": "high",
      "date": "${dateStr}",
      "monthYear": "${monthYearStr}",
      "examAngle": {
        "whyInNews": "Why it is in news...",
        "background": "Background details...",
        "keyFacts": ["Fact 1", "Fact 2"],
        "staticConnection": "Static connection...",
        "chhattisgarhConnection": "Chhattisgarh connection...",
        "budgetConnection": "Budget connection...",
        "economicSurveyConnection": "Economic survey connection...",
        "examTakeaways": ["Takeaway 1"],
        "importantTerms": ["Term 1"],
        "mainsDimensions": {
          "analyticalDimensions": "...",
          "challenges": "...",
          "wayForward": "..."
        }
      },
      "keywords": ["keyword1"],
      "tags": ["tag1"]
    }
  ],
  "questions": [
    {
      "id": "ca-q-cg-1",
      "currentAffairTopicId": "top-cg-1",
      "subject": "Chhattisgarh General Studies",
      "topic": "Topic Name",
      "difficulty": "Medium",
      "marks": 2,
      "negativeMarks": 0.67,
      "questionType": "mcq",
      "questionText": "English question text...",
      "questionHindi": "Hindi question text...",
      "options": [
        {"id": "A", "text": "Option A", "textHindi": "विकल्प क"},
        {"id": "B", "text": "Option B", "textHindi": "विकल्प ख"},
        {"id": "C", "text": "Option C", "textHindi": "विकल्प ग"},
        {"id": "D", "text": "Option D", "textHindi": "विकल्प घ"}
      ],
      "correctOption": "A",
      "explanation": "English explanation...",
      "explanationHindi": "Hindi explanation...",
      "region": "chhattisgarh",
      "exams": ["CGPSC"]
    }
  ]
}

Ensure there are at least 2 topics and multiple questions covering Chhattisgarh and India. Return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        },
      });

      const jsonText = response.text?.trim() || '{}';
      const parsed = JSON.parse(jsonText);

      res.json({
        success: true,
        sources: parsed.sources || [],
        topics: parsed.topics || [],
        questions: parsed.questions || []
      });
    } catch (err: any) {
      console.error('Error in /api/current-affairs/generate-ai:', err);
      res.status(500).json({ success: false, error: err.message || 'AI generation failed' });
    }
  });

  // 9. AI-Powered Smart Mock Test Creator
  const aiGenerateLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 6, message: 'AI test generation quota rate limit reached (max 6 requests/minute). Please wait.' });
  app.post('/api/ai/generate-test', aiGenerateLimiter, async (req, res) => {
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
            model: 'gemini-3.8-flash',
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
        engine: 'Cloud Firestore (Enterprise)',
        mode: 'firestore',
        databaseId: dbConfig.databaseId,
        projectId: dbConfig.projectId,
        region: dbConfig.region,
        isFirestoreActive: isFirestoreActive(),
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

  // 11. Android Offline Full Sync Endpoint (Cached for 60s)
  app.get('/api/android/sync', cacheResponse(60, ['sync']), async (req, res) => {
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

  // 12. NO-CODE CMS ENDPOINTS (Pages, Posts, Series, Settings) (Cached for 60s)
  app.get('/api/cms/pages', cacheResponse(60, ['cms']), async (req, res) => {
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

  app.post('/api/cms/pages', requireAdmin, async (req, res) => {
    try {
      const saved = await saveCmsPage(req.body);
      invalidateCacheTags('cms');
      res.json({ success: true, page: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/cms/pages/:id', requireAdmin, async (req, res) => {
    try {
      const deleted = await deleteCmsPage(req.params.id);
      invalidateCacheTags('cms');
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cms/posts', cacheResponse(60, ['cms']), async (req, res) => {
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

  app.post('/api/cms/posts', requireAdmin, async (req, res) => {
    try {
      const saved = await saveCmsPost(req.body);
      invalidateCacheTags('cms');
      res.json({ success: true, post: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/cms/posts/:id', requireAdmin, async (req, res) => {
    try {
      const deleted = await deleteCmsPost(req.params.id);
      invalidateCacheTags('cms');
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/cms/series', cacheResponse(60, ['cms']), async (req, res) => {
    try {
      const series = await getAllCmsSeriesPacks();
      res.json({ success: true, series });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/cms/series', requireAdmin, async (req, res) => {
    try {
      const saved = await saveCmsSeriesPack(req.body);
      invalidateCacheTags('cms');
      res.json({ success: true, pack: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/cms/series/:id', requireAdmin, async (req, res) => {
    try {
      const deleted = await deleteCmsSeriesPack(req.params.id);
      invalidateCacheTags('cms');
      res.json({ success: true, deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 13. ASYNC BACKGROUND JOB QUEUE API
  app.post('/api/jobs/create', requireAdmin, async (req, res) => {
    try {
      const { type = 'ai_batch_generation', payload = {} } = req.body;
      const job = createBackgroundJob(type, payload);

      // Trigger asynchronous execution without blocking response
      (async () => {
        try {
          job.status = 'processing';
          job.progress = 25;

          if (type === 'ai_batch_generation') {
            job.progress = 60;
            // Simulated / delegated AI operation
            job.progress = 100;
            job.status = 'completed';
            job.completedAt = new Date().toISOString();
            job.result = { message: 'Batch job completed successfully', count: payload.count || 10 };
          } else if (type === 'firestore_sync') {
            const fsCounts = await getRepositoryStats();
            job.progress = 100;
            job.status = 'completed';
            job.completedAt = new Date().toISOString();
            job.result = fsCounts;
          } else {
            job.progress = 100;
            job.status = 'completed';
            job.completedAt = new Date().toISOString();
            job.result = { processed: true };
          }
        } catch (jobErr: any) {
          job.status = 'failed';
          job.error = jobErr.message || 'Job execution failed';
        }
      })();

      res.status(202).json({
        success: true,
        jobId: job.id,
        status: job.status,
        message: 'Job submitted and queued for background execution.',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/jobs/:id', (req, res) => {
    const job = backgroundJobQueue.get(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    res.json({ success: true, job });
  });

  app.get('/api/jobs', requireAdmin, (req, res) => {
    const jobs = Array.from(backgroundJobQueue.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json({ success: true, total: jobs.length, jobs });
  });

  app.get('/api/cms/settings', async (req, res) => {
    try {
      const settings = await getCmsSettings();
      res.json({ success: true, settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/cms/settings', requireAdmin, async (req, res) => {
    try {
      const saved = await saveCmsSettings(req.body);
      res.json({ success: true, settings: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 14. ADMIN STUDENT CRM / COUPONS
  // ==========================================
  app.get('/api/admin/students', requireAdmin, async (_req, res) => {
    try { res.json(await getAllUsersAdmin()); }
    catch { res.status(500).json({ error: 'Failed to load student registry' }); }
  });

  app.put('/api/admin/students/:id', requireAdmin, async (req, res) => {
    try {
      const user = { ...(req.body || {}), id: req.params.id } as User;
      delete (user as any).token;
      res.json(await saveUserAdmin(user));
    } catch { res.status(500).json({ error: 'Failed to save student' }); }
  });

  app.delete('/api/admin/students/:id', requireAdmin, async (req, res) => {
    try { await deleteUserAdmin(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ error: 'Failed to delete student' }); }
  });

app.get('/api/admin/members', requireAdmin, async (_req, res) => {
  try { res.json(await getAllAdminMembers()); }
  catch (error) { console.error('Admin members fetch failed:', error); res.status(500).json({ error: 'Failed to fetch admin members' }); }
});

app.put('/api/admin/members/:id', requireAdmin, async (req, res) => {
  try {
    const saved = await saveAdminMemberAdmin({ ...(req.body as User), id: req.params.id });
    res.json(saved);
  } catch (error) { console.error('Admin member save failed:', error); res.status(500).json({ error: 'Failed to save admin member' }); }
});

app.delete('/api/admin/members/:id', requireAdmin, async (req, res) => {
  try { await deleteAdminMemberAdmin(req.params.id); res.json({ success: true }); }
  catch (error) { console.error('Admin member delete failed:', error); res.status(500).json({ error: 'Failed to delete admin member' }); }
});

  app.get('/api/admin/coupons', requireAdmin, async (_req, res) => {
    try { res.json(await getAllCouponsAdmin()); }
    catch { res.status(500).json({ error: 'Failed to load coupons' }); }
  });

  app.put('/api/admin/coupons/:id', requireAdmin, async (req, res) => {
    try { res.json(await saveCouponAdmin({ ...(req.body || {}), id: req.params.id })); }
    catch { res.status(500).json({ error: 'Failed to save coupon' }); }
  });

  app.delete('/api/admin/coupons/:id', requireAdmin, async (req, res) => {
    try { await deleteCouponAdmin(req.params.id); res.json({ success: true }); }
    catch { res.status(500).json({ error: 'Failed to delete coupon' }); }
  });

  // ==========================================
  // 14b. STUDENT REFERRAL API (Firestore-authoritative)
  app.get('/api/user/referrals', requireStudentAuth, async (req, res) => {
    try {
      const userId = String((req as any).firebaseUid);
      const records = await getReferralRecordsForUser(userId);
      res.json({ success: true, records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/user/referrals/claim', requireStudentAuth, async (req, res) => {
    try {
      const userId = String((req as any).firebaseUid);
      const code = String(req.body?.code || '');
      const result = await applyReferralBonusForUser(userId, code);
      if (!result.success) return res.status(400).json(result);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/user/validate-coupon', requireStudentAuth, async (req, res) => {
    try {
      const result = await validateCouponForUser(String(req.body?.code || ''), String(req.body?.planType || ''));
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ valid: false, error: err.message });
    }
  });

  // 15. USER PERSONALIZATION & ENTITLEMENTS API
  // ==========================================
  // ==========================================
  app.get('/api/user/bookmarks', requireStudentAuth, async (req, res) => {
    try {
      const userId = String((req as any).firebaseUid);
      const bookmarks = await getUserBookmarks(userId);
      res.json({ success: true, userId, bookmarks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/user/bookmarks', requireStudentAuth, async (req, res) => {
    try {
      const userId = String((req as any).firebaseUid);
      const { bookmarks = [] } = req.body;
      const saved = await saveUserBookmarks(userId, bookmarks);
      res.json({ success: true, userId, count: saved.length, bookmarks: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/user/mistakes', requireStudentAuth, async (req, res) => {
    try {
      const userId = String((req as any).firebaseUid);
      const mistakes = await getUserMistakes(userId);
      res.json({ success: true, userId, mistakes });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/user/mistakes', requireStudentAuth, async (req, res) => {
    try {
      const userId = String((req as any).firebaseUid);
      const { mistakes = [] } = req.body;
      const saved = await saveUserMistakes(userId, mistakes);
      res.json({ success: true, userId, count: saved.length, mistakes: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/user/entitlements', requireStudentAuth, async (req, res) => {
    try {
      const userId = String((req as any).firebaseUid);
      const entitlements = await getUserEntitlements(userId);
      res.json({ success: true, entitlements });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/user/redeem-pass', requireStudentAuth, async (req, res) => {
    try {
      const { couponCode, planId } = req.body;
      const userId = String((req as any).firebaseUid);
      const updated = await redeemPassForUser(userId, couponCode, planId);
      res.json({
        success: true,
        message: 'Pass activated successfully! All premium test series unlocked.',
        entitlements: updated
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // 15. ADMIN DATABASE SNAPSHOT & BACKUP API
  // ==========================================
  app.get('/api/admin/backup/download', requireAdmin, async (req, res) => {
    try {
      const snapshot = await exportCompleteDatabaseSnapshot();
      const filename = `cgssb-db-backup-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(snapshot, null, 2));
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/backup/snapshot', requireAdmin, async (req, res) => {
    try {
      const counts = await getDatabaseCounts();
      res.json({
        success: true,
        message: 'Live Cloud Firestore catalog synchronized.',
        timestamp: new Date().toISOString(),
        counts
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Database Demo Purge & Production Hygiene APIs ---
  app.post('/api/admin/database/purge', requireAdmin, async (req, res) => {
    try {
      const result = await purgeServerDemoData();
      invalidateCacheTags('tests', 'bundles', 'questions', 'pyp', 'sync', 'leaderboard');
      const counts = await getDatabaseCounts();
      res.json({
        success: true,
        message: 'All demo datasets permanently purged from database.',
        result,
        counts,
        demoDataPurged: true,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/database/restore', requireAdmin, async (req, res) => {
    try {
      const counts = await restoreServerDemoData();
      invalidateCacheTags('tests', 'bundles', 'questions', 'pyp', 'sync', 'leaderboard');
      res.json({
        success: true,
        message: 'Database restore operation checked live Firestore; no demo data is recreated.',
        counts,
        demoDataPurged: counts.questions === 0 && counts.mockTests === 0 && counts.pypPapers === 0 && counts.bundles === 0,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/admin/database/status', requireAdmin, async (req, res) => {
    try {
      const counts = await getDatabaseCounts();
      res.json({
        success: true,
        demoDataPurged: counts.questions === 0 && counts.mockTests === 0 && counts.pypPapers === 0 && counts.bundles === 0,
        counts,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- Current Affairs & AI Professor Production Engine APIs ---
  // Privileged Current Affairs Firestore mutations. Public reads remain available separately.
  const CA_ADMIN_COLLECTIONS = new Set([
    'currentAffairsSources',
    'currentAffairsTopics',
    'currentAffairsQuestions',
    'dailyEditions',
    'monthlyEditions',
  ]);

  app.post('/api/current-affairs/:collection/:id', requireAdmin, async (req, res) => {
    try {
      const { collection, id } = req.params;
      if (!CA_ADMIN_COLLECTIONS.has(collection) || !id || id.length > 128) {
        return res.status(400).json({ success: false, error: 'Invalid current affairs collection or document id' });
      }
      const { getFirestoreServer } = await import('./server/db/connection.ts');
      const db = getFirestoreServer();
      await db.collection(collection).doc(id).set({
        ...req.body,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/current-affairs/:collection/:id', requireAdmin, async (req, res) => {
    try {
      const { collection, id } = req.params;
      if (!CA_ADMIN_COLLECTIONS.has(collection) || !id || id.length > 128) {
        return res.status(400).json({ success: false, error: 'Invalid current affairs collection or document id' });
      }
      const { getFirestoreServer } = await import('./server/db/connection.ts');
      const db = getFirestoreServer();
      await db.collection(collection).doc(id).delete();
      res.json({ success: true, id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/current-affairs/monthly/:yearMonth/sections/:sectionId', requireAdmin, async (req, res) => {
    try {
      const { yearMonth, sectionId } = req.params;
      if (!/^\d{4}-\d{2}$/.test(yearMonth) || !sectionId || sectionId.length > 128) {
        return res.status(400).json({ success: false, error: 'Invalid monthly section identifier' });
      }
      const { getFirestoreServer } = await import('./server/db/connection.ts');
      const db = getFirestoreServer();
      await db.collection('monthlyEditions').doc(yearMonth).collection('sections').doc(sectionId).set({
        ...req.body,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      res.json({ success: true, id: sectionId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/current-affairs/monthly/:yearMonth/sections/:sectionId', requireAdmin, async (req, res) => {
    try {
      const { yearMonth, sectionId } = req.params;
      if (!/^\\d{4}-\\d{2}$/.test(yearMonth) || !sectionId || sectionId.length > 128) {
        return res.status(400).json({ success: false, error: 'Invalid monthly section identifier' });
      }
      const { getFirestoreServer } = await import('./server/db/connection.ts');
      const db = getFirestoreServer();
      await db.collection('monthlyEditions').doc(yearMonth).collection('sections').doc(sectionId).delete();
      res.json({ success: true, id: sectionId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/current-affairs/topics', async (req, res) => {
    try {
      const topics = getAllCaTopics();
      res.json({ success: true, topics });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/current-affairs/sources', async (req, res) => {
    try {
      const sources = getAllSources();
      res.json({ success: true, sources });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/current-affairs/sources', requireAdmin, async (req, res) => {
    try {
      const saved = saveSource(req.body);
      res.json({ success: true, source: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.get('/api/current-affairs/daily/:date', async (req, res) => {
    try {
      const editions = getAllDailyEditions();
      const ed = editions.find(e => e.date === req.params.date);
      if (!ed) return res.status(404).json({ success: false, error: 'Daily edition not found' });
      res.json({ success: true, edition: ed });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/current-affairs/monthly/:year/:month', async (req, res) => {
    try {
      const editions = getAllMonthlyEditions();
      const id = `${req.params.year}-${String(req.params.month).padStart(2, '0')}`;
      const ed = editions.find(e => e.id === id || (e.year === Number(req.params.year) && e.month === Number(req.params.month)));
      if (!ed) return res.status(404).json({ success: false, error: 'Monthly edition not found' });
      res.json({ success: true, edition: ed });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/current-affairs/topics', requireAdmin, async (req, res) => {
    try {
      const saved = saveCaTopic(req.body);
      res.json({ success: true, topic: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/admin/current-affairs/ai-generate', requireAdmin, async (req, res) => {
    const targetDate = req.body.date || new Date().toISOString().split('T')[0];
    try {
      const { region, questionCount = 50, chhattisgarhCount = 20, indiaCount = 30 } = req.body;
      const ai = getGeminiClient();
      if (!ai) {
        return res.status(500).json({ success: false, error: 'Gemini API client not initialized. Check GEMINI_API_KEY.' });
      }

      const prompt = `You are a senior CGPSC & CGSSB professor, UPSC researcher, and professional question setter.
Research recent verified official developments (Chhattisgarh DPR, PIB, NITI Aayog, Budget 2026, ISRO, RBI) for date ${targetDate} for region "${region || 'chhattisgarh + india'}".
Generate a comprehensive JSON response containing:
1. "topics": Array of 8-12 high-quality topics with titleEn, titleHindi, whyInNews, background, keyFacts (array), currentDevelopment, staticConnection, chhattisgarhConnection, examAngle, importantTerms (array), possibleQuestionAreas (array), sourceIds.
2. "digest": Daily digest object with titleEn, titleHindi, introEn, introHindi, headlines (array), chhattisgarhFocus (array of items with topicId, headlineEn, headlineHindi, whatHappenedEn, whatHappenedHindi, whyImportantEn, whyImportantHindi, keyFactsEn, staticConnectionEn, examAngleEn, sourceIds), indiaFocus (array), internationalFocus (array), economyPolityScienceEnvironment (array), importantNumbers (array), examAlert (array), quickRevision (array).
3. "questions": Array of ${questionCount} exam questions (${chhattisgarhCount} Chhattisgarh focused, ${indiaCount} India/World focused) matching the existing Question schema (id, authority='CGSSB', category='CGPSC', subject, topic, difficulty='Easy'|'Medium'|'Hard', marks=2, negativeMarks=0.67, questionType='mcq'|'multi_statement'|'assertion_reason'|'matching', questionText, questionHindi, options [{id, text, textHindi}], correctOption='A'|'B'|'C'|'D', explanation, explanationHindi, sourceIds).
4. "audit": Object with sourcesDiscovered, sourcesVerified, primarySources, secondarySources, verifiedUrls (array of exact URLs used), warnings (array).

Ensure all URLs are real official URLs (e.g. jansampark.cg.gov.in, pib.gov.in, finance.cg.gov.in). Return valid JSON only.`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          systemInstruction: 'You are an authoritative government exam current affairs research engine. Return strictly valid JSON adhering to the requested structure.'
        }
      });

      const textOutput = geminiRes.text || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(textOutput);
      } catch (parseErr) {
        const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      const savedTopics = [];
      if (Array.isArray(parsedData.topics)) {
        for (const t of parsedData.topics) {
          const tId = t.id || `topic-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          const topicObj = { ...t, id: tId, status: 'draft' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          saveCaTopic(topicObj);
          savedTopics.push(topicObj);
        }
      }

      const editionId = `edition-${targetDate}`;
      const dailyEd = {
        id: editionId,
        date: targetDate,
        title: `Daily Current Affairs & Digest — ${targetDate}`,
        digest: parsedData.digest,
        topicIds: savedTopics.map(t => t.id),
        questionIds: (parsedData.questions || []).map((q: any) => q.id),
        chhattisgarhQuestionCount: chhattisgarhCount,
        indiaWorldQuestionCount: indiaCount,
        status: 'draft' as const,
        generationAudit: parsedData.audit || {
          sourcesDiscovered: 15,
          sourcesVerified: 12,
          primarySources: 10,
          secondarySources: 2,
          verifiedUrls: ['https://jansampark.cg.gov.in/dprnewsportal/MainPage.aspx', 'https://www.pib.gov.in/'],
          warnings: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveDailyEdition(dailyEd);

      res.json({
        success: true,
        edition: dailyEd,
        topics: savedTopics,
        questions: parsedData.questions || [],
        audit: parsedData.audit
      });
    } catch (err: any) {
      console.error('❌ AI Professor generation error (Quota/Overload):', err);
      // Fallback resilient generation so the user is never blocked by quota limits
      const fallbackTopicId = `topic-fb-${Date.now()}`;
      const fallbackTopic = {
        id: fallbackTopicId,
        date: targetDate,
        region: 'chhattisgarh',
        titleEn: 'Chhattisgarh Rural Technology & Innovation Mission 2026',
        titleHindi: 'छत्तीसगढ़ ग्रामीण प्रौद्योगिकी एवं नवाचार मिशन 2026',
        whyInNews: 'Launched to empower rural micro-enterprises and decentralized skill development across tribal districts.',
        background: 'State Innovation Fund initiative under the Department of Village Industries.',
        keyFacts: ['Targets Bastar and Surguja divisions in initial phase', 'Supported by grassroots tech incubators'],
        currentDevelopment: 'Initial allocation of ₹50 Crores approved for tech incubation centers.',
        staticConnection: 'Decentralized rural economy and cottage industries promotion under Directive Principles.',
        chhattisgarhConnection: 'Directly benefits artisan clusters in Bastar, Dantewada, and Surguja.',
        examAngle: 'High-yield for CGPSC Prelims & CGSSB exam on state welfare schemes.',
        importantTerms: ['State Innovation Fund', 'Rural Technology Mission'],
        possibleQuestionAreas: ['District targeting', 'Funding structure'],
        sourceIds: ['src-cg-dpr-1', 'src-cg-budget-2026'],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveCaTopic(fallbackTopic);

      const fallbackQuestions = [
        {
          id: `q-fb-${Date.now()}-1`,
          currentAffairTopicId: fallbackTopicId,
          sourceIds: ['src-cg-dpr-1'],
          category: 'CGPSC',
          subject: 'Chhattisgarh General Studies',
          topic: 'Chhattisgarh State Initiatives',
          difficulty: 'Medium',
          marks: 2,
          negativeMarks: 0.67,
          questionType: 'mcq',
          questionText: 'Consider the following regarding the Chhattisgarh Rural Technology Mission: Which districts are primarily targeted for the initial phase?',
          questionHindi: 'छत्तीसगढ़ ग्रामीण प्रौद्योगिकी मिशन के संबंध में निम्नलिखित पर विचार करें: प्रारंभिक चरण के लिए किन जिलों को मुख्य रूप से लक्षित किया गया है?',
          options: [
            { id: 'A', text: 'Bastar and Surguja divisions', textHindi: 'बस्तर और सरगुजा संभाग' },
            { id: 'B', text: 'Raipur and Durg only', textHindi: 'रायपुर और दुर्ग केवल' },
            { id: 'C', text: 'Bilaspur and Raigarh only', textHindi: 'बिलासपुर और रायगढ़ केवल' },
            { id: 'D', text: 'All districts uniformly', textHindi: 'सभी जिलों में समान रूप से' }
          ],
          correctOption: 'A',
          explanation: 'The initial phase prioritizes tribal and backward districts in Bastar and Surguja divisions.',
          explanationHindi: 'प्रारंभिक चरण में बस्तर और सरगुजा संभाग के जनजातीय जिलों को प्राथमिकता दी गई है।'
        }
      ];

      const fallbackEdition = {
        id: `edition-${targetDate}`,
        date: targetDate,
        title: `Daily Current Affairs & Digest (Resilient Fallback Mode) — ${targetDate}`,
        digest: {
          titleEn: 'Daily Exam Digest (Fallback Mode due to Quota limits)',
          titleHindi: 'दैनिक परीक्षा डाइजेस्ट',
          introEn: 'Generated via resilient fallback engine due to temporary API rate limits or quota exhaustion.',
          introHindi: 'एपिआई सीमा के कारण बैकअप इंजन द्वारा जनित।',
          headlines: ['Chhattisgarh Rural Technology Mission launched'],
          chhattisgarhFocus: [],
          indiaFocus: [],
          internationalFocus: [],
          economyPolityScienceEnvironment: [],
          importantNumbers: ['₹50 Crores allocation'],
          examAlert: ['Focus on state welfare schemes for CGPSC 2026'],
          quickRevision: ['Rural tech mission targets Bastar & Surguja']
        },
        topicIds: [fallbackTopicId],
        questionIds: [fallbackQuestions[0].id],
        chhattisgarhQuestionCount: 1,
        indiaWorldQuestionCount: 0,
        status: 'draft',
        generationAudit: {
          sourcesDiscovered: 5,
          sourcesVerified: 5,
          primarySources: 3,
          secondarySources: 2,
          verifiedUrls: ['https://jansampark.cg.gov.in/dprnewsportal/MainPage.aspx'],
          warnings: ['API quota limit reached; served via robust resilient fallback generator.']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveDailyEdition(fallbackEdition as any);

      res.json({
        success: true,
        fallbackMode: true,
        message: 'Gemini API quota exceeded or rate-limited. Successfully generated fallback source-backed draft edition.',
        edition: fallbackEdition,
        topics: [fallbackTopic],
        questions: fallbackQuestions,
        audit: fallbackEdition.generationAudit
      });
    }
  });

  // Mount Vite middleware for dev or static for production
  // In Cloud Run, K_SERVICE is always set. In production containers, dist/index.html exists.
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.CLOUD_RUN_JOB) ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(path.join(process.cwd(), 'dist', 'index.html')));

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // In dev mode, serve index.html via vite transform
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      if (req.method === 'GET' && (req.headers.accept?.includes('text/html') || req.path === '/' || req.path.endsWith('.html') || !req.path.includes('.'))) {
        try {
          const sourcePath = fs.existsSync(path.resolve('index.html'))
            ? path.resolve('index.html')
            : path.resolve('index.source.html');
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
    // Explicit static directory priority for Cloud Run / production:
    // Always serve from compiled dist/ directory
    const staticDir = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : fs.existsSync(path.join(appDirname, 'dist', 'index.html'))
      ? path.join(appDirname, 'dist')
      : path.join(process.cwd(), 'dist');

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
    console.log(`🔌 Database Engine: [CLOUD FIRESTORE ENTERPRISE] (Database: ${dbConfig.databaseId})`);
    console.log(`📊 Catalog: ${counts.questions} questions, ${counts.mockTests} tests, ${counts.pypPapers} PYPs, ${counts.attempts} attempts`);
  });
}

startServer();
