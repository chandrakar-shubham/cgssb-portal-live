import { collection, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './config';
import { EXAM_CATALOG_COLLECTIONS, ExamAuthority, ExamPost, ExamProgram, ExamSubject, ExamTestSeries, slugifyCatalog, TestSeriesType } from './examCatalogService';
import type { TestSeriesBundle, BundleSyllabusSection } from '../data/bundleCatalog';

export interface CatalogPackageSubjectInput {
  id?: string;
  name: string;
  nameHindi?: string;
  slug?: string;
  topics?: string[];
}

export interface CatalogPackageSyllabusInput {
  subjectId?: string;
  subject: string;
  subjectHindi?: string;
  marks: number;
  questionCount: number;
  topics?: string[];
  isMandatoryQualifying?: boolean;
}

export interface CatalogPackageSeriesInput {
  id?: string;
  name: string;
  nameHindi?: string;
  slug?: string;
  seriesType?: TestSeriesType;
  postId?: string;
  postName?: string;
  description?: string;
  bundle?: {
    title?: string;
    titleHindi?: string;
    shortDescription?: string;
    fullDescription?: string;
    badge?: string;
    badgeColor?: TestSeriesBundle['badgeColor'];
    validity?: string;
    languageDisplay?: string;
    price?: number;
    originalPrice?: number;
    isProOnly?: boolean;
    features?: string[];
    faqs?: Array<{ question: string; answer: string }>;
  };
  examPattern?: Partial<TestSeriesBundle['examPattern']>;
  syllabus?: CatalogPackageSyllabusInput[];
  importantDates?: TestSeriesBundle['importantDates'];
  eligibility?: TestSeriesBundle['eligibility'];
  officialLinks?: TestSeriesBundle['officialLinks'];
  seoMeta?: TestSeriesBundle['seoMeta'];
}

export interface CatalogPackageInput {
  schemaVersion: '1.0';
  packageId: string;
  mode?: 'create' | 'upsert';
  catalog: {
    authority: {
      id?: string;
      name: string;
      shortName?: string;
      slug?: string;
      description?: string;
      logoUrl?: string;
    };
    recruitment: {
      id?: string;
      name: string;
      nameHindi?: string;
      slug?: string;
      year: number;
      programType?: 'recruitment' | 'examination';
      description?: string;
      hasPosts?: boolean;
      totalVacancies?: number;
      recruitmentLabel?: string;
    };
    posts?: Array<{
      id?: string;
      name: string;
      nameHindi?: string;
      slug?: string;
      shortName?: string;
      description?: string;
      vacancies?: number;
      cadreBreakup?: string;
      payLevel?: string;
      salaryRange?: string;
      subjects?: string[];
    }>;
    subjects?: CatalogPackageSubjectInput[];
    testSeries: CatalogPackageSeriesInput[];
  };
  tests?: unknown[];
  questions?: unknown[];
}

export interface CatalogImportPreview {
  packageId: string;
  mode: 'create' | 'upsert';
  authorityId: string;
  programId: string;
  counts: {
    authorities: number;
    programs: number;
    posts: number;
    subjects: number;
    series: number;
    bundles: number;
    tests: number;
    questions: number;
  };
  existing: {
    authority: boolean;
    program: boolean;
    posts: number;
    subjects: number;
    series: number;
    bundles: number;
  };
  warnings: string[];
  errors: string[];
}

export interface CatalogImportResult {
  packageId: string;
  authorityId: string;
  programId: string;
  postIds: string[];
  subjectIds: string[];
  seriesIds: string[];
  bundleIds: string[];
  createdOrUpdated: number;
}

const VALID_SERIES_TYPES: TestSeriesType[] = [
  'full_mock', 'chapter_test', 'subject_test', 'pyp', 'live_test', 'practice', 'mixed'
];

const clean = (value: unknown) => String(value ?? '').trim();

function stableId(prefix: string, explicitId: string | undefined, ...parts: string[]) {
  if (explicitId?.trim()) return explicitId.trim();
  const slug = slugifyCatalog(parts.filter(Boolean).join('-'));
  return slug ? `${prefix}-${slug}` : `${prefix}-${Date.now()}`;
}

function numberOr(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildSyllabus(
  input: CatalogPackageSyllabusInput[] | undefined,
  subjects: CatalogPackageSubjectInput[],
  subjectIdsByName: Map<string, string>
): BundleSyllabusSection[] {
  return (input || []).map((row, index) => {
    const subjectName = clean(row.subject);
    const subjectId = row.subjectId?.trim() || subjectIdsByName.get(subjectName.toLowerCase());
    const marks = numberOr(row.marks);
    const questionCount = numberOr(row.questionCount);
    const totalMarks = (input || []).reduce((sum, item) => sum + numberOr(item.marks), 0);
    const weightagePercentage = totalMarks > 0 ? Number(((marks / totalMarks) * 100).toFixed(2)) : 0;
    const catalogSubject = subjectId
      ? subjects.find(s => s.id === subjectId)
      : subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());

    return {
      subjectId,
      subject: subjectName,
      subjectHindi: clean(row.subjectHindi || catalogSubject?.nameHindi || subjectName),
      marks,
      questionCount,
      weightagePercentage,
      topics: Array.isArray(row.topics) ? row.topics.map(clean).filter(Boolean) : (catalogSubject?.topics || []),
      isMandatoryQualifying: row.isMandatoryQualifying
    };
  }).map((row, index) => ({ ...row, ...(row.subjectId ? {} : { subjectId: undefined }), sortOrder: index } as BundleSyllabusSection & { sortOrder: number }));
}

export function validateCatalogPackage(input: unknown): { normalized?: CatalogPackageInput; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!input || typeof input !== 'object') return { errors: ['Catalog package must be a JSON object.'], warnings };

  const raw = input as Partial<CatalogPackageInput>;
  if (raw.schemaVersion !== '1.0') errors.push('schemaVersion must be "1.0".');
  if (!clean(raw.packageId)) errors.push('packageId is required.');
  if (!raw.catalog) errors.push('catalog is required.');
  if (Array.isArray(raw.tests) && raw.tests.length > 0) errors.push('Catalog package must not contain tests. Import tests through Universal Ingestion Studio.');
  if (Array.isArray(raw.questions) && raw.questions.length > 0) errors.push('Catalog package must not contain questions. Import questions through Universal Ingestion Studio.');

  const catalog = raw.catalog;
  if (!catalog) return { errors, warnings };

  if (!clean(catalog.authority?.name)) errors.push('catalog.authority.name is required.');
  if (!clean(catalog.recruitment?.name)) errors.push('catalog.recruitment.name is required.');
  if (!Number.isInteger(Number(catalog.recruitment?.year))) errors.push('catalog.recruitment.year must be an integer.');
  if (!Array.isArray(catalog.testSeries) || catalog.testSeries.length === 0) errors.push('catalog.testSeries must contain at least one series.');

  const postNames = new Set<string>();
  for (const post of catalog.posts || []) {
    const key = clean(post.name).toLowerCase();
    if (!key) errors.push('Every post requires a name.');
    if (postNames.has(key)) errors.push(`Duplicate post name: ${post.name}`);
    postNames.add(key);
    if (post.vacancies != null && numberOr(post.vacancies) < 0) errors.push(`Invalid vacancies for post: ${post.name}`);
  }

  const subjectNames = new Set<string>();
  for (const subject of catalog.subjects || []) {
    const key = clean(subject.name).toLowerCase();
    if (!key) errors.push('Every subject requires a name.');
    if (subjectNames.has(key)) errors.push(`Duplicate subject name: ${subject.name}`);
    subjectNames.add(key);
  }

  const seriesNames = new Set<string>();
  for (const series of catalog.testSeries || []) {
    const key = clean(series.name).toLowerCase();
    if (!key) errors.push('Every test series requires a name.');
    if (seriesNames.has(key)) errors.push(`Duplicate test series name: ${series.name}`);
    seriesNames.add(key);

    const seriesType = series.seriesType || 'full_mock';
    if (!VALID_SERIES_TYPES.includes(seriesType)) errors.push(`Invalid seriesType for ${series.name}: ${seriesType}`);

    if (series.postName) {
      const found = (catalog.posts || []).some(p => p.name.toLowerCase() === series.postName!.toLowerCase());
      if (!found && !series.postId) warnings.push(`Series "${series.name}" references post "${series.postName}" which is not in this package.`);
    }

    const pattern = series.examPattern;
    const syllabus = series.syllabus || [];
    if (pattern?.totalQuestions != null && numberOr(pattern.totalQuestions) < 0) errors.push(`Invalid totalQuestions for ${series.name}`);
    if (pattern?.totalMarks != null && numberOr(pattern.totalMarks) < 0) errors.push(`Invalid totalMarks for ${series.name}`);

    const qSum = syllabus.reduce((sum, row) => sum + numberOr(row.questionCount), 0);
    const mSum = syllabus.reduce((sum, row) => sum + numberOr(row.marks), 0);
    if (pattern?.totalQuestions != null && syllabus.length > 0 && qSum !== numberOr(pattern.totalQuestions)) {
      errors.push(`Syllabus question count for "${series.name}" is ${qSum}, but examPattern.totalQuestions is ${numberOr(pattern.totalQuestions)}.`);
    }
    if (pattern?.totalMarks != null && syllabus.length > 0 && mSum !== numberOr(pattern.totalMarks)) {
      errors.push(`Syllabus marks for "${series.name}" is ${mSum}, but examPattern.totalMarks is ${numberOr(pattern.totalMarks)}.`);
    }
    for (const row of syllabus) {
      if (!clean(row.subject)) errors.push(`A syllabus row in "${series.name}" is missing subject.`);
      if (numberOr(row.marks) < 0 || numberOr(row.questionCount) < 0) errors.push(`Invalid marks/questionCount in "${series.name}" syllabus.`);
      if (row.subjectId && !((catalog.subjects || []).some(s => s.id === row.subjectId))) {
        warnings.push(`Series "${series.name}" references subjectId "${row.subjectId}" that is not declared in catalog.subjects.`);
      }
    }
  }

  if (!catalog.posts?.length && catalog.recruitment.hasPosts !== false) {
    warnings.push('No posts were supplied. Recruitment will be treated as a direct exam only if hasPosts=false is explicitly set.');
  }

  return {
    normalized: {
      schemaVersion: '1.0',
      packageId: clean(raw.packageId),
      mode: raw.mode === 'create' ? 'create' : 'upsert',
      catalog: {
        ...catalog,
        authority: {
          ...catalog.authority,
          name: clean(catalog.authority.name),
          shortName: clean(catalog.authority.shortName || catalog.authority.name),
          slug: clean(catalog.authority.slug) || slugifyCatalog(catalog.authority.name),
        },
        recruitment: {
          ...catalog.recruitment,
          name: clean(catalog.recruitment.name),
          slug: clean(catalog.recruitment.slug) || slugifyCatalog(catalog.recruitment.name),
          year: Number(catalog.recruitment.year),
          programType: catalog.recruitment.programType || 'recruitment',
          hasPosts: catalog.recruitment.hasPosts !== false,
        },
        posts: catalog.posts || [],
        subjects: catalog.subjects || [],
        testSeries: catalog.testSeries || [],
      },
    },
    errors,
    warnings
  };
}

export async function previewCatalogPackage(input: CatalogPackageInput): Promise<CatalogImportPreview> {
  if (!db) throw new Error('Firestore is not configured.');

  const authorityId = stableId('authority', input.catalog.authority.id, input.catalog.authority.slug || input.catalog.authority.name);
  const programId = stableId('program', input.catalog.recruitment.id, input.catalog.authority.slug || input.catalog.authority.name, input.catalog.recruitment.slug || input.catalog.recruitment.name);

  const postIds = (input.catalog.posts || []).map(p => stableId('post', p.id, input.catalog.recruitment.slug || input.catalog.recruitment.name, p.slug || p.name));
  const subjectIds = (input.catalog.subjects || []).map(s => stableId('subject', s.id, input.catalog.recruitment.slug || input.catalog.recruitment.name, s.slug || s.name));
  const seriesIds = input.catalog.testSeries.map(s => stableId('series', s.id, input.catalog.recruitment.slug || input.catalog.recruitment.name, s.slug || s.name));
  const bundleIds = seriesIds.map(id => `bundle-${id}`);

  const refs = [
    doc(db, EXAM_CATALOG_COLLECTIONS.AUTHORITIES, authorityId),
    doc(db, EXAM_CATALOG_COLLECTIONS.PROGRAMS, programId),
    ...postIds.map(id => doc(db, EXAM_CATALOG_COLLECTIONS.POSTS, id)),
    ...subjectIds.map(id => doc(db, EXAM_CATALOG_COLLECTIONS.SUBJECTS, id)),
    ...seriesIds.map(id => doc(db, EXAM_CATALOG_COLLECTIONS.SERIES, id)),
    ...bundleIds.map(id => doc(db, 'bundles', id)),
  ];

  const snapshots = await Promise.all(refs.map(getDoc));
  let cursor = 0;
  const authorityExists = snapshots[cursor++].exists();
  const programExists = snapshots[cursor++].exists();
  const postExisting = postIds.filter(() => snapshots[cursor++].exists()).length;
  const subjectExisting = subjectIds.filter(() => snapshots[cursor++].exists()).length;
  const seriesExisting = seriesIds.filter(() => snapshots[cursor++].exists()).length;
  const bundleExisting = bundleIds.filter(() => snapshots[cursor++].exists()).length;

  return {
    packageId: input.packageId,
    mode: input.mode || 'upsert',
    authorityId,
    programId,
    counts: {
      authorities: 1, programs: 1, posts: postIds.length,
      subjects: subjectIds.length, series: seriesIds.length,
      bundles: bundleIds.length, tests: 0, questions: 0
    },
    existing: {
      authority: authorityExists, program: programExists,
      posts: postExisting, subjects: subjectExisting,
      series: seriesExisting, bundles: bundleExisting
    },
    warnings: [
      ...(input.catalog.testSeries.some(s => !s.syllabus?.length) ? ['One or more series have no syllabus rows; their draft bundle will have an empty syllabus.'] : []),
      ...(input.catalog.testSeries.some(s => !s.examPattern) ? ['One or more series have no examPattern; defaults will be used in the draft bundle.'] : [])
    ],
    errors: []
  };
}

export async function importCatalogPackage(input: CatalogPackageInput, preview?: CatalogImportPreview): Promise<CatalogImportResult> {
  if (!db) throw new Error('Firestore is not configured.');
  if (input.mode === 'create' && preview) {
    const existingCount = Number(preview.existing.authority) + Number(preview.existing.program) + preview.existing.posts + preview.existing.subjects + preview.existing.series + preview.existing.bundles;
    if (existingCount > 0) {
      throw new Error(`Create mode is strict: ${existingCount} matching catalog record(s) already exist. Use mode=upsert to update an existing catalog.`);
    }
  }

  const authoritySlug = input.catalog.authority.slug || slugifyCatalog(input.catalog.authority.name);
  const programSlug = input.catalog.recruitment.slug || slugifyCatalog(input.catalog.recruitment.name);
  const authorityId = stableId('authority', input.catalog.authority.id, authoritySlug);
  const programId = stableId('program', input.catalog.recruitment.id, authoritySlug, programSlug);
  const timestamp = new Date().toISOString();

  const authority: ExamAuthority = {
    id: authorityId,
    name: input.catalog.authority.name,
    shortName: input.catalog.authority.shortName || input.catalog.authority.name,
    slug: authoritySlug,
    description: input.catalog.authority.description,
    logoUrl: input.catalog.authority.logoUrl,
    status: 'DRAFT',
    sortOrder: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const program: ExamProgram = {
    id: programId,
    authorityId,
    name: input.catalog.recruitment.name,
    nameHindi: input.catalog.recruitment.nameHindi,
    slug: programSlug,
    year: input.catalog.recruitment.year,
    programType: input.catalog.recruitment.programType || 'recruitment',
    description: input.catalog.recruitment.description,
    status: 'DRAFT',
    hasPosts: input.catalog.recruitment.hasPosts !== false,
    sortOrder: 0,
    totalVacancies: input.catalog.recruitment.totalVacancies,
    recruitmentLabel: input.catalog.recruitment.recruitmentLabel,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const posts: ExamPost[] = (input.catalog.posts || []).map((post, index) => ({
    id: stableId('post', post.id, programSlug, post.slug || post.name),
    programId,
    name: post.name,
    nameHindi: post.nameHindi,
    slug: post.slug || slugifyCatalog(post.name),
    shortName: post.shortName,
    description: post.description,
    status: 'DRAFT',
    sortOrder: index,
    createdAt: timestamp,
    updatedAt: timestamp,
    vacancies: post.vacancies,
    cadreBreakup: post.cadreBreakup,
    payLevel: post.payLevel,
    salaryRange: post.salaryRange,
    subjects: post.subjects,
  }));

  const postById = new Map(posts.map(p => [p.id, p]));
  const postByName = new Map(posts.map(p => [p.name.toLowerCase(), p]));

  const subjects: ExamSubject[] = (input.catalog.subjects || []).map((subject, index) => ({
    id: stableId('subject', subject.id, programSlug, subject.slug || subject.name),
    authorityId,
    programId,
    name: subject.name,
    nameHindi: subject.nameHindi,
    slug: subject.slug || slugifyCatalog(subject.name),
    topics: Array.isArray(subject.topics) ? subject.topics : [],
    status: 'DRAFT',
    sortOrder: index,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  const subjectById = new Map(subjects.map(s => [s.id, s]));
  const subjectByName = new Map(subjects.map(s => [s.name.toLowerCase(), s]));

  const seriesRecords: ExamTestSeries[] = [];
  const bundles: TestSeriesBundle[] = [];

  for (let index = 0; index < input.catalog.testSeries.length; index++) {
    const source = input.catalog.testSeries[index];
    const seriesId = stableId('series', source.id, programSlug, source.slug || source.name);
    const bundleId = `bundle-${seriesId}`;
    const resolvedPost = source.postId
      ? postById.get(source.postId)
      : source.postName
        ? postByName.get(source.postName.toLowerCase())
        : undefined;

    const seriesType = source.seriesType || 'full_mock';
    const pattern = source.examPattern || {};
    const syllabus = buildSyllabus(source.syllabus, input.catalog.subjects || [], new Map(subjects.map(s => [s.name.toLowerCase(), s.id])));
    const totalQuestions = numberOr(pattern.totalQuestions, syllabus.reduce((sum, row) => sum + row.questionCount, 0));
    const totalMarks = numberOr(pattern.totalMarks, syllabus.reduce((sum, row) => sum + row.marks, 0));
    const durationMinutes = numberOr(pattern.durationMinutes, 120);

    const seriesRecord: ExamTestSeries = {
      id: seriesId,
      authorityId,
      programId,
      postId: resolvedPost?.id,
      name: source.name,
      nameHindi: source.nameHindi,
      slug: source.slug || slugifyCatalog(source.name),
      seriesType,
      bundleId,
      description: source.description,
      status: 'DRAFT',
      sortOrder: index,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const bundle: TestSeriesBundle = {
      id: bundleId,
      slug: source.slug || slugifyCatalog(source.name),
      title: source.bundle?.title || source.name,
      titleHindi: source.bundle?.titleHindi || source.nameHindi || source.name,
      authorityId,
      programId,
      postId: resolvedPost?.id,
      seriesId,
      seriesType,
      badge: source.bundle?.badge || (seriesType === 'full_mock' ? 'Full Mock' : seriesType.replace('_', ' ')),
      badgeColor: source.bundle?.badgeColor || 'emerald',
      shortDescription: source.bundle?.shortDescription || source.description || `${source.name} — draft test series.`,
      fullDescription: source.bundle?.fullDescription || source.description || '',
      price: numberOr(source.bundle?.price),
      originalPrice: numberOr(source.bundle?.originalPrice),
      isProOnly: source.bundle?.isProOnly === true,
      totalTestsCount: 0,
      freeTestsCount: 0,
      enrolledStudentsCount: 0,
      rating: 0,
      validity: source.bundle?.validity || 'Till Exam Date',
      languageDisplay: source.bundle?.languageDisplay || String(pattern.language || 'Bilingual'),
      examPattern: {
        totalQuestions,
        totalMarks,
        durationMinutes,
        markingScheme: String(pattern.markingScheme || 'As per official notification'),
        negativeMarkPenalty: String(pattern.negativeMarkPenalty || ''),
        language: String(pattern.language || 'Bilingual'),
        cadre: String(pattern.cadre || resolvedPost?.name || ''),
        passingCriteria: pattern.passingCriteria,
        keyRules: Array.isArray(pattern.keyRules) ? pattern.keyRules.map(clean).filter(Boolean) : [],
      },
      syllabusBreakdown: syllabus.map(row => ({
        ...row,
        weightagePercentage: row.weightagePercentage
      })),
      features: Array.isArray(source.bundle?.features) ? source.bundle.features : [],
      testItems: [],
      faqs: Array.isArray(source.bundle?.faqs) ? source.bundle.faqs : [],
      importantDates: source.importantDates,
      eligibility: source.eligibility,
      officialLinks: source.officialLinks,
      seoMeta: source.seoMeta,
      isDraft: true,
      isPublished: false,
    };

    seriesRecords.push(seriesRecord);
    bundles.push(bundle);
  }

  const operations = 1 + 1 + posts.length + subjects.length + seriesRecords.length + bundles.length + 1;
  if (operations > 450) {
    throw new Error(`Catalog package contains ${operations} writes. Maximum is 450 for this client-side atomic import. Split the catalog into smaller packages.`);
  }

  const batch = writeBatch(db);
  batch.set(doc(db, EXAM_CATALOG_COLLECTIONS.AUTHORITIES, authority.id), authority, { merge: true });
  batch.set(doc(db, EXAM_CATALOG_COLLECTIONS.PROGRAMS, program.id), program, { merge: true });
  posts.forEach(record => batch.set(doc(db, EXAM_CATALOG_COLLECTIONS.POSTS, record.id), record, { merge: true }));
  subjects.forEach(record => batch.set(doc(db, EXAM_CATALOG_COLLECTIONS.SUBJECTS, record.id), record, { merge: true }));
  seriesRecords.forEach(record => batch.set(doc(db, EXAM_CATALOG_COLLECTIONS.SERIES, record.id), record, { merge: true }));
  bundles.forEach(bundle => batch.set(doc(db, 'bundles', bundle.id), bundle, { merge: true }));

  const auditId = `catalog-import-${input.packageId}-${Date.now()}`;
  batch.set(doc(db, 'aiContentManagerAudit', auditId), {
    id: auditId,
    action: 'CATALOG_PACKAGE_IMPORT',
    packageId: input.packageId,
    authorityId,
    programId,
    createdAt: timestamp,
    mode: input.mode || 'upsert',
    counts: {
      posts: posts.length,
      subjects: subjects.length,
      series: seriesRecords.length,
      bundles: bundles.length,
      tests: 0,
      questions: 0,
    },
    status: 'DRAFT',
  });

  await batch.commit();

  return {
    packageId: input.packageId,
    authorityId,
    programId,
    postIds: posts.map(p => p.id),
    subjectIds: subjects.map(s => s.id),
    seriesIds: seriesRecords.map(s => s.id),
    bundleIds: bundles.map(b => b.id),
    createdOrUpdated: operations - 1,
  };
}
