import React, { useEffect, useState } from 'react';
import { Building2, FolderTree, Plus, Save, RefreshCw, Layers3, ChevronRight, Trash2 } from 'lucide-react';
import {
  ExamAuthority, ExamProgram, ExamPost, ExamTestSeries, ExamSubject,
  fetchExamAuthorities, fetchExamPrograms, fetchExamPosts,
  fetchExamTestSeries, saveExamAuthority, saveExamProgram,
  saveExamPost, saveExamTestSeries, saveExamSubject, slugifyCatalog
} from '../firebase/examCatalogService';
import { fetchBundlesFromFirestore, saveBundleToFirestore } from '../firebase/firestoreService';
import { saveSingleBundle, getStoredBundles, purgeAllDemoDatabaseData, moveToTrashTestSeries } from '../utils/bundleStore';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { CatalogPackageImporter } from './CatalogPackageImporter';

const now = () => new Date().toISOString();

export const AdminExamCatalogStudio: React.FC = () => {
  const [authorities, setAuthorities] = useState<ExamAuthority[]>([]);
  const [programs, setPrograms] = useState<ExamProgram[]>([]);
  const [posts, setPosts] = useState<ExamPost[]>([]);
  const [series, setSeries] = useState<ExamTestSeries[]>([]);
  const [selectedAuthority, setSelectedAuthority] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedPost, setSelectedPost] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<'DRAFT'|'PUBLISHED'>('DRAFT');
  const [programType, setProgramType] = useState<'recruitment'|'examination'>('recruitment');
  const [seriesType, setSeriesType] = useState<'full_mock'|'chapter_test'|'subject_test'|'pyp'|'live_test'|'practice'|'mixed'>('full_mock');
  const [postVacancies, setPostVacancies] = useState('');
  const [postCadreBreakup, setPostCadreBreakup] = useState('');
  const [postPayLevel, setPostPayLevel] = useState('');
  const [postSalaryRange, setPostSalaryRange] = useState('');
  const [postSubjects, setPostSubjects] = useState('');
  const [message, setMessage] = useState('');
  const [purging, setPurging] = useState(false);
  const [showCatalogImporter, setShowCatalogImporter] = useState(false);

  const load = async () => {
    try {
      const a = await fetchExamAuthorities();
      setAuthorities(a);
      const authorityId = selectedAuthority || a[0]?.id || '';
      if (!selectedAuthority && authorityId) setSelectedAuthority(authorityId);
      const p = await fetchExamPrograms(authorityId || undefined);
      setPrograms(p);
      const programId = selectedProgram && p.some(x=>x.id===selectedProgram) ? selectedProgram : (p[0]?.id || '');
      if (programId && programId !== selectedProgram) setSelectedProgram(programId);
      const po = await fetchExamPosts(programId || undefined);
      setPosts(po);
      const postId = selectedPost && po.some(x=>x.id===selectedPost) ? selectedPost : '';
      if (postId !== selectedPost) setSelectedPost(postId);

      const [rawSeries, bundles] = await Promise.all([
        fetchExamTestSeries(programId || undefined, postId || undefined),
        fetchBundlesFromFirestore(),
      ]);
      const bundleById = new Map(bundles.map(b => [b.id, b]));
      const validSeries = rawSeries.filter(s => {
        const b = s.bundleId ? bundleById.get(s.bundleId) : undefined;
        return Boolean(
          b &&
          b.seriesId === s.id &&
          b.authorityId === s.authorityId &&
          b.programId === s.programId &&
          (b.postId || undefined) === (s.postId || undefined) &&
          s.status !== 'ARCHIVED'
        );
      });
      setSeries(validSeries);
    } catch (e:any) {
      setMessage(e?.message || 'Unable to load exam catalog.');
    }
  };

  useEffect(() => {
    load();
    const handleCatalogUpdate = () => { load(); };
    window.addEventListener('cgssb-exam-catalog-updated', handleCatalogUpdate);
    return () => window.removeEventListener('cgssb-exam-catalog-updated', handleCatalogUpdate);
  }, [selectedAuthority, selectedProgram, selectedPost]);

  const createProductionCatalog = async () => {
    const timestamp = now();
    const authorityId = 'authority-cgssb';
    const programId = 'program-cgssb-teacher-recruitment-2026';
    const authority: ExamAuthority = {
      id: authorityId, name: 'CGSSB', shortName: 'CGSSB', slug: 'cgssb',
      status: 'PUBLISHED', sortOrder: 0, createdAt: timestamp, updatedAt: timestamp
    };
    const program: ExamProgram = {
      id: programId, authorityId, name: 'CGSSB Teacher Recruitment 2026',
      slug: 'cgssb-teacher-recruitment-2026', year: 2026, programType: 'recruitment',
      status: 'PUBLISHED', hasPosts: true, sortOrder: 0, totalVacancies: 4800,
      recruitmentLabel: '4,800 Vacancies', description: 'CGSSB Teacher Recruitment 2026',
      createdAt: timestamp, updatedAt: timestamp
    };
    const posts: ExamPost[] = [
      {
        id: 'post-cgssb-teacher-recruitment-2026-assistant-teacher',
        programId, name: 'Assistant Teacher', slug: 'assistant-teacher',
        status: 'PUBLISHED', sortOrder: 0, vacancies: 2292,
        cadreBreakup: '795 E-Cadre + 1,497 T-Cadre',
        payLevel: 'Level-06', salaryRange: '₹35,400–₹1,12,400',
        createdAt: timestamp, updatedAt: timestamp
      },
      {
        id: 'post-cgssb-teacher-recruitment-2026-teacher-tgt',
        programId, name: 'Teacher / TGT', slug: 'teacher-tgt',
        status: 'PUBLISHED', sortOrder: 1, vacancies: 1654,
        cadreBreakup: '868 E-Cadre + 786 T-Cadre',
        payLevel: 'Level-08',
        subjects: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science'],
        createdAt: timestamp, updatedAt: timestamp
      },
      {
        id: 'post-cgssb-teacher-recruitment-2026-lecturer-pgt',
        programId, name: 'Lecturer / PGT', slug: 'lecturer-pgt',
        status: 'PUBLISHED', sortOrder: 2, vacancies: 854,
        cadreBreakup: '424 E-Cadre + 430 T-Cadre',
        payLevel: 'Level-09', salaryRange: 'Gazetted Class II',
        subjects: ['English', 'Hindi', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
        createdAt: timestamp, updatedAt: timestamp
      }
    ];
    await saveExamAuthority(authority);
    await saveExamProgram(program);
    for (const post of posts) await saveExamPost(post);
    setSelectedAuthority(authorityId);
    setSelectedProgram(programId);
    setSelectedPost('');
    setMessage('CGSSB Teacher Recruitment 2026 production catalog created/updated: 4,800 vacancies across 3 posts.');
    await load();
  };

  const createProductionSeries = async () => {
    const authorityId = 'authority-cgssb';
    const programId = 'program-cgssb-teacher-recruitment-2026';
    const postSeries = [
      { postId: 'post-cgssb-teacher-recruitment-2026-assistant-teacher', name: 'Assistant Teacher 2026 — Full Mock Series' },
      { postId: 'post-cgssb-teacher-recruitment-2026-teacher-tgt', name: 'Teacher / TGT 2026 — Full Mock Series' },
      { postId: 'post-cgssb-teacher-recruitment-2026-lecturer-pgt', name: 'Lecturer / PGT 2026 — Full Mock Series' }
    ];
    const timestamp = now();
    for (let index = 0; index < postSeries.length; index++) {
      const item = postSeries[index];
      const seriesId = `series-cgssb-teacher-recruitment-2026-${item.postId.split('-').slice(-2).join('-')}-full-mock`;
      const bundleId = `bundle-${seriesId}`;
      const record: ExamTestSeries = {
        id: seriesId, authorityId, programId, postId: item.postId,
        name: item.name, slug: slugifyCatalog(item.name), seriesType: 'full_mock',
        bundleId, status: 'DRAFT', sortOrder: index, createdAt: timestamp, updatedAt: timestamp
      };
      await saveExamTestSeries(record);
      const post = posts.find(p => p.id === item.postId);
      const bundle: TestSeriesBundle = {
        id: bundleId, slug: slugifyCatalog(item.name), title: item.name, titleHindi: item.name,
        authorityId, programId, postId: item.postId, seriesId,
        badge: 'Full Mock', badgeColor: 'emerald',
        shortDescription: `${item.name} for CGSSB Teacher Recruitment 2026.`,
        fullDescription: 'Draft production series. Add syllabus, tests and questions before publishing.',
        price: 0, originalPrice: 0, isProOnly: false, totalTestsCount: 0, freeTestsCount: 0,
        enrolledStudentsCount: 0, rating: 0, validity: 'Till Exam Date', languageDisplay: 'Bilingual',
        examPattern: { totalQuestions: 0, totalMarks: 0, durationMinutes: 0, markingScheme: '', negativeMarkPenalty: '', language: 'Bilingual', cadre: post?.name || '', keyRules: [] },
        syllabusBreakdown: [], features: [], testItems: [], faqs: [],
        isDraft: true, isPublished: false, seriesType: 'full_mock'
      };
      await saveBundleToFirestore(bundle);
      saveSingleBundle(bundle);
    }
    setMessage('Three production Full Mock Series were created as drafts and linked to the canonical posts.');
    await load();
  };

  const populateEnglishLecturerContent = async () => {
    const authorityId = 'authority-cgssb';
    const programId = 'program-cgssb-teacher-recruitment-2026';
    const postId = 'post-cgssb-teacher-recruitment-2026-lecturer-pgt';
    const seriesId = 'series-cgssb-teacher-recruitment-2026-lecturer-pgt-full-mock';
    const bundleId = 'bundle-' + seriesId;
    const timestamp = now();

    const subjectDefinitions: Array<{
      id: string;
      name: string;
      nameHindi: string;
      marks: number;
      topics: string[];
      mandatory?: boolean;
    }> = [
      {
        id: 'subject-cgssb-lecturer-english-grammar',
        name: 'Grammar Based Questions',
        nameHindi: 'व्याकरण आधारित प्रश्न',
        marks: 15,
        topics: [
          'Determiners',
          'Modals',
          'Question tag',
          'Finite and Non-finite verbs',
          'Phrasal Verbs',
          'Agreement between subject and verbs',
          'Tenses (kinds and transformation)',
          'Identifying clauses: relative clause (defining and non-defining), adverb clause, noun clause, non-finite clause',
          'Transformation of sentences: simple, compound and complex',
          'Speech: Direct and Indirect',
          'Sentence structure: employing inversion and cleft sentences',
          'Conditional sentences',
          'Elliptical sentence pattern'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-vocabulary',
        name: 'Vocabulary Based Questions',
        nameHindi: 'शब्दावली आधारित प्रश्न',
        marks: 15,
        topics: [
          'Word formation: root words and affixes',
          'Polysemy and homophones',
          'Collocations',
          'Word class conversion from one grammatical category to another',
          'Lexical bundles',
          'Idiomaticity and opacity',
          'Figure of speech'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-reading',
        name: 'Reading Comprehension',
        nameHindi: 'पठन बोध',
        marks: 15,
        topics: [
          'Two or three unseen passages from different genres: prose, poetry, drama, articles, editorials, scientific and literary extracts',
          'Comprehension',
          'Inference',
          'Vocabulary in context',
          'Tone',
          'Rhetorical devices',
          'Logical sequencing'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-pedagogy',
        name: 'Pedagogy of Language Development',
        nameHindi: 'भाषा विकास की शिक्षाशास्त्र',
        marks: 15,
        topics: [
          'Language learning and acquisition',
          'Different approaches/theories of language learning/teaching',
          'Linguistic system of languages',
          'Language skills',
          'Role of listening and speaking in language learning and function of language',
          'Critical perspective on the role of grammar in learning a language for communicating ideas verbally and in written form',
          'Methods of teaching second language with reference to English language teaching',
          'Challenges of teaching language in a diverse classroom; linguistic difficulties in language learning and performance errors',
          'Teaching-learning materials: textbook, multimedia materials, multilingual resource of the classroom',
          'Remedial teaching in context of language teaching'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-education',
        name: 'Educational Psychology, Assessment & Evaluation, Pedagogy and Teaching Aptitude',
        nameHindi: 'शैक्षिक मनोविज्ञान, आकलन एवं मूल्यांकन, शिक्षण शास्त्र एवं शैक्षिक अभिवृत्ति',
        marks: 15,
        topics: [
          'Educational Psychology: learning approaches, human development, physical, mental, emotional, social and moral development, adolescence and its problems, guidance and counselling, achievement, factors affecting achievement, principles of learning, intelligence, creativity, special needs children, individual differences, personality, personality theories, motivation',
          'Assessment and Evaluation in Education: meaning and definition, types of assessment techniques, bases of assessment, functions of assessment, assessment vs evaluation, formative and summative assessment',
          'Subject-based learning assessment: assessment tools and strategies, assignments and their types, construction and classification of available tests, planning, construction and steps',
          'Teacher competency in developing appropriate tools: design of assessment tools, use of class and subject-specific tools, characteristics and types of tests, purposes and types of appropriate evaluation standards, standards and their use, types of feedback, student file/portfolio/rubrics',
          'Testing: types and classification of tests, essential qualities of a good test, administration, tests available in different subjects',
          'Pedagogy: nature of subjects and disciplines, conceptual understanding, history, subject-specific pedagogy and logical validity of subject-specific claims',
          'Student exploration: assessment of student preparation, connecting learning with real life, opportunities for independent problem solving, group-learning strategies, promoting classroom dialogue',
          'Objectives and learning outcomes: National Curriculum Framework 2005 and 2023, objectives of education, learning outcomes, broad objectives in school education and subject-specific broad objectives',
          'Curriculum: principles of curriculum construction, curriculum at different levels of school, State curriculum framework',
          'Lesson planning and teaching-learning methods: different teaching methods and lesson plans, learning resources, including textbooks, audio-visual and multimedia materials',
          'Pedagogical attitudes: knowledge and learning, teaching as a profession, understanding the teaching-learning process, constructivist teaching-learning process, professional development of teachers, gender perspective in education'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-general-hindi',
        name: 'General Hindi',
        nameHindi: 'सामान्य हिन्दी',
        marks: 5,
        topics: [
          'स्वर, व्यंजन, वर्तनी',
          'लिंग, वचन, काल',
          'संज्ञा, सर्वनाम, विशेषण, क्रिया, क्रिया विशेषण, कारक',
          'समास रचना एवं प्रकार',
          'सीधे-स्वर, व्यंजन एवं विसर्ग संधि',
          'व्याकरणिक अशुद्धियाँ',
          'शब्द रचना: उपसर्ग एवं प्रत्यय',
          'शब्द प्रकार: तत्सम, तद्भव, देशज, विदेशी',
          'पर्यायवाची, विलोम शब्द, अनेकार्थी शब्द, अनेकार्थक शब्दों/वाक्यांशों के लिए एक शब्द'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-general-english',
        name: 'General English',
        nameHindi: 'सामान्य अंग्रेजी',
        marks: 5,
        topics: [
          'Number, Gender, Articles',
          'Noun, Pronoun, Adjectives, Verb, Adverb',
          'Preposition and Conjunctions',
          'Synonyms, Antonyms, Homonyms',
          'One word substitution',
          'Spellings, Prefixes, Suffixes',
          'Proverb and Idioms',
          'Active/Passive Voice',
          'Sentences: Declarative, Negative, Interrogative, Imperative, Exclamatory',
          'Punctuations'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-mental-ability',
        name: 'General Mental Ability',
        nameHindi: 'सामान्य मानसिक योग्यता',
        marks: 5,
        topics: [
          'Reasoning',
          'Relationships and analogies',
          'Arithmetical ability',
          'Spatial relationships',
          'Classification',
          'Number series and letter series',
          'Number and symbol coding',
          'Hidden figures',
          'Mathematical operations',
          'Figure matching',
          'Various number patterns'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-computer',
        name: 'Computer Education',
        nameHindi: 'कम्प्यूटर शिक्षा',
        marks: 5,
        topics: [
          'Introduction to computers: meaning, uses in daily life, importance and limitations, general characteristics',
          'Major parts of computer: hardware and software, CPU, ALU, CU, memory, input/output devices',
          'Types of printers: inkjet, laser, dot matrix, thermal and other modern printers',
          'Operating systems: MS-DOS, Windows, macOS, Linux and other operating systems',
          'Microsoft Office: MS Word, MS Excel and MS PowerPoint',
          'Internet and email: inbox, outbox, CC, BCC, attachments, online document search and government websites',
          'Antivirus and computer security: viruses, types, harms, antivirus software and security measures',
          'Multimedia: audio, video and text; multimedia applications',
          'Storage devices: primary/secondary storage, hard disk, pen drive, CD/DVD and cloud storage',
          'Search engines and online platforms: Google, YouTube, search engine basics, finding information and safe/effective search techniques'
        ]
      },
      {
        id: 'subject-cgssb-lecturer-english-gk',
        name: 'General Knowledge',
        nameHindi: 'सामान्य ज्ञान',
        marks: 5,
        topics: [
          'Main constitutional provisions, Fundamental Duties, Indian political system and constitutional rights, Right to Information, cultural and national symbols, Lok Sabha, Rajya Sabha and State Legislature',
          'Indian history: important historical events, personalities and cultural events; Indian independence history from 1857 to 1947 and post-1947 developments',
          'Geography: general geography, geography of India and the world',
          'Indian economy: social and economic development, demographic perspective, gross national product and per capita income, Five Year Plans, agriculture and rural development, industrial development and current economic events',
          'General Science: basic knowledge related to physics, chemistry, biology and botany',
          'General knowledge of Chhattisgarh: history, geography, political system, economy, government schemes, awards and honours, traditions, folk music, important personalities and other important Chhattisgarh-related topics',
          'National Education Policy 2020 (School Education)'
        ]
      }
    ];

    const bundles = await fetchBundlesFromFirestore();
    const existing = bundles.find(b => b.id === bundleId);

    const baseBundle: TestSeriesBundle = existing || {
      id: bundleId,
      slug: 'lecturer-pgt-2026-full-mock-series',
      title: 'Lecturer / PGT 2026 — English Full Mock Series',
      titleHindi: 'व्याख्याता / PGT 2026 — English Full Mock Series',
      authorityId, programId, postId, seriesId,
      badge: 'Full Mock',
      badgeColor: 'emerald',
      shortDescription: 'English Lecturer / PGT 2026 full mock preparation series.',
      fullDescription: 'English Lecturer / PGT 2026 test series based on the supplied CGSSB syllabus and examination directions.',
      price: 0, originalPrice: 0, isProOnly: false, totalTestsCount: 0, freeTestsCount: 0,
      enrolledStudentsCount: 0, rating: 0, validity: 'Till Exam Date', languageDisplay: 'Bilingual',
      examPattern: { totalQuestions: 100, totalMarks: 100, durationMinutes: 120, markingScheme: '+1 mark per question', negativeMarkPenalty: '-0.25 mark per wrong answer', language: 'Bilingual', cadre: 'Lecturer / PGT — English', keyRules: [] },
      syllabusBreakdown: [], features: [], testItems: [], faqs: [],
      isDraft: true, isPublished: false, seriesType: 'full_mock'
    };

    const syllabusBreakdown = subjectDefinitions.map((subject, index) => ({
      subjectId: subject.id,
      subject: subject.name,
      subjectHindi: subject.nameHindi,
      marks: subject.marks,
      questionCount: subject.marks,
      weightagePercentage: subject.marks,
      topics: subject.topics,
      ...(subject.mandatory ? { isMandatoryQualifying: true } : {})
    }));

    for (let index = 0; index < subjectDefinitions.length; index++) {
      const subject = subjectDefinitions[index];
      const record: ExamSubject = {
        id: subject.id,
        authorityId,
        programId,
        name: subject.name,
        nameHindi: subject.nameHindi,
        slug: slugifyCatalog(subject.name),
        topics: subject.topics,
        status: 'PUBLISHED',
        sortOrder: index,
        createdAt: existing?.syllabusBreakdown?.find(s => s.subjectId === subject.id)?.subjectId ? (existing as any).createdAt || timestamp : timestamp,
        updatedAt: timestamp
      };
      await saveExamSubject(record);
    }

    const populatedBundle: TestSeriesBundle = {
      ...baseBundle,
      authorityId,
      programId,
      postId,
      seriesId,
      seriesType: 'full_mock',
      title: 'Lecturer / PGT 2026 — English Full Mock Series',
      titleHindi: 'व्याख्याता / PGT 2026 — English Full Mock Series',
      targetPost: 'Lecturer / PGT — English',
      targetYear: 2026,
      authority: 'CGSSB',
      shortDescription: 'English Lecturer / PGT 2026 full mock preparation series.',
      fullDescription: 'English Lecturer / PGT 2026 test series based on the supplied CGSSB syllabus and examination directions.',
      examPattern: {
        totalQuestions: 100,
        totalMarks: 100,
        durationMinutes: 120,
        markingScheme: '+1 mark per question',
        negativeMarkPenalty: '-0.25 mark per wrong answer',
        language: 'Bilingual',
        cadre: 'Lecturer / PGT — English',
        keyRules: [
          'Objective multiple-choice question paper',
          'Each question carries 1 mark',
          'One-fourth (1/4) mark is deducted for an incorrect answer',
          'The detailed evaluation instructions state 2 hours; the notification schedule header lists 10:00–12:15',
          'Questions are answered on the OMR answer sheet'
        ]
      },
      syllabusBreakdown,
      importantDates: {
        formStartDate: '2026-09-29',
        formEndDate: '2026-10-26',
        correctionLastDate: '2026-10-29',
        examDate: '2026-11-29',
        admitCardDate: '2026-11-23',
        status: 'upcoming'
      },
      officialLinks: {
        syllabusPdfUrl: 'https://vyapamcg.cgstate.gov.in/uploads/pdfs/7d2d68da-3383-419c-8b5a-f3ac2cb7eb6a.pdf',
        notificationPdfUrl: 'https://vyapamcg.cgstate.gov.in/uploads/pdfs/64c01caa-f23b-4f56-ba74-346e73078581.pdf',
        officialWebsiteUrl: 'https://vyapamcg.cgstate.gov.in/'
      },
      isDraft: true,
      isPublished: false
    };

    await saveBundleToFirestore(populatedBundle);
    saveSingleBundle(populatedBundle);
    setSelectedAuthority(authorityId);
    setSelectedProgram(programId);
    setSelectedPost(postId);
    setMessage('English Lecturer 2026 content populated: 100 questions / 100 marks, 10 reusable syllabus subjects, official dates and exam rules. The series remains DRAFT for review.');
    await load();
  };

  const createAuthority = async () => {
    if (!name.trim()) return;
    const id = `authority-${slugifyCatalog(name)}`;
    const record: ExamAuthority = { id, name: name.trim(), shortName: name.trim(), slug: slugifyCatalog(name), status, sortOrder: authorities.length, createdAt: now(), updatedAt: now() };
    await saveExamAuthority(record);
    setName(''); setMessage('Authority created.'); await load();
  };

  const createProgram = async () => {
    if (!selectedAuthority || !name.trim()) return;
    const id = `program-${slugifyCatalog(name)}`;
    const record: ExamProgram = { id, authorityId: selectedAuthority, name: name.trim(), slug: slugifyCatalog(name), year, programType, status, hasPosts: false, sortOrder: programs.length, createdAt: now(), updatedAt: now() };
    await saveExamProgram(record);
    setName(''); setMessage('Recruitment / exam created.'); await load();
  };

  const createPost = async () => {
    if (!selectedProgram || !name.trim()) return;
    const id = `post-${selectedProgram.replace(/^program-/, '')}-${slugifyCatalog(name)}`;
    const record: ExamPost = {
      id, programId: selectedProgram, name: name.trim(), slug: slugifyCatalog(name),
      status, sortOrder: posts.length, createdAt: now(), updatedAt: now(),
      ...(postVacancies.trim() ? { vacancies: Number(postVacancies) } : {}),
      ...(postCadreBreakup.trim() ? { cadreBreakup: postCadreBreakup.trim() } : {}),
      ...(postPayLevel.trim() ? { payLevel: postPayLevel.trim() } : {}),
      ...(postSalaryRange.trim() ? { salaryRange: postSalaryRange.trim() } : {}),
      ...(postSubjects.trim() ? { subjects: postSubjects.split(',').map(s => s.trim()).filter(Boolean) } : {})
    };
    await saveExamPost(record);
    const program = programs.find(p=>p.id===selectedProgram);
    if (program && !program.hasPosts) await saveExamProgram({ ...program, hasPosts:true, updatedAt:now() });
    setName('');
    setPostVacancies('');
    setPostCadreBreakup('');
    setPostPayLevel('');
    setPostSalaryRange('');
    setPostSubjects('');
    setMessage('Post created with explicit recruitment metadata.');
    await load();
  };

  const createSeries = async () => {
    if (!selectedAuthority || !selectedProgram || !name.trim()) return;
    const program = programs.find(p=>p.id===selectedProgram);
    const authority = authorities.find(a=>a.id===selectedAuthority);
    if (!program || !authority) return;
    if (program.hasPosts && !selectedPost) {
      setMessage('Select the canonical Post before creating a Test Series for this recruitment.');
      return;
    }
    const id = `series-${selectedProgram.replace(/^program-/, '')}-${slugifyCatalog(name)}`;
    const bundleId = `bundle-${id}`;
    const targetPost = posts.find(p=>p.id===selectedPost)?.name || 'General';
    const record: ExamTestSeries = {
      id, authorityId:selectedAuthority, programId:selectedProgram, postId:selectedPost || undefined,
      name:name.trim(), slug:slugifyCatalog(name), seriesType, bundleId,
      status, sortOrder:series.length, createdAt:now(), updatedAt:now()
    };
    await saveExamTestSeries(record);
    const bundle: TestSeriesBundle = {
      id: bundleId, slug:slugifyCatalog(name), title:name.trim(), titleHindi:name.trim(),
      authorityId:selectedAuthority, programId:selectedProgram, postId:selectedPost || undefined,
      seriesId:id,
      badge:'New Series', badgeColor:'emerald', shortDescription:`${name.trim()} test series for ${program.name}.`,
      fullDescription:'Draft series created from the canonical exam catalog. Add tests and syllabus before publishing.',
      price:0, originalPrice:0, isProOnly:false, totalTestsCount:0, freeTestsCount:0,
      enrolledStudentsCount:0, rating:0, validity:'Till Exam Date', languageDisplay:'Bilingual',
      examPattern:{ totalQuestions:0,totalMarks:0,durationMinutes:0,markingScheme:'',negativeMarkPenalty:'',language:'Bilingual',cadre:targetPost,keyRules:[] },
      syllabusBreakdown:[], features:[], testItems:[], faqs:[], isDraft:true, isPublished:false,
      seriesType
    };
    await saveBundleToFirestore(bundle);
    saveSingleBundle(bundle);
    setName(''); setMessage('Draft test series created. Open it in Test Series Studio to add content.'); await load();
  };

  const handleDeleteSeries = async (record: ExamTestSeries) => {
    const linkedBundleId = record.bundleId;
    const confirmed = window.confirm(
      `Delete "${record.name}" from the canonical catalog? This will also move its linked Test Series Bundle to Trash and remove it from Universal Ingestion.\n\nYou can restore the pair from Test Series & Bundle Studio → Trash Bin.`
    );
    if (!confirmed) return;

    try {
      await moveToTrashTestSeries(record);
      setMessage(`"${record.name}" and linked bundle ${linkedBundleId ? 'were' : 'was'} moved out of the active catalog.`);
      await load();
    } catch (error: any) {
      setMessage(error?.message || `Unable to delete "${record.name}".`);
    }
  };

  const purgeDemoData = async () => {
    if (!window.confirm('This will permanently delete demo content from Firestore: tests, questions, PYP papers, bundles, and the canonical exam catalog. User accounts, attempts, enrollments and leaderboard data will NOT be deleted. Continue?')) return;
    setPurging(true);
    setMessage('');
    try {
      await purgeAllDemoDatabaseData();
      setSelectedAuthority('');
      setSelectedProgram('');
      setSelectedPost('');
      setAuthorities([]);
      setPrograms([]);
      setPosts([]);
      setSeries([]);
      setMessage('Demo content and old exam-catalog data were purged. The production catalog is now clean.');
    } catch (e:any) {
      setMessage(e?.message || 'Demo-data purge failed.');
    } finally {
      setPurging(false);
    }
  };

  const section = (title:string, icon:React.ReactNode, children:React.ReactNode) => (
    <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4 text-white font-black">{icon}<span>{title}</span></div>
      {children}
    </section>
  );

  return <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5 text-slate-200">
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Exam & Recruitment Catalog</h1>
          <p className="text-sm text-slate-400 mt-1">One canonical hierarchy for the student portal, Universal Ingestion Studio, SEO and all test content.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCatalogImporter(true)}
          className="shrink-0 rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-200 hover:bg-cyan-500/20"
        >
          Import Catalog JSON
        </button>
        <button
          type="button"
          onClick={createProductionCatalog}
          className="shrink-0 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-300 hover:bg-cyan-500/20"
        >
          Create CGSSB 2026 Catalog
        </button>
        <button
          type="button"
          onClick={createProductionSeries}
          className="shrink-0 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-black text-purple-300 hover:bg-purple-500/20"
        >
          Create 3 Full Mock Series
        </button>
        <button
          type="button"
          onClick={populateEnglishLecturerContent}
          className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-500/20"
        >
          Populate English Lecturer
        </button>
        <button
          type="button"
          onClick={purgeDemoData}
          disabled={purging}
          className="shrink-0 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/20 disabled:opacity-50"
        >
          {purging ? 'Purging…' : 'Reset Demo Data'}
        </button>
      </div>
    </div>
    {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</div>}
    {showCatalogImporter && (
      <div className="fixed inset-0 z-[120] overflow-y-auto bg-slate-950/85 backdrop-blur-md p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-2">
            <button type="button" onClick={() => setShowCatalogImporter(false)} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2">
              Close <span>×</span>
            </button>
          </div>
          <CatalogPackageImporter onImported={async () => { setShowCatalogImporter(false); await load(); }} />
        </div>
      </div>
    )}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {section('1. Exam Authority', <Building2 className="w-4 h-4 text-cyan-400" />, <>
        <div className="flex gap-2"><select value={selectedAuthority} onChange={e=>setSelectedAuthority(e.target.value)} className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">{authorities.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
        <div className="flex gap-2 mt-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="New authority" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/><button onClick={createAuthority} className="px-3 rounded-xl bg-cyan-500 text-slate-950 font-black"><Plus className="w-4 h-4"/></button></div>
      </>)}
      {section('2. Recruitment / Examination', <FolderTree className="w-4 h-4 text-emerald-400" />, <>
        <select value={selectedProgram} onChange={e=>setSelectedProgram(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="grid grid-cols-2 gap-2 mt-2"><input type="number" value={year} onChange={e=>setYear(Number(e.target.value))} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/><select value={programType} onChange={e=>setProgramType(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"><option value="recruitment">Recruitment</option><option value="examination">Examination</option></select></div>
        <div className="flex gap-2 mt-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="New recruitment / exam" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/><button onClick={createProgram} className="px-3 rounded-xl bg-emerald-500 text-slate-950 font-black"><Plus className="w-4 h-4"/></button></div>
      </>)}
      {section('3. Post (optional)', <ChevronRight className="w-4 h-4 text-amber-400" />, <>
        <select value={selectedPost} onChange={e=>setSelectedPost(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"><option value="">No post / direct exam</option>{posts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <div className="flex gap-2 mt-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="New post" className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/><button onClick={createPost} className="px-3 rounded-xl bg-amber-400 text-slate-950 font-black"><Plus className="w-4 h-4"/></button></div>
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Optional recruitment metadata</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={postVacancies} onChange={e=>setPostVacancies(e.target.value)} inputMode="numeric" placeholder="Vacancies" className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
            <input value={postPayLevel} onChange={e=>setPostPayLevel(e.target.value)} placeholder="Pay level" className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
          </div>
          <input value={postSalaryRange} onChange={e=>setPostSalaryRange(e.target.value)} placeholder="Salary range (optional)" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
          <input value={postCadreBreakup} onChange={e=>setPostCadreBreakup(e.target.value)} placeholder="Cadre breakup — only if applicable" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
          <input value={postSubjects} onChange={e=>setPostSubjects(e.target.value)} placeholder="Subjects, comma separated — only if applicable" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
        </div>
      </>)}
    </div>
    {section('4. Test Series', <Layers3 className="w-4 h-4 text-purple-400" />, <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select value={selectedAuthority} onChange={e=>setSelectedAuthority(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">{authorities.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select value={selectedProgram} onChange={e=>setSelectedProgram(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={selectedPost} onChange={e=>setSelectedPost(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"><option value="">Direct exam / no post</option>{posts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Assistant Teacher 2026 Full Mock Series" className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm"/>
        <select value={seriesType} onChange={e=>setSeriesType(e.target.value as any)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm">
          <option value="full_mock">Full Mock</option>
          <option value="chapter_test">Chapter Test</option>
          <option value="subject_test">Subject Test</option>
          <option value="pyp">Previous Year Paper</option>
          <option value="live_test">Live Test</option>
          <option value="practice">Practice</option>
          <option value="mixed">Mixed</option>
        </select>
        <button onClick={createSeries} className="px-4 rounded-xl bg-purple-500 text-white font-black flex items-center justify-center gap-2"><Save className="w-4 h-4"/>Create Draft Series</button>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">{series.map(s=><div key={s.id} className="rounded-xl bg-slate-950/80 border border-slate-800 p-3"><div className="flex items-start justify-between gap-2"><div><div className="text-xs text-slate-500">{s.seriesType}</div><div className="font-bold text-white">{s.name}</div><div className="text-xs text-slate-500 mt-1">{s.status} · {s.postId ? (posts.find(p => p.id === s.postId)?.name || 'Post') : 'Direct exam'}</div></div><button type="button" onClick={() => handleDeleteSeries(s)} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" title="Move Test Series + linked Bundle to Trash"><Trash2 className="w-4 h-4"/></button></div></div>)}</div>
    </>)}
    <button onClick={load} className="text-xs text-slate-400 hover:text-white flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5"/>Refresh catalog</button>
  </div>;
};
