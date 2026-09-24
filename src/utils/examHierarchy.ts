import { MockTest, PreviousYearPaper, Question, ExamCategory } from '../types';
import {
  CG_MASTER_SYLLABUS,
  CG_EXAM_HIERARCHICAL_SYLLABUS,
  CGSSB_EXAM_SCHEMES,
  CGMasterModule,
  CGMasterChapter,
  CGMasterTopic,
  ExamCategoryHierarchy,
  ExamSubjectHierarchy,
  getExamCategoryHierarchy,
  getSyllabusForExam,
  getModuleById,
  getChapterById,
  getChaptersForModule,
  getTopicsForChapter,
  getAllSubjects,
  flattenSyllabusHierarchy
} from '../data/cgMasterSyllabus';

export interface HierarchyRecord {
  authority: string;            // Level 1: e.g. "CGSSB", "CGPSC"
  category: string;             // Level 2: e.g. "Teacher Recruitment 2026"
  postName: string;             // Level 3: e.g. "CG Lecturer 2026", "CG Teacher 2026"
  examName: string;             // Level 4: e.g. "CG English Lecturer 2026"
  paperTitle?: string;          // Level 5: e.g. "CG English Lecturer 2026 Mock Test 8"
  year?: number;
  durationMinutes?: number;
  negativeMarkingRatio?: string;
  marks?: number;
  vacancies?: string;
  paperSummary?: string;
  isCustom?: boolean;
}

// Built-in standard hierarchy baseline with 5 distinct levels
export const DEFAULT_HIERARCHY_RECORDS: HierarchyRecord[] = [
  // 1. CGSSB -> Teacher Recruitment 2026 -> CG Lecturer 2026
  {
    authority: 'CGSSB',
    category: 'Teacher Recruitment 2026',
    postName: 'CG Lecturer 2026',
    examName: 'CG English Lecturer 2026',
    paperTitle: 'CG English Lecturer 2026 Mock Test 8',
    year: 2026,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 100,
    vacancies: '252 Posts',
    paperSummary: 'Dedicated CG Vyakhyata English mock simulation covering language, grammar, pedagogy, and general studies.',
  },
  {
    authority: 'CGSSB',
    category: 'Teacher Recruitment 2026',
    postName: 'CG Lecturer 2026',
    examName: 'CG Physics Lecturer 2026',
    paperTitle: 'CG Physics Lecturer 2026 Mock Test 1',
    year: 2026,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 100,
    vacancies: '180 Posts',
    paperSummary: 'School education cadre lecturer physics examination simulation.',
  },
  {
    authority: 'CGSSB',
    category: 'Teacher Recruitment 2026',
    postName: 'CG Lecturer 2026',
    examName: 'CG Mathematics Lecturer 2026',
    paperTitle: 'CG Mathematics Lecturer 2026 Mock Test 1',
    year: 2026,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 100,
    vacancies: '210 Posts',
    paperSummary: 'Advanced mathematics curriculum test paper with bilingual explanations.',
  },
  {
    authority: 'CGSSB',
    category: 'Teacher Recruitment 2026',
    postName: 'CG Lecturer 2026',
    examName: 'CG Chemistry Lecturer 2026',
    paperTitle: 'CG Chemistry Lecturer 2026 Mock Test 1',
    year: 2026,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 100,
    vacancies: '195 Posts',
    paperSummary: 'Lecturer chemistry mock test paper with physical, organic, and inorganic sections.',
  },

  // 2. CGSSB -> Teacher Recruitment 2026 -> CG Teacher 2026
  {
    authority: 'CGSSB',
    category: 'Teacher Recruitment 2026',
    postName: 'CG Teacher 2026',
    examName: 'CG Shikshak (Teacher) Paper-II 2026',
    paperTitle: 'CG Shikshak Paper-II 2026 Mock Test 1',
    year: 2026,
    durationMinutes: 150,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 150,
    vacancies: '5,000+ Posts',
    paperSummary: 'Middle school teacher recruitment covering child pedagogy, Hindi, English, and subject modules.',
  },
  {
    authority: 'CGSSB',
    category: 'Teacher Recruitment 2026',
    postName: 'CG Teacher 2026',
    examName: 'CG Science & Maths Teacher 2026',
    paperTitle: 'CG Science & Maths Teacher 2026 Mock Test 1',
    year: 2026,
    durationMinutes: 150,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 150,
    vacancies: '2,500+ Posts',
    paperSummary: 'Subject specific teacher paper for middle school science and mathematics.',
  },

  // 3. CGSSB -> Teacher Recruitment 2026 -> CG Assistant Teacher 2026
  {
    authority: 'CGSSB',
    category: 'Teacher Recruitment 2026',
    postName: 'CG Assistant Teacher 2026',
    examName: 'CG Sahayak Shikshak (Assistant Teacher) 2026',
    paperTitle: 'CG Sahayak Shikshak 2026 Mock Test 1',
    year: 2026,
    durationMinutes: 150,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 150,
    vacancies: '7,000+ Posts',
    paperSummary: 'Primary education teacher recruitment examination covering environmental studies and foundational pedagogy.',
  },

  // 4. CGSSB -> Patwari & Revenue Inspector (RI)
  {
    authority: 'CGSSB',
    category: 'Patwari & Revenue Inspector (RI)',
    postName: 'CG Patwari 2024',
    examName: 'CGSSB Patwari Recruitment Exam 2024',
    paperTitle: 'CGSSB Patwari Full Mock Test 01',
    year: 2024,
    durationMinutes: 180,
    negativeMarkingRatio: '-⅓rd (0.33 Marks per wrong answer)',
    marks: 150,
    vacancies: '301 Posts',
    paperSummary: 'Official Revenue Department exam covering Computer (20 Qs), Land Laws, Reasoning, and CG GK.',
  },
  {
    authority: 'CGSSB',
    category: 'Patwari & Revenue Inspector (RI)',
    postName: 'CG Revenue Inspector 2024',
    examName: 'CGSSB Revenue Inspector (RI) Solved Paper 2021',
    paperTitle: 'CGSSB Revenue Inspector Official Solved Paper',
    year: 2021,
    durationMinutes: 180,
    negativeMarkingRatio: '-⅓rd (0.33 Marks per wrong answer)',
    marks: 150,
    paperSummary: 'Official past solved paper for Revenue Inspector with detailed step-by-step solutions.',
  },

  // 5. CGSSB -> Hostel Warden (छात्रावास अधीक्षक)
  {
    authority: 'CGSSB',
    category: 'Hostel Warden (छात्रावास अधीक्षक)',
    postName: 'Hostel Superintendent Grade-D',
    examName: 'CG Hostel Warden (छात्रावास अधीक्षक) Exam 2024',
    paperTitle: 'CG Hostel Warden Full Length Mock 01',
    year: 2024,
    durationMinutes: 120,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 100,
    vacancies: '300 Posts',
    paperSummary: 'Hostel Superintendent Grade D exam with mandatory qualifying 50% Computer Knowledge section.',
  },
  {
    authority: 'CGSSB',
    category: 'Hostel Warden (छात्रावास अधीक्षक)',
    postName: 'Hostel Superintendent Grade-D',
    examName: 'Hostel Warden Computer Awareness Test Series',
    paperTitle: 'Computer Awareness 50 Questions Mock',
    year: 2024,
    durationMinutes: 60,
    negativeMarkingRatio: '-¼th (0.25 Marks per wrong answer)',
    marks: 50,
    paperSummary: 'High-yield computer module test for hostel warden aspirants.',
  },

  // 6. CGPSC -> State Service Examination (Prelims)
  {
    authority: 'CGPSC',
    category: 'State Service Examination (Prelims)',
    postName: 'State Civil Service (Deputy Collector / DSP)',
    examName: 'CGPSC SSE Prelims Paper-I (General Studies) 2024',
    paperTitle: 'CGPSC SSE Prelims Paper-I Full Mock 01',
    year: 2024,
    durationMinutes: 120,
    negativeMarkingRatio: '-⅓rd (0.667 Marks per wrong answer)',
    marks: 200,
    vacancies: '242 Posts',
    paperSummary: 'Official CGPSC Prelims Paper-I containing 50 Qs on India GK and 50 Qs on Chhattisgarh Special GK.',
  },
  {
    authority: 'CGPSC',
    category: 'State Service Examination (Prelims)',
    postName: 'State Civil Service (Deputy Collector / DSP)',
    examName: 'CGPSC SSE Prelims Paper-II (CSAT Aptitude) 2024',
    paperTitle: 'CGPSC SSE CSAT Aptitude Paper-II Mock',
    year: 2024,
    durationMinutes: 120,
    negativeMarkingRatio: '-⅓rd (0.667 Marks per wrong answer)',
    marks: 200,
    paperSummary: 'Qualifying aptitude paper covering Chhattisgarhi & Hindi language, logic, and quant.',
  },

  // 7. CG Police -> Police Recruitment 2026
  {
    authority: 'CG Police',
    category: 'Police Recruitment 2026',
    postName: 'CG Police Sub-Inspector 2026',
    examName: 'CG Police Sub-Inspector (CG SI) Written Exam 2026',
    paperTitle: 'CG Police SI Main Written Mock 01',
    year: 2026,
    durationMinutes: 120,
    negativeMarkingRatio: 'None / 0 Marks',
    marks: 300,
    vacancies: '975 Posts',
    paperSummary: 'Comprehensive multi-paper written test covering General Knowledge, Maths, and Language proficiency.',
  },
  {
    authority: 'CG Police',
    category: 'Police Recruitment 2026',
    postName: 'CG Police Constable 2026',
    examName: 'CG Police Constable Written Examination 2026',
    paperTitle: 'CG Police Constable GD Mock Test 01',
    year: 2026,
    durationMinutes: 120,
    negativeMarkingRatio: 'None / 0 Marks',
    marks: 100,
    vacancies: '5,967 Posts',
    paperSummary: 'Standard general duty constable written test pattern.',
  },

  // 8. Swami Atmanand Excellence Schools
  {
    authority: 'Swami Atmanand',
    category: 'Swami Atmanand Excellence Schools',
    postName: 'Swami Atmanand English Lecturer',
    examName: 'Swami Atmanand English Medium Teacher Exam',
    paperTitle: 'Swami Atmanand English Medium Full Mock 01',
    year: 2024,
    durationMinutes: 120,
    negativeMarkingRatio: '-⅓rd (0.33 Marks per wrong answer)',
    marks: 100,
    paperSummary: 'School excellence cadre exam with child psychology, NEP 2020, and English comprehension.',
  },

  // 9. Central Exams
  {
    authority: 'Central Exams',
    category: 'Staff Selection Commission (SSC)',
    postName: 'SSC Combined Graduate Level (CGL)',
    examName: 'SSC CGL Tier-I General Awareness',
    paperTitle: 'SSC CGL Tier-I High Yield GK Simulation',
    year: 2024,
    durationMinutes: 60,
    negativeMarkingRatio: '-0.50 Marks per wrong answer',
    marks: 50,
    paperSummary: 'National level central commission general intelligence and awareness paper.',
  },
  {
    authority: 'Central Exams',
    category: 'Railway Recruitment Board (RRB)',
    postName: 'RRB NTPC Graduate & Undergraduate',
    examName: 'RRB NTPC Stage-1 CBT Simulation',
    paperTitle: 'RRB NTPC Stage-1 Full Mock Test',
    year: 2024,
    durationMinutes: 90,
    negativeMarkingRatio: '-⅓rd (0.33 Marks per wrong answer)',
    marks: 100,
    paperSummary: 'General science, reasoning, and current affairs simulation for railway recruitment.',
  },
];

const LOCAL_STORAGE_CUSTOM_HIERARCHY = 'kavya_custom_hierarchy_v2';

export function getCustomHierarchyRecords(): HierarchyRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_HIERARCHY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse custom hierarchy records:', e);
    return [];
  }
}

export function saveCustomHierarchyRecord(record: HierarchyRecord): HierarchyRecord[] {
  try {
    const current = getCustomHierarchyRecords();
    const cleanExamName = record.examName.trim();
    const cleanAuthority = record.authority.trim();
    const cleanCategory = record.category.trim();
    const cleanPostName = (record.postName || 'General Post').trim();

    const existingIndex = current.findIndex(
      r =>
        r.authority.toLowerCase() === cleanAuthority.toLowerCase() &&
        r.category.toLowerCase() === cleanCategory.toLowerCase() &&
        (r.postName || '').toLowerCase() === cleanPostName.toLowerCase() &&
        r.examName.toLowerCase() === cleanExamName.toLowerCase()
    );

    const updatedRecord: HierarchyRecord = {
      ...record,
      authority: cleanAuthority,
      category: cleanCategory,
      postName: cleanPostName,
      examName: cleanExamName,
      isCustom: true,
    };

    let updatedList: HierarchyRecord[];
    if (existingIndex >= 0) {
      updatedList = [...current];
      updatedList[existingIndex] = updatedRecord;
    } else {
      updatedList = [updatedRecord, ...current];
    }

    localStorage.setItem(LOCAL_STORAGE_CUSTOM_HIERARCHY, JSON.stringify(updatedList));
    return updatedList;
  } catch (e) {
    console.error('Failed to save custom hierarchy record:', e);
    return getCustomHierarchyRecords();
  }
}

export function normalizeAuthority(raw?: string): string {
  if (!raw) return 'CGSSB';
  const upper = raw.toUpperCase().trim();
  if (upper.includes('VYAPAM') || upper.includes('CGSSB')) return 'CGSSB';
  if (upper.includes('CGPSC') || upper.includes('PSC')) return 'CGPSC';
  if (upper.includes('POLICE')) return 'CG Police';
  if (upper.includes('ATMANAND')) return 'Swami Atmanand';
  if (upper.includes('CENTRAL') || upper.includes('SSC') || upper.includes('RRB') || upper.includes('RAIL')) return 'Central Exams';
  return raw.trim();
}

export function extractHierarchyFromApp(
  arg1?: any[],
  arg2?: any[],
  arg3?: any[]
): HierarchyRecord[] {
  const customRecords = getCustomHierarchyRecords();
  const recordsMap = new Map<string, HierarchyRecord>();

  const allArrays = [arg1 || [], arg2 || [], arg3 || []];
  let questions: Question[] = [];
  let tests: MockTest[] = [];
  let pypPapers: PreviousYearPaper[] = [];

  allArrays.forEach(arr => {
    if (!Array.isArray(arr) || arr.length === 0) return;
    const first = arr[0];
    if (first && typeof first === 'object') {
      if ('sections' in first) {
        tests = arr as MockTest[];
      } else if ('isOfficialPaper' in first || 'downloadFileName' in first) {
        pypPapers = arr as PreviousYearPaper[];
      } else if ('options' in first || 'subject' in first || 'difficulty' in first) {
        questions = arr as Question[];
      }
    }
  });

  DEFAULT_HIERARCHY_RECORDS.forEach(r => {
    const key = `${r.authority.toLowerCase()}:::${r.category.toLowerCase()}:::${(r.postName || '').toLowerCase()}:::${r.examName.toLowerCase()}`;
    recordsMap.set(key, { ...r });
  });

  customRecords.forEach(r => {
    const key = `${r.authority.toLowerCase()}:::${r.category.toLowerCase()}:::${(r.postName || '').toLowerCase()}:::${r.examName.toLowerCase()}`;
    recordsMap.set(key, { ...r });
  });

  pypPapers.forEach(p => {
    const authority = normalizeAuthority(p.authority || p.examCategory);
    const category = p.subCategory?.trim() || (authority === 'CGPSC' ? 'State Service Examination (Prelims)' : 'Teacher Recruitment 2026');
    const postName = p.postName?.trim() || (category.includes('Teacher') ? 'CG Lecturer 2026' : 'General Cadre');
    const examName = p.examName?.trim() || p.title.trim();
    const key = `${authority.toLowerCase()}:::${category.toLowerCase()}:::${postName.toLowerCase()}:::${examName.toLowerCase()}`;

    recordsMap.set(key, {
      authority,
      category,
      postName,
      examName,
      paperTitle: p.title,
      year: p.year,
      durationMinutes: p.durationMinutes,
      negativeMarkingRatio: p.negativeMarkingRatio,
      marks: p.marks,
      paperSummary: p.paperSummary,
    });
  });

  tests.forEach(t => {
    const authority = normalizeAuthority(t.authority || t.category);
    const category = t.subCategory?.trim() || (authority === 'CGPSC' ? 'State Service Examination (Prelims)' : 'Teacher Recruitment 2026');
    const postName = t.postName?.trim() || (category.includes('Teacher') ? 'CG Lecturer 2026' : 'General Cadre');
    const examName = t.examName?.trim() || t.pypExamName?.trim() || t.title.trim();
    const key = `${authority.toLowerCase()}:::${category.toLowerCase()}:::${postName.toLowerCase()}:::${examName.toLowerCase()}`;

    if (!recordsMap.has(key)) {
      recordsMap.set(key, {
        authority,
        category,
        postName,
        examName,
        paperTitle: t.title,
        year: t.pypYear || new Date().getFullYear(),
        durationMinutes: t.durationMinutes,
        negativeMarkingRatio: `-${t.negativeMarksPerQuestion} Marks`,
        marks: t.totalMarks || t.questionCount * t.marksPerQuestion,
        paperSummary: t.description,
      });
    }
  });

  questions.forEach(q => {
    const authority = normalizeAuthority(q.authority || (typeof q.category === 'string' ? q.category : undefined));
    const category = q.subCategory?.trim() || 'Teacher Recruitment 2026';
    const postName = q.postName?.trim() || (category.includes('Teacher') ? 'CG Lecturer 2026' : 'General Cadre');

    if (q.examName) {
      const key = `${authority.toLowerCase()}:::${category.toLowerCase()}:::${postName.toLowerCase()}:::${q.examName.toLowerCase()}`;
      if (!recordsMap.has(key)) {
        recordsMap.set(key, {
          authority,
          category,
          postName,
          examName: q.examName,
          year: q.year || new Date().getFullYear(),
        });
      }
    }

    if (q.pypAppearances && Array.isArray(q.pypAppearances)) {
      q.pypAppearances.forEach(app => {
        if (app.examName) {
          const key = `${authority.toLowerCase()}:::${category.toLowerCase()}:::${postName.toLowerCase()}:::${app.examName.toLowerCase()}`;
          if (!recordsMap.has(key)) {
            recordsMap.set(key, {
              authority,
              category,
              postName,
              examName: app.examName,
              year: app.year,
            });
          }
        }
      });
    }
  });

  return Array.from(recordsMap.values());
}

/**
 * Level 1: Unique authorities
 */
export function getAvailableAuthorities(records: HierarchyRecord[]): string[] {
  const set = new Set<string>();
  const order = ['CGSSB', 'CGPSC', 'CG Police', 'Swami Atmanand', 'Central Exams'];
  records.forEach(r => {
    if (r.authority && r.authority.trim()) {
      set.add(r.authority.trim());
    }
  });

  const all = Array.from(set);
  return all.sort((a, b) => {
    const idxA = order.indexOf(a);
    const idxB = order.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * Level 2: Categories / Recruitment Drives
 */
export function getAvailableCategories(records: HierarchyRecord[], selectedAuthority?: string): string[] {
  const set = new Set<string>();
  const normAuth = selectedAuthority ? selectedAuthority.toLowerCase().trim() : null;

  records.forEach(r => {
    if (!normAuth || r.authority.toLowerCase().trim() === normAuth) {
      if (r.category && r.category.trim()) {
        set.add(r.category.trim());
      }
    }
  });

  if (set.size === 0 && selectedAuthority) {
    records.forEach(r => {
      if (r.category && r.category.trim()) set.add(r.category.trim());
    });
  }

  return Array.from(set).sort();
}

/**
 * Level 3: Posts / Cadres (e.g. "CG Lecturer 2026", "CG Teacher 2026", "CG Assistant Teacher 2026")
 */
export function getAvailablePosts(
  records: HierarchyRecord[],
  selectedAuthority?: string,
  selectedCategory?: string
): string[] {
  const set = new Set<string>();
  const normAuth = selectedAuthority ? selectedAuthority.toLowerCase().trim() : null;
  const normCat = selectedCategory ? selectedCategory.toLowerCase().trim() : null;

  records.forEach(r => {
    const authMatch = !normAuth || r.authority.toLowerCase().trim() === normAuth;
    const catMatch = !normCat || r.category.toLowerCase().trim() === normCat;
    if (authMatch && catMatch) {
      if (r.postName && r.postName.trim()) {
        set.add(r.postName.trim());
      }
    }
  });

  if (set.size === 0 && normCat) {
    records.forEach(r => {
      if (r.category.toLowerCase().trim() === normCat && r.postName && r.postName.trim()) {
        set.add(r.postName.trim());
      }
    });
  }

  // Fallback defaults if none registered for this category
  if (set.size === 0) {
    if (selectedCategory?.toLowerCase().includes('teacher')) {
      return ['CG Lecturer 2026', 'CG Teacher 2026', 'CG Assistant Teacher 2026'];
    }
    return ['General Cadre'];
  }

  return Array.from(set).sort();
}

/**
 * Level 4: Specific Exam Names (e.g. "CG English Lecturer 2026", "CG Physics Lecturer 2026")
 */
export function getAvailableExamNames(
  records: HierarchyRecord[],
  selectedAuthority?: string,
  selectedCategory?: string,
  selectedPost?: string
): HierarchyRecord[] {
  const normAuth = selectedAuthority ? selectedAuthority.toLowerCase().trim() : null;
  const normCat = selectedCategory ? selectedCategory.toLowerCase().trim() : null;
  const normPost = selectedPost ? selectedPost.toLowerCase().trim() : null;

  // Strict 3-level match
  let matches = records.filter(r => {
    const authMatch = !normAuth || r.authority.toLowerCase().trim() === normAuth;
    const catMatch = !normCat || r.category.toLowerCase().trim() === normCat;
    const postMatch = !normPost || (r.postName || '').toLowerCase().trim() === normPost;
    return authMatch && catMatch && postMatch;
  });

  // If no strict match with post, match authority + category
  if (matches.length === 0 && normCat) {
    matches = records.filter(r => {
      const authMatch = !normAuth || r.authority.toLowerCase().trim() === normAuth;
      const catMatch = r.category.toLowerCase().trim() === normCat;
      return authMatch && catMatch;
    });
  }

  if (matches.length === 0 && normCat) {
    matches = records.filter(r => r.category.toLowerCase().trim() === normCat);
  }

  if (matches.length === 0) {
    matches = records;
  }

  // Deduplicate by examName
  const seen = new Set<string>();
  return matches.filter(r => {
    const nameKey = r.examName.toLowerCase().trim();
    if (seen.has(nameKey)) return false;
    seen.add(nameKey);
    return true;
  });
}

/**
 * Maps an Authority string (or exam authority name) to an ExamCategory enum value.
 */
export function mapAuthorityToExamCategory(authority: string): ExamCategory {
  const norm = (authority || '').toLowerCase().trim();
  if (norm.includes('psc') || norm === 'cgpsc') {
    return 'CGPSC';
  }
  if (norm.includes('atmanand') || norm.includes('swami')) {
    return 'SWAMI_ATMANAND';
  }
  if (norm.includes('central') || norm.includes('ssc') || norm.includes('rail') || norm.includes('bank') || norm.includes('upsc')) {
    return 'CENTRAL_EXAMS';
  }
  return 'CGSSB';
}

/**
 * Traverses and returns the category syllabus hierarchy for a given exam authority or specific exam name.
 */
export function getSyllabusForAuthority(authority: string, examNameOrCategory?: string): ExamCategoryHierarchy {
  if (examNameOrCategory) {
    return getSyllabusForExam(examNameOrCategory, authority);
  }
  return getSyllabusForExam(authority, authority);
}

/**
 * Returns the relevant CGMasterModules for an exam authority/category.
 */
export function getSyllabusModulesForAuthority(authority: string, examNameOrCategory?: string): CGMasterModule[] {
  const hierarchy = getSyllabusForAuthority(authority, examNameOrCategory);
  const subjectIds = new Set(hierarchy.subjects.map(s => s.subjectId));
  
  const filtered = CG_MASTER_SYLLABUS.filter(m => subjectIds.has(m.id));
  return filtered.length > 0 ? filtered : [...CG_MASTER_SYLLABUS];
}

/**
 * Traverses syllabus subjects and their chapters/subtopics for a specific hierarchy level.
 * Dynamically resolves the specific marks distribution and topics according to the exam syllabus.
 */
export function getSubjectsForExamHierarchy(
  authority: string,
  category?: string,
  examName?: string
): ExamSubjectHierarchy[] {
  const hierarchy = getSyllabusForExam(examName || category || authority, authority);
  return hierarchy.subjects;
}

/**
 * Helper to lookup and retrieve all chapters and topics for any given subject ID or name.
 */
export function getSubjectChaptersAndTopics(subjectIdOrName: string): { chapterId: string; chapterName: string; topics: string[] }[] {
  const norm = subjectIdOrName.toLowerCase().trim();
  const mod = CG_MASTER_SYLLABUS.find(m => 
    m.id.toLowerCase() === norm || 
    m.nameEn.toLowerCase().includes(norm) || 
    m.nameHi.includes(norm) ||
    (m.nameHindi && m.nameHindi.includes(norm))
  );

  if (!mod) {
    // Return all chapters across all modules if no match found
    return CG_MASTER_SYLLABUS.flatMap(m => 
      m.chapters.map(c => ({
        chapterId: c.id,
        chapterName: c.nameHindi || c.name,
        topics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
      }))
    );
  }

  return mod.chapters.map(c => ({
    chapterId: c.id,
    chapterName: c.nameHindi || c.name,
    topics: c.topics.map(t => (typeof t === 'string' ? t : t.name))
  }));
}

/**
 * Intelligently matches and assigns structured syllabus metadata to an exam question or test row.
 */
export function assignHierarchySyllabus(
  authority: string,
  subjectInput: string,
  topicInput?: string
): {
  moduleId: string;
  subjectName: string;
  chapterId: string;
  chapterName: string;
  topicName: string;
  verified: boolean;
} {
  const normSub = (subjectInput || '').toLowerCase().trim();
  const normTopic = (topicInput || '').toLowerCase().trim();

  // 1. Find matching module
  let matchedMod = CG_MASTER_SYLLABUS.find(m => 
    m.id.toLowerCase() === normSub ||
    m.nameEn.toLowerCase().includes(normSub) ||
    m.nameHi.includes(normSub) ||
    (m.nameHindi && m.nameHindi.includes(normSub))
  );

  if (!matchedMod) {
    const authorityHierarchy = getSyllabusForAuthority(authority);
    const defaultSubjectId = authorityHierarchy.subjects[0]?.subjectId || 'cg-gk';
    matchedMod = CG_MASTER_SYLLABUS.find(m => m.id === defaultSubjectId) || CG_MASTER_SYLLABUS[0];
  }

  // 2. Find matching chapter inside the module
  let matchedChapter = matchedMod.chapters.find(c => 
    c.id.toLowerCase() === normTopic ||
    c.name.toLowerCase().includes(normTopic) ||
    (c.nameHindi && c.nameHindi.includes(normTopic))
  );

  if (!matchedChapter) {
    // Check if topic matches any nested subtopic string
    for (const ch of matchedMod.chapters) {
      const hasTopic = ch.topics.some(t => {
        const str = typeof t === 'string' ? t : t.name;
        return str.toLowerCase().includes(normTopic);
      });
      if (hasTopic) {
        matchedChapter = ch;
        break;
      }
    }
  }

  if (!matchedChapter) {
    matchedChapter = matchedMod.chapters[0];
  }

  const topicName = topicInput && topicInput.trim() 
    ? topicInput.trim() 
    : (matchedChapter?.nameHindi || matchedChapter?.name || 'General');

  return {
    moduleId: matchedMod.id,
    subjectName: matchedMod.nameHi || matchedMod.nameEn,
    chapterId: matchedChapter.id,
    chapterName: matchedChapter.nameHindi || matchedChapter.name,
    topicName,
    verified: Boolean(matchedMod && matchedChapter)
  };
}

// Re-export master syllabus utilities for convenience
export {
  CG_MASTER_SYLLABUS,
  CG_EXAM_HIERARCHICAL_SYLLABUS,
  CGSSB_EXAM_SCHEMES,
  getSyllabusForExam,
  getExamCategoryHierarchy,
  getModuleById,
  getChapterById,
  getChaptersForModule,
  getTopicsForChapter,
  getAllSubjects,
  flattenSyllabusHierarchy
};

