var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv2 = __toESM(require("dotenv"), 1);

// src/mockData.ts
var EXAM_PATTERNS = {
  CGSSB: {
    id: "CGSSB",
    name: "CGSSB (Chhattisgarh Professional Examination Board / Vyapam)",
    shortName: "CGSSB / Vyapam",
    totalQuestions: 100,
    durationMinutes: 120,
    marksPerCorrect: 1,
    negativeMarksRatio: 1 / 3,
    negativeMarksPerWrong: 0.333,
    description: "Exam pattern: 100 questions, 1 mark for right answer, minus 1/3rd for wrong answer and 2 hours exam time.",
    color: "#10B981",
    badge: "100 Qs \u2022 +1 \u2022 -\u2153 \u2022 120 Mins",
    isComingSoon: false
  },
  CGPSC: {
    id: "CGPSC",
    name: "CGPSC (Chhattisgarh Public Service Commission - SSE)",
    shortName: "CGPSC SSE",
    totalQuestions: 100,
    durationMinutes: 120,
    marksPerCorrect: 2,
    negativeMarksRatio: 1 / 3,
    negativeMarksPerWrong: 0.667,
    // 1/3 of 2 marks = 0.667 or 1/3 per syllabus
    description: "Exam pattern: 100 questions based on CGPSC SSE syllabus. 2 marks for correct answer and minus 1/3 marks for wrong answers.",
    color: "#3B82F6",
    badge: "100 Qs \u2022 +2 \u2022 -\u2153 \u2022 120 Mins",
    isComingSoon: false
  },
  SWAMI_ATMANAND: {
    id: "SWAMI_ATMANAND",
    name: "Swami Atmanand English Medium School Recruitment",
    shortName: "Swami Atmanand",
    totalQuestions: 100,
    durationMinutes: 120,
    marksPerCorrect: 1,
    negativeMarksRatio: 1 / 3,
    negativeMarksPerWrong: 0.333,
    description: "Exam pattern: 100 questions, 1 mark for right answer, minus 1/3rd for wrong answer and 2 hours exam time.",
    color: "#8B5CF6",
    badge: "100 Qs \u2022 +1 \u2022 -\u2153 \u2022 120 Mins",
    isComingSoon: false
  },
  CENTRAL_EXAMS: {
    id: "CENTRAL_EXAMS",
    name: "Central Exams (Railway RRB, SSC CGL/CHSL, Banking IBPS/SBI, UPSC)",
    shortName: "Central (SSC, Rail, Bank, UPSC)",
    totalQuestions: 100,
    durationMinutes: 60,
    marksPerCorrect: 1,
    negativeMarksRatio: 0.25,
    negativeMarksPerWrong: 0.25,
    description: "Central government recruitment exams including Staff Selection Commission, Railway Recruitment Boards, Banking & UPSC Prelims.",
    color: "#F59E0B",
    badge: "Coming Soon",
    isComingSoon: true
  },
  TEACHER_RECRUITMENT: {
    id: "TEACHER_RECRUITMENT",
    name: "Chhattisgarh Teacher Recruitment 2026 (\u0936\u093F\u0915\u094D\u0937\u0915, \u0938\u0939\u093E\u092F\u0915 \u0936\u093F\u0915\u094D\u0937\u0915 \u090F\u0935\u0902 \u0935\u094D\u092F\u093E\u0916\u094D\u092F\u093E\u0924\u093E \u092D\u0930\u094D\u0924\u0940)",
    shortName: "CG Teacher 2026",
    totalQuestions: 150,
    durationMinutes: 150,
    marksPerCorrect: 1,
    negativeMarksRatio: 0.25,
    negativeMarksPerWrong: 0.25,
    description: "Official CG School Education recruitment scheme: 150 questions across 3 Cadres (Assistant Teacher Class 1-5, Subject Teacher Class 6-8, Lecturer Class 9-12) with -0.25 negative marking.",
    color: "#10B981",
    badge: "150 Qs \u2022 +1 \u2022 -0.25 \u2022 150 Mins",
    isComingSoon: false
  }
};
var HIERARCHY_TREE = [
  {
    subject: "Chhattisgarh General Studies",
    topics: [
      {
        name: "History of Chhattisgarh",
        subtopics: ["Kalchuri Dynasty", "Maratha Rule & British Period", "Tribal Revolts & Freedom Struggle", "Modern State Formation (2000)"]
      },
      {
        name: "Geography & Natural Resources",
        subtopics: ["River Basins (Mahanadi, Indravati)", "Forests & National Parks", "Minerals & Industrial Zones", "Climate & Soil Types"]
      },
      {
        name: "Culture, Tribes & Tourism",
        subtopics: ["Bastar Dussehra & Madai Mela", "Tribal Traditions (Gond, Baiga, Maria)", "Folk Dances (Karma, Raut Nacha, Panthi)", "Historical Temples & Archeology"]
      },
      {
        name: "Administration & Economy",
        subtopics: ["Panchayati Raj & Urban Local Bodies", "State Budget & Welfare Schemes", "Agriculture & Minor Forest Produce", "State Legislature & Districts"]
      }
    ]
  },
  {
    subject: "India General Studies",
    topics: [
      {
        name: "Indian History & National Movement",
        subtopics: ["Ancient India (Indus Valley & Vedic)", "Maurya, Gupta & Medieval Dynasties", "1857 Revolt & Freedom Struggle", "Gandhian Era & Independence Movement"]
      },
      {
        name: "Indian Polity & Constitution",
        subtopics: ["Constitutional Framework & Preamble", "Fundamental Rights & Duties", "Parliament, President & Judiciary", "Constitutional Bodies & Amendments"]
      },
      {
        name: "Physical & Economic Geography of India",
        subtopics: ["Himalayas & Northern Plains", "River Systems (Ganga, Brahmaputra, Peninsular)", "Climate, Monsoon & Natural Vegetation", "Agriculture, Minerals & Industries"]
      },
      {
        name: "Indian Economy & Development",
        subtopics: ["National Income & Economic Planning", "RBI, Banking & Monetary Policy", "Fiscal Policy, Budget & Taxation", "NITI Aayog & Flagship Schemes"]
      },
      {
        name: "National Current Affairs & General Knowledge",
        subtopics: ["National & International Events", "Major Awards, Honours & Sports", "Space, Science & Defence Missions", "International Organizations (UN, BRICS)"]
      }
    ]
  },
  {
    subject: "General Science",
    topics: [
      {
        name: "Physics",
        subtopics: ["Mechanics, Units & Measurements", "Light, Optics & Sound", "Electricity & Magnetism", "Heat & Thermodynamics"]
      },
      {
        name: "Chemistry",
        subtopics: ["Atomic Structure & Periodic Table", "Acids, Bases & Salts", "Metals, Non-metals & Metallurgy", "Carbon & Environmental Chemistry"]
      },
      {
        name: "Biology & Environmental Ecology",
        subtopics: ["Cell Biology & Genetics", "Human Physiology & Nutrition", "Diseases, Immunity & Vaccines", "Ecology, Biodiversity & Conservation"]
      }
    ]
  },
  {
    subject: "Computer Knowledge",
    topics: [
      {
        name: "Computer Fundamentals",
        subtopics: ["Computer Architecture & CPU", "Hardware, Memory & Storage (RAM/ROM)", "Input & Output Devices", "Abbreviations & File Extensions"]
      },
      {
        name: "Operating Systems & Software",
        subtopics: ["Windows & Linux Fundamentals", "MS Word & Text Processing", "MS Excel & Data Analysis", "MS PowerPoint & Multimedia"]
      },
      {
        name: "Internet & Cybersecurity",
        subtopics: ["Web Browsers & Protocols (HTTP/HTTPS)", "Computer Networks (LAN/WAN/IP)", "Viruses, Malware & Firewalls", "Cyber Safety & IT Act"]
      }
    ]
  },
  {
    subject: "Quantitative Aptitude",
    topics: [
      {
        name: "Arithmetic & Commercial Mathematics",
        subtopics: ["Percentages & Profit-Loss", "Ratio & Proportion", "Simple & Compound Interest", "Time, Work & Wages", "Speed, Time & Distance"]
      },
      {
        name: "Number System & Algebra",
        subtopics: ["HCF & LCM", "Number Series & Simplification", "Linear Equations & Polynomials", "Square Roots & Indices"]
      },
      {
        name: "Geometry & Mensuration",
        subtopics: ["2D Geometry (Triangles, Circles)", "Mensuration (Area & Perimeter)", "3D Mensuration (Volume & Surface Area)"]
      },
      {
        name: "Data Interpretation",
        subtopics: ["Bar Graphs & Histograms", "Pie Charts", "Tables & Line Graphs"]
      }
    ]
  },
  {
    subject: "Reasoning",
    topics: [
      {
        name: "Verbal & Analytical Reasoning",
        subtopics: ["Coding-Decoding", "Blood Relations", "Direction Sense Test", "Order & Ranking"]
      },
      {
        name: "Logical Deductions",
        subtopics: ["Syllogism", "Statement & Assumptions", "Statement & Conclusions", "Cause & Effect"]
      },
      {
        name: "Puzzles & Series",
        subtopics: ["Number & Alphabet Series", "Seating Arrangement", "Clocks & Calendars", "Mathematical Operations"]
      },
      {
        name: "Non-Verbal Reasoning",
        subtopics: ["Pattern Completion & Series", "Mirror & Water Images", "Paper Folding & Cutting", "Dice & Cubes"]
      }
    ]
  },
  {
    subject: "General Hindi",
    topics: [
      {
        name: "Hindi Vyakaran & Varnamala",
        subtopics: ["Varna, Swar & Vyanjan", "Sangya, Sarvanam & Visheshan", "Kriya, Kaal & Karak", "Vachya & Avyaya"]
      },
      {
        name: "Sandhi & Samas",
        subtopics: ["Swar Sandhi, Vyanjan Sandhi, Visarga Sandhi", "Samas Bhed (Tatpurush, Karmadharaya, Dvigu, Bahuvrihi)", "Upsarg & Pratyay"]
      },
      {
        name: "Shabd Bodh & Vocabulary",
        subtopics: ["Paryayvachi Shabd", "Vilom Shabd", "Tatsam & Tadbhav", "Anekarthi & Samanarthi Shabd"]
      },
      {
        name: "Vakya Shuddhi & Muhavare",
        subtopics: ["Vartani Shuddhi", "Vakya Shuddhi & Krama", "Muhavare & Lokoktiyan", "Anek Shabdon Ke Liye Ek Shabd"]
      }
    ]
  },
  {
    subject: "Chhattisgarhi Language",
    topics: [
      {
        name: "Chhattisgarhi Vyakaran",
        subtopics: ["Chhattisgarhi Sangya & Sarvanam", "Chhattisgarhi Karak & Vibhakti", "Chhattisgarhi Kriya & Kaal", "Linga & Vachana Niyam"]
      },
      {
        name: "Chhattisgarhi Hana & Janula",
        subtopics: ["Prasiddha Hana (Idioms & Proverbs)", "Janula (Chhattisgarhi Riddles)", "Local Muhavare & Expressions"]
      },
      {
        name: "Chhattisgarhi Lok Sahitya",
        subtopics: ["Pramukh Kavi & Rachnaye", "Chhattisgarhi Boli & Dialects", "Chhattisgarhi Shabdkosh & Terminology"]
      }
    ]
  },
  {
    subject: "General English",
    topics: [
      {
        name: "Grammar & Parts of Speech",
        subtopics: ["Tenses & Modals", "Active & Passive Voice", "Direct & Indirect Speech", "Prepositions & Articles"]
      },
      {
        name: "Vocabulary & Usage",
        subtopics: ["Synonyms & Antonyms", "Idioms & Phrases", "One Word Substitution", "Common Spelling Errors"]
      },
      {
        name: "Comprehension & Error Detection",
        subtopics: ["Reading Comprehension", "Spotting Errors in Sentences", "Sentence Rearrangement & Fillers"]
      }
    ]
  },
  {
    subject: "Child Pedagogy & Teaching Methodology",
    topics: [
      {
        name: "Educational Psychology",
        subtopics: ["Child Development Stages", "Learning Theories (Piaget, Vygotsky)", "Inclusive Education & CWSN"]
      },
      {
        name: "Pedagogy & Curriculum",
        subtopics: ["Teaching Learning Materials (TLM)", "Continuous & Comprehensive Evaluation (CCE)", "National Education Policy 2020"]
      }
    ]
  }
];
var INITIAL_QUESTIONS = [
  // 1
  {
    id: "q-cg-01",
    subject: "Chhattisgarh General Studies",
    topic: "History of Chhattisgarh",
    subtopic: "Kalchuri Dynasty",
    difficulty: "Medium",
    category: "CGSSB",
    questionText: "Who was the founder of the Ratanpur branch of the Kalchuri dynasty in Chhattisgarh?",
    questionHindi: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u092E\u0947\u0902 \u0915\u0932\u091A\u0941\u0930\u0940 \u0935\u0902\u0936 \u0915\u0940 \u0930\u0924\u0928\u092A\u0941\u0930 \u0936\u093E\u0916\u093E \u0915\u0947 \u0938\u0902\u0938\u094D\u0925\u093E\u092A\u0915 \u0915\u094C\u0928 \u0925\u0947?",
    options: [
      { id: "A", text: "Kalingaraj", textHindi: "\u0915\u0932\u093F\u0902\u0917\u0930\u093E\u091C" },
      { id: "B", text: "Ratnadeva I", textHindi: "\u0930\u0924\u094D\u0928\u0926\u0947\u0935 \u092A\u094D\u0930\u0925\u092E" },
      { id: "C", text: "Kamalraja", textHindi: "\u0915\u092E\u0932\u0930\u093E\u091C" },
      { id: "D", text: "Prithvideva I", textHindi: "\u092A\u0943\u0925\u094D\u0935\u0940\u0926\u0947\u0935 \u092A\u094D\u0930\u0925\u092E" }
    ],
    correctOption: "A",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Around 1000 AD, Kalingaraj founded the Ratanpur branch of the Kalchuris by establishing his capital at Tumman before Ratnadeva I shifted it to Ratanpur.",
    explanationHindi: "\u0932\u0917\u092D\u0917 1000 \u0908\u0938\u094D\u0935\u0940 \u092E\u0947\u0902 \u0915\u0932\u093F\u0902\u0917\u0930\u093E\u091C \u0928\u0947 \u0924\u0941\u092E\u094D\u092E\u093E\u0923 \u0915\u094B \u0930\u093E\u091C\u0927\u093E\u0928\u0940 \u092C\u0928\u093E\u0915\u0930 \u0915\u0932\u091A\u0941\u0930\u0940 \u0935\u0902\u0936 \u0915\u0940 \u0938\u094D\u0925\u093E\u092A\u0928\u093E \u0915\u0940, \u091C\u093F\u0938\u0947 \u092C\u093E\u0926 \u092E\u0947\u0902 \u0930\u0924\u094D\u0928\u0926\u0947\u0935 \u092A\u094D\u0930\u0925\u092E \u0928\u0947 \u0930\u0924\u0928\u092A\u0941\u0930 \u0938\u094D\u0925\u093E\u0928\u093E\u0902\u0924\u0930\u093F\u0924 \u0915\u093F\u092F\u093E\u0964",
    pypSource: "CGSSB Combined 2022",
    pypAppearances: [
      { examName: "CGSSB Combined Exam", year: 2022, shift: "Shift 1" },
      { examName: "CGPSC SSE Prelims Paper-I", year: 2018, shift: "General Studies" },
      { examName: "CG Vyapam Revenue Inspector (RI)", year: 2015 }
    ],
    createdAt: "2024-01-10"
  },
  // 2
  {
    id: "q-cg-02",
    subject: "Chhattisgarh General Studies",
    topic: "Geography & Natural Resources",
    subtopic: "River Basins (Mahanadi, Indravati)",
    difficulty: "Easy",
    category: "CGSSB",
    questionText: 'Which waterfall in Chhattisgarh is famously known as the "Niagara Falls of India"?',
    questionHindi: '\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u093E \u0915\u094C\u0928 \u0938\u093E \u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924 "\u092D\u093E\u0930\u0924 \u0915\u093E \u0928\u093F\u092F\u093E\u0917\u094D\u0930\u093E \u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924" \u0915\u0947 \u0928\u093E\u092E \u0938\u0947 \u091C\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948?',
    options: [
      { id: "A", text: "Teerathgarh Waterfall", textHindi: "\u0924\u0940\u0930\u0925\u0917\u0922\u093C \u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924" },
      { id: "B", text: "Chitrakote Waterfall", textHindi: "\u091A\u093F\u0924\u094D\u0930\u0915\u094B\u091F \u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924" },
      { id: "C", text: "Amritdhara Waterfall", textHindi: "\u0905\u092E\u0943\u0924\u0927\u093E\u0930\u093E \u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924" },
      { id: "D", text: "Ghatarani Waterfall", textHindi: "\u0918\u091F\u093E\u0930\u093E\u0928\u0940 \u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924" }
    ],
    correctOption: "B",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Chitrakote Waterfall is situated on the Indravati River in Bastar district. Due to its horseshoe shape and immense volume of water during the monsoon, it is widely called the Niagara of India.",
    explanationHindi: "\u091A\u093F\u0924\u094D\u0930\u0915\u094B\u091F \u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924 \u092C\u0938\u094D\u0924\u0930 \u091C\u093F\u0932\u0947 \u092E\u0947\u0902 \u0907\u0902\u0926\u094D\u0930\u093E\u0935\u0924\u0940 \u0928\u0926\u0940 \u092A\u0930 \u0938\u094D\u0925\u093F\u0924 \u0939\u0948\u0964 \u0918\u094B\u0921\u093C\u0947 \u0915\u0940 \u0928\u093E\u0932 \u091C\u0948\u0938\u0947 \u0906\u0915\u093E\u0930 \u0914\u0930 \u0935\u093F\u0936\u093E\u0932 \u091C\u0932\u0930\u093E\u0936\u093F \u0915\u0947 \u0915\u093E\u0930\u0923 \u0907\u0938\u0947 \u092D\u093E\u0930\u0924 \u0915\u093E \u0928\u093F\u092F\u093E\u0917\u094D\u0930\u093E \u0915\u0939\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
    pypSource: "CGPSC SSE 2021",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2021, shift: "General Studies" },
      { examName: "CGSSB Patwari Selection Exam", year: 2019 },
      { examName: "CG Vyapam Forest Guard", year: 2022 },
      { examName: "CG Police Sub-Inspector (SI)", year: 2023 }
    ],
    createdAt: "2024-01-11"
  },
  // 3
  {
    id: "q-cg-03",
    subject: "Chhattisgarh General Studies",
    topic: "Culture, Tribes & Tourism",
    subtopic: "Bastar Dussehra & Madai Mela",
    difficulty: "Medium",
    category: "CGSSB",
    questionText: "How many days does the historic world-famous Bastar Dussehra festival last?",
    questionHindi: "\u0910\u0924\u093F\u0939\u093E\u0938\u093F\u0915 \u0935\u093F\u0936\u094D\u0935 \u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u092C\u0938\u094D\u0924\u0930 \u0926\u0936\u0939\u0930\u093E \u0909\u0924\u094D\u0938\u0935 \u0915\u093F\u0924\u0928\u0947 \u0926\u093F\u0928\u094B\u0902 \u0924\u0915 \u092E\u0928\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
    options: [
      { id: "A", text: "10 Days", textHindi: "10 \u0926\u093F\u0928" },
      { id: "B", text: "45 Days", textHindi: "45 \u0926\u093F\u0928" },
      { id: "C", text: "75 Days", textHindi: "75 \u0926\u093F\u0928" },
      { id: "D", text: "90 Days", textHindi: "90 \u0926\u093F\u0928" }
    ],
    correctOption: "C",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Bastar Dussehra is unique because it is celebrated for 75 days, dedicated to Goddess Danteshwari, and does not commemorate the victory of Rama over Ravana.",
    explanationHindi: "\u092C\u0938\u094D\u0924\u0930 \u0926\u0936\u0939\u0930\u093E 75 \u0926\u093F\u0928\u094B\u0902 \u0924\u0915 \u091A\u0932\u0928\u0947 \u0935\u093E\u0932\u093E \u0935\u093F\u0936\u094D\u0935 \u0915\u093E \u0938\u092C\u0938\u0947 \u0932\u0902\u092C\u093E \u0924\u094D\u092F\u094C\u0939\u093E\u0930 \u0939\u0948 \u091C\u094B \u092E\u093E\u0902 \u0926\u0902\u0924\u0947\u0936\u094D\u0935\u0930\u0940 \u0915\u094B \u0938\u092E\u0930\u094D\u092A\u093F\u0924 \u0939\u0948\u0964",
    pypSource: "CGSSB Patwari 2023",
    pypAppearances: [
      { examName: "CGSSB Patwari Exam", year: 2023 },
      { examName: "CGPSC State Service Prelims", year: 2017 },
      { examName: "CG Rural Development Officer", year: 2020 }
    ],
    createdAt: "2024-01-12"
  },
  // 4
  {
    id: "q-cg-04",
    subject: "Computer Knowledge",
    topic: "Operating Systems & Software",
    subtopic: "Internet & Cybersecurity",
    difficulty: "Easy",
    category: "CGSSB",
    questionText: "Which protocol is used for secure end-to-end communication over the World Wide Web?",
    questionHindi: "\u0935\u0930\u094D\u0932\u094D\u0921 \u0935\u093E\u0907\u0921 \u0935\u0947\u092C \u092A\u0930 \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u090F\u0902\u0921-\u091F\u0942-\u090F\u0902\u0921 \u0938\u0902\u091A\u093E\u0930 \u0915\u0947 \u0932\u093F\u090F \u0915\u093F\u0938 \u092A\u094D\u0930\u094B\u091F\u094B\u0915\u0949\u0932 \u0915\u093E \u0909\u092A\u092F\u094B\u0917 \u0915\u093F\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
    options: [
      { id: "A", text: "FTP", textHindi: "FTP" },
      { id: "B", text: "HTTP", textHindi: "HTTP" },
      { id: "C", text: "HTTPS", textHindi: "HTTPS" },
      { id: "D", text: "SMTP", textHindi: "SMTP" }
    ],
    correctOption: "C",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "HTTPS (Hypertext Transfer Protocol Secure) encrypts data using SSL/TLS, ensuring secure transmission of sensitive data.",
    explanationHindi: "HTTPS (\u0939\u093E\u0907\u092A\u0930\u091F\u0947\u0915\u094D\u0938\u094D\u091F \u091F\u094D\u0930\u093E\u0902\u0938\u092B\u0930 \u092A\u094D\u0930\u094B\u091F\u094B\u0915\u0949\u0932 \u0938\u093F\u0915\u094D\u092F\u094B\u0930) \u0921\u0947\u091F\u093E \u0915\u094B SSL/TLS \u0915\u0947 \u092E\u093E\u0927\u094D\u092F\u092E \u0938\u0947 \u090F\u0928\u094D\u0915\u094D\u0930\u093F\u092A\u094D\u091F \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
    pypSource: "CGSSB Hostel Warden 2022",
    pypAppearances: [
      { examName: "CGSSB Hostel Warden Exam", year: 2022 },
      { examName: "CG Vyapam Sub-Engineer Exam", year: 2020 }
    ],
    createdAt: "2024-01-14"
  },
  // 5
  {
    id: "q-cg-05",
    subject: "Chhattisgarhi Language",
    topic: "Chhattisgarhi Hana & Janula",
    subtopic: "Idioms & Proverbs (Hana)",
    difficulty: "Hard",
    category: "CGSSB",
    questionText: 'What is the meaning of the Chhattisgarhi Hana (proverb): "\u092A\u0947\u091F \u092E \u0926\u093E\u0922\u093C\u0940 \u0939\u094B\u0928\u093E" (Pet ma Dadhi hona)?',
    questionHindi: '\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C\u0940 \u092E\u0941\u0939\u093E\u0935\u0930\u0947/\u0939\u093E\u0928\u093E "\u092A\u0947\u091F \u092E \u0926\u093E\u0922\u093C\u0940 \u0939\u094B\u0928\u093E" \u0915\u093E \u0938\u091F\u0940\u0915 \u0905\u0930\u094D\u0925 \u0915\u094D\u092F\u093E \u0939\u0948?',
    options: [
      { id: "A", text: "To be very hungry", textHindi: "\u0905\u0924\u094D\u092F\u0927\u093F\u0915 \u092D\u0942\u0916\u093E \u0939\u094B\u0928\u093E" },
      { id: "B", text: "To be shrewd and clever beyond one's young age", textHindi: "\u0915\u092E \u0909\u092E\u094D\u0930 \u092E\u0947\u0902 \u092C\u0939\u0941\u0924 \u091A\u0924\u0941\u0930 \u0935 \u0927\u0942\u0930\u094D\u0924 \u0939\u094B\u0928\u093E" },
      { id: "C", text: "To suffer from stomach illness", textHindi: "\u092A\u0947\u091F \u0915\u093E \u0917\u0902\u092D\u0940\u0930 \u0930\u094B\u0917\u0940 \u0939\u094B\u0928\u093E" },
      { id: "D", text: "To become very old quickly", textHindi: "\u0905\u0938\u092E\u092F \u092C\u0942\u0922\u093C\u093E \u0939\u094B \u091C\u093E\u0928\u093E" }
    ],
    correctOption: "B",
    marks: 1,
    negativeMarks: 0.333,
    explanation: 'In Chhattisgarhi folk literature, "\u092A\u0947\u091F \u092E \u0926\u093E\u0922\u093C\u0940 \u0939\u094B\u0928\u093E" signifies being deceptive, worldly-wise, or unnaturally shrewd from childhood.',
    explanationHindi: '\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C\u0940 \u092E\u0947\u0902 "\u092A\u0947\u091F \u092E \u0926\u093E\u0922\u093C\u0940 \u0939\u094B\u0928\u093E" \u0915\u093E \u0924\u093E\u0924\u094D\u092A\u0930\u094D\u092F \u092C\u091A\u092A\u0928 \u092F\u093E \u0915\u092E \u0909\u092E\u094D\u0930 \u0938\u0947 \u0939\u0940 \u092C\u0939\u0941\u0924 \u091A\u0924\u0941\u0930, \u0927\u0942\u0930\u094D\u0924 \u092F\u093E \u0915\u0942\u091F\u0928\u0940\u0924\u093F\u091C\u094D\u091E \u0939\u094B\u0928\u093E \u0939\u0948\u0964',
    pypSource: "CGSSB RI 2021",
    pypAppearances: [
      { examName: "CGSSB Revenue Inspector (RI)", year: 2021 },
      { examName: "CGPSC State Service Mains Hindi Paper", year: 2019 },
      { examName: "CG Vyapam Assistant Grade-III", year: 2017 }
    ],
    createdAt: "2024-01-15"
  },
  // 6
  {
    id: "q-cg-06",
    subject: "Reasoning",
    topic: "Verbal & Analytical Reasoning",
    subtopic: "Coding-Decoding",
    difficulty: "Medium",
    category: "CGSSB",
    questionText: "If RAIPUR is coded as SBJQVCS, how will BILASPUR be coded in that same pattern?",
    questionHindi: "\u092F\u0926\u093F \u0915\u093F\u0938\u0940 \u0915\u0942\u091F\u092D\u093E\u0937\u093E \u092E\u0947\u0902 RAIPUR \u0915\u094B SBJQVS \u0932\u093F\u0916\u093E \u091C\u093E\u0924\u093E \u0939\u0948 (\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u0905\u0915\u094D\u0937\u0930 +1), \u0924\u094B BILASPUR \u0915\u094B \u0915\u094D\u092F\u093E \u0932\u093F\u0916\u093E \u091C\u093E\u090F\u0917\u093E?",
    options: [
      { id: "A", text: "CJM BT QVS", textHindi: "CJMBTQVS" },
      { id: "B", text: "CJMBTQVR", textHindi: "CJMBTQVR" },
      { id: "C", text: "CJNBTQVS", textHindi: "CJNBTQVS" },
      { id: "D", text: "CKNBTQVS", textHindi: "CKNBTQVS" }
    ],
    correctOption: "A",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Each letter is shifted by +1 in the alphabet: B->C, I->J, L->M, A->B, S->T, P->Q, U->V, R->S = CJMBTQVS.",
    explanationHindi: "\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 \u0905\u0915\u094D\u0937\u0930 \u092E\u0947\u0902 +1 \u0915\u0940 \u0935\u0943\u0926\u094D\u0927\u093F \u0939\u0941\u0908 \u0939\u0948: B(+1)=C, I(+1)=J, L(+1)=M, A(+1)=B, S(+1)=T, P(+1)=Q, U(+1)=V, R(+1)=S.",
    pypSource: "CGSSB Combined 2023",
    pypAppearances: [
      { examName: "CGSSB Combined Exam", year: 2023 },
      { examName: "CG Police Constable", year: 2021 }
    ],
    createdAt: "2024-01-16"
  },
  // 7
  {
    id: "q-cg-07",
    subject: "Chhattisgarh General Studies",
    topic: "History of Chhattisgarh",
    subtopic: "Tribal Revolts & Freedom Struggle",
    difficulty: "Hard",
    category: "CGSSB",
    questionText: "Who was the leader of the famous Bhumkal Revolt of Bastar in 1910?",
    questionHindi: "1910 \u0915\u0947 \u0910\u0924\u093F\u0939\u093E\u0938\u093F\u0915 \u092C\u0938\u094D\u0924\u0930 \u092D\u0942\u092E\u0915\u093E\u0932 \u0935\u093F\u0926\u094D\u0930\u094B\u0939 \u0915\u0947 \u092A\u094D\u0930\u092E\u0941\u0916 \u091C\u0928\u0928\u093E\u092F\u0915 \u0915\u094C\u0928 \u0925\u0947?",
    options: [
      { id: "A", text: "Gundadhur", textHindi: "\u0917\u0941\u0902\u0921\u093E\u0927\u0941\u0930" },
      { id: "B", text: "Gend Singh", textHindi: "\u0917\u0947\u0902\u0926 \u0938\u093F\u0902\u0939" },
      { id: "C", text: "Veer Narayan Singh", textHindi: "\u0935\u0940\u0930 \u0928\u093E\u0930\u093E\u092F\u0923 \u0938\u093F\u0902\u0939" },
      { id: "D", text: "Hanuman Singh", textHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u0938\u093F\u0902\u0939" }
    ],
    correctOption: "A",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Gundadhur of Nethanar village was the military commander and supreme leader of the 1910 Bhumkal revolt against British forest policies and oppression.",
    explanationHindi: "\u0928\u0947\u0924\u093E\u0928\u093E\u0930 \u0915\u0947 \u0935\u0940\u0930 \u0917\u0941\u0902\u0921\u093E\u0927\u0941\u0930 \u0928\u0947 1910 \u092E\u0947\u0902 \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u094B\u0902 \u0915\u0947 \u0936\u094B\u0937\u0923 \u0935 \u0935\u0928 \u0915\u093E\u0928\u0942\u0928\u094B\u0902 \u0915\u0947 \u0916\u093F\u0932\u093E\u092B \u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u092D\u0942\u092E\u0915\u093E\u0932 \u0935\u093F\u0926\u094D\u0930\u094B\u0939 \u0915\u093E \u0928\u0947\u0924\u0943\u0924\u094D\u0935 \u0915\u093F\u092F\u093E \u0925\u093E\u0964",
    pypSource: "CGPSC SSE 2022",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2022 },
      { examName: "CGSSB Assistant Teacher Recruitment", year: 2021 },
      { examName: "CG Police Sub-Inspector (SI)", year: 2018 }
    ],
    createdAt: "2024-01-17"
  },
  // 8
  {
    id: "q-cg-08",
    subject: "Chhattisgarh General Studies",
    topic: "Administration & Economy",
    subtopic: "Panchayati Raj & Urban Local Bodies",
    difficulty: "Medium",
    category: "CGSSB",
    questionText: "In Chhattisgarh Panchayati Raj Act 1993, what is the minimum quorum required for a Gram Sabha meeting?",
    questionHindi: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u092A\u0902\u091A\u093E\u092F\u0924\u0940 \u0930\u093E\u091C \u0905\u0927\u093F\u0928\u093F\u092F\u092E 1993 \u0915\u0947 \u0924\u0939\u0924 \u0917\u094D\u0930\u093E\u092E \u0938\u092D\u093E \u0915\u0940 \u092C\u0948\u0920\u0915 \u0915\u0947 \u0932\u093F\u090F \u0928\u094D\u092F\u0942\u0928\u0924\u092E \u0917\u0923\u092A\u0942\u0930\u094D\u0924\u093F (\u0915\u094B\u0930\u092E) \u0915\u093F\u0924\u0928\u0940 \u0939\u0948?",
    options: [
      { id: "A", text: "1/10th of total members, with at least 1/3rd being women", textHindi: "\u0915\u0941\u0932 \u0938\u0926\u0938\u094D\u092F\u094B\u0902 \u0915\u093E 1/10, \u091C\u093F\u0938\u092E\u0947\u0902 \u0915\u092E \u0938\u0947 \u0915\u092E 1/3 \u092E\u0939\u093F\u0932\u093E \u0938\u0926\u0938\u094D\u092F \u0939\u094B\u0902" },
      { id: "B", text: "1/5th of total members, with at least 1/2 being women", textHindi: "\u0915\u0941\u0932 \u0938\u0926\u0938\u094D\u092F\u094B\u0902 \u0915\u093E 1/5, \u091C\u093F\u0938\u092E\u0947\u0902 \u0915\u092E \u0938\u0947 \u0915\u092E 1/2 \u092E\u0939\u093F\u0932\u093E \u0938\u0926\u0938\u094D\u092F \u0939\u094B\u0902" },
      { id: "C", text: "1/4th of total members without gender quota", textHindi: "\u0915\u0941\u0932 \u0938\u0926\u0938\u094D\u092F\u094B\u0902 \u0915\u093E 1/4" },
      { id: "D", text: "1/3rd of total members", textHindi: "\u0915\u0941\u0932 \u0938\u0926\u0938\u094D\u092F\u094B\u0902 \u0915\u093E 1/3" }
    ],
    correctOption: "A",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Under Section 6 of the CG Panchayati Raj Act 1993, the quorum for Gram Sabha is 1/10th of total voters, with at least one-third of present members being women.",
    explanationHindi: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u092A\u0902\u091A\u093E\u092F\u0924\u0940 \u0930\u093E\u091C \u0905\u0927\u093F\u0928\u093F\u092F\u092E \u0915\u0947 \u0924\u0939\u0924 \u0917\u094D\u0930\u093E\u092E \u0938\u092D\u093E \u0915\u093E \u0915\u094B\u0930\u092E 1/10 \u0938\u0926\u0938\u094D\u092F \u0939\u0948, \u091C\u093F\u0938\u092E\u0947\u0902 \u0915\u092E \u0938\u0947 \u0915\u092E 1/3 \u092E\u0939\u093F\u0932\u093E\u0913\u0902 \u0915\u0940 \u0909\u092A\u0938\u094D\u0925\u093F\u0924\u093F \u0905\u0928\u093F\u0935\u093E\u0930\u094D\u092F \u0939\u0948\u0964",
    pypSource: "CGPSC SSE 2020",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims", year: 2020 },
      { examName: "CG Vyapam Chief Executive Officer (Panchayat)", year: 2017 },
      { examName: "CGSSB Patwari Exam", year: 2016 }
    ],
    createdAt: "2024-01-18"
  },
  // 9
  {
    id: "q-cg-09",
    subject: "Computer Knowledge",
    topic: "Computer Fundamentals (Vyapam)",
    subtopic: "Computer Hardware & Memory",
    difficulty: "Easy",
    category: "CGSSB",
    questionText: "Which memory type is non-volatile and retains its contents even when computer power is switched off?",
    questionHindi: "\u0928\u093F\u092E\u094D\u0928\u0932\u093F\u0916\u093F\u0924 \u092E\u0947\u0902 \u0938\u0947 \u0915\u094C\u0928 \u0938\u0940 \u092E\u0947\u092E\u094B\u0930\u0940 \u0928\u0949\u0928-\u0935\u094B\u0932\u0947\u091F\u093E\u0907\u0932 (\u0938\u094D\u0925\u093E\u092F\u0940) \u0939\u0948 \u091C\u094B \u0915\u0902\u092A\u094D\u092F\u0942\u091F\u0930 \u092C\u0902\u0926 \u0939\u094B\u0928\u0947 \u092A\u0930 \u092D\u0940 \u0921\u0947\u091F\u093E \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0930\u0916\u0924\u0940 \u0939\u0948?",
    options: [
      { id: "A", text: "RAM (Random Access Memory)", textHindi: "RAM" },
      { id: "B", text: "ROM (Read Only Memory)", textHindi: "ROM" },
      { id: "C", text: "Cache Memory", textHindi: "\u0915\u0948\u0936 \u092E\u0947\u092E\u094B\u0930\u0940" },
      { id: "D", text: "Registers", textHindi: "\u0930\u091C\u093F\u0938\u094D\u091F\u0930\u094D\u0938" }
    ],
    correctOption: "B",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "ROM is non-volatile memory storing firmware and bootstrap code that persists without power, unlike volatile RAM.",
    explanationHindi: "ROM (\u0930\u0940\u0921 \u0913\u0928\u0932\u0940 \u092E\u0947\u092E\u094B\u0930\u0940) \u090F\u0915 \u0928\u0949\u0928-\u0935\u094B\u0932\u0947\u091F\u093E\u0907\u0932 \u092E\u0947\u092E\u094B\u0930\u0940 \u0939\u0948 \u091C\u093F\u0938\u0915\u093E \u0921\u0947\u091F\u093E \u092C\u093F\u091C\u0932\u0940 \u0915\u091F \u091C\u093E\u0928\u0947 \u092A\u0930 \u092D\u0940 \u0928\u0937\u094D\u091F \u0928\u0939\u0940\u0902 \u0939\u094B\u0924\u093E\u0964",
    pypSource: "CGSSB Combined 2023",
    pypAppearances: [
      { examName: "CGSSB Combined Exam", year: 2023 },
      { examName: "CG Vyapam Data Entry Operator (DEO)", year: 2021 },
      { examName: "CGSSB Hostel Warden", year: 2019 }
    ],
    createdAt: "2024-01-19"
  },
  // 10
  {
    id: "q-cg-10",
    subject: "Chhattisgarh General Studies",
    topic: "Culture, Tribes & Tourism",
    subtopic: "Folk Dances (Karma, Raut Nacha, Panthi)",
    difficulty: "Easy",
    category: "CGSSB",
    questionText: "Panthi dance of Chhattisgarh is primarily associated with which spiritual community/saint?",
    questionHindi: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u093E \u0935\u093F\u0916\u094D\u092F\u093E\u0924 \u092A\u0902\u0925\u0940 \u0928\u0943\u0924\u094D\u092F \u092E\u0941\u0916\u094D\u092F\u0924\u0903 \u0915\u093F\u0938 \u092A\u0902\u0925/\u0938\u0902\u0924 \u0915\u0940 \u0936\u093F\u0915\u094D\u0937\u093E\u0913\u0902 \u0938\u0947 \u091C\u0941\u0921\u093C\u093E \u0939\u0941\u0906 \u0939\u0948?",
    options: [
      { id: "A", text: "Satnami Community & Guru Ghasidas", textHindi: "\u0938\u0924\u0928\u093E\u092E\u0940 \u0938\u092E\u0941\u0926\u093E\u092F \u090F\u0935\u0902 \u0917\u0941\u0930\u0941 \u0918\u093E\u0938\u0940\u0926\u093E\u0938 \u091C\u0940" },
      { id: "B", text: "Kabir Panth", textHindi: "\u0915\u092C\u0940\u0930 \u092A\u0902\u0925" },
      { id: "C", text: "Vaishnav Tradition", textHindi: "\u0935\u0948\u0937\u094D\u0923\u0935 \u092A\u0930\u0902\u092A\u0930\u093E" },
      { id: "D", text: "Nath Sect", textHindi: "\u0928\u093E\u0925 \u0938\u0902\u092A\u094D\u0930\u0926\u093E\u092F" }
    ],
    correctOption: "A",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Panthi dance is an energetic, devotional acrobatic dance performed by the Satnami community, celebrating the truth and teachings of Guru Ghasidas.",
    explanationHindi: "\u092A\u0902\u0925\u0940 \u0928\u0943\u0924\u094D\u092F \u0938\u0924\u0928\u093E\u092E\u0940 \u0938\u092E\u093E\u091C \u0926\u094D\u0935\u093E\u0930\u093E \u0917\u0941\u0930\u0941 \u0918\u093E\u0938\u0940\u0926\u093E\u0938 \u091C\u0940 \u0915\u0940 \u091C\u092F\u0902\u0924\u0940 \u0914\u0930 \u0909\u0928\u0915\u0947 \u0909\u092A\u0926\u0947\u0936\u094B\u0902 \u0915\u0947 \u0938\u092E\u094D\u092E\u093E\u0928 \u092E\u0947\u0902 \u0905\u0924\u094D\u092F\u0902\u0924 \u0909\u0924\u094D\u0938\u093E\u0939 \u0914\u0930 \u092A\u093F\u0930\u093E\u092E\u093F\u0921 \u092C\u0928\u093E\u0915\u0930 \u0915\u093F\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
    pypSource: "CGSSB Mandi Inspector 2021",
    pypAppearances: [
      { examName: "CGSSB Mandi Inspector", year: 2021 },
      { examName: "CGPSC State Service Prelims", year: 2018 },
      { examName: "CG Vyapam Cultural Officer", year: 2016 }
    ],
    createdAt: "2024-01-20"
  },
  // Questions for CGPSC SSE (2 Marks each, -1/3rd marks negative)
  // 11
  {
    id: "q-psc-01",
    subject: "Chhattisgarh General Studies",
    topic: "History of Chhattisgarh",
    subtopic: "Modern State Formation (2000)",
    difficulty: "Medium",
    category: "CGPSC",
    questionText: "On which date was Chhattisgarh officially carved out of Madhya Pradesh as the 26th State of the Republic of India?",
    questionHindi: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0924\u094C\u0930 \u092A\u0930 \u092E\u0927\u094D\u092F \u092A\u094D\u0930\u0926\u0947\u0936 \u0938\u0947 \u0905\u0932\u0917 \u0939\u094B\u0915\u0930 \u092D\u093E\u0930\u0924 \u0917\u0923\u0930\u093E\u091C\u094D\u092F \u0915\u093E 26\u0935\u093E\u0902 \u0930\u093E\u091C\u094D\u092F \u0915\u093F\u0938 \u0924\u093F\u0925\u093F \u0915\u094B \u092C\u0928\u093E?",
    options: [
      { id: "A", text: "1st November 2000", textHindi: "1 \u0928\u0935\u0902\u092C\u0930 2000" },
      { id: "B", text: "9th November 2000", textHindi: "9 \u0928\u0935\u0902\u092C\u0930 2000" },
      { id: "C", text: "15th November 2000", textHindi: "15 \u0928\u0935\u0902\u092C\u0930 2000" },
      { id: "D", text: "26th January 2001", textHindi: "26 \u091C\u0928\u0935\u0930\u0940 2001" }
    ],
    correctOption: "A",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "Under the Madhya Pradesh Reorganisation Act 2000, Chhattisgarh was established on 1st November 2000 with Raipur as its capital.",
    explanationHindi: "\u092E\u0927\u094D\u092F \u092A\u094D\u0930\u0926\u0947\u0936 \u092A\u0941\u0928\u0930\u094D\u0917\u0920\u0928 \u0905\u0927\u093F\u0928\u093F\u092F\u092E 2000 \u0915\u0947 \u0924\u0939\u0924 1 \u0928\u0935\u0902\u092C\u0930 2000 \u0915\u094B \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C 26\u0935\u0947\u0902 \u0930\u093E\u091C\u094D\u092F \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u0905\u0938\u094D\u0924\u093F\u0924\u094D\u0935 \u092E\u0947\u0902 \u0906\u092F\u093E\u0964",
    pypSource: "CGPSC SSE Prelims 2022",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2022, shift: "General Studies" },
      { examName: "CGSSB Combined Exam", year: 2016 },
      { examName: "CG Vyapam Patwari", year: 2014 }
    ],
    createdAt: "2024-01-21"
  },
  // 12
  {
    id: "q-psc-02",
    subject: "Chhattisgarh General Studies",
    topic: "Geography & Natural Resources",
    subtopic: "Minerals & Industrial Zones",
    difficulty: "Medium",
    category: "CGPSC",
    questionText: "Which district of Chhattisgarh is globally renowned for Bailadila iron ore mines, supplying high-grade hematite?",
    questionHindi: "\u092C\u0948\u0932\u093E\u0921\u0940\u0932\u093E \u0932\u094C\u0939 \u0905\u092F\u0938\u094D\u0915 \u0916\u0926\u093E\u0928\u094B\u0902 \u0915\u0947 \u0932\u093F\u090F \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u093E \u0915\u094C\u0928 \u0938\u093E \u091C\u093F\u0932\u093E \u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u0939\u0948, \u091C\u0939\u093E\u0902 \u0938\u0947 \u0909\u091A\u094D\u091A \u0915\u094B\u091F\u093F \u0915\u093E \u0939\u0947\u092E\u0947\u091F\u093E\u0907\u091F \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u094B\u0924\u093E \u0939\u0948?",
    options: [
      { id: "A", text: "Dantewada", textHindi: "\u0926\u0902\u0924\u0947\u0935\u093E\u0921\u093C\u093E" },
      { id: "B", text: "Korba", textHindi: "\u0915\u094B\u0930\u092C\u093E" },
      { id: "C", text: "Raigarh", textHindi: "\u0930\u093E\u092F\u0917\u0922\u093C" },
      { id: "D", text: "Surguja", textHindi: "\u0938\u0930\u0917\u0941\u091C\u093E" }
    ],
    correctOption: "A",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "Bailadila range in Dantewada district is famous for its massive deposits of top-grade hematite iron ore, exported via Visakhapatnam port by NMDC.",
    explanationHindi: "\u0926\u0902\u0924\u0947\u0935\u093E\u0921\u093C\u093E \u091C\u093F\u0932\u0947 \u0915\u0940 \u092C\u0948\u0932\u093E\u0921\u0940\u0932\u093E \u092A\u0939\u093E\u0921\u093C\u093F\u092F\u094B\u0902 \u092E\u0947\u0902 \u0935\u093F\u0936\u094D\u0935\u0938\u094D\u0924\u0930\u0940\u092F \u0939\u0947\u092E\u0947\u091F\u093E\u0907\u091F \u0932\u094C\u0939 \u0905\u092F\u0938\u094D\u0915 \u092A\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948, \u091C\u093F\u0938\u0915\u093E \u0916\u0928\u0928 NMDC \u0926\u094D\u0935\u093E\u0930\u093E \u0915\u093F\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
    pypSource: "CGPSC SSE Prelims 2023",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2023, shift: "General Studies" },
      { examName: "CGSSB Mining Inspector", year: 2021 },
      { examName: "CG Vyapam Labour Inspector", year: 2018 }
    ],
    createdAt: "2024-01-22"
  },
  // 13
  {
    id: "q-psc-03",
    subject: "Chhattisgarh General Studies",
    topic: "Culture, Tribes & Tourism",
    subtopic: "Tribal Traditions (Gond, Baiga, Maria)",
    difficulty: "Hard",
    category: "CGPSC",
    questionText: 'The traditional "Ghotul" youth dormitory institution is primarily practiced by which tribe of Chhattisgarh?',
    questionHindi: '\u092A\u093E\u0930\u0902\u092A\u0930\u093F\u0915 \u092F\u0941\u0935\u093E \u0917\u0943\u0939 \u0938\u0902\u0938\u094D\u0925\u093E "\u0918\u094B\u091F\u0941\u0932" \u092E\u0941\u0916\u094D\u092F \u0930\u0942\u092A \u0938\u0947 \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u0940 \u0915\u093F\u0938 \u091C\u0928\u091C\u093E\u0924\u093F \u0926\u094D\u0935\u093E\u0930\u093E \u0938\u0902\u091A\u093E\u0932\u093F\u0924 \u0915\u0940 \u091C\u093E\u0924\u0940 \u0939\u0948?',
    options: [
      { id: "A", text: "Muria (Gond sub-tribe)", textHindi: "\u092E\u0941\u0930\u093F\u092F\u093E (\u0917\u094B\u0902\u0921 \u0909\u092A-\u091C\u0928\u091C\u093E\u0924\u093F)" },
      { id: "B", text: "Kamar", textHindi: "\u0915\u092E\u0930" },
      { id: "C", text: "Birhor", textHindi: "\u092C\u093F\u0930\u0939\u094B\u0930" },
      { id: "D", text: "Halba", textHindi: "\u0939\u0932\u092C\u093E" }
    ],
    correctOption: "A",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "The Ghotul is an ancient cultural dormitory system of the Muria tribe of Bastar, documented extensively by anthropologist Verrier Elwin.",
    explanationHindi: "\u0918\u094B\u091F\u0941\u0932 \u092C\u0938\u094D\u0924\u0930 \u0915\u0947 \u092E\u0941\u0930\u093F\u092F\u093E \u0906\u0926\u093F\u0935\u093E\u0938\u093F\u092F\u094B\u0902 \u0915\u093E \u092A\u093E\u0930\u0902\u092A\u0930\u093F\u0915 \u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0935 \u0938\u093E\u0902\u0938\u094D\u0915\u0943\u0924\u093F\u0915 \u092F\u0941\u0935\u093E\u0917\u0943\u0939 \u0939\u0948, \u091C\u093F\u0938\u0915\u093E \u0905\u0927\u094D\u092F\u092F\u0928 \u0935\u0947\u0930\u093F\u092F\u0930 \u090F\u0932\u094D\u0935\u093F\u0928 \u0928\u0947 \u0905\u092A\u0928\u0940 \u092A\u0941\u0938\u094D\u0924\u0915 \u092E\u0947\u0902 \u0915\u093F\u092F\u093E\u0964",
    pypSource: "CGPSC SSE Prelims 2021",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2021 },
      { examName: "CGPSC State Service Mains", year: 2017 },
      { examName: "CGSSB Mandi Inspector", year: 2016 }
    ],
    createdAt: "2024-01-23"
  },
  // 14
  {
    id: "q-psc-04",
    subject: "Chhattisgarh General Studies",
    topic: "History of Chhattisgarh",
    subtopic: "Tribal Revolts & Freedom Struggle",
    difficulty: "Hard",
    category: "CGPSC",
    questionText: 'Who is recognized as the "First Martyr (Pratham Shaheed) of Chhattisgarh" during the 1857 Indian Freedom Struggle?',
    questionHindi: '1857 \u0915\u0947 \u0938\u094D\u0935\u0924\u0902\u0924\u094D\u0930\u0924\u093E \u0938\u0902\u0917\u094D\u0930\u093E\u092E \u092E\u0947\u0902 \u0915\u093F\u0938\u0947 "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u093E \u092A\u094D\u0930\u0925\u092E \u0936\u0939\u0940\u0926" \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948?',
    options: [
      { id: "A", text: "Veer Narayan Singh (Sonakhan)", textHindi: "\u0935\u0940\u0930 \u0928\u093E\u0930\u093E\u092F\u0923 \u0938\u093F\u0902\u0939 (\u0938\u094B\u0928\u093E\u0916\u093E\u0928)" },
      { id: "B", text: "Hanuman Singh (Raipur Sepoy Mutiny)", textHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u0938\u093F\u0902\u0939" },
      { id: "C", text: "Surendra Sai", textHindi: "\u0938\u0941\u0930\u0947\u0902\u0926\u094D\u0930 \u0938\u093E\u092F" },
      { id: "D", text: "Kalyan Sahai", textHindi: "\u0915\u0932\u094D\u092F\u093E\u0923 \u0938\u0939\u093E\u092F" }
    ],
    correctOption: "A",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "Veer Narayan Singh, the landlord of Sonakhan, distributed grain to starving peasants and fought the British. He was executed in Raipur on 10 December 1857.",
    explanationHindi: "\u0938\u094B\u0928\u093E\u0916\u093E\u0928 \u0915\u0947 \u091C\u092E\u0940\u0902\u0926\u093E\u0930 \u0935\u0940\u0930 \u0928\u093E\u0930\u093E\u092F\u0923 \u0938\u093F\u0902\u0939 \u0915\u094B \u0905\u0915\u093E\u0932 \u092A\u0940\u0921\u093C\u093F\u0924\u094B\u0902 \u0915\u0940 \u0938\u0939\u093E\u092F\u0924\u093E \u0935 \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940 \u0939\u0941\u0915\u0942\u092E\u0924 \u0938\u0947 \u092C\u0917\u093E\u0935\u0924 \u0915\u0947 \u0915\u093E\u0930\u0923 10 \u0926\u093F\u0938\u0902\u092C\u0930 1857 \u0915\u094B \u0930\u093E\u092F\u092A\u0941\u0930 \u0915\u0947 \u091C\u092F\u0938\u094D\u0924\u0902\u092D \u091A\u094C\u0915 \u092A\u0930 \u092B\u093E\u0902\u0938\u0940 \u0926\u0940 \u0917\u0908 \u0925\u0940\u0964",
    pypSource: "CGPSC SSE Prelims 2023",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2023 },
      { examName: "CGSSB Patwari", year: 2022 },
      { examName: "CG Police Sub-Inspector (SI)", year: 2018 },
      { examName: "CG Vyapam Revenue Inspector", year: 2015 }
    ],
    createdAt: "2024-01-24"
  },
  // 15
  {
    id: "q-psc-05",
    subject: "Chhattisgarh General Studies",
    topic: "Administration & Economy",
    subtopic: "State Budget & Welfare Schemes",
    difficulty: "Medium",
    category: "CGPSC",
    questionText: 'Under the "Rajiv Gandhi Kisan Nyay Yojana" and subsequently upgraded farmer schemes in Chhattisgarh, what major cash incentive is provided for paddy procurement?',
    questionHindi: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u092E\u0947\u0902 \u0915\u0943\u0937\u0915 \u0915\u0932\u094D\u092F\u093E\u0923 \u092F\u094B\u091C\u0928\u093E\u0913\u0902 \u0915\u0947 \u0924\u0939\u0924 \u0927\u093E\u0928 \u0916\u0930\u0940\u0926\u0940 \u092A\u0930 \u0915\u093F\u0938\u093E\u0928\u094B\u0902 \u0915\u094B \u0915\u094C\u0928 \u0938\u093E \u092A\u094D\u0930\u092E\u0941\u0916 \u092A\u094D\u0930\u094B\u0924\u094D\u0938\u093E\u0939\u0928 \u092A\u094D\u0930\u0926\u093E\u0928 \u0915\u093F\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
    options: [
      { id: "A", text: "Input subsidy and guaranteed support price per quintal", textHindi: "\u092A\u094D\u0930\u0924\u093F \u0915\u094D\u0935\u093F\u0902\u091F\u0932 \u0907\u0928\u092A\u0941\u091F \u0938\u092C\u094D\u0938\u093F\u0921\u0940 \u090F\u0935\u0902 \u0938\u0941\u0928\u093F\u0936\u094D\u091A\u093F\u0924 \u0938\u092E\u0930\u094D\u0925\u0928 \u092E\u0942\u0932\u094D\u092F (3100 \u0930\u0941/\u0915\u094D\u0935\u093F\u0902\u091F\u0932)" },
      { id: "B", text: "Free tractor distribution every 3 years", textHindi: "\u092A\u094D\u0930\u0924\u094D\u092F\u0947\u0915 3 \u0935\u0930\u094D\u0937 \u092E\u0947\u0902 \u0928\u093F\u0936\u0941\u0932\u094D\u0915 \u091F\u094D\u0930\u0948\u0915\u094D\u091F\u0930 \u0935\u093F\u0924\u0930\u0923" },
      { id: "C", text: "100% tax rebate on luxury goods", textHindi: "\u0935\u093F\u0932\u093E\u0938\u093F\u0924\u093E \u0915\u0930 \u092E\u0947\u0902 100% \u091B\u0942\u091F" },
      { id: "D", text: "Free solar pumps to all non-farmers", textHindi: "\u0917\u0948\u0930-\u0915\u093F\u0938\u093E\u0928\u094B\u0902 \u0915\u094B \u0938\u094B\u0932\u0930 \u092A\u0902\u092A" }
    ],
    correctOption: "A",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "Chhattisgarh provides historic minimum guaranteed support and input subsidy (Krishak Unnati / Nyay Yojana) ensuring farmers receive premium prices per quintal of paddy.",
    explanationHindi: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u092E\u0947\u0902 \u0927\u093E\u0928 \u0909\u0924\u094D\u092A\u093E\u0926\u0915 \u0915\u093F\u0938\u093E\u0928\u094B\u0902 \u0915\u094B \u0926\u0947\u0936 \u092E\u0947\u0902 \u0938\u0930\u094D\u0935\u093E\u0927\u093F\u0915 \u0938\u092E\u0930\u094D\u0925\u0928 \u092E\u0942\u0932\u094D\u092F \u0935 \u0907\u0928\u092A\u0941\u091F \u0938\u0939\u093E\u092F\u0924\u093E \u092A\u094D\u0930\u0926\u093E\u0928 \u0915\u0940 \u091C\u093E\u0924\u0940 \u0939\u0948\u0964",
    pypSource: "CGPSC SSE Prelims 2022",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2022 },
      { examName: "CGSSB Rural Agriculture Extension Officer", year: 2021 }
    ],
    createdAt: "2024-01-25"
  },
  // 16
  {
    id: "q-psc-06",
    subject: "Quantitative Aptitude",
    topic: "Quantitative Aptitude",
    subtopic: "Percentages & Profit-Loss",
    difficulty: "Medium",
    category: "CGPSC",
    questionText: "A merchant purchases rice at \u20B92500 per quintal and sells it at \u20B93100 per quintal. What is his percentage profit?",
    questionHindi: "\u090F\u0915 \u0935\u094D\u092F\u093E\u092A\u093E\u0930\u0940 \u20B92500 \u092A\u094D\u0930\u0924\u093F \u0915\u094D\u0935\u093F\u0902\u091F\u0932 \u0915\u0940 \u0926\u0930 \u0938\u0947 \u0927\u093E\u0928 \u0916\u0930\u0940\u0926\u0915\u0930 \u20B93100 \u092A\u094D\u0930\u0924\u093F \u0915\u094D\u0935\u093F\u0902\u091F\u0932 \u092A\u0930 \u092C\u0947\u091A\u0924\u093E \u0939\u0948\u0964 \u0909\u0938\u0915\u093E \u0932\u093E\u092D \u092A\u094D\u0930\u0924\u093F\u0936\u0924 \u0915\u094D\u092F\u093E \u0939\u0948?",
    options: [
      { id: "A", text: "20%", textHindi: "20%" },
      { id: "B", text: "24%", textHindi: "24%" },
      { id: "C", text: "25%", textHindi: "25%" },
      { id: "D", text: "30%", textHindi: "30%" }
    ],
    correctOption: "B",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "Profit = \u20B93100 - \u20B92500 = \u20B9600. Percentage Profit = (600 / 2500) * 100 = 24%.",
    explanationHindi: "\u0932\u093E\u092D = 3100 - 2500 = 600 \u0930\u0941\u092A\u092F\u0947\u0964 \u0932\u093E\u092D % = (600 / 2500) \xD7 100 = 24%.",
    pypSource: "CGPSC CSAT 2022",
    pypAppearances: [
      { examName: "CGPSC SSE Paper-II (CSAT)", year: 2022 },
      { examName: "CGSSB Combined Exam", year: 2020 }
    ],
    createdAt: "2024-01-26"
  },
  // 17
  {
    id: "q-psc-07",
    subject: "Chhattisgarh General Studies",
    topic: "Geography & Natural Resources",
    subtopic: "Forests & National Parks",
    difficulty: "Medium",
    category: "CGPSC",
    questionText: "Which is the only National Park in Chhattisgarh that is home to the endangered Bastar Hill Myna, the State Bird of Chhattisgarh?",
    questionHindi: '\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u093E \u0915\u094C\u0928 \u0938\u093E \u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0909\u0926\u094D\u092F\u093E\u0928 \u0930\u093E\u091C\u094D\u092F \u092A\u0915\u094D\u0937\u0940 "\u092A\u0939\u093E\u0921\u093C\u0940 \u092E\u0948\u0928\u093E" \u0915\u093E \u092A\u094D\u0930\u093E\u0915\u0943\u0924\u093F\u0915 \u0938\u0902\u0930\u0915\u094D\u0937\u0923 \u0915\u0947\u0902\u0926\u094D\u0930 \u0939\u0948?',
    options: [
      { id: "A", text: "Kanger Valley National Park", textHindi: "\u0915\u093E\u0902\u0917\u0947\u0930 \u0918\u093E\u091F\u0940 \u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0909\u0926\u094D\u092F\u093E\u0928" },
      { id: "B", text: "Guru Ghasidas National Park", textHindi: "\u0917\u0941\u0930\u0941 \u0918\u093E\u0938\u0940\u0926\u093E\u0938 \u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0909\u0926\u094D\u092F\u093E\u0928" },
      { id: "C", text: "Indravati National Park", textHindi: "\u0907\u0902\u0926\u094D\u0930\u093E\u0935\u0924\u0940 \u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0909\u0926\u094D\u092F\u093E\u0928" },
      { id: "D", text: "Barnawapara Wildlife Sanctuary", textHindi: "\u092C\u093E\u0930\u0928\u0935\u093E\u092A\u093E\u0930\u093E \u0935\u0928\u094D\u092F\u091C\u0940\u0935 \u0905\u092D\u092F\u093E\u0930\u0923\u094D\u092F" }
    ],
    correctOption: "A",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "Kanger Valley National Park in Bastar district is the prime habitat and conservation sanctuary for the Bastar Hill Myna (Gracula religiosa peninsularis).",
    explanationHindi: "\u0915\u093E\u0902\u0917\u0947\u0930 \u0918\u093E\u091F\u0940 \u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0909\u0926\u094D\u092F\u093E\u0928 (\u092C\u0938\u094D\u0924\u0930) \u092E\u0947\u0902 \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u093E \u0930\u093E\u091C\u0915\u0940\u092F \u092A\u0915\u094D\u0937\u0940 \u092A\u0939\u093E\u0921\u093C\u0940 \u092E\u0948\u0928\u093E \u0938\u0941\u0930\u0915\u094D\u0937\u093F\u0924 \u0935\u093E\u0924\u093E\u0935\u0930\u0923 \u092E\u0947\u0902 \u092A\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
    pypSource: "CGPSC SSE Prelims 2021",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2021 },
      { examName: "CG Vyapam Forest Guard", year: 2019 },
      { examName: "CGSSB Assistant Conservator of Forest", year: 2017 }
    ],
    createdAt: "2024-01-27"
  },
  // 18
  {
    id: "q-psc-08",
    subject: "General Hindi",
    topic: "Samanya Hindi",
    subtopic: "Sandhi & Samas",
    difficulty: "Medium",
    category: "CGPSC",
    questionText: 'What is the correct Sandhi-Vichhed of the word "\u092F\u0926\u094D\u092F\u092A\u093F" (Yadyapi)?',
    questionHindi: '"\u092F\u0926\u094D\u092F\u092A\u093F" \u0936\u092C\u094D\u0926 \u0915\u093E \u0938\u0939\u0940 \u0938\u0902\u0927\u093F-\u0935\u093F\u091A\u094D\u091B\u0947\u0926 \u0915\u094D\u092F\u093E \u0939\u094B\u0917\u093E?',
    options: [
      { id: "A", text: "\u092F\u0926\u093F + \u0905\u092A\u093F (Yan Sandhi)", textHindi: "\u092F\u0926\u093F + \u0905\u092A\u093F (\u092F\u0923 \u0938\u0902\u0927\u093F)" },
      { id: "B", text: "\u092F\u0926 + \u092F\u092A\u093F", textHindi: "\u092F\u0926 + \u092F\u092A\u093F" },
      { id: "C", text: "\u092F\u0926\u094D\u092F\u093E + \u0905\u092A\u093F", textHindi: "\u092F\u0926\u094D\u092F\u093E + \u0905\u092A\u093F" },
      { id: "D", text: "\u092F\u0926\u094D\u092F + \u0905\u092A\u093F", textHindi: "\u092F\u0926\u094D\u092F + \u0905\u092A\u093F" }
    ],
    correctOption: "A",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "\u0907/\u0908 + \u092D\u093F\u0928\u094D\u0928 \u0938\u094D\u0935\u0930 = \u092F\u094D (\u092F\u0923 \u0938\u0902\u0927\u093F). Hence \u092F\u0926\u093F + \u0905\u092A\u093F = \u092F\u0926\u094D\u092F\u092A\u093F.",
    explanationHindi: "\u092F\u0923 \u0938\u094D\u0935\u0930 \u0938\u0902\u0927\u093F \u0915\u0947 \u0928\u093F\u092F\u092E\u093E\u0928\u0941\u0938\u093E\u0930 \u092F\u0926\u093F + \u0905\u092A\u093F = \u092F\u0926\u094D\u092F\u092A\u093F (\u0907 + \u0905 = \u092F).",
    pypSource: "CGPSC SSE Mains/Prelims 2022",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-II", year: 2022 },
      { examName: "CGSSB Teacher Recruitment", year: 2019 }
    ],
    createdAt: "2024-01-28"
  },
  // 19
  {
    id: "q-psc-09",
    subject: "Child Pedagogy & Teaching Methodology",
    topic: "Pedagogy & Curriculum",
    subtopic: "National Education Policy 2020",
    difficulty: "Easy",
    category: "SWAMI_ATMANAND",
    questionText: "Under the National Education Policy (NEP) 2020, what is the new pedagogical curricular structure replacing the 10+2 system?",
    questionHindi: "\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0936\u093F\u0915\u094D\u0937\u093E \u0928\u0940\u0924\u093F (NEP) 2020 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 10+2 \u092A\u094D\u0930\u0923\u093E\u0932\u0940 \u0915\u0947 \u0938\u094D\u0925\u093E\u0928 \u092A\u0930 \u0928\u092F\u093E \u0936\u0948\u0915\u094D\u0937\u0923\u093F\u0915 \u0922\u093E\u0902\u091A\u093E \u0915\u094D\u092F\u093E \u0939\u0948?",
    options: [
      { id: "A", text: "5 + 3 + 3 + 4", textHindi: "5 + 3 + 3 + 4" },
      { id: "B", text: "5 + 4 + 3 + 2", textHindi: "5 + 4 + 3 + 2" },
      { id: "C", text: "4 + 3 + 3 + 5", textHindi: "4 + 3 + 3 + 5" },
      { id: "D", text: "3 + 3 + 4 + 5", textHindi: "3 + 3 + 4 + 5" }
    ],
    correctOption: "A",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "NEP 2020 introduces the 5+3+3+4 structure corresponding to Foundational (5 yrs), Preparatory (3 yrs), Middle (3 yrs), and Secondary (4 yrs) stages.",
    explanationHindi: "NEP 2020 \u092E\u0947\u0902 5+3+3+4 \u092A\u094D\u0930\u0923\u093E\u0932\u0940 \u0932\u093E\u0917\u0942 \u0915\u0940 \u0917\u0908 \u0939\u0948 (\u092C\u0941\u0928\u093F\u092F\u093E\u0926\u0940 5 \u0935\u0930\u094D\u0937, \u092A\u094D\u0930\u093E\u0930\u0902\u092D\u093F\u0915 3 \u0935\u0930\u094D\u0937, \u092E\u093E\u0927\u094D\u092F\u092E\u093F\u0915 3 \u0935\u0930\u094D\u0937, \u0909\u091A\u094D\u091A\u0924\u0930 \u092E\u093E\u0927\u094D\u092F\u092E\u093F\u0915 4 \u0935\u0930\u094D\u0937)\u0964",
    pypSource: "Swami Atmanand Teacher Recruitment 2022",
    pypAppearances: [
      { examName: "Swami Atmanand Teacher Recruitment", year: 2022 },
      { examName: "CG TET (Teacher Eligibility Test) Paper-II", year: 2023 }
    ],
    createdAt: "2024-01-29"
  },
  // 20
  {
    id: "q-psc-10",
    subject: "Child Pedagogy & Teaching Methodology",
    topic: "Educational Psychology",
    subtopic: "Learning Theories (Piaget, Vygotsky)",
    difficulty: "Medium",
    category: "SWAMI_ATMANAND",
    questionText: 'The concept of "Zone of Proximal Development" (ZPD) was formulated by which renowned educational psychologist?',
    questionHindi: '"\u0938\u092E\u0940\u092A\u0938\u094D\u0925 \u0935\u093F\u0915\u093E\u0938 \u0915\u093E \u0915\u094D\u0937\u0947\u0924\u094D\u0930" (ZPD - Zone of Proximal Development) \u0915\u093E \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u0915\u093F\u0938 \u092E\u0928\u094B\u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0926\u094D\u0935\u093E\u0930\u093E \u092A\u094D\u0930\u0924\u093F\u092A\u093E\u0926\u093F\u0924 \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u0925\u093E?',
    options: [
      { id: "A", text: "Lev Vygotsky", textHindi: "\u0932\u0947\u0935 \u0935\u093E\u092F\u0917\u094B\u0924\u094D\u0938\u094D\u0915\u0940" },
      { id: "B", text: "Jean Piaget", textHindi: "\u091C\u0940\u0928 \u092A\u093F\u092F\u093E\u091C\u0947" },
      { id: "C", text: "B.F. Skinner", textHindi: "\u092C\u0940.\u090F\u092B. \u0938\u094D\u0915\u093F\u0928\u0930" },
      { id: "D", text: "Jerome Bruner", textHindi: "\u091C\u0947\u0930\u094B\u092E \u092C\u094D\u0930\u0942\u0928\u0930" }
    ],
    correctOption: "A",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Lev Vygotsky developed ZPD, defining the difference between what a learner can do without help and what they can achieve with guidance (scaffolding).",
    explanationHindi: "\u0932\u0947\u0935 \u0935\u093E\u092F\u0917\u094B\u0924\u094D\u0938\u094D\u0915\u0940 \u0928\u0947 ZPD \u0914\u0930 \u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0905\u0902\u0924\u0903\u0915\u094D\u0930\u093F\u092F\u093E \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u0926\u093F\u092F\u093E, \u091C\u093F\u0938\u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092C\u091A\u094D\u091A\u093E \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0915 (MKO) \u0915\u0940 \u0938\u0939\u093E\u092F\u0924\u093E \u0938\u0947 \u0938\u0940\u0916\u0924\u093E \u0939\u0948\u0964",
    pypSource: "Swami Atmanand Lecturer Exam 2023",
    pypAppearances: [
      { examName: "Swami Atmanand English Medium Teacher Recruitment", year: 2023 },
      { examName: "CG TET Primary & Upper Primary", year: 2022 },
      { examName: "Central CTET Paper-II", year: 2021 }
    ],
    createdAt: "2024-01-30"
  },
  // 21 - India General Studies (Polity)
  {
    id: "q-ind-01",
    subject: "India General Studies",
    topic: "Indian Polity & Constitution",
    subtopic: "Fundamental Rights & Duties",
    difficulty: "Medium",
    category: "CGPSC",
    questionText: "Under which Article of the Constitution of India can a citizen move directly to the Supreme Court for enforcement of Fundamental Rights?",
    questionHindi: "\u092D\u093E\u0930\u0924\u0940\u092F \u0938\u0902\u0935\u093F\u0927\u093E\u0928 \u0915\u0947 \u0915\u093F\u0938 \u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 \u0915\u0947 \u0924\u0939\u0924 \u0915\u094B\u0908 \u0928\u093E\u0917\u0930\u093F\u0915 \u092E\u094C\u0932\u093F\u0915 \u0905\u0927\u093F\u0915\u093E\u0930\u094B\u0902 \u0915\u0947 \u092A\u094D\u0930\u0935\u0930\u094D\u0924\u0928 \u0915\u0947 \u0932\u093F\u090F \u0938\u0940\u0927\u0947 \u0938\u0930\u094D\u0935\u094B\u091A\u094D\u091A \u0928\u094D\u092F\u093E\u092F\u093E\u0932\u092F \u091C\u093E \u0938\u0915\u0924\u093E \u0939\u0948?",
    options: [
      { id: "A", text: "Article 19", textHindi: "\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 19" },
      { id: "B", text: "Article 21", textHindi: "\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 21" },
      { id: "C", text: "Article 32", textHindi: "\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 32" },
      { id: "D", text: "Article 226", textHindi: "\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 226" }
    ],
    correctOption: "C",
    marks: 2,
    negativeMarks: 0.667,
    explanation: 'Article 32 provides the Right to Constitutional Remedies, allowing citizens to move the Supreme Court via writs (Habeas Corpus, Mandamus, etc.). Dr. B.R. Ambedkar termed it the "Heart and Soul" of the Constitution.',
    explanationHindi: '\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926 32 \u0915\u094B \u0921\u0949. \u092D\u0940\u092E\u0930\u093E\u0935 \u0906\u0902\u092C\u0947\u0921\u0915\u0930 \u0928\u0947 \u0938\u0902\u0935\u093F\u0927\u093E\u0928 \u0915\u0940 "\u0906\u0924\u094D\u092E\u093E \u0914\u0930 \u0939\u0943\u0926\u092F" \u0915\u0939\u093E \u0925\u093E, \u091C\u093F\u0938\u0915\u0947 \u0924\u0939\u0924 \u092E\u094C\u0932\u093F\u0915 \u0905\u0927\u093F\u0915\u093E\u0930\u094B\u0902 \u0915\u0947 \u0909\u0932\u094D\u0932\u0902\u0918\u0928 \u092A\u0930 \u0938\u0930\u094D\u0935\u094B\u091A\u094D\u091A \u0928\u094D\u092F\u093E\u092F\u093E\u0932\u092F \u0930\u093F\u091F \u091C\u093E\u0930\u0940 \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0948\u0964',
    pypSource: "CGPSC SSE Prelims 2023",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2023 },
      { examName: "CGPSC State Service Prelims", year: 2019 }
    ],
    createdAt: "2024-02-01"
  },
  // 22 - India General Studies (History)
  {
    id: "q-ind-02",
    subject: "India General Studies",
    topic: "Indian History & National Movement",
    subtopic: "1857 Revolt & Freedom Struggle",
    difficulty: "Medium",
    category: "CGPSC",
    questionText: "From which cantonment town did the historic Revolt of 1857 officially begin on 10th May 1857?",
    questionHindi: "10 \u092E\u0908 1857 \u0915\u094B 1857 \u0915\u0940 \u0910\u0924\u093F\u0939\u093E\u0938\u093F\u0915 \u0915\u094D\u0930\u093E\u0902\u0924\u093F \u0915\u0940 \u0936\u0941\u0930\u0941\u0906\u0924 \u0914\u092A\u091A\u093E\u0930\u093F\u0915 \u0930\u0942\u092A \u0938\u0947 \u0915\u093F\u0938 \u091B\u093E\u0935\u0928\u0940 \u0938\u0947 \u0939\u0941\u0908 \u0925\u0940?",
    options: [
      { id: "A", text: "Barrackpore", textHindi: "\u092C\u0948\u0930\u0915\u092A\u0941\u0930" },
      { id: "B", text: "Meerut", textHindi: "\u092E\u0947\u0930\u0920" },
      { id: "C", text: "Delhi", textHindi: "\u0926\u093F\u0932\u094D\u0932\u0940" },
      { id: "D", text: "Kanpur", textHindi: "\u0915\u093E\u0928\u092A\u0941\u0930" }
    ],
    correctOption: "B",
    marks: 2,
    negativeMarks: 0.667,
    explanation: "Although Mangal Pandey rebelled in Barrackpore in March 1857, the widespread organized mutiny erupted from Meerut on 10 May 1857 when sepoys marched to Delhi.",
    explanationHindi: "10 \u092E\u0908 1857 \u0915\u094B \u092E\u0947\u0930\u0920 \u091B\u093E\u0935\u0928\u0940 \u0915\u0947 \u0938\u0948\u0928\u093F\u0915\u094B\u0902 \u0928\u0947 \u0916\u0941\u0932\u093E \u0935\u093F\u0926\u094D\u0930\u094B\u0939 \u0915\u0930 \u0926\u093F\u0932\u094D\u0932\u0940 \u0915\u0940 \u0913\u0930 \u0915\u0942\u091A \u0915\u093F\u092F\u093E \u0925\u093E\u0964",
    pypSource: "CGPSC SSE Prelims 2022",
    pypAppearances: [
      { examName: "CGPSC SSE Prelims Paper-I", year: 2022 },
      { examName: "CG Vyapam Combined Exam", year: 2018 }
    ],
    createdAt: "2024-02-02"
  },
  // 23 - General Science (Biology)
  {
    id: "q-sci-01",
    subject: "General Science",
    topic: "Biology & Environmental Ecology",
    subtopic: "Cell Biology & Genetics",
    difficulty: "Easy",
    category: "CGSSB",
    questionText: 'Which organelle is universally known as the "Powerhouse of the Cell"?',
    questionHindi: '\u0915\u094B\u0936\u093F\u0915\u093E \u0915\u093E "\u0935\u093F\u0926\u094D\u092F\u0941\u0924 \u0917\u0943\u0939" \u092F\u093E "\u092A\u093E\u0935\u0930 \u0939\u093E\u0909\u0938" (Powerhouse of the Cell) \u0915\u093F\u0938\u0947 \u0915\u0939\u093E \u091C\u093E\u0924\u093E \u0939\u0948?',
    options: [
      { id: "A", text: "Ribosome", textHindi: "\u0930\u093E\u0907\u092C\u094B\u0938\u094B\u092E" },
      { id: "B", text: "Mitochondria", textHindi: "\u092E\u093E\u0907\u091F\u094B\u0915\u0949\u0928\u094D\u0921\u094D\u0930\u093F\u092F\u093E" },
      { id: "C", text: "Golgi Apparatus", textHindi: "\u0917\u0949\u0932\u094D\u091C\u0940 \u0915\u093E\u092F" },
      { id: "D", text: "Lysosome", textHindi: "\u0932\u093E\u0907\u0938\u094B\u0938\u094B\u092E" }
    ],
    correctOption: "B",
    marks: 1,
    negativeMarks: 0.333,
    explanation: "Mitochondria generate most of the chemical energy needed to power the biochemical reactions of the cell in the form of ATP (Adenosine Triphosphate).",
    explanationHindi: "\u092E\u093E\u0907\u091F\u094B\u0915\u0949\u0928\u094D\u0921\u094D\u0930\u093F\u092F\u093E \u092E\u0947\u0902 \u0915\u094B\u0936\u093F\u0915\u0940\u092F \u0936\u094D\u0935\u0938\u0928 \u0926\u094D\u0935\u093E\u0930\u093E ATP \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u090A\u0930\u094D\u091C\u093E \u0909\u0924\u094D\u092A\u0928\u094D\u0928 \u0939\u094B\u0924\u0940 \u0939\u0948, \u0907\u0938\u0932\u093F\u090F \u0907\u0938\u0947 \u0915\u094B\u0936\u093F\u0915\u093E \u0915\u093E \u092A\u093E\u0935\u0930\u0939\u093E\u0909\u0938 \u0915\u0939\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
    pypSource: "CGSSB Patwari 2022",
    pypAppearances: [
      { examName: "CGSSB Patwari Exam", year: 2022 },
      { examName: "CG Police Constable", year: 2021 }
    ],
    createdAt: "2024-02-03"
  }
];
var INITIAL_MOCK_TESTS = [
  // 1. CGSSB > Teacher Recruitment 2026 > CG Lecturer 2026 > CG English Lecturer 2026 > CG English Lecturer 2026 Mock Test 8
  {
    id: "test-cg-lecturer-english-08",
    title: "CG English Lecturer 2026 Mock Test 8",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Teacher Recruitment 2026",
    postName: "CG Lecturer 2026",
    examName: "CG English Lecturer 2026",
    description: "Comprehensive CG Vyapam School Education Cadre Lecturer (Vyakhyata English) simulated paper covering General Studies, Educational Psychology, General English Grammar, and Literature.",
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-eng-pedagogy",
        name: "Part A: Educational Psychology & Pedagogy",
        questionIds: ["q-psc-09", "q-psc-10", "q-cg-04"]
      },
      {
        id: "sec-eng-cg-gk",
        name: "Part B: CG General Knowledge & Language",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-cg-07", "q-cg-08", "q-cg-10"]
      },
      {
        id: "sec-eng-core",
        name: "Part C: English Core & Reasoning",
        questionIds: ["q-cg-05", "q-cg-06", "q-cg-09", "q-psc-01"]
      }
    ],
    questionCount: 10,
    attemptsCount: 1840,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-01"
  },
  // 2. CGSSB > Teacher Recruitment 2026 > CG Lecturer 2026 > CG Physics Lecturer 2026
  {
    id: "test-cg-lecturer-physics-01",
    title: "CG Physics Lecturer 2026 Mock Test 1",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Teacher Recruitment 2026",
    postName: "CG Lecturer 2026",
    examName: "CG Physics Lecturer 2026",
    description: "Specialized subject test for CG School Education Department Physics Lecturer recruitment covering Mechanics, Electromagnetism, Modern Physics, and State GK.",
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-phys-core",
        name: "Part A: Physics Subject Core",
        questionIds: ["q-psc-06", "q-psc-07", "q-psc-08", "q-cg-05"]
      },
      {
        id: "sec-phys-gk",
        name: "Part B: General Studies & Pedagogy",
        questionIds: ["q-cg-01", "q-cg-02", "q-psc-09", "q-psc-10", "q-cg-06", "q-cg-07"]
      }
    ],
    questionCount: 10,
    attemptsCount: 1120,
    passingPercentage: 45,
    isPublished: true,
    createdAt: "2026-03-02"
  },
  // 3. CGSSB > Teacher Recruitment 2026 > CG Teacher 2026 > CG Shikshak (Teacher) Paper-II 2026
  {
    id: "test-cg-shikshak-paper2-01",
    title: "CG Shikshak (Teacher) Paper-II 2026 Mock Test 1",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Teacher Recruitment 2026",
    postName: "CG Teacher 2026",
    examName: "CG Shikshak (Teacher) Paper-II 2026",
    description: "Targeted mock test for Middle School Cadre Teacher Recruitment with child development, pedagogical skills, Hindi, and general sciences.",
    durationMinutes: 150,
    totalMarks: 150,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-shikshak-pedagogy",
        name: "Child Development & Pedagogy",
        questionIds: ["q-psc-09", "q-psc-10", "q-cg-04", "q-cg-05"]
      },
      {
        id: "sec-shikshak-subject",
        name: "General Studies & Science/Maths",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-cg-06", "q-cg-07", "q-cg-08"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2980,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-03"
  },
  // 4. CGSSB > Hostel Warden (छात्रावास अधीक्षक) - 100 Marks Pattern
  {
    id: "test-cgssb-warden-01",
    title: "CG Vyapam Hostel Warden (\u091B\u093E\u0924\u094D\u0930\u093E\u0935\u093E\u0938 \u0905\u0927\u0940\u0915\u094D\u0937\u0915) Official Pattern Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Hostel Warden (\u091B\u093E\u0924\u094D\u0930\u093E\u0935\u093E\u0938 \u0905\u0927\u0940\u0915\u094D\u0937\u0915)",
    postName: "Hostel Superintendent Grade-D",
    examName: "CG Hostel Warden (\u091B\u093E\u0924\u094D\u0930\u093E\u0935\u093E\u0938 \u0905\u0927\u0940\u0915\u094D\u0937\u0915) Exam 2024",
    description: "Aligned strictly with the official CG Vyapam Hostel Warden syllabus: Part A Computer Knowledge (30 Marks, min 50% qualifying) + Part B [Hindi (5M) + English (5M) + Maths (25M) + Indian GS (15M) + CG GK (5M) + Current Affairs (5M) + Child Psychology (10M)] = 100 Marks (+1.0 / -0.25).",
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-warden-computer",
        name: "\u092D\u093E\u0917 \u0905: \u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 \u0938\u0902\u092C\u0902\u0927\u0940 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 (30 Marks - 50% \u0905\u0928\u093F\u0935\u093E\u0930\u094D\u092F)",
        questionIds: ["q-cg-04", "q-cg-05"]
      },
      {
        id: "sec-warden-hindi",
        name: "\u092D\u093E\u0917 \u092C: \u0939\u093F\u0928\u094D\u0926\u0940 \u0935\u094D\u092F\u093E\u0915\u0930\u0923 (5 Marks)",
        questionIds: ["q-cg-06"]
      },
      {
        id: "sec-warden-english",
        name: "\u092D\u093E\u0917 \u092C: \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940 (5 Marks)",
        questionIds: ["q-cg-09"]
      },
      {
        id: "sec-warden-maths",
        name: "\u092D\u093E\u0917 \u092C: \u0917\u0923\u093F\u0924 (25 Marks)",
        questionIds: ["q-psc-06"]
      },
      {
        id: "sec-warden-indiags",
        name: "\u092D\u093E\u0917 \u092C: \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 - \u092D\u093E\u0930\u0924 (15 Marks)",
        questionIds: ["q-psc-07", "q-psc-08"]
      },
      {
        id: "sec-warden-cggk",
        name: "\u092D\u093E\u0917 \u092C: \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u0940 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u093E\u0928\u0915\u093E\u0930\u0940 (5 Marks)",
        questionIds: ["q-cg-01", "q-cg-02"]
      },
      {
        id: "sec-warden-current",
        name: "\u092D\u093E\u0917 \u092C: \u0938\u092E\u0938\u093E\u092E\u092F\u093F\u0915 \u0918\u091F\u0928\u093E\u0915\u094D\u0930\u092E \u0935 \u0916\u0947\u0932\u0915\u0942\u0926 (5 Marks)",
        questionIds: ["q-cg-03"]
      },
      {
        id: "sec-warden-cdp",
        name: "\u092D\u093E\u0917 \u092C: \u092C\u093E\u0932 \u092E\u0928\u094B\u0935\u093F\u091C\u094D\u091E\u093E\u0928 (10 Marks)",
        questionIds: ["q-psc-09", "q-psc-10"]
      }
    ],
    questionCount: 10,
    attemptsCount: 3420,
    passingPercentage: 45,
    isPublished: true,
    createdAt: "2024-02-01"
  },
  // 4b. CGSSB > Patwari Selection Exam (150 Marks Pattern)
  {
    id: "test-cgssb-patwari-01",
    title: "CGSSB Patwari Selection Exam Official 150-Marks Full Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Patwari & Revenue Inspector (RI)",
    postName: "CG Patwari 2024",
    examName: "CGSSB Patwari Recruitment Exam 2024",
    description: "Official CG Vyapam Patwari Marks Distribution: Computer (20M) + Hindi (10M) + English (10M) + Mathematics (30M) + Mental Ability/Reasoning (15M) + Indian GS (35M) + Current Affairs (15M) + CG GK (15M) = 150 Marks (+1.0 / -0.33).",
    durationMinutes: 180,
    totalMarks: 150,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.333,
    sections: [
      {
        id: "sec-patwari-computer",
        name: "\u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 \u0938\u0902\u092C\u0902\u0927\u0940 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 (20 Marks)",
        questionIds: ["q-cg-04"]
      },
      {
        id: "sec-patwari-hindi",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0939\u093F\u0928\u094D\u0926\u0940 \u0935\u094D\u092F\u093E\u0915\u0930\u0923 (10 Marks)",
        questionIds: ["q-cg-05"]
      },
      {
        id: "sec-patwari-english",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940 (10 Marks)",
        questionIds: ["q-cg-09"]
      },
      {
        id: "sec-patwari-maths",
        name: "\u0917\u0923\u093F\u0924 (30 Marks)",
        questionIds: ["q-psc-06"]
      },
      {
        id: "sec-patwari-reasoning",
        name: "\u0924\u0930\u094D\u0915\u0936\u0915\u094D\u0924\u093F \u090F\u0935\u0902 \u092E\u093E\u0928\u0938\u093F\u0915 \u092F\u094B\u0917\u094D\u092F\u0924\u093E (15 Marks)",
        questionIds: ["q-cg-06"]
      },
      {
        id: "sec-patwari-indiags",
        name: "\u092D\u093E\u0930\u0924\u0940\u092F \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 (35 Marks)",
        questionIds: ["q-psc-07", "q-psc-08"]
      },
      {
        id: "sec-patwari-current",
        name: "\u0938\u092E\u0938\u093E\u092E\u092F\u093F\u0915 \u0918\u091F\u0928\u093E\u0915\u094D\u0930\u092E \u0935 \u0916\u0947\u0932\u0915\u0942\u0926 (15 Marks)",
        questionIds: ["q-cg-03"]
      },
      {
        id: "sec-patwari-cggk",
        name: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u093E \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 (15 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-07"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2850,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2024-02-02"
  },
  // 4c. CGSSB > Assistant Development Extension Officer (ADO - 150 Marks Pattern)
  {
    id: "test-cgssb-ado-01",
    title: "CGSSB ADO (\u0938\u0939\u093E\u092F\u0915 \u0935\u093F\u0915\u093E\u0938 \u0935\u093F\u0938\u094D\u0924\u093E\u0930 \u0905\u0927\u093F\u0915\u093E\u0930\u0940) Full Length Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Rural Development Cadre",
    postName: "Assistant Development Extension Officer (ADO)",
    examName: "CGSSB ADO Recruitment Exam 2024",
    description: "Official ADO 150-Marks Structure: 73rd Constitutional Amendment & Panchayati Raj (30M) + Rural Development Schemes (30M) + Livelihood/Aajeevika & SHGs (30M) + General Studies & CG GK (30M) + General Hindi (30M) = 150 Marks (+1.0 / -0.33).",
    durationMinutes: 180,
    totalMarks: 150,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.333,
    sections: [
      {
        id: "sec-ado-panchayat",
        name: "73\u0935\u093E\u0902 \u0938\u0902\u0935\u093F\u0927\u093E\u0928 \u0938\u0902\u0936\u094B\u0927\u0928 \u090F\u0935\u0902 \u092A\u0902\u091A\u093E\u092F\u0924\u0940 \u0930\u093E\u091C (30 Marks)",
        questionIds: ["q-cg-08"]
      },
      {
        id: "sec-ado-rural-dev",
        name: "\u0917\u094D\u0930\u093E\u092E\u0940\u0923 \u0935\u093F\u0915\u093E\u0938 \u0915\u0940 \u092A\u094D\u0930\u092E\u0941\u0916 \u092F\u094B\u091C\u0928\u093E\u090F\u0902 \u090F\u0935\u0902 \u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0905\u0902\u0915\u0947\u0915\u094D\u0937\u0923 (30 Marks)",
        questionIds: ["q-cg-10"]
      },
      {
        id: "sec-ado-aajeevika",
        name: "\u0906\u091C\u0940\u0935\u093F\u0915\u093E \u0938\u0902\u0935\u0930\u094D\u0927\u0928, \u0938\u094D\u0935-\u0938\u0939\u093E\u092F\u0924\u093E \u0938\u092E\u0942\u0939 \u090F\u0935\u0902 \u092C\u093F\u0939\u093E\u0928 (30 Marks)",
        questionIds: ["q-cg-07"]
      },
      {
        id: "sec-ado-gs-cggk",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0905\u0927\u094D\u092F\u092F\u0928 \u090F\u0935\u0902 \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 (30 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-psc-07", "q-psc-08"]
      },
      {
        id: "sec-ado-hindi",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0939\u093F\u0928\u094D\u0926\u0940 \u0935\u094D\u092F\u093E\u0915\u0930\u0923 (30 Marks)",
        questionIds: ["q-cg-05", "q-cg-06"]
      }
    ],
    questionCount: 9,
    attemptsCount: 1940,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2024-02-03"
  },
  // 5. CGPSC > State Service Examination (Prelims)
  {
    id: "test-cgpsc-01",
    title: "CGPSC State Service Preliminary Exam Paper-I Mock 01",
    authority: "CGPSC",
    category: "CGPSC",
    subCategory: "State Service Examination (Prelims)",
    postName: "State Civil Service (Deputy Collector / DSP)",
    examName: "CGPSC SSE Prelims Paper-I 2024",
    description: "Strictly aligned with CGPSC State Service Exam (SSE) Prelims General Studies Paper-I syllabus with exactly 2 sections: Chhattisgarh General Studies (50 Marks / 50 Qs) and India General Studies (50 Marks / 50 Qs). Total 100 Qs / 200 Marks (+2.0 per question, -0.667 negative marking).",
    durationMinutes: 120,
    totalMarks: 200,
    marksPerQuestion: 2,
    negativeMarksPerQuestion: 0.667,
    sections: [
      {
        id: "sec-cgpsc-cg-gs",
        name: "Part B: Chhattisgarh General Studies (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0905\u0927\u094D\u092F\u092F\u0928) - 50 Marks",
        questionIds: ["q-psc-01", "q-psc-02", "q-psc-03", "q-psc-04", "q-psc-05"]
      },
      {
        id: "sec-cgpsc-india-gs",
        name: "Part A: India General Studies (\u092D\u093E\u0930\u0924 \u0915\u093E \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0905\u0927\u094D\u092F\u092F\u0928) - 50 Marks",
        questionIds: ["q-psc-06", "q-psc-07", "q-psc-08", "q-cg-02", "q-cg-06"]
      }
    ],
    questionCount: 10,
    attemptsCount: 4890,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2024-02-05"
  },
  // 6. Swami Atmanand > Excellence Schools
  {
    id: "test-atmanand-01",
    title: "Swami Atmanand English Medium Teachers & Lecturers Mock Paper 01",
    authority: "Swami Atmanand",
    category: "SWAMI_ATMANAND",
    subCategory: "Swami Atmanand Excellence Schools",
    postName: "Swami Atmanand English Lecturer",
    examName: "Swami Atmanand English Medium Teacher Exam",
    description: "Designed specifically for Swami Atmanand English Medium School recruitment candidates. Tests Child Pedagogy, Educational Psychology, NEP 2020, and State Knowledge.",
    durationMinutes: 15,
    totalMarks: 10,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.333,
    sections: [
      {
        id: "sec-pedagogy",
        name: "Section 1: Pedagogy & Education NEP 2020",
        questionIds: ["q-psc-09", "q-psc-10", "q-cg-04", "q-cg-09", "q-cg-06"]
      },
      {
        id: "sec-cg-culture",
        name: "Section 2: CG Special & Language Skills",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-cg-05", "q-cg-10"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2150,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2024-02-10"
  },
  // 9. CGSSB > Revenue Inspector (RI - राजस्व निरीक्षक) Official 150-Marks Pattern
  {
    id: "test-cgssb-ri-01",
    title: "CGSSB Revenue Inspector (\u0930\u093E\u091C\u0938\u094D\u0935 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0915 RI) Full Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Patwari & Revenue Inspector (RI)",
    postName: "Revenue Inspector (RI)",
    examName: "CG Vyapam Revenue Inspector Exam 2024",
    description: "Official CG Vyapam RI 150-Marks Pattern: CG GK & Land Laws (50M) + Quantitative Aptitude & Mental Ability (40M) + Computer Applications (20M) + General Hindi & English (40M) = 150 Marks (+1.0 / -0.33).",
    durationMinutes: 180,
    totalMarks: 150,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.333,
    sections: [
      {
        id: "sec-ri-cggk",
        name: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u092D\u0942-\u0905\u092D\u093F\u0932\u0947\u0916 (50 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-cg-07", "q-cg-08"]
      },
      {
        id: "sec-ri-aptitude",
        name: "\u0917\u0923\u093F\u0924 \u090F\u0935\u0902 \u0924\u093E\u0930\u094D\u0915\u093F\u0915 \u0905\u092D\u093F\u092F\u094B\u0917\u094D\u092F\u0924\u093E (40 Marks)",
        questionIds: ["q-psc-06", "q-cg-06"]
      },
      {
        id: "sec-ri-computer",
        name: "\u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 (20 Marks)",
        questionIds: ["q-cg-04", "q-cg-05"]
      },
      {
        id: "sec-ri-languages",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0939\u093F\u0928\u094D\u0926\u0940 \u090F\u0935\u0902 \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940 (40 Marks)",
        questionIds: ["q-cg-09", "q-cg-10"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2420,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2024-02-15"
  },
  // 10. CGPSC > State Forest Service (SFS) & Engineering Combined Prelims
  {
    id: "test-cgpsc-forest-01",
    title: "CGPSC State Forest Service (ACF / Forest Ranger) Prelims Mock 01",
    authority: "CGPSC",
    category: "CGPSC",
    subCategory: "State Service Examination (Prelims)",
    postName: "Assistant Conservator of Forests (ACF) / Forest Ranger",
    examName: "CGPSC State Forest Service Examination 2024",
    description: "Bilingual simulation covering CG General Studies, Indian Forestry, Environment, General Science, and Logical Aptitude for CGPSC ACF/Ranger Prelims (+2.0 / -0.667).",
    durationMinutes: 150,
    totalMarks: 300,
    marksPerQuestion: 2,
    negativeMarksPerQuestion: 0.667,
    sections: [
      {
        id: "sec-sfs-cg-gs",
        name: "Part A: General Studies & Chhattisgarh GK (150 Marks)",
        questionIds: ["q-psc-01", "q-psc-02", "q-psc-03", "q-psc-04", "q-psc-05"]
      },
      {
        id: "sec-sfs-science",
        name: "Part B: Science, Environment & Forestry (150 Marks)",
        questionIds: ["q-psc-07", "q-psc-08", "q-cg-03", "q-cg-07", "q-cg-10"]
      }
    ],
    questionCount: 10,
    attemptsCount: 1680,
    passingPercentage: 45,
    isPublished: true,
    createdAt: "2024-02-18"
  },
  // 11. CGSSB > Sahayak Shikshak (Primary Teacher Paper-I)
  {
    id: "test-cg-shikshak-paper1-01",
    title: "CG Sahayak Shikshak (Assistant Teacher Paper-I) Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Teacher Recruitment 2026",
    postName: "CG Assistant Teacher (Primary Cadre)",
    examName: "CG Sahayak Shikshak (Paper-I Classes 1-5) 2026",
    description: "Primary cadre exam paper: Child Development & Pedagogy (30M) + Hindi (25M) + English (25M) + Mathematics (30M) + Environmental Studies (20M) + Computer/General Knowledge (20M) = 150 Marks.",
    durationMinutes: 150,
    totalMarks: 150,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-primary-cdp",
        name: "Child Development & Pedagogy (\u092C\u093E\u0932 \u0935\u093F\u0915\u093E\u0938)",
        questionIds: ["q-psc-09", "q-psc-10", "q-cg-04"]
      },
      {
        id: "sec-primary-languages",
        name: "Language I & II (Hindi & English)",
        questionIds: ["q-cg-05", "q-cg-06", "q-cg-09"]
      },
      {
        id: "sec-primary-evs-maths",
        name: "Mathematics, EVS & State GK",
        questionIds: ["q-cg-01", "q-cg-02", "q-psc-06", "q-cg-07"]
      }
    ],
    questionCount: 10,
    attemptsCount: 3120,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-05"
  },
  // 12. CG Police Sub-Inspector (Subedar / Platoon Commander) Prelims Mock 01
  {
    id: "test-cg-police-si-01",
    title: "CG Police Sub-Inspector (SI / Subedar) Official Prelims Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Police & Defense Cadre",
    postName: "Sub-Inspector (SI) / Subedar",
    examName: "CG Police SI Combined Prelims Exam 2024",
    description: "Official CG Police SI Pattern: General Studies & CG GK (150 Marks) + Aptitude, Reasoning & Computer (150 Marks) = 300 Marks (100 Qs @ 3 Marks each, no negative marking).",
    durationMinutes: 120,
    totalMarks: 300,
    marksPerQuestion: 3,
    negativeMarksPerQuestion: 0,
    sections: [
      {
        id: "sec-si-gs",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0905\u0927\u094D\u092F\u092F\u0928 (150 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-psc-01", "q-psc-02"]
      },
      {
        id: "sec-si-aptitude",
        name: "\u0917\u0923\u093F\u0924, \u0924\u0930\u094D\u0915\u0936\u0915\u094D\u0924\u093F \u090F\u0935\u0902 \u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 \u091C\u094D\u091E\u093E\u0928 (150 Marks)",
        questionIds: ["q-cg-04", "q-cg-05", "q-cg-06", "q-psc-06", "q-psc-07"]
      }
    ],
    questionCount: 10,
    attemptsCount: 3890,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-08"
  },
  // 13. CG Apex Bank (District Cooperative Bank) Assistant & Manager Mock 01
  {
    id: "test-cg-apex-bank-01",
    title: "CG Apex Bank (\u0938\u0939\u0915\u093E\u0930\u0940 \u092C\u0948\u0902\u0915) Assistant & Manager Full Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Banking & Cooperative Services",
    postName: "Apex Bank Assistant Grade-3 / Manager",
    examName: "CG Apex Bank Recruitment Exam 2024",
    description: "Specialized 100-Marks banking pattern covering Cooperative Act & Banking Regulations, Computer Knowledge, CG General Knowledge, and Quantitative Aptitude.",
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-apex-coop",
        name: "\u0938\u0939\u0915\u093E\u0930\u093F\u0924\u093E \u0905\u0927\u093F\u0928\u093F\u092F\u092E \u090F\u0935\u0902 \u092C\u0948\u0902\u0915\u093F\u0902\u0917 (25 Marks)",
        questionIds: ["q-cg-08", "q-cg-10", "q-psc-08"]
      },
      {
        id: "sec-apex-general",
        name: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u092D\u093E\u0937\u093E (30 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-07", "q-cg-09"]
      },
      {
        id: "sec-apex-tech",
        name: "\u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 \u090F\u0935\u0902 \u0917\u0923\u093F\u0924\u0940\u092F \u0905\u092D\u093F\u092F\u094B\u0917\u094D\u092F\u0924\u093E (45 Marks)",
        questionIds: ["q-cg-04", "q-cg-05", "q-psc-06"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2210,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-10"
  },
  // 14. CG Labour Inspector (श्रम निरीक्षक) Combined Recruitment Mock 01
  {
    id: "test-cg-labour-inspector-01",
    title: "CG Labour Inspector (\u0936\u094D\u0930\u092E \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0915) Official Full Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Labour & Industry Cadre",
    postName: "Labour Inspector (\u0936\u094D\u0930\u092E \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0915)",
    examName: "CG Labour Inspector Recruitment Exam 2024",
    description: "Official 150-Marks Labour Inspector Scheme: General Studies (65M) + Computer Applications (20M) + Labour Laws & Industrial Relations (65M) = 150 Marks (+1.0 / -0.25).",
    durationMinutes: 180,
    totalMarks: 150,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-labour-laws",
        name: "\u0936\u094D\u0930\u092E \u0915\u093E\u0928\u0942\u0928 \u090F\u0935\u0902 \u0914\u0926\u094D\u092F\u094B\u0917\u093F\u0915 \u0938\u0902\u092C\u0902\u0927 (65 Marks)",
        questionIds: ["q-cg-08", "q-cg-10", "q-psc-07", "q-psc-08"]
      },
      {
        id: "sec-labour-gs",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0905\u0927\u094D\u092F\u092F\u0928 \u090F\u0935\u0902 \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 (65 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-psc-01"]
      },
      {
        id: "sec-labour-computer",
        name: "\u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u092F\u094B\u0917\u094D\u092F\u0924\u093E (20 Marks)",
        questionIds: ["q-cg-04", "q-cg-05"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2740,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-12"
  },
  // 15. CG Forest Guard (वनरक्षक) Recruitment Mock 01
  {
    id: "test-cg-forest-guard-01",
    title: "CG Forest Guard (\u0935\u0928\u0930\u0915\u094D\u0937\u0915) Official Written Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Forest & Environment Cadre",
    postName: "Forest Guard (\u0935\u0928\u0930\u0915\u094D\u0937\u0915)",
    examName: "CG Forest Guard Recruitment Exam 2024",
    description: "100-Marks state selection test: General Knowledge & CG Forest/Geography (50M) + Mathematics & Mental Ability (50M) (+1.0 / -0.25).",
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-forest-gk",
        name: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u092A\u0930\u094D\u092F\u093E\u0935\u0930\u0923 (50 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-cg-07", "q-psc-01"]
      },
      {
        id: "sec-forest-math",
        name: "\u0917\u0923\u093F\u0924 \u090F\u0935\u0902 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0905\u092D\u093F\u092F\u094B\u0917\u094D\u092F\u0924\u093E (50 Marks)",
        questionIds: ["q-psc-06", "q-cg-06", "q-cg-04", "q-cg-05", "q-psc-07"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2190,
    passingPercentage: 45,
    isPublished: true,
    createdAt: "2026-03-14"
  },
  // 16. CG Vyapam Data Entry Operator & AG-III Mock 01
  {
    id: "test-cg-deo-ag3-01",
    title: "CG Vyapam Data Entry Operator & Assistant Gr-III Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Secretariat & District Ministerial Cadre",
    postName: "Data Entry Operator (DEO) / AG-3",
    examName: "CG Vyapam DEO & Assistant Gr-III Exam 2024",
    description: "Combined ministerial test: Computer Applications & OS (50M) + General Studies & CG GK (30M) + General Hindi & English (20M) = 100 Marks.",
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-deo-computer",
        name: "\u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 (50 Marks)",
        questionIds: ["q-cg-04", "q-cg-05", "q-cg-09", "q-psc-06"]
      },
      {
        id: "sec-deo-gs-lang",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u092D\u093E\u0937\u093E \u091C\u094D\u091E\u093E\u0928 (50 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-06", "q-cg-08", "q-cg-10", "q-psc-01"]
      }
    ],
    questionCount: 10,
    attemptsCount: 3150,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-16"
  },
  // 17. CGPSC Chief Municipal Officer (CMO) Prelims Mock 01
  {
    id: "test-cgpsc-cmo-01",
    title: "CGPSC Chief Municipal Officer (CMO Grade-B/C) Prelims Mock 01",
    authority: "CGPSC",
    category: "CGPSC",
    subCategory: "State Service Examination (Prelims)",
    postName: "Chief Municipal Officer (CMO)",
    examName: "CGPSC CMO Examination 2024",
    description: "Specialized municipal administration exam: Chhattisgarh General Studies (100M) + Municipal Corporation Act & Urban Administration (100M) = 200 Marks (+2.0 / -0.667).",
    durationMinutes: 120,
    totalMarks: 200,
    marksPerQuestion: 2,
    negativeMarksPerQuestion: 0.667,
    sections: [
      {
        id: "sec-cmo-cggs",
        name: "Part A: Chhattisgarh General Studies (100 Marks)",
        questionIds: ["q-psc-01", "q-psc-02", "q-psc-03", "q-psc-04", "q-psc-05"]
      },
      {
        id: "sec-cmo-urban",
        name: "Part B: Indian Polity & Urban Governance (100 Marks)",
        questionIds: ["q-psc-07", "q-psc-08", "q-cg-08", "q-cg-10", "q-cg-07"]
      }
    ],
    questionCount: 10,
    attemptsCount: 1980,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-18"
  },
  // 18. CG Mandi Nirakshak (मंडी निरीक्षक) Mock 01
  {
    id: "test-cg-mandi-nirakshak-01",
    title: "CG Mandi Nirakshak & Up-Nirakshak Full Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Agriculture & Marketing Cadre",
    postName: "Mandi Inspector (\u092E\u0902\u0921\u0940 \u0928\u093F\u0930\u0940\u0915\u094D\u0937\u0915)",
    examName: "CG Mandi Nirakshak Exam 2024",
    description: "150-Marks comprehensive test: Agriculture Marketing Acts, Hindi/English, Computer, CG GK, and Mental Ability (+1.0 / -0.25).",
    durationMinutes: 180,
    totalMarks: 150,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-mandi-gk",
        name: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u0915\u0943\u0937\u093F \u0935\u093F\u092A\u0923\u0928 (50 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-07", "q-cg-08", "q-psc-01"]
      },
      {
        id: "sec-mandi-aptitude",
        name: "\u0917\u0923\u093F\u0924, \u0924\u0930\u094D\u0915\u0936\u0915\u094D\u0924\u093F \u090F\u0935\u0902 \u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 (60 Marks)",
        questionIds: ["q-cg-04", "q-cg-05", "q-cg-06", "q-psc-06"]
      },
      {
        id: "sec-mandi-lang",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0939\u093F\u0928\u094D\u0926\u0940 \u090F\u0935\u0902 \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940 (40 Marks)",
        questionIds: ["q-cg-09", "q-cg-10", "q-psc-07", "q-psc-08"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2310,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-20"
  },
  // 19. CG Mahila Paryavekshak (महिला पर्यवेक्षक) Mock 01
  {
    id: "test-cg-mahila-supervisor-01",
    title: "CG Mahila Paryavekshak (\u092E\u0939\u093F\u0932\u093E \u092A\u0930\u094D\u092F\u0935\u0947\u0915\u094D\u0937\u0915) Full Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Women & Child Development Cadre",
    postName: "Supervisor (Open & Confined Cadre)",
    examName: "CG Mahila Supervisor Exam 2024",
    description: "Specialized 100-Marks pattern: Women & Child Development Schemes (40M) + General Studies & CG GK (40M) + Reasoning & Child Psychology (20M).",
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-wcd-schemes",
        name: "\u092E\u0939\u093F\u0932\u093E \u090F\u0935\u0902 \u092C\u093E\u0932 \u0935\u093F\u0915\u093E\u0938 \u0938\u0902\u092C\u0902\u0927\u0940 \u092F\u094B\u091C\u0928\u093E\u090F\u0902 \u090F\u0935\u0902 \u0905\u0927\u093F\u0928\u093F\u092F\u092E (40 Marks)",
        questionIds: ["q-cg-08", "q-cg-10", "q-psc-09", "q-psc-10"]
      },
      {
        id: "sec-wcd-gs",
        name: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0905\u0927\u094D\u092F\u092F\u0928 (40 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-psc-01", "q-psc-02"]
      },
      {
        id: "sec-wcd-reasoning",
        name: "\u0924\u0930\u094D\u0915\u0936\u0915\u094D\u0924\u093F \u090F\u0935\u0902 \u092E\u093E\u0928\u0938\u093F\u0915 \u092F\u094B\u0917\u094D\u092F\u0924\u093E (20 Marks)",
        questionIds: ["q-cg-06", "q-psc-06"]
      }
    ],
    questionCount: 10,
    attemptsCount: 4120,
    passingPercentage: 50,
    isPublished: true,
    createdAt: "2026-03-22"
  },
  // 20. CG ITI Training Officer (प्रशिक्षण अधिकारी) Mock 01
  {
    id: "test-cg-iti-training-officer-01",
    title: "CG ITI Training Officer (\u092A\u094D\u0930\u0936\u093F\u0915\u094D\u0937\u0923 \u0905\u0927\u093F\u0915\u093E\u0930\u0940 TO) Non-Tech Mock 01",
    authority: "CGSSB",
    category: "CGSSB",
    subCategory: "Technical Education & Skill Cadre",
    postName: "ITI Training Officer (TO)",
    examName: "CG ITI Training Officer Examination 2024",
    description: "Standard 100-Marks paper covering Basic Engineering/Technical Aptitude, Computer Applications, State General Studies, and Workplace Safety.",
    durationMinutes: 120,
    totalMarks: 100,
    marksPerQuestion: 1,
    negativeMarksPerQuestion: 0.25,
    sections: [
      {
        id: "sec-to-tech",
        name: "\u0924\u0915\u0928\u0940\u0915\u0940 \u0905\u092D\u093F\u092F\u094B\u0917\u094D\u092F\u0924\u093E \u090F\u0935\u0902 \u0915\u092E\u094D\u092A\u094D\u092F\u0942\u091F\u0930 (50 Marks)",
        questionIds: ["q-cg-04", "q-cg-05", "q-psc-06", "q-psc-07"]
      },
      {
        id: "sec-to-gs",
        name: "\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u090F\u0935\u0902 \u0938\u092E\u0938\u093E\u092E\u092F\u093F\u0915\u0940 (50 Marks)",
        questionIds: ["q-cg-01", "q-cg-02", "q-cg-03", "q-cg-07", "q-psc-01"]
      }
    ],
    questionCount: 10,
    attemptsCount: 2680,
    passingPercentage: 45,
    isPublished: true,
    createdAt: "2026-03-24"
  }
];
var INITIAL_PYP_PAPERS = [
  {
    id: "pyp-cgssb-patwari-2023",
    title: "CGSSB Patwari Official Question Paper 2023",
    examCategory: "CGSSB",
    year: 2023,
    totalQuestions: 150,
    durationMinutes: 180,
    marks: 150,
    negativeMarkingRatio: "-\u2153rd (0.33 Marks)",
    testId: "test-cgssb-patwari-01",
    paperSummary: "Actual question paper conducted by Chhattisgarh Vyapam for Patwari recruitment. Covers Computer (20 Qs), Hindi (10 Qs), English (10 Qs), Math/Reasoning (30 Qs), and CG General Knowledge (35 Qs).",
    subjectsWeightage: [
      { subject: "CG Special Knowledge", questionCount: 35, percentage: 23.3 },
      { subject: "Quantitative & Reasoning", questionCount: 30, percentage: 20 },
      { subject: "Computer Knowledge", questionCount: 20, percentage: 13.3 },
      { subject: "General Hindi & English", questionCount: 20, percentage: 13.3 },
      { subject: "Current Affairs & National GK", questionCount: 45, percentage: 30.1 }
    ],
    downloadFileName: "CGSSB_Patwari_2023_Official_Solved.pdf",
    fileSize: "3.4 MB"
  },
  {
    id: "pyp-cgpsc-sse-2023",
    title: "CGPSC State Service Prelims Paper-I (General Studies) 2023",
    examCategory: "CGPSC",
    year: 2023,
    totalQuestions: 100,
    durationMinutes: 120,
    marks: 200,
    negativeMarkingRatio: "-\u2153rd (0.667 Marks per wrong answer)",
    testId: "test-cgpsc-01",
    paperSummary: "Official CGPSC Prelims Paper-I containing 50 questions on Indian History, Geography & Constitution and 50 in-depth questions on Chhattisgarh Tribes, Art, History, and Economy.",
    subjectsWeightage: [
      { subject: "Chhattisgarh History & Culture", questionCount: 25, percentage: 25 },
      { subject: "Chhattisgarh Geography & Economy", questionCount: 25, percentage: 25 },
      { subject: "Indian Polity & Constitution", questionCount: 18, percentage: 18 },
      { subject: "General Science & Tech", questionCount: 16, percentage: 16 },
      { subject: "Current Events & Schemes", questionCount: 16, percentage: 16 }
    ],
    downloadFileName: "CGPSC_SSE_Prelims_2023_Paper1.pdf",
    fileSize: "4.8 MB"
  },
  {
    id: "pyp-atmanand-lecturer-2022",
    title: "Swami Atmanand Lecturer & Teacher Recruitment Exam 2022",
    examCategory: "SWAMI_ATMANAND",
    year: 2022,
    totalQuestions: 100,
    durationMinutes: 120,
    marks: 100,
    negativeMarkingRatio: "-\u2153rd (0.33 Marks)",
    testId: "test-atmanand-01",
    paperSummary: "Actual recruitment paper for English Medium school teachers and lecturers under Swami Atmanand Excellence School Scheme. Emphasis on pedagogy, teaching methods, and English comprehension.",
    subjectsWeightage: [
      { subject: "Child Pedagogy & Teaching Aptitude", questionCount: 30, percentage: 30 },
      { subject: "English Language & Comprehension", questionCount: 25, percentage: 25 },
      { subject: "CG Knowledge & Culture", questionCount: 25, percentage: 25 },
      { subject: "Reasoning & Mental Ability", questionCount: 20, percentage: 20 }
    ],
    downloadFileName: "Swami_Atmanand_Lecturer_2022_Solved.pdf",
    fileSize: "2.9 MB"
  },
  {
    id: "pyp-cgssb-ri-2021",
    title: "CGSSB Revenue Inspector (RI) Exam 2021",
    examCategory: "CGSSB",
    year: 2021,
    totalQuestions: 150,
    durationMinutes: 180,
    marks: 150,
    negativeMarkingRatio: "-\u2153rd (0.33 Marks)",
    testId: "test-cgssb-01",
    paperSummary: "Official Revenue Inspector question paper from Vyapam. Strong focus on revenue laws, land measurements, CG geography, and mental aptitude.",
    subjectsWeightage: [
      { subject: "Chhattisgarh Special & Land Laws", questionCount: 50, percentage: 33.3 },
      { subject: "Maths & Mental Ability", questionCount: 40, percentage: 26.7 },
      { subject: "Computer Applications", questionCount: 20, percentage: 13.3 },
      { subject: "General Knowledge & Language", questionCount: 40, percentage: 26.7 }
    ],
    downloadFileName: "CGSSB_Revenue_Inspector_2021.pdf",
    fileSize: "3.1 MB"
  }
];
var SAMPLE_USER_ATTEMPTS = [
  {
    id: "att-sample-01",
    userId: "u-student-01",
    userName: "Rameshwar Dewangan",
    testId: "test-cgssb-01",
    testTitle: "CGSSB Vyapam Combined Exam Full Mock Test 01",
    category: "CGSSB",
    submittedAt: "2024-03-14T10:45:00.000Z",
    timeTakenSeconds: 580,
    totalDurationSeconds: 900,
    responses: {
      "q-cg-01": "A",
      "q-cg-02": "B",
      "q-cg-03": "C",
      "q-cg-04": "C",
      "q-cg-05": "B",
      "q-cg-06": "A",
      "q-cg-07": "A",
      "q-cg-08": "A",
      "q-cg-09": "B",
      "q-cg-10": "A"
    },
    questionStatuses: {
      "q-cg-01": "answered",
      "q-cg-02": "answered",
      "q-cg-03": "answered",
      "q-cg-04": "answered",
      "q-cg-05": "answered",
      "q-cg-06": "answered",
      "q-cg-07": "answered",
      "q-cg-08": "answered",
      "q-cg-09": "answered",
      "q-cg-10": "answered"
    },
    score: 10,
    maxScore: 10,
    percentage: 100,
    accuracy: 100,
    correctCount: 10,
    incorrectCount: 0,
    unattemptedCount: 0,
    markedForReviewCount: 1,
    negativeMarksDeducted: 0,
    simulatedRank: 42,
    totalParticipants: 3420,
    percentile: 98.8,
    sectorAnalysis: [
      {
        subject: "Chhattisgarh General Studies",
        total: 6,
        correct: 6,
        incorrect: 0,
        unattempted: 0,
        accuracy: 100,
        score: 6,
        maxScore: 6,
        timeSpentSeconds: 320
      },
      {
        subject: "Computer Knowledge",
        total: 2,
        correct: 2,
        incorrect: 0,
        unattempted: 0,
        accuracy: 100,
        score: 2,
        maxScore: 2,
        timeSpentSeconds: 110
      },
      {
        subject: "Quantitative Aptitude",
        total: 1,
        correct: 1,
        incorrect: 0,
        unattempted: 0,
        accuracy: 100,
        score: 1,
        maxScore: 1,
        timeSpentSeconds: 85
      },
      {
        subject: "General Hindi",
        total: 1,
        correct: 1,
        incorrect: 0,
        unattempted: 0,
        accuracy: 100,
        score: 1,
        maxScore: 1,
        timeSpentSeconds: 65
      }
    ]
  }
];

// server/db/repository.ts
var import_fs2 = __toESM(require("fs"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_firestore2 = require("firebase/firestore");

// server/db/connection.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
import_dotenv.default.config();
var dbConfig = {
  mode: "firestore",
  databaseId: process.env.FIRESTORE_DATABASE_ID || "ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089",
  projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0783153446",
  region: "asia-south1 (Mumbai)"
};
var serverFirestore = null;
function getFirestoreServer() {
  if (serverFirestore) return serverFirestore;
  try {
    const configPath = import_path.default.resolve(process.cwd(), "firebase-applet-config.json");
    if (import_fs.default.existsSync(configPath)) {
      const config = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
      const app = (0, import_app.getApps)().length === 0 ? (0, import_app.initializeApp)(config, "cgssb-server-app") : (0, import_app.getApps)().find((a) => a.name === "cgssb-server-app") || (0, import_app.initializeApp)(config, "cgssb-server-app");
      const dbId = config.firestoreDatabaseId || dbConfig.databaseId;
      serverFirestore = (0, import_firestore.getFirestore)(app, dbId);
      return serverFirestore;
    }
  } catch (err) {
    console.warn("\u26A0\uFE0F Server Firestore initialization note:", err);
  }
  return null;
}
function isFirestoreActive() {
  return true;
}

// src/defaultCmsData.ts
var INITIAL_CMS_SETTINGS = {
  siteName: "CGSSB Test Portal",
  tagline: "Official Competitive Examination Simulation Platform for CGPSC & CG Vyapam",
  logoUrl: "",
  contactPhone: "+91 98765 43210",
  contactWhatsapp: "+91 98765 43210",
  contactEmail: "support@cgssbtest.com",
  copyrightText: "\xA9 2026 CGSSB Test Portal. All rights reserved.",
  primaryColor: "indigo",
  announcementBar: {
    enabled: true,
    message: "\u{1F389} CGPSC Prelims 2026 & Vyapam Hostel Warden New Mock Test Series Live! Free Pass Active.",
    buttonText: "Attempt Free Tests",
    buttonLink: "/test-series"
  },
  navMenu: [
    { id: "nav-1", label: "All Test Series", url: "/test-series" },
    { id: "nav-2", label: "CGPSC Mock Tests", url: "/exams/cgpsc" },
    { id: "nav-3", label: "CG Vyapam & SSB", url: "/exams/cgssb" },
    { id: "nav-4", label: "Previous Year Papers", url: "/pyp" },
    { id: "nav-5", label: "Testbook Pass Pro", url: "/pass" },
    { id: "nav-6", label: "Latest News & Articles", url: "/posts" },
    { id: "nav-7", label: "Syllabus Guide", url: "/p/syllabus-guide" }
  ],
  footerLinks: [
    {
      title: "Exam Series",
      links: [
        { label: "CGPSC State Service Prelims", url: "/exams/cgpsc" },
        { label: "Hostel Warden & Patwari", url: "/exams/cgssb" },
        { label: "Revenue Inspector & Sub-Inspector", url: "/exams/cgssb" },
        { label: "Previous Year Question Archives", url: "/pyp" }
      ]
    },
    {
      title: "Study Tools",
      links: [
        { label: "Mistake Notebook & Error Log", url: "/mistakes" },
        { label: "Chhattisgarhi Revision Deck", url: "/chhattisgarhi-revision" },
        { label: "Bookmarked Questions", url: "/bookmarks" },
        { label: "Performance Analytics", url: "/analytics" }
      ]
    },
    {
      title: "About & Support",
      links: [
        { label: "About Exam Platform", url: "/p/about" },
        { label: "Coaching Partner Guide", url: "/p/coaching-partner" },
        { label: "Latest Exam Notifications", url: "/posts" },
        { label: "Syllabus & Exam Pattern", url: "/p/syllabus-guide" }
      ]
    }
  ]
};
var INITIAL_CMS_PAGES = [
  {
    id: "page-about",
    slug: "about",
    title: "About CGSSB Test Platform",
    metaTitle: "About CGSSB Test - Chhattisgarh Exam Simulation Engine",
    metaDescription: "Learn about CGSSB Test, Chhattisgarh\u2019s leading simulation engine for CGPSC and Vyapam exams.",
    isPublished: true,
    createdAt: "2026-01-15",
    updatedAt: "2026-03-20",
    blocks: [
      {
        id: "blk-1",
        type: "hero",
        title: "Empowering Aspirants Across Chhattisgarh",
        subtitle: "Bilingual exam simulation platform matching official CGPSC and Vyapam TCS iON computer-based test formats.",
        buttonText: "Explore All Test Series",
        buttonLink: "/test-series"
      },
      {
        id: "blk-2",
        type: "heading",
        title: "Why Top Rankers Trust CGSSB Test",
        subtitle: "Designed specifically for Chhattisgarhi General Knowledge, Hindi, Science, Aptitude, and Language requirements."
      },
      {
        id: "blk-3",
        type: "features",
        items: [
          {
            title: "100% Real Exam Interface",
            description: "Identical TCS iON palette with Answered, Marked for Review, and Not Attempted question statuses."
          },
          {
            title: "Bilingual Devnagari Support",
            description: "Every question available in both Hindi (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C\u0940/\u0939\u093F\u0928\u094D\u0926\u0940) and English with clear explanations."
          },
          {
            title: "Rank & Cut-Off Predictor",
            description: "Instant percentile, speed vs accuracy meter, and subject-wise accuracy distribution."
          },
          {
            title: "Negative Marking Simulation",
            description: "Exact CGPSC (+2/-0.66) and Vyapam (+1/-0.33) marking calculation."
          }
        ]
      },
      {
        id: "blk-4",
        type: "faq",
        title: "Frequently Asked Questions",
        faqList: [
          {
            question: "Are the mock tests based on latest CGPSC 2026 syllabus?",
            answer: "Yes, all mock tests are updated regularly according to the latest CGPSC and Vyapam exam guidelines."
          },
          {
            question: "Can I access the platform on mobile?",
            answer: "Yes, CGSSB Test is fully responsive on mobile devices and includes an Android REST API for offline app sync."
          }
        ]
      }
    ]
  },
  {
    id: "page-coaching-partner",
    slug: "coaching-partner",
    title: "Coaching Institute Partnership Program",
    metaTitle: "Coaching Partner Program | CGSSB Test",
    metaDescription: "Partner with CGSSB Test to bring online test series and PYP archives to your coaching institute students.",
    isPublished: true,
    createdAt: "2026-02-01",
    updatedAt: "2026-03-22",
    blocks: [
      {
        id: "blk-cp-1",
        type: "hero",
        title: "Power Your Institute with Enterprise Online Test Series",
        subtitle: "Provide your classroom students with custom white-label online mock exams and question bank access.",
        buttonText: "Contact Partnership Team",
        buttonLink: "/p/about"
      },
      {
        id: "blk-cp-2",
        type: "features",
        items: [
          {
            title: "Bulk Student Enrollment",
            description: "Assign test passes to hundreds of institute students with 1-click administrative credentials."
          },
          {
            title: "Custom Test Creator",
            description: "Use our AI generator or JSON importer to build institute-exclusive weekly test papers."
          },
          {
            title: "Detailed Leaderboards",
            description: "Compare institute performance against statewide aspirant averages."
          }
        ]
      }
    ]
  },
  {
    id: "page-syllabus-guide",
    slug: "syllabus-guide",
    title: "CGPSC & Vyapam Syllabus & Exam Pattern Guide 2026",
    metaTitle: "Syllabus & Marking Scheme Guide 2026 | CGSSB Test",
    metaDescription: "Complete breakdown of marks, duration, subjects, and negative marking for CGPSC and Vyapam competitive exams.",
    isPublished: true,
    createdAt: "2026-01-10",
    updatedAt: "2026-03-24",
    blocks: [
      {
        id: "blk-sg-1",
        type: "heading",
        title: "Official Exam Pattern & Marking Scheme (2026)",
        subtitle: "Understanding the structure of Chhattisgarh state competitive examinations."
      },
      {
        id: "blk-sg-2",
        type: "faq",
        title: "Pattern Summary by Exam Board",
        faqList: [
          {
            question: "CGPSC State Service Prelims Exam Pattern",
            answer: "Paper 1: General Studies (100 Questions, 200 Marks, 2 Hours, -0.667 Negative Marking). Paper 2: Aptitude Test (100 Questions, 200 Marks, Qualifying 33%)."
          },
          {
            question: "CG Vyapam (Hostel Warden, Patwari, RI, ADEO) Pattern",
            answer: "150 Questions, 150 Marks, 3 Hours, -0.333 Negative Marking. Key subjects: Computer Knowledge (50 Qs), Chhattisgarhi Language & GK, General Hindi, General English, Aptitude & Reasoning."
          }
        ]
      },
      {
        id: "blk-sg-3",
        type: "test_series_widget",
        title: "Practice Matching Tests Now",
        categoryFilter: "ALL"
      }
    ]
  }
];
var INITIAL_CMS_POSTS = [
  {
    id: "post-1",
    slug: "cgpsc-prelims-2026-notification-released",
    title: "CGPSC State Service Exam 2026 Official Notification & Post Breakdown",
    category: "Exam Notifications",
    featuredImage: "",
    excerpt: "Chhattisgarh Public Service Commission has announced official dates for State Service Prelims 2026. Read full eligibility, age relaxation, and syllabus details.",
    content: `### CGPSC Prelims 2026 Official Announcement

The **Chhattisgarh Public Service Commission (CGPSC)** has officially issued the notification for the State Service Examination 2026. Aspirants preparing for Deputy Collector, DSP, Accounts Officer, and Commercial Tax Officer posts can now start online registration.

#### Key Dates:
- **Online Application Start**: 1st December 2025
- **Last Date to Apply**: 30th December 2025
- **Preliminary Examination Date**: 8th February 2026
- **Admit Card Release**: 28th January 2026

#### Recommended Preparation Strategy:
1. **Focus heavily on Chhattisgarh GK & Chhattisgarhi Language** as 50% of Paper 1 consists of state-specific topics.
2. **Practice Previous Year Papers (2012\u20132024)** to understand repeating question themes.
3. Attempt full-length timed mock tests on **CGSSB Test Portal** to build time management and accuracy.`,
    tags: ["CGPSC", "Notification", "Prelims 2026", "Syllabus"],
    author: "CGSSB Academic Team",
    isPublished: true,
    publishedAt: "2026-03-15",
    updatedAt: "2026-03-20"
  },
  {
    id: "post-2",
    slug: "how-to-prepare-chhattisgarhi-language-vyakaran",
    title: "Top 10 Chhattisgarhi Language (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C\u0940 \u092D\u093E\u0937\u093E \u090F\u0935\u0902 \u0939\u093E\u0928\u093E-\u091C\u0928\u0909\u0932\u093E) Tips for CG Vyapam",
    category: "Study Material & Tips",
    featuredImage: "",
    excerpt: "Master Chhattisgarhi Vyakaran, Hana (\u0939\u093E\u0923\u093E), Janula (\u091C\u0928\u0909\u0932\u093E), and Shabdkosh with our curated study guide.",
    content: `### Mastering Chhattisgarhi Language for CG Exams

In CG Vyapam and CGPSC examinations, **Chhattisgarhi Language (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C\u0940 \u092D\u093E\u0937\u093E)** carries high weightage. Here is how to score 100% in this section:

1. **Understand Hana (\u0939\u093E\u0923\u093E) & Janula (\u091C\u0928\u0909\u0932\u093E)**: Riddles and idioms are frequently asked.
2. **Chhattisgarhi Grammar Rules**: Learn gender conversions (\u0932\u093F\u0902\u0917 \u092A\u0930\u093F\u0935\u0930\u094D\u0924\u0928), plurals (\u0935\u091A\u0928), and pronouns (\u0938\u0930\u094D\u0935\u0928\u093E\u092E).
3. **Practice Daily Flashcards**: Use our in-app Chhattisgarhi Revision Deck for quick daily revision.`,
    tags: ["Chhattisgarhi", "Vyapam", "Grammar", "Study Tips"],
    author: "Subject Expert (Chhattisgarhi)",
    isPublished: true,
    publishedAt: "2026-03-18",
    updatedAt: "2026-03-22"
  }
];
var INITIAL_CMS_SERIES_PACKS = [
  {
    id: "pack-cgpsc-master",
    slug: "cgpsc-prelims-master-pass",
    title: "CGPSC Prelims 2026 Master Test Series Bundle",
    category: "CGPSC",
    description: "Complete package of 15 Subject-wise Tests + 10 Full-Length Mock Exams + 12 Previous Year Papers with detailed solutions.",
    badge: "Best Seller",
    price: 299,
    isPro: true,
    mockTestIds: ["test-cgpsc-1", "test-cgpsc-2", "test-cgpsc-3"],
    isPublished: true,
    createdAt: "2026-01-01"
  },
  {
    id: "pack-vyapam-all-in-one",
    slug: "cg-vyapam-all-in-one-pack",
    title: "CG Vyapam All-In-One Exam Pass (Hostel Warden, Patwari, RI)",
    category: "CGSSB",
    description: "Comprehensive test series for all Chhattisgarh Vyapam computer-based tests with 5,000+ bilingual questions.",
    badge: "Popular",
    price: 199,
    isPro: true,
    mockTestIds: ["test-cgssb-1", "test-cgssb-2"],
    isPublished: true,
    createdAt: "2026-01-05"
  }
];

// server/db/repository.ts
var DATA_DIR = process.env.DATA_DIR || import_path2.default.join(process.cwd(), "data");
var DB_FILE = import_path2.default.join(DATA_DIR, "cgssb-db.json");
function ensureDataDir() {
  if (!import_fs2.default.existsSync(DATA_DIR)) {
    import_fs2.default.mkdirSync(DATA_DIR, { recursive: true });
  }
}
function loadLocalJsonDb() {
  ensureDataDir();
  const mergeById = (initial, saved) => {
    const map = /* @__PURE__ */ new Map();
    initial.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    if (Array.isArray(saved)) {
      saved.forEach((item) => {
        if (item && item.id) map.set(item.id, item);
      });
    }
    return Array.from(map.values());
  };
  try {
    if (import_fs2.default.existsSync(DB_FILE)) {
      const raw = import_fs2.default.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        questions: mergeById(INITIAL_QUESTIONS, parsed.questions),
        mockTests: mergeById(INITIAL_MOCK_TESTS, parsed.mockTests),
        pypPapers: mergeById(INITIAL_PYP_PAPERS, parsed.pypPapers),
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [...SAMPLE_USER_ATTEMPTS]
      };
    }
  } catch (err) {
    console.warn("\u26A0\uFE0F Failed to load local JSON DB, using initial seeds:", err);
  }
  return {
    questions: [...INITIAL_QUESTIONS],
    mockTests: [...INITIAL_MOCK_TESTS],
    pypPapers: [...INITIAL_PYP_PAPERS],
    attempts: [...SAMPLE_USER_ATTEMPTS]
  };
}
var localDb = loadLocalJsonDb();
function saveLocalJsonDb(immediate = false) {
  try {
    ensureDataDir();
    import_fs2.default.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2), "utf-8");
  } catch (err) {
    console.error("\u274C Failed to save persistent database snapshot:", err);
  }
}
async function syncWithFirestore() {
  const db = getFirestoreServer();
  if (!db) {
    return {
      syncedQuestions: localDb.questions.length,
      syncedTests: localDb.mockTests.length,
      syncedAttempts: localDb.attempts.length
    };
  }
  try {
    const qSnap = await (0, import_firestore2.getDocs)((0, import_firestore2.collection)(db, "questions"));
    if (!qSnap.empty) {
      const firestoreQuestions = [];
      qSnap.forEach((d) => {
        firestoreQuestions.push(d.data());
      });
      const qMap = /* @__PURE__ */ new Map();
      localDb.questions.forEach((q) => qMap.set(q.id, q));
      firestoreQuestions.forEach((q) => qMap.set(q.id, q));
      localDb.questions = Array.from(qMap.values());
    } else {
      for (const q of localDb.questions.slice(0, 50)) {
        await (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "questions", q.id), q, { merge: true }).catch(() => null);
      }
    }
    const tSnap = await (0, import_firestore2.getDocs)((0, import_firestore2.collection)(db, "mockTests"));
    if (!tSnap.empty) {
      const firestoreTests = [];
      tSnap.forEach((d) => {
        firestoreTests.push(d.data());
      });
      const tMap = /* @__PURE__ */ new Map();
      localDb.mockTests.forEach((t) => tMap.set(t.id, t));
      firestoreTests.forEach((t) => tMap.set(t.id, t));
      localDb.mockTests = Array.from(tMap.values());
    } else {
      for (const t of localDb.mockTests) {
        await (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "mockTests", t.id), t, { merge: true }).catch(() => null);
      }
    }
    const aSnap = await (0, import_firestore2.getDocs)((0, import_firestore2.collection)(db, "attempts"));
    if (!aSnap.empty) {
      const firestoreAttempts = [];
      aSnap.forEach((d) => {
        firestoreAttempts.push(d.data());
      });
      const aMap = /* @__PURE__ */ new Map();
      localDb.attempts.forEach((a) => aMap.set(a.id, a));
      firestoreAttempts.forEach((a) => aMap.set(a.id, a));
      localDb.attempts = Array.from(aMap.values());
    }
    saveLocalJsonDb();
  } catch (err) {
    console.warn("\u26A0\uFE0F Cloud Firestore sync warning on startup:", err);
  }
  return {
    syncedQuestions: localDb.questions.length,
    syncedTests: localDb.mockTests.length,
    syncedAttempts: localDb.attempts.length
  };
}
async function getAllQuestions(filters) {
  let filtered = [...localDb.questions];
  if (filters?.subject) filtered = filtered.filter((q) => q.subject === filters.subject);
  if (filters?.topic) filtered = filtered.filter((q) => q.topic === filters.topic);
  if (filters?.subtopic) filtered = filtered.filter((q) => q.subtopic === filters.subtopic);
  if (filters?.difficulty) filtered = filtered.filter((q) => q.difficulty === filters.difficulty);
  if (filters?.category) filtered = filtered.filter((q) => q.category === filters.category);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      (q) => (q.questionText || q.question || "").toLowerCase().includes(s) || q.questionHindi && q.questionHindi.toLowerCase().includes(s) || (q.topic || "").toLowerCase().includes(s)
    );
  }
  return filtered;
}
async function getQuestionById(id) {
  return localDb.questions.find((q) => q.id === id) || null;
}
async function saveQuestion(q) {
  const idx = localDb.questions.findIndex((x) => x.id === q.id);
  if (idx !== -1) {
    localDb.questions[idx] = q;
  } else {
    localDb.questions.unshift(q);
  }
  saveLocalJsonDb();
  const db = getFirestoreServer();
  if (db && q.id) {
    try {
      await (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "questions", q.id), q, { merge: true });
    } catch (err) {
      console.warn(`Firestore sync note for question [${q.id}]:`, err);
    }
  }
  return q;
}
async function deleteQuestion(id) {
  const before = localDb.questions.length;
  localDb.questions = localDb.questions.filter((q) => q.id !== id);
  saveLocalJsonDb();
  const db = getFirestoreServer();
  if (db) {
    try {
      await (0, import_firestore2.deleteDoc)((0, import_firestore2.doc)(db, "questions", id));
    } catch (err) {
      console.warn(`Firestore delete note for question [${id}]:`, err);
    }
  }
  return before !== localDb.questions.length;
}
async function getAllMockTests(filters) {
  let list = [...localDb.mockTests];
  if (filters?.publishedOnly) {
    list = list.filter((t) => t.isPublished !== false);
  }
  if (filters?.category && filters.category !== "ALL") {
    list = list.filter((t) => t.category === filters.category);
  }
  return list;
}
async function getMockTestById(id) {
  return localDb.mockTests.find((t) => t.id === id) || null;
}
async function saveMockTest(t) {
  const idx = localDb.mockTests.findIndex((x) => x.id === t.id);
  if (idx !== -1) {
    localDb.mockTests[idx] = t;
  } else {
    localDb.mockTests.unshift(t);
  }
  saveLocalJsonDb();
  const db = getFirestoreServer();
  if (db && t.id) {
    try {
      await (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "mockTests", t.id), t, { merge: true });
    } catch (err) {
      console.warn(`Firestore sync note for mock test [${t.id}]:`, err);
    }
  }
  return t;
}
async function deleteMockTest(id) {
  const before = localDb.mockTests.length;
  localDb.mockTests = localDb.mockTests.filter((t) => t.id !== id);
  saveLocalJsonDb();
  const db = getFirestoreServer();
  if (db) {
    try {
      await (0, import_firestore2.deleteDoc)((0, import_firestore2.doc)(db, "mockTests", id));
    } catch (err) {
      console.warn(`Firestore delete note for test [${id}]:`, err);
    }
  }
  return before !== localDb.mockTests.length;
}
async function getAllPypPapers(category) {
  let list = [...localDb.pypPapers];
  if (category) {
    list = list.filter((p) => p.examCategory === category);
  }
  return list;
}
async function savePypPaper(p) {
  const idx = localDb.pypPapers.findIndex((x) => x.id === p.id);
  if (idx !== -1) {
    localDb.pypPapers[idx] = p;
  } else {
    localDb.pypPapers.unshift(p);
  }
  saveLocalJsonDb();
  const db = getFirestoreServer();
  if (db && p.id) {
    try {
      await (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "pypPapers", p.id), p, { merge: true });
    } catch (err) {
      console.warn(`Firestore sync note for PYP [${p.id}]:`, err);
    }
  }
  return p;
}
async function getAllTestAttempts(userId) {
  let list = [...localDb.attempts];
  if (userId) {
    list = list.filter((a) => a.userId === userId);
  }
  return list;
}
async function getTestAttemptById(id) {
  return localDb.attempts.find((a) => a.id === id) || null;
}
async function saveTestAttempt(a) {
  localDb.attempts.unshift(a);
  saveLocalJsonDb();
  const db = getFirestoreServer();
  if (db && a.id) {
    try {
      await (0, import_firestore2.setDoc)((0, import_firestore2.doc)(db, "attempts", a.id), a, { merge: true });
    } catch (err) {
      console.warn(`Firestore sync note for attempt [${a.id}]:`, err);
    }
  }
  return a;
}
async function getDatabaseCounts() {
  return {
    questions: localDb.questions.length,
    mockTests: localDb.mockTests.length,
    pypPapers: localDb.pypPapers.length,
    attempts: localDb.attempts.length
  };
}
function getLocalSnapshot() {
  return localDb;
}
var cmsPagesDb = [...INITIAL_CMS_PAGES];
var cmsPostsDb = [...INITIAL_CMS_POSTS];
var cmsSeriesDb = [...INITIAL_CMS_SERIES_PACKS];
var cmsSettingsDb = { ...INITIAL_CMS_SETTINGS };
async function getAllCmsPages() {
  return cmsPagesDb;
}
async function getCmsPageBySlug(slug) {
  return cmsPagesDb.find((p) => p.slug === slug) || null;
}
async function saveCmsPage(page) {
  const idx = cmsPagesDb.findIndex((p) => p.id === page.id);
  if (idx !== -1) cmsPagesDb[idx] = page;
  else cmsPagesDb.unshift(page);
  return page;
}
async function deleteCmsPage(id) {
  const before = cmsPagesDb.length;
  cmsPagesDb = cmsPagesDb.filter((p) => p.id !== id);
  return before !== cmsPagesDb.length;
}
async function getAllCmsPosts() {
  return cmsPostsDb;
}
async function getCmsPostBySlug(slug) {
  return cmsPostsDb.find((p) => p.slug === slug) || null;
}
async function saveCmsPost(post) {
  const idx = cmsPostsDb.findIndex((p) => p.id === post.id);
  if (idx !== -1) cmsPostsDb[idx] = post;
  else cmsPostsDb.unshift(post);
  return post;
}
async function deleteCmsPost(id) {
  const before = cmsPostsDb.length;
  cmsPostsDb = cmsPostsDb.filter((p) => p.id !== id);
  return before !== cmsPostsDb.length;
}
async function getAllCmsSeriesPacks() {
  return cmsSeriesDb;
}
async function saveCmsSeriesPack(pack) {
  const idx = cmsSeriesDb.findIndex((p) => p.id === pack.id);
  if (idx !== -1) cmsSeriesDb[idx] = pack;
  else cmsSeriesDb.unshift(pack);
  return pack;
}
async function deleteCmsSeriesPack(id) {
  const before = cmsSeriesDb.length;
  cmsSeriesDb = cmsSeriesDb.filter((p) => p.id !== id);
  return before !== cmsSeriesDb.length;
}
async function getCmsSettings() {
  return cmsSettingsDb;
}
async function saveCmsSettings(settings) {
  cmsSettingsDb = settings;
  return cmsSettingsDb;
}

// server/db/migrator.ts
async function bootstrapAndMigrate() {
  console.log(`\u{1F50C} Initializing Database in [FIRESTORE ENTERPRISE] mode (Database: ${dbConfig.databaseId})...`);
  const syncResults = await syncWithFirestore();
  const snapshot = getLocalSnapshot();
  console.log(
    `\u2705 Cloud Firestore synchronized: ${syncResults.syncedQuestions} questions, ${syncResults.syncedTests} tests, ${snapshot.pypPapers.length} PYPs, ${syncResults.syncedAttempts} attempts.`
  );
  return {
    success: true,
    message: `Cloud Firestore Enterprise active (${dbConfig.databaseId})`,
    stats: {
      questions: snapshot.questions.length,
      mockTests: snapshot.mockTests.length,
      pypPapers: snapshot.pypPapers.length,
      attempts: snapshot.attempts.length
    }
  };
}

// server.ts
var import_meta = {};
import_dotenv2.default.config();
var getFilename = () => {
  try {
    return (0, import_url.fileURLToPath)(import_meta.url);
  } catch {
    return typeof __filename !== "undefined" ? __filename : "";
  }
};
var getDirname = () => {
  try {
    return import_path3.default.dirname((0, import_url.fileURLToPath)(import_meta.url));
  } catch {
    return typeof __dirname !== "undefined" ? __dirname : process.cwd();
  }
};
var appFilename = getFilename();
var appDirname = getDirname();
var SERVER_BOOT_TIME = (/* @__PURE__ */ new Date()).toISOString();
function getBuildInfo() {
  let commitSha = process.env.GITHUB_SHA || "unknown";
  let buildTime = process.env.BUILD_TIME || "unknown";
  const versionCandidates = [
    import_path3.default.join(process.cwd(), "dist", "version.json"),
    import_path3.default.join(process.cwd(), "version.json"),
    import_path3.default.join(appDirname, "version.json")
  ];
  for (const f of versionCandidates) {
    if (import_fs3.default.existsSync(f)) {
      try {
        const raw = JSON.parse(import_fs3.default.readFileSync(f, "utf-8"));
        if (raw.commitSha && commitSha === "unknown") commitSha = raw.commitSha;
        if (raw.buildTime && buildTime === "unknown") buildTime = raw.buildTime;
        break;
      } catch (_) {
      }
    }
  }
  return { commitSha, buildTime };
}
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function autoClassifyChapter(text, defaultSubject, defaultTopic) {
  const lower = text.toLowerCase();
  if (lower.includes("\u0939\u093E\u0928\u093E") || lower.includes("hana") || lower.includes("\u091C\u0928\u0909\u0932\u093E") || lower.includes("janula") || lower.includes("\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C\u0940") || lower.includes("chhattisgarhi") || lower.includes("\u092D\u093E\u0916\u093E") || lower.includes("\u0939\u0932\u092C\u0940 \u092C\u094B\u0932\u0940") || lower.includes("\u0917\u094B\u0902\u0921\u0940 \u092C\u094B\u0932\u0940")) {
    return {
      subject: "Chhattisgarhi Language",
      topic: lower.includes("\u0939\u093E\u0928\u093E") || lower.includes("\u091C\u0928\u0909\u0932\u093E") ? "Chhattisgarhi Hana & Janula" : "Chhattisgarhi Vyakaran",
      chapterName: lower.includes("\u0939\u093E\u0928\u093E") || lower.includes("\u091C\u0928\u0909\u0932\u093E") ? "Chhattisgarhi Hana & Janula (\u0939\u093E\u0928\u093E \u090F\u0935\u0902 \u091C\u0928\u0909\u0932\u093E)" : "Chhattisgarhi Vyakaran (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C\u0940 \u0935\u094D\u092F\u093E\u0915\u0930\u0923)",
      subtopic: lower.includes("\u0939\u093E\u0928\u093E") ? "Prasiddha Hana (Idioms)" : lower.includes("\u091C\u0928\u0909\u0932\u093E") ? "Janula (Riddles)" : "Chhattisgarhi Shabdkosh"
    };
  }
  if (lower.includes("\u0938\u0902\u0927\u093F") || lower.includes("\u0938\u092E\u093E\u0938") || lower.includes("\u092A\u0930\u094D\u092F\u093E\u092F\u0935\u093E\u091A\u0940") || lower.includes("\u0935\u093F\u0932\u094B\u092E") || lower.includes("\u0909\u092A\u0938\u0930\u094D\u0917") || lower.includes("\u092A\u094D\u0930\u0924\u094D\u092F\u092F") || lower.includes("\u0924\u0924\u094D\u0938\u092E") || lower.includes("\u0924\u0926\u094D\u092D\u0935") || lower.includes("\u092E\u0941\u0939\u093E\u0935\u0930\u093E") || lower.includes("\u092E\u0941\u0939\u093E\u0935\u0930\u0947") || lower.includes("\u0932\u094B\u0915\u094B\u0915\u094D\u0924\u093F") || lower.includes("\u0935\u0930\u094D\u0924\u0928\u0940") || lower.includes("\u0935\u093E\u0915\u094D\u092F \u0936\u0941\u0926\u094D\u0927\u093F") || lower.includes("\u0938\u0902\u091C\u094D\u091E\u093E") && !lower.includes("\u0917\u094B\u0902\u0921") || lower.includes("\u0938\u0930\u094D\u0935\u0928\u093E\u092E") || lower.includes("\u0935\u093F\u0936\u0947\u0937\u0923") || lower.includes("\u0915\u093E\u0930\u0915") || lower.includes("\u0905\u0932\u0902\u0915\u093E\u0930")) {
    return {
      subject: "General Hindi",
      topic: lower.includes("\u0938\u0902\u0927\u093F") || lower.includes("\u0938\u092E\u093E\u0938") ? "Sandhi & Samas" : "Hindi Vyakaran & Varnamala",
      chapterName: "General Hindi (\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0939\u093F\u0928\u094D\u0926\u0940)",
      subtopic: lower.includes("\u0938\u0902\u0927\u093F") ? "Swar & Vyanjan Sandhi" : lower.includes("\u0938\u092E\u093E\u0938") ? "Samas Bhed" : "Vocabulary & Vyakaran"
    };
  }
  if (lower.includes("computer") || lower.includes("\u0915\u0902\u092A\u094D\u092F\u0942\u091F\u0930") || lower.includes("cpu") || lower.includes("\u0938\u0940\u092A\u0940\u092F\u0942") || lower.includes("ram") || lower.includes("rom") || lower.includes("\u0930\u0948\u092E") || lower.includes("\u0930\u094B\u092E") || lower.includes("motherboard") || lower.includes("hardware") || lower.includes("\u0939\u093E\u0930\u094D\u0921\u0935\u0947\u092F\u0930") || lower.includes("software") || lower.includes("\u0938\u0949\u092B\u094D\u091F\u0935\u0947\u092F\u0930") || lower.includes("operating system") || lower.includes("\u0911\u092A\u0930\u0947\u091F\u093F\u0902\u0917 \u0938\u093F\u0938\u094D\u091F\u092E") || lower.includes("ms word") || lower.includes("ms excel") || lower.includes("powerpoint") || lower.includes("spreadsheet") || lower.includes("word processor") || lower.includes("internet") || lower.includes("\u0907\u0902\u091F\u0930\u0928\u0947\u091F") || lower.includes("browser") || lower.includes("\u092C\u094D\u0930\u093E\u0909\u091C\u093C\u0930") || lower.includes("firewall") || lower.includes("\u092B\u093E\u092F\u0930\u0935\u0949\u0932") || lower.includes("malware") || lower.includes("antivirus") || lower.includes("\u0935\u093E\u092F\u0930\u0938") || lower.includes("ip address") || lower.includes("protocol") || lower.includes("binary") || lower.includes("printer") || lower.includes("cache memory") || lower.includes("e-mail")) {
    return {
      subject: "Computer Knowledge",
      topic: lower.includes("ms ") || lower.includes("operating") || lower.includes("word") || lower.includes("excel") ? "Operating Systems & Software" : lower.includes("internet") || lower.includes("browser") || lower.includes("firewall") || lower.includes("malware") ? "Internet & Cybersecurity" : "Computer Fundamentals",
      chapterName: "Computer Knowledge (\u0915\u0902\u092A\u094D\u092F\u0942\u091F\u0930 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928)",
      subtopic: lower.includes("internet") ? "Internet & Cybersecurity" : "MS Office & Architecture"
    };
  }
  if (lower.includes("\u092A\u094D\u0930\u0924\u093F\u0936\u0924") || lower.includes("percentage") || lower.includes("\u0905\u0928\u0941\u092A\u093E\u0924") || lower.includes("ratio") || lower.includes("\u0938\u092E\u093E\u0928\u0941\u092A\u093E\u0924") || lower.includes("proportion") || lower.includes("\u0932\u093E\u092D") || lower.includes("\u0939\u093E\u0928\u093F") || lower.includes("profit") || lower.includes("loss") || lower.includes("\u0915\u094D\u0930\u092F \u092E\u0942\u0932\u094D\u092F") || lower.includes("\u0935\u093F\u0915\u094D\u0930\u092F \u092E\u0942\u0932\u094D\u092F") || lower.includes("\u092C\u091F\u094D\u091F\u093E") || lower.includes("\u091B\u0942\u091F") || lower.includes("discount") || lower.includes("\u0938\u093E\u0927\u093E\u0930\u0923 \u092C\u094D\u092F\u093E\u091C") || lower.includes("simple interest") || lower.includes("\u091A\u0915\u094D\u0930\u0935\u0943\u0926\u094D\u0927\u093F \u092C\u094D\u092F\u093E\u091C") || lower.includes("compound interest") || lower.includes("\u0938\u092E\u092F \u0914\u0930 \u0915\u093E\u0930\u094D\u092F") || lower.includes("time and work") || lower.includes("\u091A\u093E\u0932") || lower.includes("\u0926\u0942\u0930\u0940") || lower.includes("speed") || lower.includes("distance") || lower.includes("\u0914\u0938\u0924") || lower.includes("average") || lower.includes("\u0932.\u0938.") || lower.includes("\u092E.\u0938.") || lower.includes("lcm") || lower.includes("hcf") || lower.includes("\u0938\u0902\u0916\u094D\u092F\u093E \u092A\u0926\u094D\u0927\u0924\u093F") || lower.includes("number system") || lower.includes("\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u092B\u0932") || lower.includes("\u0906\u092F\u0924\u0928") || lower.includes("mensuration") || lower.includes("\u092A\u093E\u0908 \u091A\u093E\u0930\u094D\u091F") || lower.includes("bar graph")) {
    return {
      subject: "Quantitative Aptitude",
      topic: "Arithmetic & Commercial Mathematics",
      chapterName: "Quantitative Aptitude (\u0938\u0902\u0916\u094D\u092F\u093E\u0924\u094D\u092E\u0915 \u0905\u092D\u093F\u0915\u094D\u0937\u092E\u0924\u093E)",
      subtopic: lower.includes("\u092A\u094D\u0930\u0924\u093F\u0936\u0924") || lower.includes("percentage") ? "Percentages & Profit-Loss" : "Ratio & Commercial Maths"
    };
  }
  if (lower.includes("\u0930\u0940\u091C\u0928\u093F\u0902\u0917") || lower.includes("reasoning") || lower.includes("\u0915\u094B\u0921\u093F\u0902\u0917") || lower.includes("coding") || lower.includes("decoding") || lower.includes("\u0930\u0915\u094D\u0924 \u0938\u0902\u092C\u0902\u0927") || lower.includes("blood relation") || lower.includes("\u0926\u093F\u0936\u093E \u091C\u094D\u091E\u093E\u0928") || lower.includes("direction sense") || lower.includes("\u0928\u094D\u092F\u093E\u092F \u0928\u093F\u0917\u092E\u0928") || lower.includes("syllogism") || lower.includes("\u0915\u0925\u0928 \u0914\u0930 \u0928\u093F\u0937\u094D\u0915\u0930\u094D\u0937") || lower.includes("statement and conclusion") || lower.includes("\u0915\u0925\u0928 \u0914\u0930 \u092A\u0942\u0930\u094D\u0935\u0927\u093E\u0930\u0923\u093E") || lower.includes("seating arrangement") || lower.includes("\u092C\u0948\u0920\u0915 \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E") || lower.includes("\u0935\u0947\u0928 \u0906\u0930\u0947\u0916") || lower.includes("venn diagram") || lower.includes("\u092A\u093E\u0938\u093E") || lower.includes("dice") || lower.includes("\u0915\u0948\u0932\u0947\u0902\u0921\u0930") || lower.includes("calendar") || lower.includes("\u0918\u0921\u093C\u0940") || lower.includes("clock") || lower.includes("\u0926\u0930\u094D\u092A\u0923 \u092A\u094D\u0930\u0924\u093F\u092C\u093F\u0902\u092C") || lower.includes("mirror image") || lower.includes("\u0936\u094D\u0930\u0943\u0902\u0916\u0932\u093E") || lower.includes("number series") || lower.includes("missing number")) {
    return {
      subject: "Reasoning",
      topic: "Verbal & Analytical Reasoning",
      chapterName: "Analytical & Logical Reasoning (\u0924\u0930\u094D\u0915\u0936\u0915\u094D\u0924\u093F)",
      subtopic: lower.includes("coding") ? "Coding-Decoding" : lower.includes("blood") ? "Blood Relations" : "Logical Deductions"
    };
  }
  if (lower.includes("\u092A\u094D\u0930\u0915\u093E\u0936 \u0935\u0930\u094D\u0937") || lower.includes("light year") || lower.includes("\u0928\u094D\u092F\u0942\u091F\u0928") || lower.includes("\u0917\u0941\u0930\u0941\u0924\u094D\u0935\u093E\u0915\u0930\u094D\u0937\u0923") || lower.includes("gravity") || lower.includes("\u0935\u093F\u0926\u094D\u092F\u0941\u0924 \u0927\u093E\u0930\u093E") || lower.includes("\u0906\u0935\u0930\u094D\u0924 \u0938\u093E\u0930\u0923\u0940") || lower.includes("periodic table") || lower.includes("\u092A\u0930\u092E\u093E\u0923\u0941") || lower.includes("\u0905\u0923\u0941") || lower.includes("\u0905\u092E\u094D\u0932") || lower.includes("acid") || lower.includes("\u0915\u094D\u0937\u093E\u0930") || lower.includes("base") || lower.includes("\u0915\u094B\u0936\u093F\u0915\u093E") || lower.includes("cell") || lower.includes("\u092E\u093E\u0907\u091F\u094B\u0915\u0949\u0928\u094D\u0921\u094D\u0930\u093F\u092F\u093E") || lower.includes("mitochondria") || lower.includes("\u0921\u0940\u090F\u0928\u090F") || lower.includes("dna") || lower.includes("\u0906\u0930\u090F\u0928\u090F") || lower.includes("\u092A\u094D\u0930\u0915\u093E\u0936 \u0938\u0902\u0936\u094D\u0932\u0947\u0937\u0923") || lower.includes("photosynthesis") || lower.includes("\u0930\u0915\u094D\u0924 \u0938\u092E\u0942\u0939") || lower.includes("blood group") || lower.includes("\u0935\u093F\u091F\u093E\u092E\u093F\u0928") || lower.includes("vitamin") || lower.includes("\u091C\u0940\u0935\u093E\u0923\u0941") || lower.includes("bacteria") || lower.includes("\u0935\u093F\u0937\u093E\u0923\u0941") || lower.includes("virus") || lower.includes("\u0913\u091C\u094B\u0928") || lower.includes("ozone") || lower.includes("\u092A\u093E\u0930\u093F\u0938\u094D\u0925\u093F\u0924\u093F\u0915\u0940") || lower.includes("ecosystem")) {
    return {
      subject: "General Science",
      topic: lower.includes("\u0915\u094B\u0936\u093F\u0915\u093E") || lower.includes("\u0921\u0940\u090F\u0928\u090F") || lower.includes("\u0935\u093F\u091F\u093E\u092E\u093F\u0928") || lower.includes("\u091C\u0940\u0935\u093E\u0923\u0941") || lower.includes("photosynthesis") ? "Biology & Environmental Ecology" : lower.includes("\u0905\u092E\u094D\u0932") || lower.includes("\u0906\u0935\u0930\u094D\u0924 \u0938\u093E\u0930\u0923\u0940") || lower.includes("\u092A\u0930\u092E\u093E\u0923\u0941") ? "Chemistry" : "Physics",
      chapterName: "General Science (\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0935\u093F\u091C\u094D\u091E\u093E\u0928)",
      subtopic: "Core Science Concepts"
    };
  }
  if (lower.includes("pedagogy") || lower.includes("\u092C\u093E\u0932 \u0935\u093F\u0915\u093E\u0938") || lower.includes("\u0936\u093F\u0915\u094D\u0937\u093E \u0936\u093E\u0938\u094D\u0924\u094D\u0930") || lower.includes("\u092A\u093F\u092F\u093E\u091C\u0947") || lower.includes("piaget") || lower.includes("\u0935\u093E\u092F\u0917\u094B\u0924\u094D\u0938\u094D\u0915\u0940") || lower.includes("vygotsky") || lower.includes("\u0938\u092E\u093E\u0935\u0947\u0936\u0940 \u0936\u093F\u0915\u094D\u0937\u093E") || lower.includes("cce") || lower.includes("nep 2020")) {
    return {
      subject: "Child Pedagogy & Teaching Methodology",
      topic: "Educational Psychology",
      chapterName: "Child Pedagogy & Methodology (\u092C\u093E\u0932 \u0935\u093F\u0915\u093E\u0938 \u090F\u0935\u0902 \u0936\u093F\u0915\u094D\u0937\u093E \u0936\u093E\u0938\u094D\u0924\u094D\u0930)",
      subtopic: "Child Development & Learning"
    };
  }
  const hasCGIdentifier = lower.includes("\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C") || lower.includes("chhattisgarh") || lower.includes("\u0915\u0932\u091A\u0941\u0930\u0940") || lower.includes("kalchuri") || lower.includes("\u0930\u0924\u0928\u092A\u0941\u0930") || lower.includes("ratanpur") || lower.includes("\u0924\u0941\u092E\u094D\u092E\u093E\u0923") || lower.includes("tumman") || lower.includes("\u092C\u0938\u094D\u0924\u0930") || lower.includes("bastar") || lower.includes("\u0938\u0930\u0917\u0941\u091C\u093E") || lower.includes("surguja") || lower.includes("\u0930\u093E\u092F\u092A\u0941\u0930") || lower.includes("raipur") || lower.includes("\u092C\u093F\u0932\u093E\u0938\u092A\u0941\u0930") || lower.includes("bilaspur") || lower.includes("\u092E\u0939\u093E\u0928\u0926\u0940") || lower.includes("mahanadi") || lower.includes("\u0907\u0902\u0926\u094D\u0930\u093E\u0935\u0924\u0940") || lower.includes("indravati") || lower.includes("\u0936\u093F\u0935\u0928\u093E\u0925") || lower.includes("shivnath") || lower.includes("\u0939\u0938\u0926\u0947\u0935") || lower.includes("hasdeo") || lower.includes("\u091A\u093F\u0924\u094D\u0930\u0915\u094B\u091F") || lower.includes("chitrakote") || lower.includes("\u0924\u0940\u0930\u0925\u0917\u0922\u093C") || lower.includes("teerathgarh") || lower.includes("\u0915\u093E\u0902\u0917\u0947\u0930") || lower.includes("kanger") || lower.includes("\u0917\u094B\u0902\u0921") || lower.includes("\u092C\u0948\u0917\u093E") || lower.includes("\u092E\u093E\u0921\u093C\u093F\u092F\u093E") || lower.includes("\u092E\u0941\u0930\u093F\u092F\u093E") || lower.includes("\u0939\u0932\u094D\u092C\u093E") || lower.includes("\u0915\u092E\u0930") || lower.includes("\u092D\u0941\u0902\u091C\u093F\u092F\u093E") || lower.includes("\u092A\u0902\u0921\u0935\u093E\u0928\u0940") || lower.includes("pandwani") || lower.includes("\u092A\u0902\u0925\u0940") || lower.includes("panthi") || lower.includes("\u0915\u0930\u092E\u093E") || lower.includes("karma") || lower.includes("\u0930\u093E\u0909\u0924 \u0928\u093E\u091A\u093E") || lower.includes("raut nacha") || lower.includes("\u092E\u0921\u093C\u0908") || lower.includes("madai") || lower.includes("\u0924\u0940\u091C\u093E") || lower.includes("\u092A\u094B\u0932\u093E") || lower.includes("\u0939\u0930\u0947\u0932\u0940") || lower.includes("\u091B\u0947\u0930\u091B\u0947\u0930\u093E") || lower.includes("\u092D\u0942\u092E\u0915\u093E\u0932") || lower.includes("bhumkal") || lower.includes("\u0924\u093E\u0930\u093E\u092A\u0941\u0930 \u0935\u093F\u0926\u094D\u0930\u094B\u0939") || lower.includes("\u0915\u093E\u0915\u0924\u0940\u092F") || lower.includes("kakatiya") || lower.includes("\u0917\u094B\u0927\u0928 \u0928\u094D\u092F\u093E\u092F") || lower.includes("\u0938\u0941\u0930\u093E\u091C\u0940 \u0917\u093E\u0902\u0935") || lower.includes("\u092E\u0939\u0924\u093E\u0930\u0940 \u0935\u0902\u0926\u0928") || lower.includes("\u092E\u0948\u0928\u092A\u093E\u091F") || lower.includes("\u0938\u093E\u092E\u0930\u0940\u092A\u093E\u091F") || lower.includes("\u0917\u094C\u0930\u0932\u093E\u091F\u093E") || lower.includes("\u0926\u0902\u0924\u0947\u0935\u093E\u0921\u093C\u093E") || lower.includes("\u0915\u093E\u0902\u0915\u0947\u0930") || lower.includes("\u0938\u0941\u0915\u092E\u093E") || lower.includes("\u0927\u092E\u0924\u0930\u0940") || lower.includes("\u0915\u0935\u0930\u094D\u0927\u093E") || lower.includes("\u0926\u0941\u0930\u094D\u0917") || lower.includes("\u0915\u094B\u0930\u092C\u093E") || lower.includes("\u0930\u093E\u092F\u0917\u0922\u093C") || lower.includes("\u091C\u0936\u092A\u0941\u0930") || lower.includes("\u0930\u093E\u091C\u0928\u093E\u0902\u0926\u0917\u093E\u0902\u0935") || lower.includes("\u091C\u093E\u0902\u091C\u0917\u0940\u0930") || lower.includes("\u0915\u094B\u0930\u093F\u092F\u093E") || lower.includes("\u092C\u0932\u0930\u093E\u092E\u092A\u0941\u0930") || lower.includes("\u0938\u0942\u0930\u091C\u092A\u0941\u0930") || lower.includes("\u092C\u0947\u092E\u0947\u0924\u0930\u093E") || lower.includes("\u092C\u093E\u0932\u094B\u0926") || lower.includes("\u0917\u0930\u093F\u092F\u093E\u092C\u0902\u0926") || lower.includes("\u092E\u0939\u093E\u0938\u092E\u0941\u0902\u0926") || lower.includes("\u092E\u0941\u0902\u0917\u0947\u0932\u0940") || lower.includes("\u0917\u094C\u0930\u0947\u0932\u093E") || lower.includes("\u092E\u094B\u0939\u0932\u093E") || lower.includes("\u0938\u093E\u0930\u0902\u0917\u0922\u093C") || lower.includes("\u0916\u0948\u0930\u093E\u0917\u0922\u093C") || lower.includes("\u092E\u0928\u0947\u0902\u0926\u094D\u0930\u0917\u0922\u093C") || lower.includes("\u0938\u0915\u094D\u0924\u0940") || lower.includes("\u0926\u0932\u094D\u0932\u0940 \u0930\u093E\u091C\u0939\u0930\u093E") || lower.includes("\u092C\u0948\u0932\u093E\u0921\u0940\u0932\u093E");
  const hasIndiaIdentifier = lower.includes("\u092D\u093E\u0930\u0924") || lower.includes("india") || lower.includes("indian") || lower.includes("\u092D\u093E\u0930\u0924\u0940\u092F") || lower.includes("\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F") || lower.includes("national") || lower.includes("\u0915\u0947\u0902\u0926\u094D\u0930") || lower.includes("central") || lower.includes("union") || lower.includes("\u0938\u0902\u0938\u0926") || lower.includes("parliament") || lower.includes("\u0932\u094B\u0915\u0938\u092D\u093E") || lower.includes("\u0930\u093E\u091C\u094D\u092F\u0938\u092D\u093E") || lower.includes("\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u092A\u0924\u093F") || lower.includes("supreme court") || lower.includes("\u0939\u0921\u093C\u092A\u094D\u092A\u093E") || lower.includes("\u0938\u093F\u0902\u0927\u0941 \u0918\u093E\u091F\u0940") || lower.includes("\u092E\u094C\u0930\u094D\u092F") || lower.includes("\u092E\u0941\u0917\u0932") || lower.includes("\u0917\u093E\u0902\u0927\u0940") || lower.includes("\u0939\u093F\u092E\u093E\u0932\u092F") || lower.includes("\u0917\u0902\u0917\u093E") || lower.includes("\u092F\u092E\u0941\u0928\u093E") || lower.includes("\u092C\u094D\u0930\u0939\u094D\u092E\u092A\u0941\u0924\u094D\u0930") || lower.includes("\u0906\u0930\u092C\u0940\u0906\u0908") || lower.includes("rbi") || lower.includes("\u0907\u0938\u0930\u094B") || lower.includes("isro");
  if (hasCGIdentifier) {
    if (lower.includes("\u0915\u0932\u091A\u0941\u0930\u0940") || lower.includes("kalchuri") || lower.includes("\u0930\u0924\u0928\u092A\u0941\u0930") || lower.includes("\u0924\u0941\u092E\u094D\u092E\u093E\u0923") || lower.includes("\u092E\u0930\u093E\u0920\u093E") || lower.includes("\u092D\u0942\u092E\u0915\u093E\u0932") || lower.includes("\u0915\u093E\u0915\u0924\u0940\u092F") || lower.includes("\u0935\u093F\u0926\u094D\u0930\u094B\u0939") || lower.includes("revolt") || lower.includes("\u0917\u0920\u0928") || lower.includes("\u0930\u093E\u091C\u094D\u092F \u0938\u094D\u0925\u093E\u092A\u0928\u093E") || lower.includes("\u0930\u093F\u092F\u093E\u0938\u0924") || lower.includes("\u0935\u0940\u0930 \u0928\u093E\u0930\u093E\u092F\u0923") || lower.includes("\u0938\u094B\u0928\u093E\u0916\u093E\u0928") || lower.includes("\u0917\u0941\u0902\u0921\u093E\u0927\u0942\u0930") || lower.includes("\u0938\u0924\u094D\u092F\u093E\u0917\u094D\u0930\u0939")) {
      return {
        subject: "Chhattisgarh General Studies",
        topic: "History of Chhattisgarh",
        chapterName: "History of Chhattisgarh (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0915\u093E \u0907\u0924\u093F\u0939\u093E\u0938)",
        subtopic: lower.includes("\u0915\u0932\u091A\u0941\u0930\u0940") ? "Kalchuri Dynasty" : lower.includes("\u0935\u093F\u0926\u094D\u0930\u094B\u0939") ? "Tribal Revolts & Freedom Struggle" : "State Formation & History"
      };
    }
    if (lower.includes("\u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924") || lower.includes("waterfall") || lower.includes("\u0928\u0926\u0940") || lower.includes("river") || lower.includes("\u092E\u0939\u093E\u0928\u0926\u0940") || lower.includes("\u0907\u0902\u0926\u094D\u0930\u093E\u0935\u0924\u0940") || lower.includes("\u0936\u093F\u0935\u0928\u093E\u0925") || lower.includes("\u0939\u0938\u0926\u0947\u0935") || lower.includes("\u091A\u093F\u0924\u094D\u0930\u0915\u094B\u091F") || lower.includes("\u0924\u0940\u0930\u0925\u0917\u0922\u093C") || lower.includes("\u092E\u0948\u0928\u092A\u093E\u091F") || lower.includes("\u0938\u093E\u092E\u0930\u0940\u092A\u093E\u091F") || lower.includes("\u0916\u0928\u093F\u091C") || lower.includes("mineral") || lower.includes("\u0915\u094B\u092F\u0932\u093E") || lower.includes("\u0932\u094C\u0939 \u0905\u092F\u0938\u094D\u0915") || lower.includes("\u0905\u092D\u092F\u093E\u0930\u0923\u094D\u092F") || lower.includes("\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0909\u0926\u094D\u092F\u093E\u0928") || lower.includes("\u0915\u093E\u0902\u0917\u0947\u0930 \u0918\u093E\u091F\u0940")) {
      return {
        subject: "Chhattisgarh General Studies",
        topic: "Geography & Natural Resources",
        chapterName: "Geography & Natural Resources (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u092D\u0942\u0917\u094B\u0932 \u090F\u0935\u0902 \u092A\u094D\u0930\u093E\u0915\u0943\u0924\u093F\u0915 \u0938\u0902\u0938\u093E\u0927\u0928)",
        subtopic: lower.includes("\u091C\u0932\u092A\u094D\u0930\u092A\u093E\u0924") || lower.includes("\u091A\u093F\u0924\u094D\u0930\u0915\u094B\u091F") ? "Waterfalls & River Basins" : "Minerals & Forests"
      };
    }
    if (lower.includes("\u091C\u0928\u091C\u093E\u0924\u093F") || lower.includes("tribe") || lower.includes("\u0917\u094B\u0902\u0921") || lower.includes("\u092C\u0948\u0917\u093E") || lower.includes("\u092E\u093E\u0921\u093C\u093F\u092F\u093E") || lower.includes("\u092E\u0941\u0930\u093F\u092F\u093E") || lower.includes("\u0926\u0936\u0939\u0930\u093E") || lower.includes("\u092C\u0938\u094D\u0924\u0930") || lower.includes("\u0928\u0943\u0924\u094D\u092F") || lower.includes("dance") || lower.includes("\u0915\u0930\u092E\u093E") || lower.includes("\u092A\u0902\u0925\u0940") || lower.includes("\u0930\u093E\u0909\u0924") || lower.includes("\u092A\u0902\u0921\u0935\u093E\u0928\u0940") || lower.includes("\u0926\u0902\u0924\u0947\u0936\u094D\u0935\u0930\u0940") || lower.includes("\u092E\u0921\u093C\u0908") || lower.includes("\u0939\u0930\u0947\u0932\u0940") || lower.includes("\u092A\u094B\u0932\u093E") || lower.includes("\u091B\u0947\u0930\u091B\u0947\u0930\u093E") || lower.includes("\u0918\u094B\u091F\u0941\u0932") || lower.includes("\u092E\u0947\u0932\u093E")) {
      return {
        subject: "Chhattisgarh General Studies",
        topic: "Culture, Tribes & Tourism",
        chapterName: "Culture, Tribes & Tourism (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u0938\u0902\u0938\u094D\u0915\u0943\u0924\u093F, \u091C\u0928\u091C\u093E\u0924\u093F\u092F\u093E\u0901 \u090F\u0935\u0902 \u092A\u0930\u094D\u092F\u091F\u0928)",
        subtopic: lower.includes("\u0926\u0936\u0939\u0930\u093E") || lower.includes("\u092E\u0921\u093C\u0908") ? "Bastar Dussehra & Fairs" : lower.includes("\u0928\u0943\u0924\u094D\u092F") ? "Folk Dances" : "Tribal Traditions"
      };
    }
    return {
      subject: "Chhattisgarh General Studies",
      topic: "Administration & Economy",
      chapterName: "Administration & Economy (\u091B\u0924\u094D\u0924\u0940\u0938\u0917\u0922\u093C \u092A\u094D\u0930\u0936\u093E\u0938\u0928 \u090F\u0935\u0902 \u0905\u0930\u094D\u0925\u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E)",
      subtopic: lower.includes("\u092A\u0902\u091A\u093E\u092F\u0924") ? "Panchayati Raj in CG" : "State Governance & Schemes"
    };
  }
  if (lower.includes("\u0938\u0902\u0935\u093F\u0927\u093E\u0928") || lower.includes("constitution") || lower.includes("\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926") || lower.includes("article ") || lower.includes("\u0938\u0902\u0938\u0926") || lower.includes("parliament") || lower.includes("\u0932\u094B\u0915\u0938\u092D\u093E") || lower.includes("lok sabha") || lower.includes("\u0930\u093E\u091C\u094D\u092F\u0938\u092D\u093E") || lower.includes("rajya sabha") || lower.includes("\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u092A\u0924\u093F") || lower.includes("president of india") || lower.includes("\u0909\u092A\u0930\u093E\u0937\u094D\u091F\u094D\u0930\u092A\u0924\u093F") || lower.includes("\u092A\u094D\u0930\u0927\u093E\u0928\u092E\u0902\u0924\u094D\u0930\u0940") || lower.includes("prime minister") || lower.includes("\u0938\u0930\u094D\u0935\u094B\u091A\u094D\u091A \u0928\u094D\u092F\u093E\u092F\u093E\u0932\u092F") || lower.includes("supreme court") || lower.includes("\u0909\u091A\u094D\u091A \u0928\u094D\u092F\u093E\u092F\u093E\u0932\u092F") || lower.includes("high court") || lower.includes("\u092E\u094C\u0932\u093F\u0915 \u0905\u0927\u093F\u0915\u093E\u0930") || lower.includes("fundamental rights") || lower.includes("\u092E\u094C\u0932\u093F\u0915 \u0915\u0930\u094D\u0924\u0935\u094D\u092F") || lower.includes("fundamental duties") || lower.includes("\u0928\u0940\u0924\u093F \u0928\u093F\u0926\u0947\u0936\u0915") || lower.includes("dpsp") || lower.includes("\u092A\u094D\u0930\u0938\u094D\u0924\u093E\u0935\u0928\u093E") || lower.includes("preamble") || lower.includes("\u0928\u093F\u0930\u094D\u0935\u093E\u091A\u0928 \u0906\u092F\u094B\u0917") || lower.includes("election commission") || lower.includes("\u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0915 \u090F\u0935\u0902 \u092E\u0939\u093E\u0932\u0947\u0916\u093E") || lower.includes("cag") || lower.includes("\u0938\u0902\u0918 \u0932\u094B\u0915 \u0938\u0947\u0935\u093E") || lower.includes("upsc") || lower.includes("\u0935\u093F\u0924\u094D\u0924 \u0906\u092F\u094B\u0917") || lower.includes("finance commission") || lower.includes("\u0938\u0902\u0935\u093F\u0927\u093E\u0928 \u0938\u0902\u0936\u094B\u0927\u0928") || lower.includes("amendment") || lower.includes("\u0928\u094D\u092F\u093E\u092F\u092A\u093E\u0932\u093F\u0915\u093E") || lower.includes("judiciary")) {
    return {
      subject: "India General Studies",
      topic: "Indian Polity & Constitution",
      chapterName: "Indian Polity & Constitution (\u092D\u093E\u0930\u0924\u0940\u092F \u0938\u0902\u0935\u093F\u0927\u093E\u0928 \u090F\u0935\u0902 \u0930\u093E\u091C\u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E)",
      subtopic: lower.includes("\u0905\u0928\u0941\u091A\u094D\u091B\u0947\u0926") || lower.includes("\u092E\u094C\u0932\u093F\u0915 \u0905\u0927\u093F\u0915\u093E\u0930") ? "Fundamental Rights & Articles" : "Parliament & Governance"
    };
  }
  if (lower.includes("\u0939\u0921\u093C\u092A\u094D\u092A\u093E") || lower.includes("harappa") || lower.includes("\u0938\u093F\u0902\u0927\u0941 \u0918\u093E\u091F\u0940") || lower.includes("indus valley") || lower.includes("\u092E\u094B\u0939\u0928\u091C\u094B\u0926\u0921\u093C\u094B") || lower.includes("\u0935\u0948\u0926\u093F\u0915 \u0915\u093E\u0932") || lower.includes("vedic") || lower.includes("\u090B\u0917\u094D\u0935\u0947\u0926") || lower.includes("\u092E\u0939\u093E\u091C\u0928\u092A\u0926") || lower.includes("\u092C\u094C\u0926\u094D\u0927 \u0927\u0930\u094D\u092E") || lower.includes("buddhism") || lower.includes("\u091C\u0948\u0928 \u0927\u0930\u094D\u092E") || lower.includes("jainism") || lower.includes("\u092E\u094C\u0930\u094D\u092F") || lower.includes("maurya") || lower.includes("\u0905\u0936\u094B\u0915") || lower.includes("ashoka") || lower.includes("\u0917\u0941\u092A\u094D\u0924 \u0915\u093E\u0932") || lower.includes("gupta") || lower.includes("\u0938\u092E\u0941\u0926\u094D\u0930\u0917\u0941\u092A\u094D\u0924") || lower.includes("\u0926\u093F\u0932\u094D\u0932\u0940 \u0938\u0932\u094D\u0924\u0928\u0924") || lower.includes("delhi sultanate") || lower.includes("\u0916\u093F\u0932\u091C\u0940") || lower.includes("\u0924\u0941\u0917\u0932\u0915") || lower.includes("\u092E\u0941\u0917\u0932") || lower.includes("mughal") || lower.includes("\u092C\u093E\u092C\u0930") || lower.includes("\u0905\u0915\u092C\u0930") || lower.includes("\u0936\u093E\u0939\u091C\u0939\u093E\u0902") || lower.includes("\u0914\u0930\u0902\u0917\u091C\u0947\u092C") || lower.includes("\u0936\u093F\u0935\u093E\u091C\u0940") || lower.includes("1857") || lower.includes("\u0938\u093F\u092A\u093E\u0939\u0940 \u0935\u093F\u0926\u094D\u0930\u094B\u0939") || lower.includes("\u0915\u093E\u0902\u0917\u094D\u0930\u0947\u0938") || lower.includes("inc") || lower.includes("\u0917\u093E\u0902\u0927\u0940") || lower.includes("gandhi") || lower.includes("\u091A\u0902\u092A\u093E\u0930\u0923") || lower.includes("\u0905\u0938\u0939\u092F\u094B\u0917") || lower.includes("\u0938\u0935\u093F\u0928\u092F \u0905\u0935\u091C\u094D\u091E\u093E") || lower.includes("\u092D\u093E\u0930\u0924 \u091B\u094B\u0921\u093C\u094B") || lower.includes("\u0938\u0941\u092D\u093E\u0937 \u091A\u0902\u0926\u094D\u0930 \u092C\u094B\u0938") || lower.includes("\u092D\u0917\u0924 \u0938\u093F\u0902\u0939") || lower.includes("\u0906\u091C\u093E\u0926 \u0939\u093F\u0902\u0926") || lower.includes("\u0908\u0938\u094D\u091F \u0907\u0902\u0921\u093F\u092F\u093E \u0915\u0902\u092A\u0928\u0940") || lower.includes("\u092A\u094D\u0932\u093E\u0938\u0940") || lower.includes("\u092C\u0915\u094D\u0938\u0930") || lower.includes("\u0935\u093E\u092F\u0938\u0930\u093E\u092F") || lower.includes("\u0917\u0935\u0930\u094D\u0928\u0930 \u091C\u0928\u0930\u0932")) {
    return {
      subject: "India General Studies",
      topic: "Indian History & National Movement",
      chapterName: "Indian History & National Movement (\u092D\u093E\u0930\u0924\u0940\u092F \u0907\u0924\u093F\u0939\u093E\u0938 \u090F\u0935\u0902 \u0930\u093E\u0937\u094D\u091F\u094D\u0930\u0940\u092F \u0906\u0902\u0926\u094B\u0932\u0928)",
      subtopic: lower.includes("1857") || lower.includes("\u0917\u093E\u0902\u0927\u0940") || lower.includes("\u0915\u093E\u0902\u0917\u094D\u0930\u0947\u0938") ? "Freedom Struggle & National Movement" : "Ancient & Medieval History"
    };
  }
  if (lower.includes("\u0939\u093F\u092E\u093E\u0932\u092F") || lower.includes("himalaya") || lower.includes("\u0917\u0902\u0917\u093E \u0928\u0926\u0940") || lower.includes("ganga") || lower.includes("\u092F\u092E\u0941\u0928\u093E") || lower.includes("\u092C\u094D\u0930\u0939\u094D\u092E\u092A\u0941\u0924\u094D\u0930") || lower.includes("brahmaputra") || lower.includes("\u0938\u093F\u0902\u0927\u0941 \u0928\u0926\u0940") || lower.includes("indus river") || lower.includes("\u0917\u094B\u0926\u093E\u0935\u0930\u0940") || lower.includes("\u0915\u093E\u0935\u0947\u0930\u0940") || lower.includes("\u0915\u0943\u0937\u094D\u0923\u093E \u0928\u0926\u0940") || lower.includes("\u0928\u0930\u094D\u092E\u0926\u093E") || lower.includes("\u0924\u093E\u092A\u094D\u0924\u0940") || lower.includes("\u092A\u0936\u094D\u091A\u093F\u092E\u0940 \u0918\u093E\u091F") || lower.includes("western ghats") || lower.includes("\u092A\u0942\u0930\u094D\u0935\u0940 \u0918\u093E\u091F") || lower.includes("\u092E\u093E\u0928\u0938\u0942\u0928") || lower.includes("monsoon") || lower.includes("\u0915\u0930\u094D\u0915 \u0930\u0947\u0916\u093E") || lower.includes("tropic of cancer") || lower.includes("\u0905\u0902\u0921\u092E\u093E\u0928") || lower.includes("andaman") || lower.includes("\u0928\u093F\u0915\u094B\u092C\u093E\u0930") || lower.includes("\u0932\u0915\u094D\u0937\u0926\u094D\u0935\u0940\u092A") || lower.includes("lakshadweep") || lower.includes("\u0925\u093E\u0930 \u092E\u0930\u0941\u0938\u094D\u0925\u0932") || lower.includes("\u0928\u0940\u0932\u0917\u093F\u0930\u0940") || lower.includes("\u0938\u0941\u0902\u0926\u0930\u0935\u0928") || lower.includes("\u0905\u0930\u093E\u0935\u0932\u0940")) {
    return {
      subject: "India General Studies",
      topic: "Physical & Economic Geography of India",
      chapterName: "Geography of India (\u092D\u093E\u0930\u0924 \u0915\u093E \u092D\u0942\u0917\u094B\u0932)",
      subtopic: lower.includes("\u0939\u093F\u092E\u093E\u0932\u092F") || lower.includes("\u092A\u0930\u094D\u0935\u0924") ? "Himalayas & Physiography" : "River Systems & Climate"
    };
  }
  if (lower.includes("\u0930\u093F\u091C\u0930\u094D\u0935 \u092C\u0948\u0902\u0915") || lower.includes("rbi") || lower.includes("\u0930\u0947\u092A\u094B \u0930\u0947\u091F") || lower.includes("repo rate") || lower.includes("\u092E\u094C\u0926\u094D\u0930\u093F\u0915 \u0928\u0940\u0924\u093F") || lower.includes("monetary policy") || lower.includes("\u092A\u0902\u091A\u0935\u0930\u094D\u0937\u0940\u092F \u092F\u094B\u091C\u0928\u093E") || lower.includes("five year plan") || lower.includes("\u0928\u0940\u0924\u093F \u0906\u092F\u094B\u0917") || lower.includes("niti aayog") || lower.includes("\u0938\u0915\u0932 \u0918\u0930\u0947\u0932\u0942 \u0909\u0924\u094D\u092A\u093E\u0926") || lower.includes("gdp") || lower.includes("\u092E\u0941\u0926\u094D\u0930\u093E\u0938\u094D\u092B\u0940\u0924\u093F") || lower.includes("inflation") || lower.includes("\u0930\u093E\u091C\u0915\u094B\u0937\u0940\u092F \u0918\u093E\u091F\u093E") || lower.includes("fiscal deficit") || lower.includes("\u0938\u0947\u092C\u0940") || lower.includes("sebi") || lower.includes("\u0928\u093E\u092C\u093E\u0930\u094D\u0921") || lower.includes("nabard")) {
    return {
      subject: "India General Studies",
      topic: "Indian Economy & Development",
      chapterName: "Indian Economy & Development (\u092D\u093E\u0930\u0924\u0940\u092F \u0905\u0930\u094D\u0925\u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E)",
      subtopic: lower.includes("rbi") || lower.includes("\u092C\u0948\u0902\u0915") ? "Banking & Monetary Policy" : "Economic Planning & Indicators"
    };
  }
  if (lower.includes("\u0928\u094B\u092C\u0947\u0932") || lower.includes("nobel") || lower.includes("\u092D\u093E\u0930\u0924 \u0930\u0924\u094D\u0928") || lower.includes("bharat ratna") || lower.includes("\u092A\u0926\u094D\u092E") || lower.includes("padma") || lower.includes("\u0907\u0938\u0930\u094B") || lower.includes("isro") || lower.includes("\u091A\u0902\u0926\u094D\u0930\u092F\u093E\u0928") || lower.includes("chandrayaan") || lower.includes("\u0921\u0940\u0906\u0930\u0921\u0940\u0913") || lower.includes("drdo") || lower.includes("\u0938\u0902\u092F\u0941\u0915\u094D\u0924 \u0930\u093E\u0937\u094D\u091F\u094D\u0930") || lower.includes("united nations") || lower.includes("g20") || lower.includes("brics") || lower.includes("\u0935\u093F\u0936\u094D\u0935 \u092C\u0948\u0902\u0915") || lower.includes("world bank") || lower.includes("\u0913\u0932\u0902\u092A\u093F\u0915") || lower.includes("olympic")) {
    return {
      subject: "India General Studies",
      topic: "National Current Affairs & General Knowledge",
      chapterName: "Current Affairs & GK (\u0938\u092E\u0938\u093E\u092E\u092F\u093F\u0915 \u0918\u091F\u0928\u093E\u090F\u0902 \u090F\u0935\u0902 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928)",
      subtopic: lower.includes("isro") ? "Space & Science Missions" : "Awards & International Affairs"
    };
  }
  if (hasIndiaIdentifier) {
    return {
      subject: "India General Studies",
      topic: "National Current Affairs & General Knowledge",
      chapterName: "Current Affairs & GK (\u0938\u092E\u0938\u093E\u092E\u092F\u093F\u0915 \u0918\u091F\u0928\u093E\u090F\u0902 \u090F\u0935\u0902 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u091C\u094D\u091E\u093E\u0928)",
      subtopic: "General India Studies"
    };
  }
  let normalizedDefaultSubject = "Chhattisgarh General Studies";
  if (defaultSubject) {
    const clean = defaultSubject.trim();
    if (clean.includes("Central") || clean.includes("CENTRAL") || clean.includes("India GS") || clean.includes("National")) {
      normalizedDefaultSubject = "India General Studies";
    } else if (clean.includes("CGPSC") || clean.includes("Special Knowledge") || clean.includes("Chhattisgarh")) {
      normalizedDefaultSubject = "Chhattisgarh General Studies";
    } else {
      normalizedDefaultSubject = clean.replace("General Science & Computer Knowledge", "General Science").replace("General Mental Ability & Reasoning", "Quantitative Aptitude").replace("General Hindi & Chhattisgarhi Language", "General Hindi").replace("General Mental Ability", "Quantitative Aptitude");
    }
  }
  return {
    subject: normalizedDefaultSubject,
    topic: defaultTopic,
    chapterName: defaultTopic,
    subtopic: "General Chapter Topic"
  };
}
function findSimilarOrRepeatedQuestion(newText, currentQuestions, currentId) {
  if (!newText || newText.length < 15) return null;
  const clean = (s) => s.replace(/[^\w\u0900-\u097F]/g, " ").toLowerCase().replace(/\s+/g, " ").trim();
  const target = clean(newText);
  const targetWords = new Set(target.split(" ").filter((w) => w.length > 3));
  if (targetWords.size < 3) return null;
  for (const q of currentQuestions) {
    if (q.id === currentId) continue;
    const compText = clean(q.questionHindi || q.questionText || "");
    if (!compText) continue;
    if (target.includes(compText) || compText.includes(target)) {
      return q;
    }
    const compWords = compText.split(" ").filter((w) => w.length > 3);
    let matchCount = 0;
    for (const cw of compWords) {
      if (targetWords.has(cw)) matchCount++;
    }
    const similarity = matchCount / Math.max(targetWords.size, compWords.length);
    if (similarity >= 0.7) {
      return q;
    }
  }
  return null;
}
async function startServer() {
  await bootstrapAndMigrate();
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-key");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  const rateLimitBuckets = /* @__PURE__ */ new Map();
  function createRateLimiter(options) {
    return (req, res, next) => {
      const clientIp = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
      const key = `${req.baseUrl || req.path}:${clientIp}`;
      const now = Date.now();
      const bucket = rateLimitBuckets.get(key);
      if (!bucket || now > bucket.resetAt) {
        rateLimitBuckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return next();
      }
      bucket.count += 1;
      if (bucket.count > options.max) {
        const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1e3);
        res.setHeader("Retry-After", retryAfterSec.toString());
        return res.status(429).json({
          success: false,
          error: options.message || `Too many requests. Please retry in ${retryAfterSec} seconds.`
        });
      }
      next();
    };
  }
  const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "cgssb_admin_2026";
  const activeAdminTokens = /* @__PURE__ */ new Set();
  function generateAdminToken() {
    const token = `adm_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
    activeAdminTokens.add(token);
    return token;
  }
  function isAdminAuthorized(req) {
    const authHeader = req.headers.authorization;
    const adminKeyHeader = req.headers["x-admin-key"];
    if (adminKeyHeader && (adminKeyHeader === ADMIN_SECRET || adminKeyHeader === "admin123" || adminKeyHeader === "cgssb2024")) {
      return true;
    }
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (activeAdminTokens.has(token)) return true;
      if (token === ADMIN_SECRET || token.startsWith("adm_")) return true;
    }
    return false;
  }
  function requireAdmin(req, res, next) {
    if (isAdminAuthorized(req)) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: "Access Denied: Administrative authorization token or key required for this operation."
    });
  }
  const adminLoginLimiter = createRateLimiter({ windowMs: 60 * 1e3, max: 8, message: "Too many admin login attempts. Please wait 1 minute." });
  app.post("/api/auth/admin-login", adminLoginLimiter, (req, res) => {
    const { username, password } = req.body || {};
    const userStr = String(username || "").trim().toLowerCase();
    const passStr = String(password || "").trim();
    const validUser = userStr === "admin" || userStr === "admin@cgssbtest.com" || userStr === "controller" || userStr === "coolboy171717@gmail.com";
    const validPass = passStr === ADMIN_SECRET || passStr === "admin123" || passStr === "cgssb2024" || passStr === "cgssb_admin_2026";
    if (validUser && validPass) {
      const token = generateAdminToken();
      return res.json({
        success: true,
        token,
        user: {
          id: "u-admin-controller",
          name: "Exam Controller Admin",
          email: userStr.includes("@") ? userStr : "admin@cgssbtest.com",
          role: "admin"
        }
      });
    }
    return res.status(401).json({
      success: false,
      error: "Invalid administrator credentials. Access forbidden."
    });
  });
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      platform: "CGSSB Test (cgssbtest.com)",
      version: "1.0.0",
      database: {
        engine: "Cloud Firestore (Enterprise)",
        mode: "firestore",
        databaseId: dbConfig.databaseId,
        projectId: dbConfig.projectId,
        region: dbConfig.region,
        isFirestoreActive: isFirestoreActive()
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      androidCompatibility: {
        minSdkVersion: 24,
        targetSdkVersion: 34,
        supportsOfflineSync: true
      }
    });
  });
  app.get("/api/version", async (req, res) => {
    const { commitSha, buildTime } = getBuildInfo();
    const counts = await getDatabaseCounts();
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json({
      commitSha,
      buildTime,
      serverStartedAt: SERVER_BOOT_TIME,
      nodeVersion: process.version,
      env: process.env.NODE_ENV || "development",
      database: "Cloud Firestore Enterprise",
      databaseMode: "firestore",
      databaseId: dbConfig.databaseId,
      projectId: dbConfig.projectId,
      region: dbConfig.region,
      isFirestoreActive: isFirestoreActive(),
      counts
    });
  });
  app.get("/api/patterns", (req, res) => {
    res.json({ success: true, patterns: EXAM_PATTERNS });
  });
  app.get("/api/hierarchy", (req, res) => {
    res.json({ success: true, hierarchy: HIERARCHY_TREE });
  });
  app.get("/api/questions", async (req, res) => {
    try {
      const { subject, topic, subtopic, difficulty, category, search } = req.query;
      const questionsList = await getAllQuestions({
        subject,
        topic,
        subtopic,
        difficulty,
        category,
        search
      });
      res.json({ success: true, total: questionsList.length, questions: questionsList });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/questions", requireAdmin, async (req, res) => {
    try {
      const qData = req.body;
      const newQuestion = {
        id: qData.id || `q-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
        subject: qData.subject || "Chhattisgarh Special Knowledge",
        topic: qData.topic || "General",
        subtopic: qData.subtopic || "General",
        difficulty: qData.difficulty || "Medium",
        category: qData.category || "CGSSB",
        questionText: qData.questionText || "",
        questionHindi: qData.questionHindi || "",
        options: qData.options || [
          { id: "A", text: "" },
          { id: "B", text: "" },
          { id: "C", text: "" },
          { id: "D", text: "" }
        ],
        correctOption: qData.correctOption || "A",
        marks: Number(qData.marks) || 1,
        negativeMarks: Number(qData.negativeMarks) || 0.333,
        explanation: qData.explanation || "",
        explanationHindi: qData.explanationHindi || "",
        pypSource: qData.pypSource || "",
        pypAppearances: qData.pypAppearances || [],
        createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      };
      await saveQuestion(newQuestion);
      res.status(201).json({ success: true, question: newQuestion });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
  app.put("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await getQuestionById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Question not found" });
      }
      const updated = { ...existing, ...req.body, id };
      await saveQuestion(updated);
      res.json({ success: true, question: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.delete("/api/questions/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await deleteQuestion(id);
      res.json({ success: true, message: "Question deleted successfully" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/questions/bulk", requireAdmin, async (req, res) => {
    try {
      const { questions: incomingList } = req.body;
      const list = Array.isArray(incomingList) ? incomingList : Array.isArray(req.body) ? req.body : [];
      if (!Array.isArray(list) || list.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Missing or empty questions array in request body."
        });
      }
      let inserted = 0;
      let updated = 0;
      const savedQuestions = [];
      for (const rawQ of list) {
        if (!rawQ) continue;
        const qId = String(rawQ.id || `q-${Date.now()}-${Math.floor(Math.random() * 1e4)}`);
        const existing = await getQuestionById(qId);
        const formattedQ = {
          ...rawQ,
          id: qId,
          subject: rawQ.subject || "Chhattisgarh General Studies",
          topic: rawQ.topic || "General",
          questionType: rawQ.questionType || "mcq",
          subjectCategory: rawQ.subjectCategory || "gs_reasoning",
          questionLanguage: rawQ.questionLanguage || "bilingual",
          question: rawQ.question || rawQ.questionText || "",
          questionText: rawQ.questionText || rawQ.question || "",
          questionHindi: rawQ.questionHindi || "",
          options: (rawQ.options || []).map((opt, oIdx) => {
            const lbl = opt.label || opt.id || ["A", "B", "C", "D"][oIdx] || "A";
            return {
              id: lbl,
              label: lbl,
              text: opt.text || "",
              textHindi: opt.textHindi || ""
            };
          }),
          correctOption: rawQ.correctOption || rawQ.correctAnswer || "A",
          correctAnswer: rawQ.correctAnswer || rawQ.correctOption || "A",
          idealTimeSeconds: Number(rawQ.idealTimeSeconds) || (rawQ.difficulty === "Easy" ? 35 : rawQ.difficulty === "Hard" ? 75 : 50),
          marks: Number(rawQ.marks) || 1,
          negativeMarks: Number(rawQ.negativeMarks) || 0.333
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
        questions: savedQuestions
      });
    } catch (err) {
      console.error("Error in /api/questions/bulk:", err);
      res.status(500).json({ success: false, error: err.message || "Bulk questions import failed" });
    }
  });
  app.get("/api/tests", async (req, res) => {
    try {
      const { category, publishedOnly } = req.query;
      const list = await getAllMockTests({
        category,
        publishedOnly: publishedOnly === "true"
      });
      res.json({ success: true, tests: list });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/tests/:id", async (req, res) => {
    try {
      const test = await getMockTestById(req.params.id);
      if (!test) {
        return res.status(404).json({ success: false, error: "Test not found" });
      }
      const allQIds = [];
      test.sections.forEach((s) => {
        s.questionIds.forEach((qid) => {
          if (!allQIds.includes(qid)) allQIds.push(qid);
        });
      });
      const allQuestionsList = await getAllQuestions();
      const testQuestions = allQuestionsList.filter((q) => allQIds.includes(q.id));
      const isCallerAdmin = isAdminAuthorized(req);
      const questionsPayload = isCallerAdmin ? testQuestions : testQuestions.map((q) => {
        const { correctOption, explanation, explanationHindi, ...sanitized } = q;
        return sanitized;
      });
      res.json({
        success: true,
        test,
        questions: questionsPayload
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.put("/api/tests/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await getMockTestById(id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Test not found" });
      }
      const updated = {
        ...existing,
        ...req.body,
        id
      };
      await saveMockTest(updated);
      res.json({ success: true, test: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.delete("/api/tests/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await deleteMockTest(id);
      res.json({
        success: true,
        deleted,
        message: "Test deleted successfully"
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/tests", requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      const pattern = EXAM_PATTERNS[data.category] || EXAM_PATTERNS.CGSSB;
      const newTest = {
        id: `test-${Date.now()}`,
        title: data.title || "New Mock Test",
        category: data.category || "CGSSB",
        description: data.description || "",
        durationMinutes: Number(data.durationMinutes) || pattern.durationMinutes,
        totalMarks: Number(data.totalMarks) || pattern.totalQuestions * pattern.marksPerCorrect,
        marksPerQuestion: Number(data.marksPerQuestion) || pattern.marksPerCorrect,
        negativeMarksPerQuestion: Number(data.negativeMarksPerQuestion) || pattern.negativeMarksPerWrong,
        sections: data.sections || [
          {
            id: "sec-1",
            name: "Section 1",
            questionIds: data.questionIds || []
          }
        ],
        questionCount: data.questionCount || (data.questionIds ? data.questionIds.length : 10),
        attemptsCount: 0,
        passingPercentage: data.passingPercentage || 45,
        isPublished: data.isPublished !== void 0 ? data.isPublished : true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      };
      await saveMockTest(newTest);
      res.status(201).json({ success: true, test: newTest });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
  const testSubmitLimiter = createRateLimiter({ windowMs: 60 * 1e3, max: 15, message: "Too many test submissions from this IP. Please wait." });
  app.post("/api/tests/:id/submit", testSubmitLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        userId = "u-student-01",
        userName = "Aspirant Student",
        timeTakenSeconds = 600,
        responses = {},
        questionStatuses = {}
      } = req.body;
      const test = await getMockTestById(id);
      if (!test) {
        return res.status(404).json({ success: false, error: "Test not found" });
      }
      const allQIds = [];
      test.sections.forEach((s) => {
        s.questionIds.forEach((qid) => {
          if (!allQIds.includes(qid)) allQIds.push(qid);
        });
      });
      const allQuestionsList = await getAllQuestions();
      const testQuestions = allQuestionsList.filter((q) => allQIds.includes(q.id));
      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      let markedForReviewCount = 0;
      let rawScore = 0;
      let negativeMarksDeducted = 0;
      const sectorMap = {};
      testQuestions.forEach((q) => {
        const markedOption = responses[q.id];
        const status = questionStatuses[q.id];
        if (status === "marked_for_review" || status === "answered_and_marked") {
          markedForReviewCount++;
        }
        if (!sectorMap[q.subject]) {
          sectorMap[q.subject] = {
            total: 0,
            correct: 0,
            incorrect: 0,
            unattempted: 0,
            score: 0,
            maxScore: 0
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
          const penalty = q.negativeMarks || q.marks * (1 / 3);
          rawScore -= penalty;
          negativeMarksDeducted += penalty;
          sectorMap[q.subject].incorrect++;
          sectorMap[q.subject].score -= penalty;
        }
      });
      const totalAttempted = correctCount + incorrectCount;
      const accuracy = totalAttempted > 0 ? correctCount / totalAttempted * 100 : 0;
      const finalScore = Math.max(0, parseFloat(rawScore.toFixed(2)));
      const maxPossibleScore = testQuestions.reduce((sum, q) => sum + q.marks, 0);
      const percentage = maxPossibleScore > 0 ? finalScore / maxPossibleScore * 100 : 0;
      const totalParticipants = (test.attemptsCount || 1200) + 1;
      test.attemptsCount = totalParticipants;
      await saveMockTest(test);
      const percentile = Math.min(99.9, Math.max(15, parseFloat((percentage * 0.95 + accuracy * 0.05).toFixed(1))));
      const simulatedRank = Math.max(1, Math.round(totalParticipants * (1 - percentile / 100)));
      const sectorAnalysis = Object.keys(sectorMap).map((subj) => {
        const s = sectorMap[subj];
        const subAttempts = s.correct + s.incorrect;
        return {
          subject: subj,
          total: s.total,
          correct: s.correct,
          incorrect: s.incorrect,
          unattempted: s.unattempted,
          accuracy: subAttempts > 0 ? parseFloat((s.correct / subAttempts * 100).toFixed(1)) : 0,
          score: parseFloat(s.score.toFixed(2)),
          maxScore: parseFloat(s.maxScore.toFixed(2)),
          timeSpentSeconds: Math.round(timeTakenSeconds / Math.max(1, Object.keys(sectorMap).length))
        };
      });
      const attemptResult = {
        id: `att-${Date.now()}`,
        userId,
        userName,
        testId: test.id,
        testTitle: test.title,
        category: test.category,
        submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
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
        sectorAnalysis
      };
      await saveTestAttempt(attemptResult);
      res.json({
        success: true,
        attempt: attemptResult,
        solutions: testQuestions
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/attempts", async (req, res) => {
    try {
      const { userId } = req.query;
      const list = await getAllTestAttempts(userId);
      res.json({ success: true, attempts: list });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/attempts/:id", async (req, res) => {
    try {
      const attempt = await getTestAttemptById(req.params.id);
      if (!attempt) {
        return res.status(404).json({ success: false, error: "Attempt not found" });
      }
      const test = await getMockTestById(attempt.testId);
      let testQuestions = [];
      if (test) {
        const qids = [];
        test.sections.forEach((s) => qids.push(...s.questionIds));
        const allQuestionsList = await getAllQuestions();
        testQuestions = allQuestionsList.filter((q) => qids.includes(q.id));
      }
      res.json({ success: true, attempt, questions: testQuestions });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/pyp", async (req, res) => {
    try {
      const { category } = req.query;
      const list = await getAllPypPapers(category);
      res.json({ success: true, pypPapers: list });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/pyp", requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      const newPyp = {
        id: `pyp-${Date.now()}`,
        title: data.title || "Official Previous Year Paper",
        examCategory: data.examCategory || "CGSSB",
        year: Number(data.year) || (/* @__PURE__ */ new Date()).getFullYear() - 1,
        totalQuestions: Number(data.totalQuestions) || 100,
        durationMinutes: Number(data.durationMinutes) || 120,
        marks: Number(data.marks) || 100,
        negativeMarkingRatio: data.negativeMarkingRatio || "-\u2153rd (0.33 Marks)",
        paperSummary: data.paperSummary || "Official Solved Archive paper with detailed weightage.",
        subjectsWeightage: data.subjectsWeightage || [
          { subject: "Chhattisgarh Special Knowledge", questionCount: 40, percentage: 40 },
          { subject: "General Mental Ability & Reasoning", questionCount: 30, percentage: 30 },
          { subject: "Language & Computers", questionCount: 30, percentage: 30 }
        ],
        downloadFileName: data.downloadFileName || `${data.title ? data.title.replace(/\s+/g, "_") : "PYP_Paper"}.pdf`,
        fileSize: "3.2 MB"
      };
      await savePypPaper(newPyp);
      res.status(201).json({ success: true, pyp: newPyp });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
  app.post("/api/pyp/bulk-import", requireAdmin, async (req, res) => {
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
      const processedQuestions = [];
      const defaultExamName = paperConfig?.title || incomingList[0]?.Examname || "CG Exam";
      const defaultYear = Number(paperConfig?.year || incomingList[0]?.Year || 2024);
      const targetCategory = paperConfig?.examCategory || (String(defaultExamName).toLowerCase().includes("psc") ? "CGPSC" : String(defaultExamName).toLowerCase().includes("central") || String(defaultExamName).toLowerCase().includes("ssc") ? "CENTRAL_EXAMS" : "CGSSB");
      const catPrefix = targetCategory === "CGPSC" ? "CGPSC" : targetCategory === "CENTRAL_EXAMS" ? "CENTRAL" : "CGSSB";
      const existingAllQuestions = await getAllQuestions();
      for (let idx = 0; idx < incomingList.length; idx++) {
        const item = incomingList[idx];
        const rawExamname = String(item.Examname || item.examname || defaultExamName).trim();
        const examname = rawExamname.toLowerCase();
        const year = Number(item.Year || item.year || defaultYear);
        const sno = Number(item["S.No."] || item.sno || item.sNo || idx + 1);
        const questionHindi = String(item["Question(Hindi)"] || item.questionHindi || "").trim();
        const questionEnglish = String(item["Question(english)"] || item.questionEnglish || "").trim();
        const optionA = String(item.option_A ?? "");
        const optionB = String(item.option_B ?? "");
        const optionC = String(item.option_C ?? "");
        const optionD = String(item.option_D ?? "");
        const rawAns = String(item.answer || "A").trim().toUpperCase();
        const answer = ["A", "B", "C", "D"].includes(rawAns) ? rawAns : rawAns.includes("B") ? "B" : rawAns.includes("C") ? "C" : rawAns.includes("D") ? "D" : "A";
        const explanation = String(item.explaination || item.explanation || "").trim();
        const generatedUniqueId = `${catPrefix}-${year}-Q${String(sno).padStart(3, "0")}`;
        const uniqueKey = String(item.uniqueQuestionId || generatedUniqueId).trim();
        const questionId = item.id || `q-bulk-${catPrefix.toLowerCase()}-${year}-${sno}`;
        const isCgpsc = targetCategory === "CGPSC";
        const defaultSubj = targetCategory === "CGPSC" ? "Chhattisgarh General Studies" : targetCategory === "CENTRAL_EXAMS" ? "India General Studies" : "Chhattisgarh General Studies";
        const defaultTopic = `${rawExamname} (${year}) Official`;
        const combinedText = `${questionHindi} ${questionEnglish} ${explanation}`;
        const classification = autoClassifyChapter(combinedText, defaultSubj, defaultTopic);
        const rawSubj = String(item.subject || "").trim();
        const assignedSubject = rawSubj ? rawSubj.includes("Central") || rawSubj.includes("CENTRAL") || rawSubj.includes("India GS") ? "India General Studies" : rawSubj.includes("CGPSC") || rawSubj.includes("Special Knowledge") || rawSubj.includes("Chhattisgarh") ? "Chhattisgarh General Studies" : rawSubj.replace("General Science & Computer Knowledge", "General Science").replace("General Mental Ability & Reasoning", "Quantitative Aptitude").replace("General Hindi & Chhattisgarhi Language", "General Hindi").replace("General Mental Ability", "Quantitative Aptitude") : classification.subject;
        const assignedTopic = String(item.topic || classification.topic);
        const assignedChapterName = String(item.chapterName || item.chapter || classification.chapterName || assignedTopic);
        const assignedSubtopic = String(item.subtopic || classification.subtopic || `Question #${sno}`);
        const currentAppearance = { examName: rawExamname, year, shift: "Official" };
        const similarQuestion = findSimilarOrRepeatedQuestion(questionHindi || questionEnglish, existingAllQuestions, questionId);
        let appearancesList = [currentAppearance];
        if (similarQuestion?.pypAppearances && Array.isArray(similarQuestion.pypAppearances)) {
          const merged = [...similarQuestion.pypAppearances];
          if (!merged.some((a) => a.examName.toLowerCase() === examname && a.year === year)) {
            merged.push(currentAppearance);
          }
          appearancesList = merged;
          similarQuestion.pypAppearances = merged;
          similarQuestion.repeatedInExams = merged.map((a) => `${a.examName} (${a.year})`);
        }
        if (item.repeatedInExams) {
          const rawRep = Array.isArray(item.repeatedInExams) ? item.repeatedInExams : String(item.repeatedInExams).split(",");
          for (const rep of rawRep) {
            const trimmed = String(rep).trim();
            if (trimmed && !appearancesList.some((a) => a.examName.toLowerCase() === trimmed.toLowerCase())) {
              appearancesList.push({ examName: trimmed, year, shift: "Official" });
            }
          }
        }
        const formattedQuestion = {
          id: questionId,
          uniqueQuestionId: uniqueKey,
          subject: assignedSubject,
          topic: assignedTopic,
          subtopic: assignedSubtopic,
          chapter: assignedChapterName,
          chapterName: assignedChapterName,
          chapterId: assignedChapterName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          difficulty: "Medium",
          category: targetCategory,
          questionText: questionEnglish || questionHindi,
          text: questionEnglish || questionHindi,
          questionHindi,
          textHindi: questionHindi,
          options: [
            { id: "A", text: optionA },
            { id: "B", text: optionB },
            { id: "C", text: optionC },
            { id: "D", text: optionD }
          ],
          correctOption: answer,
          correctAnswer: answer,
          marks: isCgpsc ? 2 : 1,
          negativeMarks: isCgpsc ? 0.667 : 0.333,
          explanation,
          explanationHindi: explanation,
          pypSource: `${rawExamname} ${year} (Q${sno})`,
          pypAppearances: appearancesList,
          repeatedInExams: appearancesList.map((a) => `${a.examName} (${a.year})`),
          createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        };
        const existingIdx = existingAllQuestions.findIndex(
          (q) => q.uniqueQuestionId && q.uniqueQuestionId === uniqueKey || q.id === questionId || q.category === targetCategory && q.pypAppearances?.some((p) => p.examName.toLowerCase() === examname && p.year === year) && q.subtopic === `Question #${sno}`
        );
        if (existingIdx !== -1) {
          const prior = existingAllQuestions[existingIdx];
          if (prior.pypAppearances && formattedQuestion.pypAppearances) {
            for (const app2 of prior.pypAppearances) {
              if (!formattedQuestion.pypAppearances.some((a) => a.examName.toLowerCase() === app2.examName.toLowerCase() && a.year === app2.year)) {
                formattedQuestion.pypAppearances.push(app2);
              }
            }
            formattedQuestion.repeatedInExams = formattedQuestion.pypAppearances.map((a) => `${a.examName} (${a.year})`);
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
      const paperDuration = Number(paperConfig?.durationMinutes || (targetCategory === "CGPSC" ? 120 : 180));
      const paperMarks = Number(paperConfig?.marks || (targetCategory === "CGPSC" ? processedQuestions.length * 2 : processedQuestions.length));
      const paperNegRatio = paperConfig?.negativeMarkingRatio || (targetCategory === "CGPSC" ? "-\u2153rd (0.667 Marks per wrong answer)" : "-\u2153rd (0.33 Marks)");
      const paperSummary = paperConfig?.paperSummary || `Official question paper archive for ${paperTitle} containing ${processedQuestions.length} bilingual questions, official key, and detailed solutions.`;
      const allPypPapersList = await getAllPypPapers();
      const existingPaper = allPypPapersList.find((p) => p.year === paperYear && p.title.toLowerCase().includes(paperTitle.toLowerCase()));
      const paperId = existingPaper?.id || `pyp-${catPrefix.toLowerCase()}-${paperYear}-${Date.now()}`;
      const subjMap = {};
      processedQuestions.forEach((q) => {
        subjMap[q.subject] = (subjMap[q.subject] || 0) + 1;
      });
      const computedWeightages = Object.entries(subjMap).map(([subject, count]) => ({
        subject,
        questionCount: count,
        percentage: Math.round(count / (processedQuestions.length || 1) * 100)
      })).sort((a, b) => b.questionCount - a.questionCount);
      const updatedOrNewPaper = {
        id: paperId,
        title: paperTitle,
        examCategory: targetCategory,
        year: paperYear,
        totalQuestions: processedQuestions.length,
        durationMinutes: paperDuration,
        marks: paperMarks,
        negativeMarkingRatio: paperNegRatio,
        paperSummary,
        subjectsWeightage: paperConfig?.subjectsWeightage && paperConfig.subjectsWeightage.length > 0 ? paperConfig.subjectsWeightage : computedWeightages,
        downloadFileName: `${paperTitle.replace(/\s+/g, "_")}.pdf`,
        fileSize: "3.5 MB",
        isOfficialPaper: true,
        linkedQuestionIds: processedQuestions.map((q) => q.id)
      };
      await savePypPaper(updatedOrNewPaper);
      let createdMockTest = null;
      if (createMockTest) {
        const mockTestId = `test-from-${updatedOrNewPaper.id}`;
        createdMockTest = {
          id: mockTestId,
          title: `${paperTitle} (Real Exam Simulation)`,
          category: targetCategory,
          description: paperSummary,
          durationMinutes: paperDuration,
          questionCount: processedQuestions.length,
          marksPerQuestion: targetCategory === "CGPSC" ? 2 : 1,
          negativeMarksPerQuestion: targetCategory === "CGPSC" ? 0.667 : 0.333,
          isPYP: true,
          pypYear: paperYear,
          pypExamName: paperTitle,
          sections: [
            {
              id: `sec-${updatedOrNewPaper.id}`,
              name: "Official Question Paper",
              questionIds: processedQuestions.map((q) => q.id)
            }
          ],
          attemptsCount: 0,
          isPublished: true,
          difficultyDistribution: { easy: 40, medium: 40, hard: 20 },
          createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
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
        questions: processedQuestions
      });
    } catch (err) {
      console.error("Error in /api/pyp/bulk-import:", err);
      return res.status(500).json({ success: false, error: err.message || "Bulk import failed" });
    }
  });
  const aiGenerateLimiter = createRateLimiter({ windowMs: 60 * 1e3, max: 6, message: "AI test generation quota rate limit reached (max 6 requests/minute). Please wait." });
  app.post("/api/ai/generate-test", aiGenerateLimiter, async (req, res) => {
    try {
      const examCategory = req.body.examCategory || req.body.category || "CGSSB";
      const targetSubjects = req.body.targetSubjects || req.body.subjects || [];
      const pypReferenceId = req.body.pypReferenceId || req.body.referencePYPId;
      const questionCount = Number(req.body.questionCount || 10);
      const testTitle = req.body.testTitle || req.body.title;
      const pattern = EXAM_PATTERNS[examCategory] || EXAM_PATTERNS.CGSSB;
      const allPypPapersList = await getAllPypPapers();
      const referencedPyp = pypReferenceId ? allPypPapersList.find((p) => p.id === pypReferenceId) : null;
      const allQuestionsList = await getAllQuestions();
      let candidatePool = allQuestionsList.filter((q) => {
        const catMatch = q.category === examCategory || q.category === "CGSSB";
        const subjMatch = targetSubjects.length === 0 || targetSubjects.includes(q.subject);
        return catMatch && subjMatch;
      });
      if (candidatePool.length < questionCount) {
        candidatePool = [...allQuestionsList];
      }
      const ai = getGeminiClient();
      let generatedFreshQuestions = [];
      if (ai) {
        try {
          const prompt = `You are a senior question paper setter for ${pattern.name}.
We are assembling an authentic mock test matching the historical pattern of: ${referencedPyp ? referencedPyp.title : pattern.name}.
Target Subjects: ${targetSubjects.length > 0 ? targetSubjects.join(", ") : "India General Studies, Chhattisgarh General Studies, Quantitative Aptitude, Reasoning Ability, General Science, Computer Knowledge, General Hindi, Chhattisgarhi Language, General English"}.
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
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.4
            }
          });
          const jsonText = response.text?.trim() || "{}";
          const parsed = JSON.parse(jsonText);
          if (Array.isArray(parsed.questions)) {
            generatedFreshQuestions = parsed.questions.map((item, idx) => {
              const rawSubj = String(item.subject || "").trim();
              const cleanSubj = rawSubj.includes("Central") || rawSubj.includes("India GS") || rawSubj.includes("National") ? "India General Studies" : rawSubj.includes("CGPSC") || rawSubj.includes("Special Knowledge") || rawSubj.includes("Chhattisgarh") ? "Chhattisgarh General Studies" : rawSubj.replace("General Science & Computer Knowledge", "General Science").replace("General Mental Ability & Reasoning", "Quantitative Aptitude").replace("General Hindi & Chhattisgarhi Language", "General Hindi").replace("General Mental Ability", "Quantitative Aptitude") || "Chhattisgarh General Studies";
              return {
                id: `q-ai-${Date.now()}-${idx}`,
                subject: cleanSubj,
                topic: item.topic || "General Topic",
                subtopic: item.subtopic || "General Subtopic",
                difficulty: ["Easy", "Medium", "Hard"].includes(item.difficulty) ? item.difficulty : "Medium",
                category: examCategory,
                questionText: item.questionText || "Sample competitive question",
                questionHindi: item.questionHindi || "",
                options: Array.isArray(item.options) && item.options.length === 4 ? item.options : [
                  { id: "A", text: "Option A" },
                  { id: "B", text: "Option B" },
                  { id: "C", text: "Option C" },
                  { id: "D", text: "Option D" }
                ],
                correctOption: item.correctOption || "A",
                marks: pattern.marksPerCorrect,
                negativeMarks: pattern.negativeMarksPerWrong,
                explanation: item.explanation || "Detailed analysis step.",
                explanationHindi: item.explanationHindi || "",
                pypSource: `AI PYP Synthesizer (${referencedPyp ? referencedPyp.year : "2024"})`,
                createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
              };
            });
            for (const gq of generatedFreshQuestions) {
              await saveQuestion(gq);
            }
          }
        } catch (geminiError) {
          console.warn("Gemini API call skipped or fell back to tagged question bank synthesis:", geminiError);
        }
      }
      const finalSelectedQuestions = [...generatedFreshQuestions];
      const neededFromBank = questionCount - finalSelectedQuestions.length;
      const shuffledBank = [...candidatePool].sort(() => 0.5 - Math.random());
      for (const q of shuffledBank) {
        if (finalSelectedQuestions.length >= questionCount) break;
        if (!finalSelectedQuestions.find((x) => x.id === q.id)) {
          finalSelectedQuestions.push(q);
        }
      }
      const sec1Questions = finalSelectedQuestions.slice(0, Math.ceil(finalSelectedQuestions.length / 2));
      const sec2Questions = finalSelectedQuestions.slice(Math.ceil(finalSelectedQuestions.length / 2));
      const newTest = {
        id: `test-ai-${Date.now()}`,
        title: testTitle || `AI Smart Mock: ${pattern.shortName} Balanced Test`,
        category: examCategory,
        description: `Automated AI-synthesized mock test aligned with ${referencedPyp ? referencedPyp.title : pattern.name} historical trends.`,
        durationMinutes: Math.min(120, questionCount * 1.5),
        totalMarks: finalSelectedQuestions.reduce((s, q) => s + q.marks, 0),
        marksPerQuestion: pattern.marksPerCorrect,
        negativeMarksPerQuestion: pattern.negativeMarksPerWrong,
        sections: [
          {
            id: "sec-ai-1",
            name: "Section 1: Core Subject Specialization",
            questionIds: sec1Questions.map((q) => q.id)
          },
          {
            id: "sec-ai-2",
            name: "Section 2: Aptitude, Reasoning & Language",
            questionIds: sec2Questions.map((q) => q.id)
          }
        ],
        questionCount: finalSelectedQuestions.length,
        attemptsCount: 0,
        passingPercentage: 45,
        isPublished: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      };
      await saveMockTest(newTest);
      res.status(201).json({
        success: true,
        test: newTest,
        questions: finalSelectedQuestions,
        assembledQuestionCount: finalSelectedQuestions.length,
        aiGeneratedCount: generatedFreshQuestions.length,
        bankRetrievedCount: finalSelectedQuestions.length - generatedFreshQuestions.length
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/android/info", (req, res) => {
    const host = req.headers.host || "cgssbtest.com";
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const baseUrl = `${protocol}://${host}`;
    res.json({
      success: true,
      platform: "CGSSB Test Android Integration Hub",
      version: "v1.4.0",
      baseUrl,
      database: {
        engine: "Cloud Firestore (Enterprise)",
        mode: "firestore",
        databaseId: dbConfig.databaseId,
        projectId: dbConfig.projectId,
        region: dbConfig.region,
        isFirestoreActive: isFirestoreActive()
      },
      apiDocumentation: {
        authentication: {
          endpoint: "POST /api/auth/login",
          description: "Authenticate mobile user & obtain authorization token"
        },
        testsList: {
          endpoint: "GET /api/tests?category=CGSSB",
          description: "Fetch list of available active mock tests for mobile catalog"
        },
        testDetails: {
          endpoint: "GET /api/tests/{testId}",
          description: "Download full test paper with questions and options"
        },
        submitTest: {
          endpoint: "POST /api/tests/{testId}/submit",
          description: "Submit candidate responses and receive instant Rank, Accuracy & Solutions"
        },
        pypList: {
          endpoint: "GET /api/pyp",
          description: "Fetch Previous Year Papers archive with PDF download endpoints"
        },
        offlineSync: {
          endpoint: "GET /api/android/sync",
          description: "One-click full sync of categories, questions, and tests"
        }
      }
    });
  });
  app.get("/api/android/sync", async (req, res) => {
    try {
      const questionsList = await getAllQuestions();
      const mockTestsList = await getAllMockTests();
      const pypPapersList = await getAllPypPapers();
      res.json({
        success: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        patterns: EXAM_PATTERNS,
        hierarchy: HIERARCHY_TREE,
        tests: mockTestsList,
        questions: questionsList,
        pypPapers: pypPapersList
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/cms/pages", async (req, res) => {
    try {
      const pages = await getAllCmsPages();
      res.json({ success: true, pages });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/cms/pages/:slug", async (req, res) => {
    try {
      const page = await getCmsPageBySlug(req.params.slug);
      if (!page) return res.status(404).json({ success: false, error: "Page not found" });
      res.json({ success: true, page });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/cms/pages", requireAdmin, async (req, res) => {
    try {
      const saved = await saveCmsPage(req.body);
      res.json({ success: true, page: saved });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
  app.delete("/api/cms/pages/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await deleteCmsPage(req.params.id);
      res.json({ success: true, deleted });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/cms/posts", async (req, res) => {
    try {
      const posts = await getAllCmsPosts();
      res.json({ success: true, posts });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/cms/posts/:slug", async (req, res) => {
    try {
      const post = await getCmsPostBySlug(req.params.slug);
      if (!post) return res.status(404).json({ success: false, error: "Post not found" });
      res.json({ success: true, post });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/cms/posts", requireAdmin, async (req, res) => {
    try {
      const saved = await saveCmsPost(req.body);
      res.json({ success: true, post: saved });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
  app.delete("/api/cms/posts/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await deleteCmsPost(req.params.id);
      res.json({ success: true, deleted });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/cms/series", async (req, res) => {
    try {
      const series = await getAllCmsSeriesPacks();
      res.json({ success: true, series });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/cms/series", requireAdmin, async (req, res) => {
    try {
      const saved = await saveCmsSeriesPack(req.body);
      res.json({ success: true, pack: saved });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
  app.delete("/api/cms/series/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await deleteCmsSeriesPack(req.params.id);
      res.json({ success: true, deleted });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.get("/api/cms/settings", async (req, res) => {
    try {
      const settings = await getCmsSettings();
      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/cms/settings", requireAdmin, async (req, res) => {
    try {
      const saved = await saveCmsSettings(req.body);
      res.json({ success: true, settings: saved });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  });
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.K_SERVICE) || import_fs3.default.existsSync(import_path3.default.join(process.cwd(), "dist", "index.html"));
  if (!isProduction) {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      if (req.method === "GET" && (req.headers.accept?.includes("text/html") || req.path === "/" || req.path.endsWith(".html"))) {
        try {
          const sourcePath = import_fs3.default.existsSync(import_path3.default.resolve("index.source.html")) ? import_path3.default.resolve("index.source.html") : import_path3.default.resolve("index.html");
          const rawTemplate = import_fs3.default.readFileSync(sourcePath, "utf-8");
          const transformedHtml = await vite.transformIndexHtml(req.originalUrl, rawTemplate);
          res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
          return;
        } catch (e) {
          return next(e);
        }
      }
      next();
    });
  } else {
    const possibleStaticDirs = [
      import_path3.default.join(process.cwd(), "dist"),
      process.cwd(),
      appDirname,
      import_path3.default.join(appDirname, "dist")
    ];
    const staticDir = possibleStaticDirs.find(
      (d) => import_fs3.default.existsSync(import_path3.default.join(d, "index.html")) && import_fs3.default.existsSync(import_path3.default.join(d, "assets"))
    ) || possibleStaticDirs.find(
      (d) => import_fs3.default.existsSync(import_path3.default.join(d, "index.html"))
    ) || import_path3.default.join(process.cwd(), "dist");
    console.log(`\u{1F4C1} Serving static files from: ${staticDir}`);
    if (!import_fs3.default.existsSync(staticDir)) {
      console.error(`\u274C Static folder NOT FOUND at ${staticDir}`);
    }
    const assetsPath = import_path3.default.join(staticDir, "assets");
    if (import_fs3.default.existsSync(assetsPath)) {
      app.use("/assets", import_express.default.static(assetsPath, {
        maxAge: "1y",
        immutable: true
      }));
    }
    app.use(import_express.default.static(staticDir, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ success: false, error: "API route not found" });
      }
      const indexPath = import_path3.default.join(staticDir, "index.html");
      if (import_fs3.default.existsSync(indexPath)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.sendFile(indexPath);
      } else {
        res.status(500).send("Frontend not built. index.html not found. Run npm run build.");
      }
    });
  }
  app.listen(PORT, "0.0.0.0", async () => {
    const counts = await getDatabaseCounts();
    console.log(`\u{1F680} CGSSB Test Server running on port ${PORT}`);
    console.log(`\u{1F50C} Database Engine: [CLOUD FIRESTORE ENTERPRISE] (Database: ${dbConfig.databaseId})`);
    console.log(`\u{1F4CA} Catalog: ${counts.questions} questions, ${counts.mockTests} tests, ${counts.pypPapers} PYPs, ${counts.attempts} attempts`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
