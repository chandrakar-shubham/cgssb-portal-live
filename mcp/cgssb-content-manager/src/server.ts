import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { applicationDefault, cert, getApp, initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const PORT = Number(process.env.PORT || 8787);
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const DATABASE_ID = process.env.FIRESTORE_DATABASE_ID;
const MCP_TOKEN = process.env.MCP_BEARER_TOKEN;
const ALLOWED_ORIGIN = process.env.MCP_ALLOWED_ORIGIN || '';

if (!PROJECT_ID) throw new Error('FIREBASE_PROJECT_ID is required');
if (!MCP_TOKEN) throw new Error('MCP_BEARER_TOKEN is required');
if (MCP_TOKEN.length < 32) throw new Error('MCP_BEARER_TOKEN must be at least 32 characters');

function initializeFirebase(): Firestore {
  const app: App = getApps().length === 0
    ? (() => {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        return initializeApp(serviceAccountJson
          ? { credential: cert(JSON.parse(serviceAccountJson)), projectId: PROJECT_ID }
          : { credential: applicationDefault(), projectId: PROJECT_ID });
      })()
    : getApp();

  return DATABASE_ID ? getFirestore(app, DATABASE_ID) : getFirestore(app);
}

const db = initializeFirebase();

const COLLECTIONS = {
  AUTHORITIES: 'examAuthorities',
  PROGRAMS: 'examPrograms',
  POSTS: 'examPosts',
  SERIES: 'examTestSeries',
  SUBJECTS: 'examSubjects',
  BUNDLES: 'bundles',
  AUDIT: 'aiContentManagerAudit',
} as const;

type SeriesType = 'full_mock' | 'chapter_test' | 'subject_test' | 'pyp' | 'live_test' | 'practice' | 'mixed';

interface SubjectInput {
  id?: string;
  name: string;
  nameHindi?: string;
  marks: number;
  questionCount: number;
  topics: string[];
  isMandatoryQualifying?: boolean;
}

interface SyllabusSection {
  subjectId: string;
  subject: string;
  subjectHindi: string;
  marks: number;
  questionCount: number;
  weightagePercentage: number;
  topics: string[];
  isMandatoryQualifying?: boolean;
}

function slugify(value: string): string {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9\\s-]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

async function getDoc<T>(collection: string, id: string): Promise<T | null> {
  const snap = await db.collection(collection).doc(id).get();
  return snap.exists ? snap.data() as T : null;
}

async function listDocs(collection: string): Promise<Array<Record<string, unknown>>> {
  const snap = await db.collection(collection).get();
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function audit(action: string, target: Record<string, unknown>, details: Record<string, unknown> = {}) {
  const ref = db.collection(COLLECTIONS.AUDIT).doc();
  await ref.set({
    id: ref.id,
    actor: 'cgssb-content-manager-mcp',
    action,
    target,
    details,
    createdAt: new Date().toISOString()
  });
}

function ok(data: unknown, message: string) {
  return {
    structuredContent: data,
    content: [{ type: 'text' as const, text: message }]
  };
}

function fail(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }]
  };
}

async function loadSeriesContext(seriesId: string) {
  const series = await getDoc<Record<string, unknown>>(COLLECTIONS.SERIES, seriesId);
  if (!series) throw new Error(`Test Series not found: ${seriesId}`);

  const bundleId = typeof series.bundleId === 'string' && series.bundleId
    ? series.bundleId
    : `bundle-${seriesId}`;

  const bundle = await getDoc<Record<string, unknown>>(COLLECTIONS.BUNDLES, bundleId);
  if (!bundle) throw new Error(`Content bundle not found for series ${seriesId}: ${bundleId}`);

  return { series, bundleId, bundle };
}

function createServerInstance() {
  const server = new McpServer(
    {
      name: 'cgssb-content-manager',
      version: '0.1.0'
    },
    {
      instructions:
        'Use the CGSSB Content Manager tools for controlled content operations. ' +
        'Always inspect the canonical series before changing it. Writes are draft-first. ' +
        'Use cgssb_validate_series after syllabus or blueprint changes. Never publish unless the user explicitly asks to publish and the validation is clean.'
    }
  );

  server.registerTool(
    'cgssb_get_catalog',
    {
      title: 'Get CGSSB catalog',
      description: 'Use this when you need to inspect the canonical Authority → Recruitment/Examination → Post → Test Series hierarchy before editing content.',
      inputSchema: z.object({
        programId: z.string().optional(),
        postId: z.string().optional()
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async ({ programId, postId }) => {
      try {
        const [authorities, programs, posts, series] = await Promise.all([
          listDocs(COLLECTIONS.AUTHORITIES),
          listDocs(COLLECTIONS.PROGRAMS),
          listDocs(COLLECTIONS.POSTS),
          listDocs(COLLECTIONS.SERIES)
        ]);

        const filteredPrograms = programId
          ? programs.filter(item => item.id === programId)
          : programs;
        const filteredPosts = postId
          ? posts.filter(item => item.id === postId)
          : posts.filter(item => !programId || item.programId === programId);
        const filteredSeries = series.filter(item =>
          (!programId || item.programId === programId) &&
          (!postId || item.postId === postId)
        );

        return ok(
          { authorities, programs: filteredPrograms, posts: filteredPosts, series: filteredSeries },
          `Found ${filteredPrograms.length} recruitment/examination programs, ${filteredPosts.length} posts and ${filteredSeries.length} test series.`
        );
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
      }
    }
  );

  server.registerTool(
    'cgssb_get_series',
    {
      title: 'Get test series content',
      description: 'Use this before editing a series. Returns the canonical Test Series record, its content bundle, syllabus, blueprint, and reusable subjects for the same recruitment.',
      inputSchema: z.object({ seriesId: z.string() }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async ({ seriesId }) => {
      try {
        const { series, bundleId, bundle } = await loadSeriesContext(seriesId);
        const subjects = await listDocs(COLLECTIONS.SUBJECTS);
        const reusableSubjects = subjects.filter(item => item.programId === series.programId);
        return ok(
          { series, bundleId, bundle, reusableSubjects },
          `Loaded ${String(series.name || seriesId)} with ${Array.isArray(bundle.syllabusBreakdown) ? bundle.syllabusBreakdown.length : 0} syllabus sections.`
        );
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
      }
    }
  );

  server.registerTool(
    'cgssb_upsert_subjects',
    {
      title: 'Save reusable subjects',
      description: 'Use this to create or update reusable syllabus subjects and attach them to a Test Series. Weightage is calculated automatically from total marks. The series remains a draft.',
      inputSchema: z.object({
        seriesId: z.string(),
        totalMarks: z.number().positive().optional(),
        replaceAll: z.boolean().default(false),
        subjects: z.array(z.object({
          id: z.string().optional(),
          name: z.string().min(1),
          nameHindi: z.string().optional(),
          marks: z.number().nonnegative(),
          questionCount: z.number().int().nonnegative(),
          topics: z.array(z.string()).default([]),
          isMandatoryQualifying: z.boolean().optional()
        })).min(1).max(100)
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
    },
    async ({ seriesId, totalMarks, replaceAll, subjects }) => {
      try {
        const { series, bundleId, bundle } = await loadSeriesContext(seriesId);
        const baseMarks = totalMarks ?? Number((bundle.examPattern as Record<string, unknown> | undefined)?.totalMarks ?? 0);
        if (baseMarks <= 0) return fail('totalMarks must be provided or the series exam blueprint must contain a positive totalMarks value.');

        const existingSections = Array.isArray(bundle.syllabusBreakdown)
          ? bundle.syllabusBreakdown as SyllabusSection[]
          : [];

        const normalized: SyllabusSection[] = subjects.map((subject, index) => {
          const subjectId = subject.id || `subject-${series.programId}-${slugify(subject.name)}`;
          return {
            subjectId,
            subject: subject.name,
            subjectHindi: subject.nameHindi || subject.name,
            marks: subject.marks,
            questionCount: subject.questionCount,
            weightagePercentage: round2((subject.marks / baseMarks) * 100),
            topics: subject.topics,
            ...(subject.isMandatoryQualifying === undefined ? {} : { isMandatoryQualifying: subject.isMandatoryQualifying }),
            _sortOrder: index
          };
        });

        const merged = replaceAll
          ? normalized
          : [
              ...existingSections.filter(existing =>
                !normalized.some(next => next.subjectId === existing.subjectId || next.subject === existing.subject)
              ),
              ...normalized
            ];

        const cleanedSections = merged.map(section => {
          const { _sortOrder, ...clean } = section as SyllabusSection & { _sortOrder?: number };
          return {
            ...clean,
            weightagePercentage: round2((Number(clean.marks) || 0) / baseMarks * 100)
          };
        });

        const batch = db.batch();
        const timestamp = new Date().toISOString();

        for (const subject of subjects) {
          const subjectId = subject.id || `subject-${series.programId}-${slugify(subject.name)}`;
          batch.set(
            db.collection(COLLECTIONS.SUBJECTS).doc(subjectId),
            {
              id: subjectId,
              authorityId: series.authorityId,
              programId: series.programId,
              name: subject.name,
              nameHindi: subject.nameHindi || subject.name,
              slug: slugify(subject.name),
              topics: subject.topics,
              status: 'DRAFT',
              sortOrder: subjects.indexOf(subject),
              createdAt: timestamp,
              updatedAt: timestamp
            },
            { merge: true }
          );
        }

        const updatedBundle = {
          ...bundle,
          syllabusBreakdown: cleanedSections,
          isDraft: true,
          isPublished: false
        };

        batch.set(db.collection(COLLECTIONS.BUNDLES).doc(bundleId), updatedBundle);
        await batch.commit();

        await audit('UPSERT_SUBJECTS', {
          seriesId,
          bundleId,
          programId: series.programId
        }, {
          replaceAll,
          subjectCount: subjects.length,
          totalMarks: baseMarks
        });

        const totalQuestionCount = cleanedSections.reduce((sum, section) => sum + Number(section.questionCount || 0), 0);
        const totalSubjectMarks = cleanedSections.reduce((sum, section) => sum + Number(section.marks || 0), 0);
        return ok(
          {
            seriesId,
            bundleId,
            subjectsSaved: subjects.length,
            syllabusSectionCount: cleanedSections.length,
            totalSubjectQuestions: totalQuestionCount,
            totalSubjectMarks,
            totalMarks: baseMarks,
            weightageTotal: round2(cleanedSections.reduce((sum, section) => sum + section.weightagePercentage, 0))
          },
          `Saved ${subjects.length} reusable subjects to ${String(series.name || seriesId)} as DRAFT. Weightage was calculated automatically from ${baseMarks} total marks.`
        );
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
      }
    }
  );

  server.registerTool(
    'cgssb_update_exam_blueprint',
    {
      title: 'Update exam blueprint',
      description: 'Use this to update the Content Manager exam blueprint for a Test Series. This never publishes the series.',
      inputSchema: z.object({
        seriesId: z.string(),
        totalQuestions: z.number().int().positive().optional(),
        totalMarks: z.number().positive().optional(),
        durationMinutes: z.number().int().positive().optional(),
        markingScheme: z.string().optional(),
        negativeMarkPenalty: z.string().optional(),
        language: z.string().optional(),
        cadre: z.string().optional(),
        passingCriteria: z.string().optional(),
        keyRules: z.array(z.string()).optional()
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
    },
    async ({ seriesId, ...patch }) => {
      try {
        const { series, bundleId, bundle } = await loadSeriesContext(seriesId);
        const current = (bundle.examPattern || {}) as Record<string, unknown>;
        const nextPattern = {
          ...current,
          ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
        };

        await db.collection(COLLECTIONS.BUNDLES).doc(bundleId).set({
          ...bundle,
          examPattern: nextPattern,
          isDraft: true,
          isPublished: false
        });

        await audit('UPDATE_EXAM_BLUEPRINT', { seriesId, bundleId }, { patch: nextPattern });

        return ok(
          { seriesId, bundleId, examPattern: nextPattern },
          `Updated the exam blueprint for ${String(series.name || seriesId)}. The series remains DRAFT.`
        );
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
      }
    }
  );

  server.registerTool(
    'cgssb_validate_series',
    {
      title: 'Validate test series',
      description: 'Use this after syllabus or blueprint changes. Reports missing/excess questions, marks, weightage total, and basic canonical linkage problems.',
      inputSchema: z.object({ seriesId: z.string() }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async ({ seriesId }) => {
      try {
        const { series, bundleId, bundle } = await loadSeriesContext(seriesId);
        const pattern = (bundle.examPattern || {}) as Record<string, unknown>;
        const sections = Array.isArray(bundle.syllabusBreakdown)
          ? bundle.syllabusBreakdown as SyllabusSection[]
          : [];
        const expectedQuestions = Number(pattern.totalQuestions || 0);
        const expectedMarks = Number(pattern.totalMarks || 0);
        const actualQuestions = sections.reduce((sum, section) => sum + Number(section.questionCount || 0), 0);
        const actualMarks = sections.reduce((sum, section) => sum + Number(section.marks || 0), 0);
        const weightageTotal = round2(sections.reduce((sum, section) => sum + Number(section.weightagePercentage || 0), 0));
        const questionDelta = expectedQuestions - actualQuestions;
        const marksDelta = round2(expectedMarks - actualMarks);

        const errors: string[] = [];
        if (!series.authorityId || !series.programId) errors.push('Series is missing canonical authorityId/programId.');
        if (!series.bundleId) errors.push('Series is missing bundleId.');
        if (!series.seriesType) errors.push('Series is missing seriesType.');
        if (expectedQuestions <= 0) errors.push('Exam blueprint totalQuestions is missing or invalid.');
        if (expectedMarks <= 0) errors.push('Exam blueprint totalMarks is missing or invalid.');
        if (questionDelta !== 0) errors.push(
          questionDelta > 0
            ? `Total subject questions = ${actualQuestions}, but exam requires ${expectedQuestions} → ${questionDelta} question(s) missing.`
            : `Total subject questions = ${actualQuestions}, but exam requires ${expectedQuestions} → ${Math.abs(questionDelta)} question(s) over.`
        );
        if (marksDelta !== 0) errors.push(
          marksDelta > 0
            ? `Total subject marks = ${actualMarks}, but exam requires ${expectedMarks} → ${marksDelta} mark(s) missing.`
            : `Total subject marks = ${actualMarks}, but exam requires ${expectedMarks} → ${Math.abs(marksDelta)} mark(s) over.`
        );
        if (Math.abs(weightageTotal - 100) > 0.05) errors.push(`Syllabus weightage totals ${weightageTotal}%, not 100%.`);

        return ok(
          {
            valid: errors.length === 0,
            seriesId,
            bundleId,
            expectedQuestions,
            actualQuestions,
            questionDelta,
            expectedMarks,
            actualMarks,
            marksDelta,
            weightageTotal,
            errors
          },
          errors.length === 0
            ? `Validation passed: ${expectedQuestions} questions, ${expectedMarks} marks and ${weightageTotal}% weightage reconcile.`
            : `Validation found ${errors.length} issue(s): ${errors.join(' | ')}`
        );
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
      }
    }
  );

  server.registerTool(
    'cgssb_get_audit_log',
    {
      title: 'Get content manager audit log',
      description: 'Use this to inspect recent AI Content Manager changes for a series or other target before continuing work.',
      inputSchema: z.object({
        seriesId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(25)
      }),
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    },
    async ({ seriesId, limit }) => {
      try {
        const snapshot = await db.collection(COLLECTIONS.AUDIT).orderBy('createdAt', 'desc').limit(Math.min(limit * 10, 500)).get();
        const entries = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(entry => {
            const target = (entry as { target?: unknown }).target;
            return !seriesId || (
              typeof target === 'object' &&
              target !== null &&
              'seriesId' in target &&
              (target as { seriesId?: unknown }).seriesId === seriesId
            );
          })
          .slice(0, limit);

        return ok(
          { entries },
          `Found ${entries.length} recent Content Manager audit entr${entries.length === 1 ? 'y' : 'ies'}.`
        );
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
      }
    }
  );

  server.registerTool(
    'cgssb_publish_series',
    {
      title: 'Publish test series',
      description: 'Use only when the user explicitly asks to publish a series. Requires confirm=true and passes validation before publishing.',
      inputSchema: z.object({
        seriesId: z.string(),
        confirm: z.literal(true)
      }),
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false }
    },
    async ({ seriesId, confirm }) => {
      if (!confirm) return fail('Publishing requires explicit confirm=true.');
      try {
        const validation = await validateSeriesForPublish(seriesId);
        if (!validation.valid) {
          return fail(`Publish blocked. Fix validation errors first: ${validation.errors.join(' | ')}`);
        }

        const { bundleId, bundle } = await loadSeriesContext(seriesId);
        await db.collection(COLLECTIONS.BUNDLES).doc(bundleId).set({
          ...bundle,
          isDraft: false,
          isPublished: true
        });

        await db.collection(COLLECTIONS.SERIES).doc(seriesId).set({
          status: 'PUBLISHED',
          updatedAt: new Date().toISOString()
        }, { merge: true });

        await audit('PUBLISH_SERIES', { seriesId, bundleId }, { validation });
        return ok(
          { seriesId, bundleId, published: true, validation },
          `Published ${seriesId} after validation.`
        );
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error));
      }
    }
  );

  return server;
}

async function validateSeriesForPublish(seriesId: string) {
  const { series, bundleId, bundle } = await loadSeriesContext(seriesId);
  const pattern = (bundle.examPattern || {}) as Record<string, unknown>;
  const sections = Array.isArray(bundle.syllabusBreakdown)
    ? bundle.syllabusBreakdown as SyllabusSection[]
    : [];
  const expectedQuestions = Number(pattern.totalQuestions || 0);
  const expectedMarks = Number(pattern.totalMarks || 0);
  const actualQuestions = sections.reduce((sum, section) => sum + Number(section.questionCount || 0), 0);
  const actualMarks = sections.reduce((sum, section) => sum + Number(section.marks || 0), 0);
  const weightageTotal = round2(sections.reduce((sum, section) => sum + Number(section.weightagePercentage || 0), 0));
  const errors: string[] = [];
  if (!series.authorityId || !series.programId || !series.seriesType || !series.bundleId) errors.push('Canonical series linkage is incomplete.');
  if (expectedQuestions <= 0 || expectedMarks <= 0) errors.push('Exam blueprint is incomplete.');
  if (expectedQuestions !== actualQuestions) errors.push(`Question count mismatch: expected ${expectedQuestions}, found ${actualQuestions}.`);
  if (Math.abs(expectedMarks - actualMarks) > 0.001) errors.push(`Marks mismatch: expected ${expectedMarks}, found ${actualMarks}.`);
  if (Math.abs(weightageTotal - 100) > 0.05) errors.push(`Weightage mismatch: ${weightageTotal}%.`);
  return { valid: errors.length === 0, errors, seriesId, bundleId };
}

const mcpHandler = createMcpHandler(() => createServerInstance(), {
  responseMode: 'json',
  onerror: (error) => console.error('[MCP]', error)
});
const nodeHandler = toNodeHandler(mcpHandler);

function authorized(req: IncomingMessage): boolean {
  const header = req.headers.authorization || '';
  return header === `Bearer ${MCP_TOKEN}`;
}

function requestOriginAllowed(req: IncomingMessage): boolean {
  if (!ALLOWED_ORIGIN) return true;
  const origin = req.headers.origin;
  return !origin || origin === ALLOWED_ORIGIN;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(text);
}

const httpServer = createServer(async (req, res) => {
  if (req.url === '/healthz' && req.method === 'GET') {
    return sendJson(res, 200, { ok: true, service: 'cgssb-content-manager-mcp' });
  }

  if (req.url !== '/mcp') {
    return sendJson(res, 404, { error: 'Not found' });
  }

  if (!requestOriginAllowed(req)) {
    return sendJson(res, 403, { error: 'Origin not allowed' });
  }

  if (!authorized(req)) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return sendJson(res, 401, { error: 'Unauthorized' });
  }

  try {
    await nodeHandler(req, res);
  } catch (error) {
    console.error('[MCP HTTP]', error);
    if (!res.headersSent) sendJson(res, 500, { error: 'Internal MCP server error' });
  }
});

httpServer.listen(PORT, () => {
  console.log(`CGSSB Content Manager MCP listening on :${PORT}/mcp`);
});
