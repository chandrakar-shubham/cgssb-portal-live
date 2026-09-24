/**
 * Master Syllabus Hierarchy for Chhattisgarh State Competitive Exams
 * (CGPSC Prelims/Mains, CGSSB / Vyapam Exams with Post-Specific Mark Distributions,
 *  Hostel Warden, Patwari, Revenue Inspector, AGDO/DEO, ADO, Labour Inspector, Apex Bank,
 *  Mandi Nirikshak, Teacher / Swami Atmanand, Police SI)
 * 
 * Note: CGSSB exams do NOT have a single common syllabus or marks distribution;
 * each recruitment notification specifies its unique subject weightage, qualifying cutoffs,
 * and mark distributions.
 */

export interface CGMasterTopic {
  id: string;
  name: string;
  nameHindi?: string;
  subtopics?: string[];
}

export interface CGMasterChapter {
  id: string;
  name: string;
  nameHindi?: string;
  nameEn?: string;
  topics: (string | CGMasterTopic)[];
  subTopics?: string[];
}

export type CGExamSubjectCategory = 
  | 'CG_GENERAL' 
  | 'CHHATTISGARHI' 
  | 'HINDI' 
  | 'ENGLISH' 
  | 'APTITUDE' 
  | 'REASONING' 
  | 'COMPUTER' 
  | 'INDIAN_GS' 
  | 'CURRENT_AFFAIRS'
  | 'CHILD_PSYCHOLOGY'
  | 'PANCHAYATI_RAJ'
  | 'BANKING_ACT'
  | 'LABOUR_LAWS'
  | 'AGRICULTURE';

export interface CGMasterModule {
  id: string;
  name?: string;
  nameEn: string;
  nameHi: string;
  nameHindi?: string;
  category: CGExamSubjectCategory;
  chapters: CGMasterChapter[];
}

export interface FlatSyllabusItem {
  moduleId: string;
  moduleNameEn: string;
  moduleNameHi: string;
  chapterId: string;
  chapterName: string;
  topicName: string;
  category: CGExamSubjectCategory;
}

export interface ExamSubjectHierarchy {
  subjectId: string;
  subjectNameEn: string;
  subjectNameHi: string;
  weightagePercent?: number;
  marks?: number;
  questionsCount?: number;
  part?: string;
  qualifyingMinPercent?: number;
  chapters: {
    chapterId: string;
    chapterName: string;
    subtopics: string[];
  }[];
}

export interface ExamCategoryHierarchy {
  categoryId: 'CGPSC' | 'CGSSB' | 'ATMANAND' | 'GENERAL' | string;
  categoryNameEn: string;
  categoryNameHi: string;
  examCode?: string;
  totalMarks?: number;
  totalQuestions?: number;
  durationMinutes?: number;
  negativeMarkingRatio?: string;
  description: string;
  subjects: ExamSubjectHierarchy[];
}

/**
 * Standard array list of all Subject Modules in the CG State Exam ecosystem
 */
const MODULES_LIST: CGMasterModule[] = [
  {
    id: 'cg-gk',
    name: 'CG General Knowledge & Special Study',
    nameEn: 'CG General Knowledge & Special Study',
    nameHi: 'छत्तीसगढ़ सामान्य ज्ञान एवं विशेष अध्ययन',
    nameHindi: 'छत्तीसगढ़ सामान्य ज्ञान एवं विशेष अध्ययन',
    category: 'CG_GENERAL',
    chapters: [
      {
        id: 'cg-history',
        name: 'इतिहास एवं स्वतंत्रता आंदोलन में योगदान (History & Freedom Movement)',
        nameHindi: 'इतिहास एवं स्वतंत्रता आंदोलन में योगदान',
        nameEn: 'History & Freedom Movement',
        topics: [
          'प्राचीन राजवंश (कलचुरी, नल, नागवंश)',
          'मराठा व ब्रिटिश शासन काल',
          '1857 की क्रांति व छत्तीसगढ़ के स्वतंत्रता संग्राम सेनानी',
          'किसान एवं जंगल सत्याग्रह',
          'रियासतों का विलीनीकरण एवं राज्य निर्माण'
        ]
      },
      {
        id: 'cg-geography',
        name: 'भूगोल, जलवायु, भौतिक संरचना एवं नदियां (Geography & Rivers)',
        nameHindi: 'भूगोल, जलवायु, भौतिक संरचना एवं नदियां',
        nameEn: 'Geography, Climate & Drainage',
        topics: [
          'भौतिक विभाजन व भूगर्भिक शैल संरचना',
          'महानदी, शिवनाथ, इंद्रावती, हसदेव अपवाह तंत्र व जलप्रपात',
          'जलवायु, वर्षा, कृषि जलवायु क्षेत्र व मृदा प्रकार',
          'खनिज संसाधन (कोयला, लोहा, बॉक्साइट, चूना पत्थर, हीरा, टिन) एवं ऊर्जा संयंत्र'
        ]
      },
      {
        id: 'cg-tribes-culture',
        name: 'जनजातियां, कला, संस्कृति, तीज-त्योहार व पर्यटन (Tribes, Art & Culture)',
        nameHindi: 'जनजातियां, कला, संस्कृति, तीज-त्योहार व पर्यटन',
        nameEn: 'Tribes, Folk Culture, Festivals & Tourism',
        topics: [
          'विशेष पिछड़ी जनजातियां (PVTGs) एवं सामाजिक रीति-रिवाज',
          'विवाह प्रथाएं, गोत्र व्यवस्था व युवागृह (घोटुल)',
          'लोकगीत, लोकनृत्य एवं लोकनाट्य (पंडवानी, भरथरी, नाचा, पंथी, करमा)',
          'तीज-त्योहार (हरेली, पोला, तीजा, छेरछेरा), मेले एवं प्रमुख पर्यटन-पुरातत्व स्थल'
        ]
      },
      {
        id: 'cg-admin-panchayat',
        name: 'प्रशासनिक ढांचा, स्थानीय स्वशासन एवं पंचायती राज (Admin & Panchayati Raj)',
        nameHindi: 'प्रशासनिक ढांचा, स्थानीय स्वशासन एवं पंचायती राज',
        nameEn: 'Administrative Structure & Panchayati Raj',
        topics: [
          '73वां व 74वां संविधान संशोधन (छत्तीसगढ़ संदर्भ)',
          'ग्राम पंचायत, जनपद एवं जिला पंचायत संरचना व शक्तियां',
          'नगरीय निकाय एवं प्रशासन (नगर निगम, पालिका, नगर पंचायत)',
          'राज्य सचिवालय, निदेशालय, संभागीय व जिला प्रशासन',
          'राज्य मानवाधिकार, निर्वाचन व सूचना आयोग'
        ]
      },
      {
        id: 'cg-economy-schemes',
        name: 'छत्तीसगढ़ अर्थव्यवस्था, कृषि एवं जनकल्याणकारी योजनाएं (Economy & Schemes)',
        nameHindi: 'छत्तीसगढ़ अर्थव्यवस्था, कृषि एवं जनकल्याणकारी योजनाएं',
        nameEn: 'Economy, Agriculture & Welfare Schemes',
        topics: [
          'कृषि, उद्यानिकी, पशुपालन व लघु वनोपज एमएसपी प्रणाली',
          'प्रमुख जनकल्याणकारी योजनाएं (महतारी वंदन, कृषक उन्नति योजना आदि)',
          'राज्य बजट एवं नवीनतम आर्थिक सर्वेक्षण आंकड़े',
          'प्रमुख औद्योगिक क्षेत्र, सीएसआईडीसी व बुनियादी ढांचा परियोजनाएं'
        ]
      }
    ]
  },
  {
    id: 'chhattisgarhi-lang',
    name: 'Chhattisgarhi Language & Literature',
    nameEn: 'Chhattisgarhi Language & Literature',
    nameHi: 'छत्तीसगढ़ी भाषा, व्याकरण एवं साहित्य',
    nameHindi: 'छत्तीसगढ़ी भाषा, व्याकरण एवं साहित्य',
    category: 'CHHATTISGARHI',
    chapters: [
      {
        id: 'chg-grammar',
        name: 'छत्तीसगढ़ी व्याकरण (संज्ञा, सर्वनाम, क्रिया, काल, कारक)',
        nameHindi: 'छत्तीसगढ़ी व्याकरण एवं वाक्य संरचना',
        nameEn: 'Chhattisgarhi Grammar & Structure',
        topics: [
          'संज्ञा, सर्वनाम, विशेषण एवं क्रिया रूप',
          'क्रिया, काल (भूत, वर्तमान, भविष्य) एवं सहायक क्रियाएं',
          'लिंग (पुल्लिंग, स्त्रीलिंग) एवं वचन (एकवचन, बहुवचन) रचना',
          'कारक एवं विभक्ति प्रत्यय (मा, ले, बर, खातिर)',
          'उपसर्ग, प्रत्यय एवं सामासिक पद'
        ]
      },
      {
        id: 'chg-vocab-idioms',
        name: 'छत्तीसगढ़ी शब्दावली, मुहावरे, हाना एवं जनउला (Vocabulary & Riddles)',
        nameHindi: 'छत्तीसगढ़ी शब्दावली, मुहावरे, हाना एवं जनउला',
        nameEn: 'Vocabulary, Idioms, Proverbs & Riddles',
        topics: [
          'रिश्ते-नाते, कृषि उपकरण एवं घरेलू वस्तुओं के पारंपरिक नाम',
          'प्रचलित मुहावरे एवं कहावतें (हाना)',
          'जनउला (पहेलियां) एवं उनके समाधान',
          'छत्तीसगढ़ी पर्यायवाची, विलोम एवं समोच्चारित भिन्नार्थक शब्द'
        ]
      },
      {
        id: 'chg-literature',
        name: 'छत्तीसगढ़ी साहित्यकार, रचनाएं एवं पत्र-पत्रिकाएं (Literature & Authors)',
        nameHindi: 'छत्तीसगढ़ी साहित्यकार, रचनाएं एवं पत्र-पत्रिकाएं',
        nameEn: 'Literature, Authors & Periodicals',
        topics: [
          'प्राचीन एवं आधुनिक छत्तीसगढ़ी साहित्यकार व कवि',
          'प्रमुख महाकाव्य, खंडकाव्य, उपन्यास एवं कहानी संग्रह',
          'छत्तीसगढ़ी नाटक, एकांकी एवं शोध पत्रिकाएं'
        ]
      }
    ]
  },
  {
    id: 'general-hindi',
    name: 'General Hindi',
    nameEn: 'General Hindi',
    nameHi: 'सामान्य हिन्दी व्याकरण',
    nameHindi: 'सामान्य हिन्दी व्याकरण',
    category: 'HINDI',
    chapters: [
      {
        id: 'hindi-varna-sandhi',
        name: 'वर्ण विचार, वर्तनी, संधि एवं समास',
        nameHindi: 'वर्ण विचार, वर्तनी, संधि एवं समास',
        nameEn: 'Phonology, Spelling, Sandhi & Samas',
        topics: [
          'स्वर, व्यंजन, अयोगवाह व उच्चारण स्थान',
          'संधि (स्वर संधि, व्यंजन संधि, विसर्ग संधि)',
          'समास (अव्ययीभाव, तत्पुरुष, कर्मधारय, द्विगु, द्वंद्व, बहुव्रीहि)',
          'शुद्ध वर्तनी व वाक्य शुद्धि नियम'
        ]
      },
      {
        id: 'hindi-grammar-elements',
        name: 'शब्द भेद, संज्ञा से अव्यय, लिंग, वचन, कारक व काल',
        nameHindi: 'शब्द भेद, संज्ञा से अव्यय, लिंग, वचन, कारक व काल',
        nameEn: 'Parts of Speech, Gender, Number, Case & Tense',
        topics: [
          'तत्सम, तद्भव, देशज एवं विदेशी शब्द',
          'संज्ञा, सर्वनाम, विशेषण एवं क्रिया भेद',
          'अव्यय (क्रियाविशेषण, संबंधबोधक, समुच्चयबोधक, विस्मयादिबोधक)',
          'उपसर्ग, प्रत्यय, वाच्य (कर्तृवाच्य, कर्मवाच्य, भाववाच्य)'
        ]
      },
      {
        id: 'hindi-vocab',
        name: 'शब्द सामर्थ्य (पर्यायवाची, विलोम, अनेकार्थी, मुहावरे व लोकोक्तियां)',
        nameHindi: 'शब्द सामर्थ्य एवं व्यावहारिक हिन्दी',
        nameEn: 'Vocabulary, Idioms & Phrases',
        topics: [
          'पर्यायवाची एवं विलोम शब्द',
          'वाक्यांश के लिए एक शब्द',
          'मुहावरे एवं लोकोक्तियां',
          'युग्म शब्द, अनेकार्थक शब्द एवं पत्र प्रारूप'
        ]
      }
    ]
  },
  {
    id: 'general-english',
    name: 'General English',
    nameEn: 'General English',
    nameHi: 'सामान्य अंग्रेजी व्याकरण एवं बोध',
    nameHindi: 'सामान्य अंग्रेजी व्याकरण एवं बोध',
    category: 'ENGLISH',
    chapters: [
      {
        id: 'eng-grammar',
        name: 'Grammar & Sentence Structure',
        nameHindi: 'व्याकरण एवं वाक्य संरचना',
        nameEn: 'Grammar & Sentence Structure',
        topics: [
          'Tenses & Aspects',
          'Voice (Active & Passive Voice)',
          'Direct & Indirect Speech (Narration)',
          'Subject-Verb Agreement (Syntax)',
          'Articles, Determiners & Prepositions',
          'Conjunctions, Question Tags & Modals'
        ]
      },
      {
        id: 'eng-vocabulary',
        name: 'Vocabulary & Comprehension',
        nameHindi: 'शब्दावली एवं गद्यांश बोध',
        nameEn: 'Vocabulary & Comprehension',
        topics: [
          'Synonyms & Antonyms',
          'One Word Substitution',
          'Idioms & Phrasal Verbs',
          'Spelling Errors & Sentence Improvement',
          'Reading Comprehension Passages'
        ]
      }
    ]
  },
  {
    id: 'maths-aptitude',
    name: 'Mathematics & Quantitative Aptitude',
    nameEn: 'Mathematics & Quantitative Aptitude',
    nameHi: 'गणित एवं संख्यात्मक अभियोग्यता',
    nameHindi: 'गणित एवं संख्यात्मक अभियोग्यता',
    category: 'APTITUDE',
    chapters: [
      {
        id: 'math-arithmetic',
        name: 'अंकगणित एवं संख्या पद्धति (Arithmetic & Number System)',
        nameHindi: 'अंकगणित एवं संख्या पद्धति',
        nameEn: 'Arithmetic & Number System',
        topics: [
          'संख्या पद्धति, ल.स.प. व म.स.प. (LCM & HCF)',
          'अनुपात-समानुपात, आयु संबंध व साझेदारी',
          'प्रतिशतता, लाभ-हानि, छूट व बट्टा',
          'साधारण ब्याज एवं चक्रवृद्धि ब्याज (SI & CI)',
          'समय, कार्य, मजदूरी, पाइप एवं टंकी',
          'समय, चाल, दूरी, रेलगाड़ी एवं नाव-धारा'
        ]
      },
      {
        id: 'math-adv-mensuration',
        name: 'क्षेत्रमिति, ज्यामिति व बीजगणित (Mensuration & Algebra)',
        nameHindi: 'क्षेत्रमिति, ज्यामिति, बीजगणित एवं सांख्यिकी',
        nameEn: 'Mensuration, Geometry & Data Interpretation',
        topics: [
          'द्विविमीय (2D) क्षेत्रमिति (त्रिभुज, चतुर्भुज, वृत्त)',
          'त्रिविमीय (3D) आयतन व पृष्ठीय क्षेत्रफल (घन, घनाभ, बेलन, शंकु, गोला)',
          'बीजगणितीय सर्वसमिकाएं, रैखिक व द्विघात समीकरण',
          'सांख्यिकी (माध्य, माध्यिका, बहुलक) एवं डाटा इंटरप्रिटेशन (Bar/Pie Chart/Line Graph)'
        ]
      }
    ]
  },
  {
    id: 'general-reasoning',
    name: 'Logical Reasoning & Mental Ability',
    nameEn: 'Logical Reasoning & Mental Ability',
    nameHi: 'तर्कशक्ति एवं मानसिक योग्यता',
    nameHindi: 'तर्कशक्ति एवं मानसिक योग्यता',
    category: 'REASONING',
    chapters: [
      {
        id: 'reasoning-verbal',
        name: 'मौखिक तर्कशक्ति (Verbal Reasoning)',
        nameHindi: 'मौखिक एवं विश्लेषणात्मक तर्कशक्ति',
        nameEn: 'Verbal & Analytical Reasoning',
        topics: [
          'शृंखला परीक्षण (Number & Alphabet Series)',
          'सादृश्यता एवं वर्गीकरण (Analogy & Odd One Out)',
          'कोडिंग-डिकोडिंग (Coding-Decoding)',
          'रक्त संबंध एवं दिशा ज्ञान (Blood Relations & Direction)',
          'बैठक व्यवस्था एवं पहेली (Seating Arrangement & Puzzle)',
          'कथन एवं निष्कर्ष / न्याय निगमन (Syllogism)'
        ]
      },
      {
        id: 'reasoning-nonverbal',
        name: 'गैर-मौखिक तर्कशक्ति (Non-Verbal Reasoning)',
        nameHindi: 'गैर-मौखिक एवं दृश्य तर्कशक्ति',
        nameEn: 'Non-Verbal & Visual Reasoning',
        topics: [
          'दर्पण व जल प्रतिबिंब (Mirror & Water Images)',
          'कागज मोड़ना व काटना (Paper Folding & Cutting)',
          'आकृति शृंखला, सन्निहित आकृतियां एवं पैटर्न पूर्ति',
          'पासा, घन एवं घनाभ (Dice & Cubes)'
        ]
      }
    ]
  },
  {
    id: 'computer-awareness',
    name: 'Computer Awareness & IT',
    nameEn: 'Computer Awareness & IT',
    nameHi: 'कम्प्यूटर सामान्य ज्ञान एवं सूचना प्रौद्योगिकी',
    nameHindi: 'कम्प्यूटर सामान्य ज्ञान एवं सूचना प्रौद्योगिकी',
    category: 'COMPUTER',
    chapters: [
      {
        id: 'comp-fundamentals',
        name: 'कम्प्यूटर का सामान्य परिचय एवं हार्डवेयर (Fundamentals & Hardware)',
        nameHindi: 'कम्प्यूटर सामान्य परिचय एवं हार्डवेयर',
        nameEn: 'Computer Fundamentals & Hardware',
        topics: [
          'कम्प्यूटर का इतिहास, विकास एवं पीढ़ियां',
          'सीपीयू, मेमोरी (RAM/ROM/Cache) एवं सेकेंडरी स्टोरेज',
          'इनपुट डिवाइसेस (कीबोर्ड, माउस, स्कैनर, ओएमआर, ओसीआर) व आउटपुट डिवाइसेस (मॉनिटर, प्रिंटर, प्लॉटर)',
          'ऑपरेटिंग सिस्टम (DOS, Windows, Linux, Unix, Android)'
        ]
      },
      {
        id: 'comp-software-internet',
        name: 'सॉफ्टवेयर, इंटरनेट, साइबर सुरक्षा एवं मल्टीमीडिया (Software & Internet)',
        nameHindi: 'सॉफ्टवेयर, इंटरनेट, साइबर सुरक्षा एवं मल्टीमीडिया',
        nameEn: 'Software, Internet, Cyber Security & Multimedia',
        topics: [
          'एमएस वर्ड, एमएस एक्सेल एवं पावरपॉइंट की-बोर्ड शॉर्टकट्स व कार्यप्रणाली',
          'इंटरनेट प्रोटोकॉल, वेब ब्राउज़र, सर्च इंजन, ईमेल एवं सोशल मीडिया',
          'कम्प्यूटर वायरस, एंटीवायरस, मैलवेयर, फ़ायरवॉल एवं साइबर सुरक्षा',
          'डिजिटल इलेक्ट्रॉनिक्स, मल्टीमीडिया (ऑडियो, वीडियो, इमेज फॉर्मेट) व ओपन-सोर्स सॉफ्टवेयर'
        ]
      }
    ]
  },
  {
    id: 'indian-general-studies',
    name: 'Indian General Studies',
    nameEn: 'Indian General Studies',
    nameHi: 'भारतीय सामान्य अध्ययन (संविधान, इतिहास, भूगोल, विज्ञान)',
    nameHindi: 'भारतीय सामान्य अध्ययन (संविधान, इतिहास, भूगोल, विज्ञान)',
    category: 'INDIAN_GS',
    chapters: [
      {
        id: 'ind-polity',
        name: 'भारतीय संविधान एवं राजव्यवस्था (Polity & Constitution)',
        nameHindi: 'भारतीय संविधान एवं राजव्यवस्था',
        nameEn: 'Indian Polity & Constitution',
        topics: [
          'संविधान निर्माण, स्रोत, प्रस्तावना एवं नागरिकता',
          'मौलिक अधिकार, मौलिक कर्तव्य एवं राज्य के नीति निर्देशक तत्व (DPSP)',
          'राष्ट्रपति, प्रधानमंत्री, संसद (लोकसभा/राज्यसभा) व न्यायपालिका',
          'संवैधानिक व गैर-संवैधानिक आयोग (CAG, UPSC, चुनाव आयोग, नीति आयोग)'
        ]
      },
      {
        id: 'ind-history-geo',
        name: 'भारतीय इतिहास एवं भारत का भूगोल (History & Geography)',
        nameHindi: 'भारतीय इतिहास एवं भारत का भूगोल',
        nameEn: 'Indian History & Geography',
        topics: [
          'प्राचीन, मध्यकालीन एवं आधुनिक भारत का इतिहास',
          'भारतीय राष्ट्रीय आंदोलन व 1857 का प्रथम स्वतंत्रता संग्राम',
          'भारत का भौतिक स्वरूप, पर्वत, नदियां, जलवायु एवं वनस्पति',
          'भारतीय अर्थव्यवस्था के मूल सिद्धांत, बैंकिंग व मुद्रास्फीति'
        ]
      },
      {
        id: 'ind-science',
        name: 'सामान्य विज्ञान (भौतिक, रसायन, जीव विज्ञान व पर्यावरण)',
        nameHindi: 'सामान्य विज्ञान एवं पर्यावरण',
        nameEn: 'General Science & Environment',
        topics: [
          'दैनिक जीवन में भौतिक एवं रासायनिक परिवर्तन',
          'मानव शरीर रचना, रोग, पोषण, विटामिन एवं स्वास्थ्य',
          'पर्यावरण प्रदूषण, पारिस्थितिकी तंत्र एवं जैव विविधता संरक्षण'
        ]
      }
    ]
  },
  {
    id: 'current-affairs',
    name: 'Current Affairs (National & CG Special)',
    nameEn: 'Current Affairs (National & CG Special)',
    nameHi: 'समसामयिकी (राष्ट्रीय, अंतर्राष्ट्रीय एवं छत्तीसगढ़)',
    nameHindi: 'समसामयिकी (राष्ट्रीय, अंतर्राष्ट्रीय एवं छत्तीसगढ़)',
    category: 'CURRENT_AFFAIRS',
    chapters: [
      {
        id: 'cg-current',
        name: 'छत्तीसगढ़ समसामयिकी (CG Current Affairs)',
        nameHindi: 'छत्तीसगढ़ समसामयिकी',
        nameEn: 'Chhattisgarh Current Affairs',
        topics: [
          'राज्य स्तरीय पुरस्कार, सम्मान, नियुक्तियां एवं निधन',
          'छत्तीसगढ़ शासन की नवीन नीतियां, विधेयक एवं योजनाएं',
          'राज्य खेलकूद, सांस्कृतिक महोत्सव एवं महत्वपूर्ण आयोजन'
        ]
      },
      {
        id: 'national-current',
        name: 'राष्ट्रीय एवं अंतर्राष्ट्रीय घटनाएं (National & International)',
        nameHindi: 'राष्ट्रीय एवं अंतर्राष्ट्रीय समसामयिकी',
        nameEn: 'National & International Current Affairs',
        topics: [
          'राष्ट्रीय एवं अंतर्राष्ट्रीय समसामयिक घटनाएं, सूचकांक व रैंकिंग',
          'प्रमुख खेल प्रतियोगिताएं (ओलंपिक, राष्ट्रमंडल, विश्व कप, राष्ट्रीय खेल)',
          'अंतर्राष्ट्रीय शिखर सम्मेलन, द्विपक्षीय समझौते व प्रमुख चर्चित व्यक्तित्व'
        ]
      }
    ]
  },
  {
    id: 'child-psychology',
    name: 'Child Psychology & Pedagogy',
    nameEn: 'Child Psychology & Pedagogy',
    nameHi: 'बाल मनोविज्ञान एवं शिक्षण शास्त्र',
    nameHindi: 'बाल मनोविज्ञान एवं शिक्षण शास्त्र',
    category: 'CHILD_PSYCHOLOGY',
    chapters: [
      {
        id: 'child-dev-psycho',
        name: 'बाल विकास एवं मनोविज्ञान (Child Development & Concepts)',
        nameHindi: 'बाल विकास एवं मनोविज्ञान',
        nameEn: 'Child Development & Psychology',
        topics: [
          'शिक्षा एवं मनोविज्ञान की अवधारणाएं व महत्व',
          'बाल विकास की अवस्थाएं (शारीरिक, मानसिक, संवेगात्मक एवं सामाजिक विकास)',
          'बुद्धि एवं व्यक्तित्व की अवधारणाएं, सिद्धांत एवं मापन',
          'समावेशी शिक्षा, विशेष आवश्यकता वाले बच्चे (CWSN) एवं वंचित समूह'
        ]
      },
      {
        id: 'pedagogy-guidance',
        name: 'अधिगम प्रक्रिया, सृजनात्मकता एवं निर्देशन (Learning & Guidance)',
        nameHindi: 'अधिगम प्रक्रिया एवं निर्देशन',
        nameEn: 'Learning Process, Creativity & Guidance',
        topics: [
          'अधिगम के सिद्धांत, अभिप्रेरणा (Motivation) एवं स्मृति',
          'सृजनात्मकता, व्यक्तिगत भिन्नताएं एवं अधिगम अक्षमताएं',
          'निर्देशन एवं परामर्श (Guidance & Counseling) की तकनीकें',
          'सतत एवं समग्र मूल्यांकन (CCE) व उपचारात्मक शिक्षण'
        ]
      }
    ]
  },
  {
    id: 'rural-development-panchayat',
    name: 'Rural Development, Aajeevika & Panchayati Raj',
    nameEn: 'Rural Development, Aajeevika & Panchayati Raj',
    nameHi: 'ग्रामीण विकास, आजीविका एवं 73वां संविधान संशोधन',
    nameHindi: 'ग्रामीण विकास, आजीविका एवं 73वां संविधान संशोधन',
    category: 'PANCHAYATI_RAJ',
    chapters: [
      {
        id: 'ado-panchayati-raj',
        name: '73वां संविधान संशोधन एवं पंचायती राज अधिनियम',
        nameHindi: '73वां संविधान संशोधन एवं पंचायती राज अधिनियम',
        nameEn: '73rd Amendment & Panchayati Raj Act',
        topics: [
          '73वां संविधान संशोधन की विशेषताएं एवं 11वीं अनुसूची के विषय',
          'छत्तीसगढ़ पंचायती राज अधिनियम 1993 (त्रिस्तरीय संरचना एवं कार्य)',
          'ग्राम सभा की भूमिका, शक्तियां एवं स्थायी समितियां',
          'पंचायत निधि, करारोपण एवं वित्तीय स्रोत'
        ]
      },
      {
        id: 'ado-rural-dev',
        name: 'ग्रामीण विकास योजनाएं एवं सामाजिक अंकेक्षण',
        nameHindi: 'ग्रामीण विकास योजनाएं एवं सामाजिक अंकेक्षण',
        nameEn: 'Rural Development & Social Audit',
        topics: [
          'मनरेगा (MGNREGA), प्रधानमंत्री आवास योजना (ग्रामीण)',
          'स्वच्छ भारत मिशन (ग्रामीण) एवं राष्ट्रीय ग्रामीण पेयजल कार्यक्रम',
          'सामाजिक अंकेक्षण (Social Audit) की प्रक्रिया एवं जवाबदेही'
        ]
      },
      {
        id: 'ado-aajeevika',
        name: 'आजीविका संवर्धन एवं स्व-सहायता समूह (SHGs)',
        nameHindi: 'आजीविका संवर्धन एवं स्व-सहायता समूह (SHGs)',
        nameEn: 'Livelihood & Self Help Groups',
        topics: [
          'राष्ट्रीय ग्रामीण आजीविका मिशन (NRLM / बिहान)',
          'स्व-सहायता समूह (SHG) गठन, पंचसूत्र एवं बैंक लिंकेज',
          'कृषि आधारित एवं गैर-कृषि आजीविका मॉडल व ग्राम संगठन'
        ]
      }
    ]
  },
  {
    id: 'cooperative-banking',
    name: 'Cooperative Societies Act & Banking Operations',
    nameEn: 'Cooperative Societies Act & Banking Operations',
    nameHi: 'छत्तीसगढ़ सहकारी सोसायटी अधिनियम एवं बैंकिंग नियमन',
    nameHindi: 'छत्तीसगढ़ सहकारी सोसायटी अधिनियम एवं बैंकिंग नियमन',
    category: 'BANKING_ACT',
    chapters: [
      {
        id: 'coop-act',
        name: 'छत्तीसगढ़ सहकारी सोसायटी अधिनियम 1960 व नियम 1962',
        nameHindi: 'सहकारी सोसायटी अधिनियम एवं नियम',
        nameEn: 'Cooperative Societies Act & Rules',
        topics: [
          'सहकारी सोसायटियों का पंजीकरण, उप-विधियां एवं सदस्यता',
          'प्रबंधन समितियां, आम सभा एवं निर्वाचन प्रक्रिया',
          'सोसायटियों का अंकेक्षण, जांच, परिसमापन एवं अपील'
        ]
      },
      {
        id: 'coop-banking',
        name: 'बैंकिंग नियमन अधिनियम, नाबार्ड एवं साख प्रणाली',
        nameHindi: 'बैंकिंग नियमन, नाबार्ड एवं साख प्रणाली',
        nameEn: 'Banking Regulation & Credit Structure',
        topics: [
          'बैंकिंग नियमन अधिनियम 1949 (सहकारी सोसायटियों पर लागू प्रावधान)',
          'नाबार्ड (NABARD) की भूमिका, अल्पकालीन व मध्यकालीन कृषि ऋण प्रणाली',
          'केसीसी (Kisan Credit Card), ब्याज अनुदान एवं प्राथमिक कृषि साख समितियां (PACS)'
        ]
      }
    ]
  },
  {
    id: 'labour-laws',
    name: 'Labour Laws & Industrial Relations',
    nameEn: 'Labour Laws & Industrial Relations',
    nameHi: 'श्रम विधियां, औद्योगिक संबंध एवं कामगार कल्याण',
    nameHindi: 'श्रम विधियां, औद्योगिक संबंध एवं कामगार कल्याण',
    category: 'LABOUR_LAWS',
    chapters: [
      {
        id: 'labour-acts',
        name: 'प्रमुख श्रम अधिनियम एवं मजदूरी संहिता',
        nameHindi: 'प्रमुख श्रम अधिनियम एवं मजदूरी संहिता',
        nameEn: 'Major Labour Acts & Wage Codes',
        topics: [
          'न्यूनतम मजदूरी अधिनियम 1948 एवं वेतन भुगतान अधिनियम 1936',
          'कारखाना अधिनियम 1948 (काम के घंटे, सुरक्षा, स्वास्थ्य व कल्याण)',
          'मातृत्व लाभ अधिनियम 1961 एवं उपदान संदाय अधिनियम 1972',
          'औद्योगिक विवाद अधिनियम 1947 एवं नवीन 4 श्रम संहिताएं (Labour Codes)'
        ]
      }
    ]
  },
  {
    id: 'agriculture-mandi',
    name: 'Agriculture Science & Mandi Adhiniyam',
    nameEn: 'Agriculture Science & Mandi Adhiniyam',
    nameHi: 'कृषि विज्ञान, उद्यानिकी एवं छत्तीसगढ़ कृषि उपज मंडी अधिनियम',
    nameHindi: 'कृषि विज्ञान, उद्यानिकी एवं छत्तीसगढ़ कृषि उपज मंडी अधिनियम',
    category: 'AGRICULTURE',
    chapters: [
      {
        id: 'mandi-act',
        name: 'छत्तीसगढ़ कृषि उपज मंडी अधिनियम 1972 एवं नियम',
        nameHindi: 'छत्तीसगढ़ कृषि उपज मंडी अधिनियम 1972',
        nameEn: 'CG Mandi Adhiniyam 1972',
        topics: [
          'मंडी समितियों का गठन, शक्तियां एवं कर्तव्य',
          'मंडी शुल्क, लाइसेंसिंग एवं ई-नाम (e-NAM) विपणन व्यवस्था',
          'न्यूनतम समर्थन मूल्य (MSP) एवं राजीव गांधी किसान न्याय योजना'
        ]
      },
      {
        id: 'agri-horticulture',
        name: 'सस्य विज्ञान, उद्यानिकी फसलें एवं मृदा स्वास्थ्य',
        nameHindi: 'सस्य विज्ञान, उद्यानिकी फसलें एवं मृदा स्वास्थ्य',
        nameEn: 'Agronomy & Horticulture Sciences',
        topics: [
          'धान, दलहन, तिलहन व बागवानी फसलों की उन्नत खेती',
          'पौध संरक्षण, कीट एवं रोग नियंत्रण',
          'मृदा परीक्षण, उर्वरक प्रबंधन एवं सूक्ष्म सिंचाई तकनीकें'
        ]
      }
    ]
  }
];

/**
 * Helper to build subject hierarchy from modules
 */
function buildSubjectHierarchy(
  moduleId: string,
  subjectNameEn: string,
  subjectNameHi: string,
  marks: number,
  questionsCount: number,
  part?: string,
  qualifyingMinPercent?: number
): ExamSubjectHierarchy {
  const mod = MODULES_LIST.find(m => m.id === moduleId);
  const chapters = mod 
    ? mod.chapters.map(c => ({
        chapterId: c.id,
        chapterName: c.nameHindi || c.name,
        subtopics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
      }))
    : [];

  return {
    subjectId: moduleId,
    subjectNameEn,
    subjectNameHi,
    marks,
    questionsCount,
    weightagePercent: marks,
    part,
    qualifyingMinPercent,
    chapters
  };
}

/**
 * Detailed Post-Wise CGSSB / CG Vyapam Official Exam Syllabus Schemes
 * Note: Marks distribution is different for each exam depending on its official notification.
 */
export const CGSSB_EXAM_SCHEMES: Record<string, ExamCategoryHierarchy> = {
  // 1. Hostel Warden (छात्रावास अधीक्षक - HSW) - 100 Marks Pattern
  HOSTEL_WARDEN: {
    categoryId: 'CGSSB',
    examCode: 'HSW_100',
    categoryNameEn: 'CGSSB Hostel Warden (छात्रावास अधीक्षक Grade-D)',
    categoryNameHi: 'छत्तीसगढ़ छात्रावास अधीक्षक श्रेणी-द भर्ती परीक्षा (100 अंक)',
    totalMarks: 100,
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (-0.25)',
    description: 'Official CG Vyapam Hostel Warden Syllabus: Part A Computer (30M, min 50% qualifying) + Part B [Hindi (5M) + English (5M) + Maths (25M) + Indian GS (15M) + CG GK (5M) + Current Affairs (5M) + Child Psychology (10M)] = Total 100 Marks.',
    subjects: [
      buildSubjectHierarchy('computer-awareness', 'Computer Knowledge (Part A - 30 Marks, 50% Qualifying)', 'भाग अ: कम्प्यूटर संबंधी सामान्य ज्ञान (30 अंक - 50% अनिवार्य)', 30, 30, 'Part A', 50),
      buildSubjectHierarchy('general-hindi', 'General Hindi Grammar (Part B - 5 Marks)', 'भाग ब: हिन्दी व्याकरण (5 अंक / 5 प्रश्न)', 5, 5, 'Part B'),
      buildSubjectHierarchy('general-english', 'General English (Part B - 5 Marks)', 'भाग ब: सामान्य अंग्रेजी (5 अंक / 5 प्रश्न)', 5, 5, 'Part B'),
      buildSubjectHierarchy('maths-aptitude', 'Mathematics (Part B - 25 Marks)', 'भाग ब: गणित (25 अंक / 25 प्रश्न)', 25, 25, 'Part B'),
      buildSubjectHierarchy('indian-general-studies', 'Indian General Knowledge (Part B - 15 Marks)', 'भाग ब: सामान्य ज्ञान - भारतीय राजव्यवस्था, इतिहास, भूगोल, अर्थव्यवस्था, विज्ञान (15 अंक)', 15, 15, 'Part B'),
      buildSubjectHierarchy('cg-gk', 'Chhattisgarh General Knowledge (Part B - 5 Marks)', 'भाग ब: छत्तीसगढ़ की सामान्य जानकारी (5 अंक / 5 प्रश्न)', 5, 5, 'Part B'),
      buildSubjectHierarchy('current-affairs', 'Current Affairs & Sports (Part B - 5 Marks)', 'भाग ब: समसामयिक घटनाक्रम, खेलकूद व देश-विदेश (5 अंक / 5 प्रश्न)', 5, 5, 'Part B'),
      buildSubjectHierarchy('child-psychology', 'Child Psychology (Part B - 10 Marks)', 'भाग ब: बाल मनोविज्ञान (10 अंक / 10 प्रश्न)', 10, 10, 'Part B')
    ]
  },

  // 2. Patwari Recruitment (पटवारी चयन परीक्षा - RDP) - 150 Marks Pattern
  PATWARI: {
    categoryId: 'CGSSB',
    examCode: 'RDP_150',
    categoryNameEn: 'CGSSB Patwari Selection Exam (पटवारी चयन परीक्षा)',
    categoryNameHi: 'छत्तीसगढ़ पटवारी चयन परीक्षा (150 अंक)',
    totalMarks: 150,
    totalQuestions: 150,
    durationMinutes: 180,
    negativeMarkingRatio: '-⅓rd (-0.33)',
    description: 'Official Patwari Marks Distribution: Computer (20M) + Hindi (10M) + English (10M) + Maths (30M) + Mental Ability/Reasoning (15M) + Indian GS (35M) + Current Affairs (15M) + CG GK (15M) = Total 150 Marks.',
    subjects: [
      buildSubjectHierarchy('computer-awareness', 'Computer Knowledge (20 Marks)', 'कम्प्यूटर संबंधी सामान्य ज्ञान (20 अंक / 20 प्रश्न)', 20, 20),
      buildSubjectHierarchy('general-hindi', 'General Hindi (10 Marks)', 'सामान्य हिन्दी व्याकरण (10 अंक / 10 प्रश्न)', 10, 10),
      buildSubjectHierarchy('general-english', 'General English (10 Marks)', 'सामान्य अंग्रेजी (10 अंक / 10 प्रश्न)', 10, 10),
      buildSubjectHierarchy('maths-aptitude', 'Mathematics (30 Marks)', 'गणित एवं संख्यात्मक अभियोग्यता (30 अंक / 30 प्रश्न)', 30, 30),
      buildSubjectHierarchy('general-reasoning', 'Mental Ability & Reasoning (15 Marks)', 'तर्कशक्ति एवं मानसिक योग्यता (15 अंक / 15 प्रश्न)', 15, 15),
      buildSubjectHierarchy('indian-general-studies', 'Indian General Studies (35 Marks)', 'भारतीय सामान्य ज्ञान - संविधान, इतिहास, भूगोल, अर्थव्यवस्था, विज्ञान (35 अंक)', 35, 35),
      buildSubjectHierarchy('current-affairs', 'Current Affairs & Sports (15 Marks)', 'समसामयिक घटनाक्रम, खेलकूद व राष्ट्रीय-अंतर्राष्ट्रीय (15 अंक)', 15, 15),
      buildSubjectHierarchy('cg-gk', 'Chhattisgarh General Knowledge (15 Marks)', 'छत्तीसगढ़ का सामान्य ज्ञान एवं इतिहास-संस्कृति (15 अंक / 15 प्रश्न)', 15, 15)
    ]
  },

  // 3. Revenue Inspector (RI / राजस्व निरीक्षक - RII) - 150 Marks Pattern
  REVENUE_INSPECTOR: {
    categoryId: 'CGSSB',
    examCode: 'RII_150',
    categoryNameEn: 'CGSSB Revenue Inspector Exam (राजस्व निरीक्षक RI)',
    categoryNameHi: 'छत्तीसगढ़ राजस्व निरीक्षक भर्ती परीक्षा (150 अंक)',
    totalMarks: 150,
    totalQuestions: 150,
    durationMinutes: 180,
    negativeMarkingRatio: '-⅓rd (-0.33)',
    description: 'Official Revenue Inspector Marks Distribution: Computer (20M) + Hindi (10M) + English (10M) + Maths (30M) + Mental Ability (15M) + Indian GS (35M) + Current Affairs (15M) + CG GK (15M) = Total 150 Marks.',
    subjects: [
      buildSubjectHierarchy('computer-awareness', 'Computer Knowledge (20 Marks)', 'कम्प्यूटर संबंधी सामान्य ज्ञान (20 अंक)', 20, 20),
      buildSubjectHierarchy('general-hindi', 'General Hindi (10 Marks)', 'सामान्य हिन्दी (10 अंक)', 10, 10),
      buildSubjectHierarchy('general-english', 'General English (10 Marks)', 'सामान्य अंग्रेजी (10 अंक)', 10, 10),
      buildSubjectHierarchy('maths-aptitude', 'Mathematics (30 Marks)', 'गणित (30 अंक)', 30, 30),
      buildSubjectHierarchy('general-reasoning', 'Reasoning & Mental Ability (15 Marks)', 'तर्कशक्ति एवं मानसिक योग्यता (15 अंक)', 15, 15),
      buildSubjectHierarchy('indian-general-studies', 'General Knowledge (35 Marks)', 'सामान्य ज्ञान (35 अंक)', 35, 35),
      buildSubjectHierarchy('current-affairs', 'Current Affairs (15 Marks)', 'समसामयिक घटनाक्रम (15 अंक)', 15, 15),
      buildSubjectHierarchy('cg-gk', 'Chhattisgarh GK (15 Marks)', 'छत्तीसगढ़ का सामान्य ज्ञान (15 अंक)', 15, 15)
    ]
  },

  // 4. Assistant Grade-III & Data Entry Operator (AGDO / DEO) - 100 Marks Pattern
  AGDO_DEO: {
    categoryId: 'CGSSB',
    examCode: 'AGDO_100',
    categoryNameEn: 'CGSSB Assistant Grade-3 & Data Entry Operator (AG-III & DEO)',
    categoryNameHi: 'सहायक ग्रेड-3 एवं डाटा एंट्री ऑपरेटर संयुक्त भर्ती (100 अंक)',
    totalMarks: 100,
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (-0.25)',
    description: 'Official AG-III & DEO Marks Distribution: General Knowledge & CG GS (50M) + Computer Knowledge (30M) + General Hindi (10M) + General English (10M) = Total 100 Marks.',
    subjects: [
      buildSubjectHierarchy('cg-gk', 'General Studies & CG GK (50 Marks)', 'सामान्य अध्ययन एवं छत्तीसगढ़ सामान्य ज्ञान (50 अंक)', 50, 50),
      buildSubjectHierarchy('computer-awareness', 'Computer Knowledge & MS Office (30 Marks)', 'कम्प्यूटर सामान्य ज्ञान एवं अनुप्रयोग (30 अंक)', 30, 30),
      buildSubjectHierarchy('general-hindi', 'General Hindi (10 Marks)', 'सामान्य हिन्दी व्याकरण (10 अंक)', 10, 10),
      buildSubjectHierarchy('general-english', 'General English (10 Marks)', 'सामान्य अंग्रेजी (10 अंक)', 10, 10)
    ]
  },

  // 5. Assistant Development Extension Officer (ADO / सहायक विकास विस्तार अधिकारी) - 150 Marks Pattern
  ADO: {
    categoryId: 'CGSSB',
    examCode: 'ADO_150',
    categoryNameEn: 'CGSSB Assistant Development Extension Officer (ADO)',
    categoryNameHi: 'सहायक विकास विस्तार अधिकारी (ADO) भर्ती परीक्षा (150 अंक)',
    totalMarks: 150,
    totalQuestions: 150,
    durationMinutes: 180,
    negativeMarkingRatio: '-⅓rd (-0.33)',
    description: 'Official ADO Marks Distribution: 73rd Constitutional Amendment & Panchayati Raj (30M) + Rural Development (30M) + Aajeevika/Livelihood (30M) + General Studies & CG GK (30M) + General Hindi (30M) = Total 150 Marks.',
    subjects: [
      buildSubjectHierarchy('rural-development-panchayat', '73rd Amendment & Panchayati Raj (30 Marks)', '73वां संविधान संशोधन एवं पंचायती राज (30 अंक)', 30, 30),
      buildSubjectHierarchy('rural-development-panchayat', 'Rural Development Schemes (30 Marks)', 'ग्रामीण विकास की प्रमुख योजनाएं एवं सामाजिक अंकेक्षण (30 अंक)', 30, 30),
      buildSubjectHierarchy('rural-development-panchayat', 'Livelihood Promotion & SHGs (30 Marks)', 'आजीविका संवर्धन, स्व-सहायता समूह एवं बिहान योजना (30 अंक)', 30, 30),
      buildSubjectHierarchy('cg-gk', 'General Studies & CG Knowledge (30 Marks)', 'सामान्य अध्ययन एवं छत्तीसगढ़ का सामान्य ज्ञान (30 अंक)', 30, 30),
      buildSubjectHierarchy('general-hindi', 'General Hindi (30 Marks)', 'सामान्य हिन्दी व्याकरण (30 अंक)', 30, 30)
    ]
  },

  // 6. Labour Inspector (श्रम निरीक्षक - LII) - 150 Marks Pattern
  LABOUR_INSPECTOR: {
    categoryId: 'CGSSB',
    examCode: 'LII_150',
    categoryNameEn: 'CGSSB Labour Inspector Recruitment Exam (श्रम निरीक्षक)',
    categoryNameHi: 'छत्तीसगढ़ श्रम निरीक्षक भर्ती परीक्षा (150 अंक)',
    totalMarks: 150,
    totalQuestions: 150,
    durationMinutes: 180,
    negativeMarkingRatio: '-⅓rd (-0.33)',
    description: 'Official Labour Inspector Marks Distribution: General Studies & CG GK (65M) + Labour Laws & Industrial Relations (20M) + Computer, Maths & Reasoning (65M) = Total 150 Marks.',
    subjects: [
      buildSubjectHierarchy('cg-gk', 'General Studies & CG GK (65 Marks)', 'सामान्य अध्ययन एवं छत्तीसगढ़ सामान्य ज्ञान (65 अंक)', 65, 65),
      buildSubjectHierarchy('labour-laws', 'Labour Laws & Acts (20 Marks)', 'श्रम विधियां, कारखाना अधिनियम व मजदूरी संहिता (20 अंक)', 20, 20),
      buildSubjectHierarchy('computer-awareness', 'Computer, Maths & Reasoning (65 Marks)', 'कम्प्यूटर, गणितीय अभियोग्यता एवं तर्कशक्ति (65 अंक)', 65, 65)
    ]
  },

  // 7. Apex Bank / Cooperative Bank (अपेक्स बैंक / सहायक प्रबंधक) - 100 Marks Pattern
  APEX_BANK: {
    categoryId: 'CGSSB',
    examCode: 'CBA_100',
    categoryNameEn: 'CG Apex Bank / Cooperative Bank Assistant Manager Exam',
    categoryNameHi: 'छत्तीसगढ़ अपेक्स बैंक एवं जिला सहकारी केंद्रीय बैंक भर्ती (100 अंक)',
    totalMarks: 100,
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (-0.25)',
    description: 'Official Apex Bank Marks Distribution: CG GK & Chhattisgarhi Language (20M) + Cooperative Societies Act & Banking Operations (25M) + Computer Knowledge (15M) + General Hindi (10M) + General English (10M) + Maths & Reasoning (10M) + Indian GS (10M) = Total 100 Marks.',
    subjects: [
      buildSubjectHierarchy('cg-gk', 'Chhattisgarh GK & Chhattisgarhi Language (Part 1 - 20 Marks)', 'भाग 1: छत्तीसगढ़ का सामान्य ज्ञान एवं छत्तीसगढ़ी भाषा (20 अंक)', 20, 20, 'Part 1'),
      buildSubjectHierarchy('cooperative-banking', 'Cooperative Societies Act & Banking (25 Marks)', 'भाग 2: छत्तीसगढ़ सहकारी सोसायटी अधिनियम व बैंकिंग (25 अंक)', 25, 25, 'Part 2'),
      buildSubjectHierarchy('computer-awareness', 'Computer Knowledge (15 Marks)', 'भाग 2: कम्प्यूटर संबंधी ज्ञान (15 अंक)', 15, 15, 'Part 2'),
      buildSubjectHierarchy('general-hindi', 'General Hindi (10 Marks)', 'भाग 2: सामान्य हिन्दी (10 अंक)', 10, 10, 'Part 2'),
      buildSubjectHierarchy('general-english', 'General English (10 Marks)', 'भाग 2: सामान्य अंग्रेजी (10 अंक)', 10, 10, 'Part 2'),
      buildSubjectHierarchy('maths-aptitude', 'Mathematics & Reasoning (10 Marks)', 'भाग 2: गणित एवं तार्किक योग्यता (10 अंक)', 10, 10, 'Part 2'),
      buildSubjectHierarchy('indian-general-studies', 'Indian General Studies (10 Marks)', 'भाग 2: भारत का सामान्य ज्ञान (10 अंक)', 10, 10, 'Part 2')
    ]
  },

  // 8. Mandi Nirikshak & Sub-Inspector (मंडी निरीक्षक / उप-निरीक्षक) - 150 Marks Pattern
  MANDI_NIRIKSHAK: {
    categoryId: 'CGSSB',
    examCode: 'MSI_150',
    categoryNameEn: 'CGSSB Mandi Nirikshak & Sub-Inspector Exam (मंडी निरीक्षक)',
    categoryNameHi: 'छत्तीसगढ़ कृषि उपज मंडी निरीक्षक व उप-निरीक्षक परीक्षा (150 अंक)',
    totalMarks: 150,
    totalQuestions: 150,
    durationMinutes: 180,
    negativeMarkingRatio: '-⅓rd (-0.33)',
    description: 'Official Mandi Nirikshak Marks Distribution: Hindi (10M) + English (10M) + Maths (30M) + Reasoning (15M) + Indian GS (35M) + Current Affairs (15M) + CG GK (15M) + Mandi Adhiniyam & Agri (20M) = Total 150 Marks.',
    subjects: [
      buildSubjectHierarchy('general-hindi', 'General Hindi (10 Marks)', 'सामान्य हिन्दी (10 अंक)', 10, 10),
      buildSubjectHierarchy('general-english', 'General English (10 Marks)', 'सामान्य अंग्रेजी (10 अंक)', 10, 10),
      buildSubjectHierarchy('maths-aptitude', 'Mathematics (30 Marks)', 'गणित (30 अंक)', 30, 30),
      buildSubjectHierarchy('general-reasoning', 'Reasoning Ability (15 Marks)', 'तर्कशक्ति एवं मानसिक योग्यता (15 अंक)', 15, 15),
      buildSubjectHierarchy('indian-general-studies', 'General Knowledge (35 Marks)', 'सामान्य ज्ञान (35 अंक)', 35, 35),
      buildSubjectHierarchy('current-affairs', 'Current Affairs (15 Marks)', 'समसामयिक घटनाएं (15 अंक)', 15, 15),
      buildSubjectHierarchy('cg-gk', 'Chhattisgarh GK (15 Marks)', 'छत्तीसगढ़ सामान्य ज्ञान (15 अंक)', 15, 15),
      buildSubjectHierarchy('agriculture-mandi', 'Mandi Act & Agriculture (20 Marks)', 'कृषि उपज मंडी अधिनियम 1972 व कृषि विज्ञान (20 अंक)', 20, 20)
    ]
  },

  // 9. CG Teacher Recruitment (शिक्षक भर्ती वर्ग-2 / Teacher Paper 2) - 150 Marks Pattern
  CG_TEACHER_PAPER2: {
    categoryId: 'CGSSB',
    examCode: 'SEDT_150',
    categoryNameEn: 'CGSSB Teacher Recruitment Paper-II (शिक्षक भर्ती वर्ग-2)',
    categoryNameHi: 'छत्तीसगढ़ शिक्षक भर्ती परीक्षा वर्ग-2 (150 अंक)',
    totalMarks: 150,
    totalQuestions: 150,
    durationMinutes: 150,
    negativeMarkingRatio: '-¼th (-0.25)',
    description: 'Official CG Teacher Paper-II Marks Distribution: Child Pedagogy (30M) + Hindi (25M) + English (25M) + Maths & Science (30M) + Social Science / EVS (20M) + Computer (10M) + CG & Indian GS (10M) = Total 150 Marks.',
    subjects: [
      buildSubjectHierarchy('child-psychology', 'Child Pedagogy & Development (30 Marks)', 'बाल विकास एवं शिक्षण शास्त्र (30 अंक)', 30, 30),
      buildSubjectHierarchy('general-hindi', 'General Hindi (25 Marks)', 'सामान्य हिन्दी (25 अंक)', 25, 25),
      buildSubjectHierarchy('general-english', 'General English (25 Marks)', 'सामान्य अंग्रेजी (25 अंक)', 25, 25),
      buildSubjectHierarchy('maths-aptitude', 'Mathematics & Science (30 Marks)', 'गणित एवं विज्ञान (30 अंक)', 30, 30),
      buildSubjectHierarchy('indian-general-studies', 'Social Science & EVS (20 Marks)', 'सामाजिक अध्ययन एवं पर्यावरण (20 अंक)', 20, 20),
      buildSubjectHierarchy('computer-awareness', 'Computer Knowledge (10 Marks)', 'कम्प्यूटर संबंधी सामान्य ज्ञान (10 अंक)', 10, 10),
      buildSubjectHierarchy('cg-gk', 'General Knowledge (10 Marks)', 'सामान्य ज्ञान व छत्तीसगढ़ ज्ञान (10 अंक)', 10, 10)
    ]
  },

  // 10. CG Assistant Teacher Recruitment (सहायक शिक्षक वर्ग-3 / Assistant Teacher) - 150 Marks Pattern
  CG_ASST_TEACHER_PAPER1: {
    categoryId: 'CGSSB',
    examCode: 'SEDAT_150',
    categoryNameEn: 'CGSSB Assistant Teacher Recruitment (सहायक शिक्षक वर्ग-3)',
    categoryNameHi: 'छत्तीसगढ़ सहायक शिक्षक भर्ती परीक्षा वर्ग-3 (150 अंक)',
    totalMarks: 150,
    totalQuestions: 150,
    durationMinutes: 150,
    negativeMarkingRatio: '-¼th (-0.25)',
    description: 'Official CG Assistant Teacher Marks Distribution: Child Pedagogy (30M) + Hindi (25M) + English (25M) + Maths (30M) + Environmental Studies (30M) + Computer (10M) = Total 150 Marks.',
    subjects: [
      buildSubjectHierarchy('child-psychology', 'Child Pedagogy & Development (30 Marks)', 'बाल विकास एवं शिक्षण शास्त्र (30 अंक)', 30, 30),
      buildSubjectHierarchy('general-hindi', 'General Hindi (25 Marks)', 'सामान्य हिन्दी (25 अंक)', 25, 25),
      buildSubjectHierarchy('general-english', 'General English (25 Marks)', 'सामान्य अंग्रेजी (25 अंक)', 25, 25),
      buildSubjectHierarchy('maths-aptitude', 'Mathematics (30 Marks)', 'गणित (30 अंक)', 30, 30),
      buildSubjectHierarchy('indian-general-studies', 'Environmental Studies (30 Marks)', 'पर्यावरण अध्ययन (30 अंक)', 30, 30),
      buildSubjectHierarchy('computer-awareness', 'Computer Knowledge (10 Marks)', 'कम्प्यूटर संबंधी सामान्य ज्ञान (10 अंक)', 10, 10)
    ]
  },

  // 11. CG Police Sub-Inspector Prelims (सब-इंस्पेक्टर प्रारंभिक परीक्षा) - 300 Marks Pattern
  CG_POLICE_SI: {
    categoryId: 'CGSSB',
    examCode: 'POL_SI_300',
    categoryNameEn: 'CG Police Sub-Inspector Prelims Exam (सब-इंस्पेक्टर प्रारंभिक)',
    categoryNameHi: 'छत्तीसगढ़ पुलिस सब-इंस्पेक्टर प्रारंभिक परीक्षा (300 अंक)',
    totalMarks: 300,
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarkingRatio: 'None / 0 Marks',
    description: 'Official CG Police SI Prelims: 100 Questions × 3 Marks = 300 Marks. Indian GS (35 Qs / 105M) + CG GK (25 Qs / 75M) + Maths & Reasoning (20 Qs / 60M) + Computer & Science (20 Qs / 60M). No negative marking.',
    subjects: [
      buildSubjectHierarchy('indian-general-studies', 'Indian General Studies & History-Polity (105 Marks / 35 Qs)', 'भारतीय सामान्य अध्ययन, संविधान, इतिहास व भूगोल (105 अंक / 35 प्रश्न)', 105, 35),
      buildSubjectHierarchy('cg-gk', 'Chhattisgarh General Studies (75 Marks / 25 Qs)', 'छत्तीसगढ़ का सामान्य ज्ञान एवं जनजाति-संस्कृति (75 अंक / 25 प्रश्न)', 75, 25),
      buildSubjectHierarchy('maths-aptitude', 'Mathematics & Logical Reasoning (60 Marks / 20 Qs)', 'गणित एवं मानसिक योग्यता परीक्षण (60 अंक / 20 प्रश्न)', 60, 20),
      buildSubjectHierarchy('computer-awareness', 'Computer Knowledge & Science (60 Marks / 20 Qs)', 'कम्प्यूटर सामान्य ज्ञान एवं दैनिक विज्ञान (60 अंक / 20 प्रश्न)', 60, 20)
    ]
  }
};

/**
 * Exam Category Syllabus Hierarchy (CGPSC, CGSSB/Vyapam, Swami Atmanand, General)
 */
export const CG_EXAM_HIERARCHICAL_SYLLABUS: Record<string, ExamCategoryHierarchy> = {
  CGPSC: {
    categoryId: 'CGPSC',
    examCode: 'CGPSC_SSE_PRE_1',
    categoryNameEn: 'Chhattisgarh Public Service Commission (CGPSC SSE Prelims Paper 1)',
    categoryNameHi: 'छत्तीसगढ़ लोक सेवा आयोग (प्रारंभिक परीक्षा प्रश्न-पत्र 1)',
    totalMarks: 200,
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarkingRatio: '-⅓rd (-0.667)',
    description: 'CGPSC State Service Prelims Paper-I strictly contains only 2 sections: Chhattisgarh General Studies (50 Marks / 50 Qs) and India General Studies (50 Marks / 50 Qs). Total 100 Qs / 200 Marks (+2.0 / -0.667 negative marking).',
    subjects: [
      {
        subjectId: 'cg-gk',
        subjectNameEn: 'Chhattisgarh General Studies (Part B)',
        subjectNameHi: 'छत्तीसगढ़ का सामान्य ज्ञान (50 प्रश्न / 50 Marks - कुल 100 अंक)',
        weightagePercent: 50,
        marks: 50,
        questionsCount: 50,
        part: 'Section 1 / Part B',
        chapters: MODULES_LIST.find(m => m.id === 'cg-gk')!.chapters.map(c => ({
          chapterId: c.id,
          chapterName: c.nameHindi || c.name,
          subtopics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
        }))
      },
      {
        subjectId: 'indian-general-studies',
        subjectNameEn: 'General Studies of India (Part A)',
        subjectNameHi: 'भारत का सामान्य अध्ययन (50 प्रश्न / 50 Marks - कुल 100 अंक)',
        weightagePercent: 50,
        marks: 50,
        questionsCount: 50,
        part: 'Section 2 / Part A',
        chapters: MODULES_LIST.find(m => m.id === 'indian-general-studies')!.chapters.map(c => ({
          chapterId: c.id,
          chapterName: c.nameHindi || c.name,
          subtopics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
        }))
      }
    ]
  },
  CGSSB: CGSSB_EXAM_SCHEMES.HOSTEL_WARDEN, // Default CGSSB scheme
  ATMANAND: {
    categoryId: 'ATMANAND',
    examCode: 'ATMANAND_2026',
    categoryNameEn: 'Swami Atmanand English Medium School & Teacher Recruitment',
    categoryNameHi: 'स्वामी आत्मानंद उत्कृष्ट विद्यालय एवं शिक्षक पात्रता परीक्षा',
    totalMarks: 100,
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (-0.25)',
    description: 'Assistant Teacher, Teacher (Science/Math/Arts), Lecturer recruitment exams.',
    subjects: [
      {
        subjectId: 'general-english',
        subjectNameEn: 'English Language Pedagogy & Grammar',
        subjectNameHi: 'अंग्रेजी भाषा एवं शिक्षण शास्त्र',
        weightagePercent: 30,
        marks: 30,
        questionsCount: 30,
        chapters: MODULES_LIST.find(m => m.id === 'general-english')!.chapters.map(c => ({
          chapterId: c.id,
          chapterName: c.nameHindi || c.name,
          subtopics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
        }))
      },
      {
        subjectId: 'maths-aptitude',
        subjectNameEn: 'Mathematics & Science',
        subjectNameHi: 'गणित एवं विज्ञान',
        weightagePercent: 30,
        marks: 30,
        questionsCount: 30,
        chapters: MODULES_LIST.find(m => m.id === 'maths-aptitude')!.chapters.map(c => ({
          chapterId: c.id,
          chapterName: c.nameHindi || c.name,
          subtopics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
        }))
      },
      {
        subjectId: 'general-reasoning',
        subjectNameEn: 'General Mental Ability & Reasoning',
        subjectNameHi: 'तर्कशक्ति एवं मानसिक योग्यता',
        weightagePercent: 20,
        marks: 20,
        questionsCount: 20,
        chapters: MODULES_LIST.find(m => m.id === 'general-reasoning')!.chapters.map(c => ({
          chapterId: c.id,
          chapterName: c.nameHindi || c.name,
          subtopics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
        }))
      },
      {
        subjectId: 'child-psychology',
        subjectNameEn: 'Child Psychology & Pedagogy',
        subjectNameHi: 'बाल मनोविज्ञान एवं शिक्षण शास्त्र',
        weightagePercent: 20,
        marks: 20,
        questionsCount: 20,
        chapters: MODULES_LIST.find(m => m.id === 'child-psychology')!.chapters.map(c => ({
          chapterId: c.id,
          chapterName: c.nameHindi || c.name,
          subtopics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
        }))
      }
    ]
  },
  GENERAL: {
    categoryId: 'GENERAL',
    examCode: 'GENERAL_STATE_RECRUITMENT',
    categoryNameEn: 'All Combined State Government Recruitments',
    categoryNameHi: 'समस्त राज्य स्तरीय संयुक्त भर्ती परीक्षाएं',
    totalMarks: 100,
    totalQuestions: 100,
    durationMinutes: 120,
    negativeMarkingRatio: '-⅓rd (-0.33)',
    description: 'Standard syllabus mapping for all competitive tests in Chhattisgarh.',
    subjects: MODULES_LIST.map(m => ({
      subjectId: m.id,
      subjectNameEn: m.nameEn,
      subjectNameHi: m.nameHi,
      marks: Math.round(100 / MODULES_LIST.length),
      questionsCount: Math.round(100 / MODULES_LIST.length),
      weightagePercent: Math.round(100 / MODULES_LIST.length),
      chapters: m.chapters.map(c => ({
        chapterId: c.id,
        chapterName: c.nameHindi || c.name,
        subtopics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
      }))
    }))
  }
};

/**
 * Resolves exact exam-specific syllabus and marks distribution based on exam title, code, or post.
 * Allows CGSSB exams to have their exact official marks distributions rather than a single static template.
 */
export function getSyllabusForExam(examIdentifier: string, authority?: string): ExamCategoryHierarchy {
  const norm = (examIdentifier || '').toLowerCase().trim();
  const authNorm = (authority || '').toLowerCase().trim();

  // CGPSC Check
  if (norm.includes('psc') || norm.includes('state service') || authNorm.includes('psc')) {
    return CG_EXAM_HIERARCHICAL_SYLLABUS.CGPSC;
  }

  // CGSSB Post-Wise Check
  if (norm.includes('warden') || norm.includes('छात्रावास') || norm.includes('hsw') || norm.includes('ths')) {
    return CGSSB_EXAM_SCHEMES.HOSTEL_WARDEN;
  }
  if (norm.includes('patwari') || norm.includes('पटवारी') || norm.includes('rdp')) {
    return CGSSB_EXAM_SCHEMES.PATWARI;
  }
  if (norm.includes('revenue inspector') || norm.includes('राजस्व निरीक्षक') || norm.includes(' ri') || norm.includes('rii')) {
    return CGSSB_EXAM_SCHEMES.REVENUE_INSPECTOR;
  }
  if (norm.includes('ado') || norm.includes('सहायक विकास') || norm.includes('extension officer')) {
    return CGSSB_EXAM_SCHEMES.ADO;
  }
  if (norm.includes('labour') || norm.includes('श्रम निरीक्षक') || norm.includes('lii')) {
    return CGSSB_EXAM_SCHEMES.LABOUR_INSPECTOR;
  }
  if (norm.includes('bank') || norm.includes('apex') || norm.includes('सहकारी') || norm.includes('cooperative')) {
    return CGSSB_EXAM_SCHEMES.APEX_BANK;
  }
  if (norm.includes('mandi') || norm.includes('मंडी')) {
    return CGSSB_EXAM_SCHEMES.MANDI_NIRIKSHAK;
  }
  if (norm.includes('assistant teacher') || norm.includes('सहायक शिक्षक') || norm.includes('sedat')) {
    return CGSSB_EXAM_SCHEMES.CG_ASST_TEACHER_PAPER1;
  }
  if (norm.includes('teacher') || norm.includes('shikshak') || norm.includes('शिक्षक') || norm.includes('sedt')) {
    return CGSSB_EXAM_SCHEMES.CG_TEACHER_PAPER2;
  }
  if (norm.includes('police') || norm.includes('sub-inspector') || norm.includes('sub inspector') || norm.includes('si ') || norm.includes('सब-इंस्पेक्टर')) {
    return CGSSB_EXAM_SCHEMES.CG_POLICE_SI;
  }
  if (norm.includes('agdo') || norm.includes('deo') || norm.includes('सहायक ग्रेड') || norm.includes('data entry') || norm.includes('ag-3') || norm.includes('ag-iii')) {
    return CGSSB_EXAM_SCHEMES.AGDO_DEO;
  }

  // Atmanand / Teacher
  if (norm.includes('atmanand') || norm.includes('swami')) {
    return CG_EXAM_HIERARCHICAL_SYLLABUS.ATMANAND;
  }

  // Default CGSSB fallback
  if (authNorm.includes('vyapam') || authNorm.includes('ssb') || authNorm.includes('cgssb') || norm.includes('vyapam') || norm.includes('cgssb')) {
    return CGSSB_EXAM_SCHEMES.HOSTEL_WARDEN;
  }

  return CG_EXAM_HIERARCHICAL_SYLLABUS.GENERAL;
}

/**
 * Augmented Master Syllabus Object & Array:
 * Supports both array methods (`.map`, `.find`, `[0]`, `.length`) and categorized property lookup
 */
export interface CGMasterSyllabusType extends Array<CGMasterModule> {
  CGPSC: ExamCategoryHierarchy;
  CGSSB: ExamCategoryHierarchy;
  ATMANAND: ExamCategoryHierarchy;
  GENERAL: ExamCategoryHierarchy;
  schemes: Record<string, ExamCategoryHierarchy>;
  categories: Record<string, ExamCategoryHierarchy>;
  byCategory: Record<string, ExamCategoryHierarchy>;
  byModuleId: Record<string, CGMasterModule>;
}

// Create the unified hybrid array & dictionary constant
const masterSyllabusInstance = [...MODULES_LIST] as CGMasterSyllabusType;

masterSyllabusInstance.CGPSC = CG_EXAM_HIERARCHICAL_SYLLABUS.CGPSC;
masterSyllabusInstance.CGSSB = CG_EXAM_HIERARCHICAL_SYLLABUS.CGSSB;
masterSyllabusInstance.ATMANAND = CG_EXAM_HIERARCHICAL_SYLLABUS.ATMANAND;
masterSyllabusInstance.GENERAL = CG_EXAM_HIERARCHICAL_SYLLABUS.GENERAL;
masterSyllabusInstance.schemes = CGSSB_EXAM_SCHEMES;
masterSyllabusInstance.categories = CG_EXAM_HIERARCHICAL_SYLLABUS;
masterSyllabusInstance.byCategory = CG_EXAM_HIERARCHICAL_SYLLABUS;

masterSyllabusInstance.byModuleId = MODULES_LIST.reduce((acc, m) => {
  acc[m.id] = m;
  return acc;
}, {} as Record<string, CGMasterModule>);

export const CG_MASTER_SYLLABUS = masterSyllabusInstance;

/**
 * Syllabus Utility Helper Methods for Admin Tools & Question Bank Management
 */

export function getModuleById(moduleId: string): CGMasterModule | undefined {
  return CG_MASTER_SYLLABUS.find(m => m.id === moduleId);
}

export function getChapterById(moduleId: string, chapterId: string): CGMasterChapter | undefined {
  const mod = getModuleById(moduleId);
  if (!mod) return undefined;
  return mod.chapters.find(c => c.id === chapterId);
}

export function getChaptersForModule(moduleId: string): CGMasterChapter[] {
  const mod = getModuleById(moduleId);
  return mod ? mod.chapters : [];
}

export function getTopicsForChapter(moduleId: string, chapterId: string): string[] {
  const ch = getChapterById(moduleId, chapterId);
  if (!ch) return [];
  return ch.topics.map(t => (typeof t === 'string' ? t : t.name));
}

export function getAllSubjects(): { id: string; nameEn: string; nameHi: string; category: CGExamSubjectCategory }[] {
  return CG_MASTER_SYLLABUS.map(m => ({
    id: m.id,
    nameEn: m.nameEn,
    nameHi: m.nameHi,
    category: m.category
  }));
}

export function getExamCategoryHierarchy(categoryId: string): ExamCategoryHierarchy {
  return CG_EXAM_HIERARCHICAL_SYLLABUS[categoryId] || CG_EXAM_HIERARCHICAL_SYLLABUS.GENERAL;
}

export function flattenSyllabusHierarchy(): FlatSyllabusItem[] {
  const result: FlatSyllabusItem[] = [];
  for (const mod of CG_MASTER_SYLLABUS) {
    for (const ch of mod.chapters) {
      for (const topic of ch.topics) {
        const topicName = typeof topic === 'string' ? topic : topic.name;
        result.push({
          moduleId: mod.id,
          moduleNameEn: mod.nameEn,
          moduleNameHi: mod.nameHi,
          chapterId: ch.id,
          chapterName: ch.nameHindi || ch.name,
          topicName,
          category: mod.category
        });
      }
    }
  }
  return result;
}
