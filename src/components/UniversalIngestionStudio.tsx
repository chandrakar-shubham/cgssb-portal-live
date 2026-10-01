import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  FileText,
  Code2,
  Layers,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Zap,
  Save,
  ChevronRight,
  Filter,
  Check,
  Crown,
  Eye,
  Settings,
  FolderPlus,
  ArrowRight,
  Copy,
  Languages,
  Monitor,
  Layout,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  Clock,
  Award,
  PlayCircle
} from 'lucide-react';
import { Question, MockTest, PreviousYearPaper, ExamCategory, DifficultyLevel, QuestionType } from '../types';
import { TestSeriesBundle } from '../data/bundleCatalog';
import { getStoredBundles, saveSingleBundle } from '../utils/bundleStore';
import { apiFetch, getAdminHeaders } from '../utils/apiClient';
import { mapRawJsonToQuestion } from '../utils/jsonQuestionMapper';
import { QuestionRenderer } from './QuestionRenderer';
import { saveQuestionsToFirestore, saveTestToFirestore, savePypPaperToFirestore } from '../firebase/firestoreService';
import { ensureCanonicalHierarchyForBundle } from '../firebase/examCatalogService';
import { CanonicalIngestionSelector } from './CanonicalIngestionSelector';

export type IngestionContentType = 'MOCK_TEST' | 'PYP' | 'CHAPTER_TEST' | 'QUESTION_BANK';
export type IngestionInputTab = 'SMART_PASTE' | 'JSON_EDITOR' | 'AI_GEMINI';
export type PreviewSubMode = 'EDITOR' | 'LIVE_CARD' | 'BUNDLE_CARD';

export interface UniversalIngestionStudioProps {
  isOpen: boolean;
  onClose: () => void;
  // Context configuration
  initialType?: IngestionContentType;
  lockType?: boolean;
  initialInputTab?: IngestionInputTab;
  // Pre-filled defaults (optional)
  defaultAuthority?: string;
  defaultExamName?: string;
  defaultCadre?: string;
  defaultBundleId?: string;
  // Data props & callbacks
  availableBundles?: TestSeriesBundle[];
  onQuestionsIngested?: (questions: Question[]) => void;
  onMockTestCreated?: (test: MockTest) => void;
  onPypCreated?: (pyp: PreviousYearPaper) => void;
  onBundleUpdated?: (bundle: TestSeriesBundle) => void;
}

export const UniversalIngestionStudio: React.FC<UniversalIngestionStudioProps> = ({
  isOpen,
  onClose,
  initialType = 'MOCK_TEST',
  lockType = false,
  initialInputTab = 'SMART_PASTE',
  defaultAuthority = 'CGSSB',
  defaultExamName = 'CG Teacher Recruitment 2026',
  defaultCadre = 'Assistant Teacher (Sahayak Shikshak)',
  defaultBundleId = '',
  availableBundles = [],
  onQuestionsIngested,
  onMockTestCreated,
  onPypCreated,
  onBundleUpdated,
}) => {
  // 1. Core Workflow States
  const [contentType, setContentType] = useState<IngestionContentType>(initialType);
  const [activeTab, setActiveTab] = useState<IngestionInputTab>(initialInputTab);
  const [currentStep, setCurrentStep] = useState<'METADATA' | 'INPUT' | 'PREVIEW'>('METADATA');
  const jsonFileInputRef = React.useRef<HTMLInputElement>(null);
  const textFileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // 2. Hierarchical Metadata Configuration
  const [authority, setAuthority] = useState<string>(defaultAuthority);
  const [examName, setExamName] = useState<string>(defaultExamName);
  const [cadre, setCadre] = useState<string>(defaultCadre);
  const [testTitle, setTestTitle] = useState<string>('Assistant Teacher 2026 - Comprehensive Mock 01');
  const [targetBundleId, setTargetBundleId] = useState<string>(defaultBundleId);
  const [durationMinutes, setDurationMinutes] = useState<number>(150);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1.0);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);
  const [accessTier, setAccessTier] = useState<'free' | 'paid' | 'live'>('paid');

  // Chapter Test Specifics
  const [subject, setSubject] = useState<string>('Chhattisgarh General Knowledge');
  const [topic, setTopic] = useState<string>('Kalchuri Dynasty & History');
  const [subtopic, setSubtopic] = useState<string>('Ratanpur & Raipur Branches');

  // PYP Specifics
  const [pypYear, setPypYear] = useState<number>(2024);
  const [pypShift, setPypShift] = useState<string>('Shift 1 (Morning)');

  // 3. Ingestion Input States
  const [rawText, setRawText] = useState<string>('');
  const [rawJson, setRawJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // AI Gemini Generator States
  const [aiTopicPrompt, setAiTopicPrompt] = useState<string>(
    'Child Development & Pedagogy (Bal Vikas avam Shikshashastra) for CG Assistant Teacher 2026 in Hindi with detailed explanations'
  );
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(15);
  const [aiDifficulty, setAiDifficulty] = useState<DifficultyLevel>('Medium');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // 4. Parsed Questions Output State
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 5. Live Card Preview & Rich Editing States
  const [previewSubMode, setPreviewSubMode] = useState<PreviewSubMode>('EDITOR');
  const [previewLanguage, setPreviewLanguage] = useState<'bilingual' | 'hi' | 'en'>('bilingual');
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [simulatedAnswers, setSimulatedAnswers] = useState<Record<string, string>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [editingQuestionModalIndex, setEditingQuestionModalIndex] = useState<number | null>(null);
  const [activeLiveCardIndex, setActiveLiveCardIndex] = useState<number>(0);
  const [liveDisplayLayout, setLiveDisplayLayout] = useState<'list' | 'single'>('list');

  // Synchronize state when modal is opened or target configuration changes
  React.useEffect(() => {
    if (isOpen) {
      setContentType(initialType);
      setActiveTab(initialInputTab);
      setAuthority(defaultAuthority);
      setExamName(defaultExamName);
      setCadre(defaultCadre);
      setTargetBundleId(defaultBundleId);
      setCurrentStep('METADATA');
      setStatusMessage(null);
      setUploadedFileName(null);
      if (initialType === 'PYP') {
        setTestTitle(`${defaultExamName} Official Solved Paper (${pypYear})`);
      } else if (initialType === 'CHAPTER_TEST') {
        setTestTitle(`${defaultExamName} - Chapter Quiz (${topic})`);
      } else {
        setTestTitle(`${defaultCadre} 2026 - Comprehensive Mock 01`);
      }
    }
  }, [isOpen, initialType, initialInputTab, defaultAuthority, defaultExamName, defaultCadre, defaultBundleId]);

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        setRawJson(text);
        setJsonError(null);
        // Pre-validate JSON
        const parsed = JSON.parse(text);
        const count = Array.isArray(parsed) ? parsed.length : Array.isArray(parsed.questions) ? parsed.questions.length : 1;
        setStatusMessage({ type: 'success', text: `📁 Loaded file "${file.name}" with ${count} question entries!` });
      } catch (err: any) {
        setJsonError(`Invalid JSON in file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        setRawText(text);
        setStatusMessage({ type: 'success', text: `📄 Loaded document "${file.name}" (${(text.length / 1024).toFixed(1)} KB)` });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: `Error reading file: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

  // Load all available bundles (fallback to localStorage + default catalog)
  const allBundles = useMemo(() => {
    if (availableBundles && availableBundles.length > 0) return availableBundles;
    return getStoredBundles();
  }, [availableBundles]);

  // Filtered Questions for Preview
  const filteredPreviewQuestions = useMemo(() => {
    return parsedQuestions.filter(q => {
      const matchesDifficulty = filterDifficulty === 'ALL' || q.difficulty === filterDifficulty;
      const qText = `${q.questionHindi || ''} ${q.questionText || ''} ${q.subject || ''} ${q.topic || ''}`.toLowerCase();
      const matchesSearch = !previewSearch.trim() || qText.includes(previewSearch.toLowerCase());
      return matchesDifficulty && matchesSearch;
    });
  }, [parsedQuestions, filterDifficulty, previewSearch]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // SMART TEXT / PDF PARSER ENGINE (Bilingual Hindi + English)
  // -------------------------------------------------------------
  const parseRawTextToQuestions = () => {
    if (!rawText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste raw question text first!' });
      return;
    }

    try {
      const questionsList: Question[] = [];
      // Split on question patterns like "Q1.", "1.", "Q.1", "प्रश्न 1:"
      const questionBlocks = rawText
        .split(/(?:(?:\r?\n){2,}|(?=^(?:Q\.?\s*\d+|प्रश्न\s*\d+|\d+[\.\)])\s*))/gim)
        .map(b => b.trim())
        .filter(b => b.length > 20);

      const timestamp = Date.now();

      questionBlocks.forEach((block, idx) => {
        const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return;

        let qHindi = '';
        let qEnglish = '';
        let optA = { text: '', textHindi: '' };
        let optB = { text: '', textHindi: '' };
        let optC = { text: '', textHindi: '' };
        let optD = { text: '', textHindi: '' };
        let correctOpt: 'A' | 'B' | 'C' | 'D' = 'A';
        let explanation = '';
        let explanationHindi = '';

        // Extract Answer
        const ansMatch = block.match(/(?:(?:Ans|Answer|उत्तर|सही उत्तर)[\s\:\-\=]+([A-D]|अ|ब|स|द|[1-4]))/i);
        if (ansMatch) {
          const rawAns = ansMatch[1].toUpperCase();
          if (rawAns === 'A' || rawAns === 'अ' || rawAns === '1') correctOpt = 'A';
          else if (rawAns === 'B' || rawAns === 'ब' || rawAns === '2') correctOpt = 'B';
          else if (rawAns === 'C' || rawAns === 'स' || rawAns === '3') correctOpt = 'C';
          else if (rawAns === 'D' || rawAns === 'द' || rawAns === '4') correctOpt = 'D';
        }

        // Extract Explanation
        const expMatch = block.match(/(?:(?:Explanation|व्याख्या|स्पष्टीकरण)[\s\:\-]+)([\s\S]+)$/i);
        if (expMatch) {
          explanationHindi = expMatch[1].trim();
          explanation = expMatch[1].trim();
        }

        // Parse Question Lines & Options
        const cleanLines = lines.filter(l => !l.match(/^(?:Ans|Answer|उत्तर|Explanation|व्याख्या|स्पष्टीकरण)/i));
        
        cleanLines.forEach(line => {
          // Check for options (A), (B), (C), (D) or (अ), (ब), (स), (द)
          const optAMatch = line.match(/^(?:\(?\s*[Aअ1]\s*[\.\)]|\(A\)|\(अ\))\s*(.+)$/i);
          const optBMatch = line.match(/^(?:\(?\s*[Bब2]\s*[\.\)]|\(B\)|\(ब\))\s*(.+)$/i);
          const optCMatch = line.match(/^(?:\(?\s*[Cस3]\s*[\.\)]|\(C\)|\(स\))\s*(.+)$/i);
          const optDMatch = line.match(/^(?:\(?\s*[Dद4]\s*[\.\)]|\(D\)|\(द\))\s*(.+)$/i);

          if (optAMatch) {
            optA = { text: optAMatch[1], textHindi: optAMatch[1] };
          } else if (optBMatch) {
            optB = { text: optBMatch[1], textHindi: optBMatch[1] };
          } else if (optCMatch) {
            optC = { text: optCMatch[1], textHindi: optCMatch[1] };
          } else if (optDMatch) {
            optD = { text: optDMatch[1], textHindi: optDMatch[1] };
          } else if (!optA.text) {
            // It's part of the question text
            const cleanQ = line.replace(/^(?:Q\.?\s*\d+|प्रश्न\s*\d+|\d+[\.\)])\s*/i, '');
            if (!qHindi) qHindi = cleanQ;
            else qHindi += ' ' + cleanQ;
            qEnglish = qHindi;
          }
        });

        if (qHindi && optA.text && optB.text) {
          questionsList.push({
            id: `q-ingest-${timestamp}-${idx + 1}`,
            uniqueQuestionId: `QID-${authority}-${idx + 1}-${timestamp.toString().slice(-4)}`,
            authority: authority,
            category: authority as ExamCategory,
            subCategory: examName,
            postName: cadre,
            examName: examName,
            year: pypYear,
            subject: subject,
            topic: topic,
            subtopic: subtopic,
            difficulty: 'Medium',
            marks: marksPerQuestion,
            negativeMarks: negativeMarking,
            questionText: qEnglish || qHindi,
            questionHindi: qHindi,
            options: [
              { id: 'A', text: optA.text, textHindi: optA.textHindi },
              { id: 'B', text: optB.text, textHindi: optB.textHindi },
              { id: 'C', text: optC.text || 'Option C', textHindi: optC.textHindi || 'विकल्प C' },
              { id: 'D', text: optD.text || 'Option D', textHindi: optD.textHindi || 'विकल्प D' }
            ],
            correctOption: correctOpt,
            explanation: explanation,
            explanationHindi: explanationHindi || explanation,
          });
        }
      });

      if (questionsList.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'No valid questions parsed. Check format (e.g. 1. Question? (A) Option 1 (B) Option 2 Ans: A).'
        });
        return;
      }

      setParsedQuestions(questionsList);
      setCurrentStep('PREVIEW');
      setStatusMessage({ type: 'success', text: `Successfully parsed ${questionsList.length} questions!` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Parsing failed: ${err.message}` });
    }
  };

  // -------------------------------------------------------------
  // JSON BULK INGESTION & AUTO-VALIDATION
  // -------------------------------------------------------------
  const parseJsonToQuestions = () => {
    setJsonError(null);
    if (!rawJson.trim()) {
      setJsonError('Please paste a JSON array of questions');
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      const items: any[] = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.data || [parsed]);
      
      if (!Array.isArray(items) || items.length === 0) {
        setJsonError('JSON must contain an array of question objects.');
        return;
      }

      const validList: Question[] = items.map((item, idx) => {
        return mapRawJsonToQuestion(item, idx, {
          authority: authority,
          category: authority as ExamCategory,
          examName: examName,
          postName: cadre,
          subCategory: examName,
          year: pypYear,
          subject: contentType === 'CHAPTER_TEST' ? subject : undefined,
          topic: contentType === 'CHAPTER_TEST' ? topic : undefined,
          subtopic: contentType === 'CHAPTER_TEST' ? subtopic : undefined,
          marks: marksPerQuestion,
          negativeMarks: negativeMarking,
          originType: contentType === 'PYP' ? 'pyq' : 'mock',
        });
      });

      setParsedQuestions(validList);
      setCurrentStep('PREVIEW');
      setStatusMessage({ type: 'success', text: `Successfully loaded and normalized ${validList.length} questions from JSON!` });
    } catch (err: any) {
      setJsonError(`Invalid JSON format: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // AI GEMINI QUESTION GENERATION
  // -------------------------------------------------------------
  const generateQuestionsWithAi = async () => {
    if (!aiTopicPrompt.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify a syllabus topic prompt for AI generation.' });
      return;
    }

    setIsGeneratingAi(true);
    setStatusMessage(null);

    try {
      const response = await fetch('/api/ai/generate-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({
          authority: authority,
          examName: examName,
          cadre: cadre,
          subject: subject,
          topic: aiTopicPrompt,
          difficulty: aiDifficulty,
          count: aiQuestionCount,
          language: 'bilingual',
        }),
      });

      if (!response.ok) {
        throw new Error(`AI generation service returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const generatedQs: Question[] = data.questions || [];

      if (generatedQs.length === 0) {
        throw new Error('AI generated 0 valid questions. Please refine topic prompt.');
      }

      // Attach metadata tags
      const taggedList = generatedQs.map((q, idx) => ({
        ...q,
        authority: authority,
        category: authority as ExamCategory,
        subCategory: examName,
        postName: cadre,
        examName: examName,
        subject: subject,
        marks: marksPerQuestion,
        negativeMarks: negativeMarking,
      }));

      setParsedQuestions(taggedList);
      setCurrentStep('PREVIEW');
      setStatusMessage({
        type: 'success',
        text: `Gemini AI generated ${taggedList.length} authentic bilingual questions!`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `AI Generation error: ${err.message}` });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // -------------------------------------------------------------
  // ATOMIC DATABASE PUBLISH & DISPATCH (Direct to Firestore)
  // -------------------------------------------------------------
  const handleAtomicPublish = async () => {
    if (parsedQuestions.length === 0) {
      setStatusMessage({ type: 'error', text: 'No questions to publish!' });
      return;
    }
    if (!targetBundleId) {
      setStatusMessage({
        type: 'error',
        text: 'Select a canonical Test Series before publishing. Create a new recruitment/post/series in Admin → Exam & Recruitment Catalog if needed.'
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const timestamp = Date.now();

      // Phase 7: resolve the canonical Authority → Program → Post → Series
      // before content is persisted. Legacy strings remain populated for
      // backwards compatibility, but new content is anchored by stable IDs.
      const targetBundle = targetBundleId ? allBundles.find(b => b.id === targetBundleId) : undefined;
      const canonical = targetBundle ? await ensureCanonicalHierarchyForBundle(targetBundle) : null;
      const questionsForPublish = parsedQuestions.map(q => ({
        ...q,
        authorityId: canonical?.authority.id,
        programId: canonical?.program.id,
        postId: canonical?.post?.id,
        seriesId: canonical?.series.id,
      }));
      const createdQuestionIds = questionsForPublish.map(q => q.id);

      // 1. Dual-Write all questions directly to Cloud Firestore & backend
      saveQuestionsToFirestore(questionsForPublish).catch(err => {
        console.warn('Firestore bulk question save note:', err);
      });

      const qRes = await fetch('/api/questions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify({ questions: questionsForPublish }),
      });

      if (!qRes.ok) {
        console.warn('Backend bulk API returned warning, continuing with client broadcast.');
      }

      if (onQuestionsIngested) {
        onQuestionsIngested(questionsForPublish);
      }

      let createdMockTestId: string | null = null;
      let createdPypId: string | null = null;

      // 2. If Mock Test or Chapter Test, create MockTest record
      if (contentType === 'MOCK_TEST' || contentType === 'CHAPTER_TEST') {
        const testId = `mock-${authority.toLowerCase()}-${timestamp.toString().slice(-6)}`;
        createdMockTestId = testId;

        const newMockTest: MockTest = {
          id: testId,
          title: testTitle || `${examName} - Mock Test`,
          examName: examName,
          category: authority as ExamCategory,
          authority: authority,
          subCategory: examName,
          postName: cadre,
          description: contentType === 'CHAPTER_TEST' ? `Topic quiz on ${topic}` : `${cadre} full length simulation exam`,
          durationMinutes: durationMinutes,
          totalMarks: questionsForPublish.length * marksPerQuestion,
          marksPerQuestion: marksPerQuestion,
          negativeMarksPerQuestion: negativeMarking,
          questionCount: questionsForPublish.length,
          attemptsCount: 0,
          isPublished: true,
          authorityId: canonical?.authority.id,
          programId: canonical?.program.id,
          postId: canonical?.post?.id,
          seriesId: canonical?.series.id,
          seriesType: contentType === 'CHAPTER_TEST' ? 'chapter_test' : 'full_mock',
          bundleId: targetBundleId || undefined,
          createdAt: new Date().toISOString(),
          sections: [
            {
              id: 'sec-1',
              name: contentType === 'CHAPTER_TEST' ? topic : `${cadre} Core Paper`,
              questionIds: createdQuestionIds,
            },
          ],
        };

        // Direct write to Cloud Firestore
        saveTestToFirestore(newMockTest).catch(err => {
          console.warn('Firestore test save note:', err);
        });

        // Save Mock Test to backend
        await fetch('/api/tests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminHeaders(),
          },
          body: JSON.stringify(newMockTest),
        }).catch(err => console.warn('Mock test API save note:', err));

        if (onMockTestCreated) {
          onMockTestCreated(newMockTest);
        }
      }

      // 3. If PYP, create PreviousYearPaper record
      if (contentType === 'PYP') {
        const pypId = `pyp-${authority.toLowerCase()}-${pypYear}-${timestamp.toString().slice(-4)}`;
        createdPypId = pypId;

        const newPyp: PreviousYearPaper = {
          id: pypId,
          title: testTitle || `${examName} Official Paper (${pypYear})`,
          examName: examName,
          examCategory: authority as ExamCategory,
          authority: authority,
          subCategory: examName,
          postName: cadre,
          year: pypYear,
          totalQuestions: parsedQuestions.length,
          durationMinutes: durationMinutes,
          marks: parsedQuestions.length * marksPerQuestion,
          negativeMarkingRatio: negativeMarking === 0.25 ? '-1/4' : negativeMarking === 0.333 ? '-1/3' : '0',
          paperSummary: `${examName} Official Solved Paper (${pypYear} ${pypShift})`,
          subjectsWeightage: [{ subject: subject || 'General Paper', questionCount: parsedQuestions.length, percentage: 100 }],
          downloadFileName: `${(testTitle || examName).replace(/\s+/g, '_')}_Official.pdf`,
          isOfficialPaper: true,
          linkedQuestionIds: createdQuestionIds,
          authorityId: canonical?.authority.id,
          programId: canonical?.program.id,
          postId: canonical?.post?.id,
          seriesId: canonical?.series.id,
          createdAt: new Date().toISOString(),
        };

        savePypPaperToFirestore(newPyp).catch(err => {
          console.warn('Firestore PYP save note:', err);
        });

        await fetch('/api/pyp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAdminHeaders(),
          },
          body: JSON.stringify(newPyp),
        }).catch(err => console.warn('PYP API save note:', err));

        if (onPypCreated) {
          onPypCreated(newPyp);
        }
      }

      // 4. If Target Test Series Bundle is selected, link and update Bundle
      if (targetBundleId) {
        const bundle = allBundles.find(b => b.id === targetBundleId);
        if (bundle) {
          const updatedBundle: TestSeriesBundle = {
            ...bundle,
            authorityId: canonical?.authority.id || bundle.authorityId,
            programId: canonical?.program.id || bundle.programId,
            postId: canonical?.post?.id || bundle.postId,
            seriesType: canonical?.series.seriesType || bundle.seriesType,
            totalTestsCount: (bundle.totalTestsCount || 0) + 1,
            testItems: [
              ...(bundle.testItems || []),
              {
                id: createdMockTestId || createdPypId || `test-${timestamp}`,
                title: testTitle,
                titleHindi: testTitle,
                type: contentType === 'PYP' ? 'pyp' : contentType === 'CHAPTER_TEST' ? 'sectional' : 'full_mock',
                questionCount: parsedQuestions.length,
                durationMinutes: durationMinutes,
                marks: parsedQuestions.length * marksPerQuestion,
                isFreePreview: accessTier === 'free',
                attemptsCount: 0,
              },
            ],
          };

          saveSingleBundle(updatedBundle);
          if (onBundleUpdated) {
            onBundleUpdated(updatedBundle);
          }
        }
      }

      setStatusMessage({
        type: 'success',
        text: `🚀 Successfully published ${questionsForPublish.length} questions and created ${contentType}!`,
      });

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Publishing failed: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to edit option in preview
  const handleOptionChange = (qIndex: number, optId: string, newText: string) => {
    setParsedQuestions(prev => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      q.options = q.options.map(opt => (opt.id === optId ? { ...opt, text: newText, textHindi: newText } : opt));
      next[qIndex] = q;
      return next;
    });
  };

  const handleCorrectOptionChange = (qIndex: number, optId: 'A' | 'B' | 'C' | 'D') => {
    setParsedQuestions(prev => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], correctOption: optId };
      return next;
    });
  };

  const handleDeletePreviewQuestion = (qIndex: number) => {
    setParsedQuestions(prev => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleDuplicateQuestion = (qIndex: number) => {
    setParsedQuestions(prev => {
      const target = prev[qIndex];
      if (!target) return prev;
      const clone: Question = {
        ...target,
        id: `q-dup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        uniqueQuestionId: `QID-${authority}-${prev.length + 1}-${Date.now().toString().slice(-4)}`,
        options: target.options.map(o => ({ ...o })),
      };
      const next = [...prev];
      next.splice(qIndex + 1, 0, clone);
      return next;
    });
    setStatusMessage({ type: 'success', text: `Question #${qIndex + 1} duplicated!` });
  };

  const handleAddNewQuestion = () => {
    const newIdx = parsedQuestions.length + 1;
    const newQ: Question = {
      id: `q-manual-${Date.now()}`,
      uniqueQuestionId: `QID-${authority}-${newIdx}-${Date.now().toString().slice(-4)}`,
      authority: authority,
      category: authority as ExamCategory,
      subCategory: examName,
      postName: cadre,
      examName: examName,
      year: pypYear,
      subject: subject || 'General Knowledge',
      topic: topic || 'Important Topics',
      difficulty: 'Medium',
      marks: marksPerQuestion,
      negativeMarks: negativeMarking,
      questionText: 'New Question Title in English',
      questionHindi: 'नया प्रश्न शीर्षक (हिंदी में)',
      options: [
        { id: 'A', text: 'Option A', textHindi: 'विकल्प A' },
        { id: 'B', text: 'Option B', textHindi: 'विकल्प B' },
        { id: 'C', text: 'Option C', textHindi: 'विकल्प C' },
        { id: 'D', text: 'Option D', textHindi: 'विकल्प D' },
      ],
      correctOption: 'A',
      explanation: 'Explanation for correct answer',
      explanationHindi: 'सही उत्तर का विस्तृत स्पष्टीकरण',
    };
    setParsedQuestions(prev => [...prev, newQ]);
    setEditingQuestionModalIndex(parsedQuestions.length);
  };

  const handleQuestionFieldChange = (qIndex: number, field: keyof Question, value: any) => {
    setParsedQuestions(prev => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], [field]: value };
      return next;
    });
  };

  const handleSimulateOptionSelect = (qId: string, optKey: string) => {
    setSimulatedAnswers(prev => ({
      ...prev,
      [qId]: optKey,
    }));
  };

  const handleToggleExplanation = (qId: string) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-indigo-900/60 rounded-2xl shadow-2xl shadow-black/90 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-indigo-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-tight">Universal Ingestion Studio</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.5 Master Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ingest from Text/PDF, JSON, or Gemini AI into Mocks, PYPs, Chapter Tests & Bundles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WORKFLOW STEP INDICATOR */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-semibold text-slate-400">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentStep('METADATA')}
              className={`flex items-center space-x-1.5 transition ${
                currentStep === 'METADATA' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>1. Exam & Target Setup</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button
              onClick={() => setCurrentStep('INPUT')}
              className={`flex items-center space-x-1.5 transition ${
                currentStep === 'INPUT' ? 'text-indigo-400 font-bold' : 'hover:text-slate-200'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>2. Ingest Content</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <button
              onClick={() => parsedQuestions.length > 0 && setCurrentStep('PREVIEW')}
              disabled={parsedQuestions.length === 0}
              className={`flex items-center space-x-1.5 transition ${
                currentStep === 'PREVIEW'
                  ? 'text-indigo-400 font-bold'
                  : parsedQuestions.length > 0
                  ? 'hover:text-slate-200'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>3. Live Preview & Publish ({parsedQuestions.length})</span>
            </button>
          </div>

          {/* Status Message Banner */}
          {statusMessage && (
            <div
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* STEP BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* STEP 1: METADATA SETUP */}
          {currentStep === 'METADATA' && (
            <div className="space-y-6">
              {/* Content Type Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Select Target Content Type {!lockType && '(Click to switch)'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'MOCK_TEST', label: 'Full Mock Test', desc: 'Simulated timed full-length test', icon: Layers },
                    { id: 'PYP', label: 'Previous Year Paper', desc: 'Official solved question paper', icon: Calendar },
                    { id: 'CHAPTER_TEST', label: 'Chapter Test', desc: 'Topic-wise practice module', icon: BookOpen },
                    { id: 'QUESTION_BANK', label: 'Question Bank', desc: 'Raw master question pool', icon: FileText },
                  ].map(t => {
                    const Icon = t.icon;
                    const isSelected = contentType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={lockType && !isSelected}
                        onClick={() => setContentType(t.id as IngestionContentType)}
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                            : lockType
                            ? 'opacity-40 bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{t.label}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Canonical hierarchy — single source of truth */}
              <CanonicalIngestionSelector
                authority={authority}
                examName={examName}
                cadre={cadre}
                targetBundleId={targetBundleId}
                onChange={({ authority: nextAuthority, examName: nextExamName, cadre: nextCadre, targetBundleId: nextSeriesId }) => {
                  setAuthority(nextAuthority);
                  setExamName(nextExamName);
                  setCadre(nextCadre);
                  setTargetBundleId(nextSeriesId);
                }}
              />

              {/* Test details — series is selected only through the canonical hierarchy */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Test Display Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  placeholder="e.g. Assistant Teacher 2026 — Full Mock 01"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
                <div className="text-[11px] text-slate-500 mt-2">
                  The selected Test Series is the canonical destination. Standalone bundle assignment is no longer supported by the ingestion workflow.
                </div>
              </div>

              {/* Specifics based on Content Type */}
              {contentType === 'CHAPTER_TEST' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-900/40">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-300 mb-1">Subject</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-300 mb-1">Topic</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-300 mb-1">Subtopic</label>
                    <input
                      type="text"
                      value={subtopic}
                      onChange={e => setSubtopic(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {contentType === 'PYP' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-950/30 p-3.5 rounded-xl border border-amber-900/40">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-300 mb-1">Official Exam Year</label>
                    <input
                      type="number"
                      value={pypYear}
                      onChange={e => setPypYear(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-300 mb-1">Official Shift</label>
                    <input
                      type="text"
                      value={pypShift}
                      onChange={e => setPypShift(e.target.value)}
                      placeholder="e.g. Shift 1 (Morning)"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Rules & Access Configuration */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Marks / Question</label>
                  <input
                    type="number"
                    step="0.5"
                    value={marksPerQuestion}
                    onChange={e => setMarksPerQuestion(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Negative Penalty</label>
                  <select
                    value={negativeMarking}
                    onChange={e => setNegativeMarking(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value={0.25}>-0.25 (1/4th - CG Vyapam)</option>
                    <option value={0.333}>-0.33 (1/3rd - CGPSC / SSC)</option>
                    <option value={0}>0.00 (No Negative Marking)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Access Tier</label>
                  <select
                    value={accessTier}
                    onChange={e => setAccessTier(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="paid">🔒 Bundle VIP / Pass</option>
                    <option value="free">🎁 Free Demo Test</option>
                    <option value="live">🏆 Live Statewide Test</option>
                  </select>
                </div>
              </div>

              {/* Next Step Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('INPUT')}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition"
                >
                  <span>Continue to Content Ingestion</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INGESTION INPUT METHODS */}
          {currentStep === 'INPUT' && (
            <div className="space-y-4">
              {/* Method Switcher Tabs */}
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                {[
                  { id: 'SMART_PASTE', label: '📄 Smart Text / PDF / OCR Paste', desc: 'Auto-extracts Hindi & English MCQs' },
                  { id: 'JSON_EDITOR', label: '💻 JSON Bulk Editor', desc: 'Direct raw JSON array import' },
                  { id: 'AI_GEMINI', label: '🪄 Gemini AI Generator', desc: 'Auto-generate on any CG syllabus topic' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as IngestionInputTab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB 1: SMART TEXT / PDF PARSER */}
              {activeTab === 'SMART_PASTE' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={textFileInputRef}
                    accept=".txt,.pdf,.docx,.doc,text/plain"
                    onChange={handleTextFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>Paste raw text with questions, options (A,B,C,D or अ,ब,स,द), and answer keys:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => textFileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 flex items-center space-x-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Browse Text / PDF File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRawText(
                            `1. छत्तीसगढ़ राज्य में 'कलचुरि वंश' की कुलदेवी कौन थीं?\n(A) महामाया देवी\n(B) दंतेश्वरी माई\n(C) बम्लेश्वरी देवी\n(D) चंद्रहासिनी देवी\nAns: A\nव्याख्या: कलचुरि शासकों की कुलदेवी मां महामाया थीं जिनका प्रमुख मंदिर रतनपुर में स्थित है。\n\n2. शिक्षा का अधिकार अधिनियम (RTE) किस वर्ष लागू हुआ था?\n(A) 2005\n(B) 2009\n(C) 2010\n(D) 2012\nAns: C\nExplanation: RTE अधिनियम 1 अप्रैल 2010 से संपूर्ण भारत में प्रभावी हुआ था।`
                          )
                        }
                        className="text-indigo-400 hover:underline font-mono text-[11px]"
                      >
                        Load Sample Hindi Text
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={12}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder={`1. छत्तीसगढ़ का पहला शक्कर कारखाना कहां स्थापित हुआ?\n(A) कवर्धा (भोरमदेव)\n(B) धमतरी\n(C) बालोद\n(D) पेंड्रा\nउत्तर: A\nस्पष्टीकरण: भोरमदेव सहकारी शक्कर उत्पादक कारखाना कबीरधाम जिले में 2003 में स्थापित किया गया था।`}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none leading-relaxed"
                  />
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('METADATA')}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg cursor-pointer"
                    >
                      Back to Setup
                    </button>
                    <button
                      type="button"
                      onClick={parseRawTextToQuestions}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Parse Questions to Live Preview</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: JSON BULK EDITOR */}
              {activeTab === 'JSON_EDITOR' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={jsonFileInputRef}
                    accept=".json,application/json"
                    onChange={handleJsonFileUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span>Paste raw JSON array of questions or upload file:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => jsonFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                        <span>📁 Choose / Upload .JSON File</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRawJson(
                            JSON.stringify(
                              [
                                {
                                  questionHindi: "छत्तीसगढ़ की सबसे लंबी नदी कौन सी है?",
                                  questionText: "Which is the longest river flowing in Chhattisgarh?",
                                  options: [
                                    { id: "A", text: "Mahanadi", textHindi: "महानदी (286 किमी राज्य में)" },
                                    { id: "B", text: "Shivnath", textHindi: "शिवनाथ नदी (290 किमी)" },
                                    { id: "C", text: "Indravati", textHindi: "इंद्रावती नदी" },
                                    { id: "D", text: "Hasdeo", textHindi: "हसदेव नदी" }
                                  ],
                                  correctOption: "B",
                                  explanationHindi: "शिवनाथ नदी छत्तीसगढ़ में बहने वाली सबसे लंबी नदी (290 किमी) है, जबकि महानदी का राज्य में बहाव 286 किमी है।"
                                }
                              ],
                              null,
                              2
                            )
                          )
                        }
                        className="text-indigo-400 hover:underline font-mono text-[11px]"
                      >
                        Load Sample JSON
                      </button>
                    </div>
                  </div>

                  {uploadedFileName && (
                    <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs flex items-center justify-between text-indigo-200">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span>Active File: <strong>{uploadedFileName}</strong></span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded font-mono text-indigo-300">
                        {rawJson.length > 0 ? `${(rawJson.length / 1024).toFixed(1)} KB` : ''}
                      </span>
                    </div>
                  )}

                  <textarea
                    rows={12}
                    value={rawJson}
                    onChange={e => setRawJson(e.target.value)}
                    placeholder="[ { questionHindi: '...', options: [...], correctOption: 'A' } ]"
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:border-indigo-500 focus:outline-none leading-relaxed"
                  />
                  {jsonError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{jsonError}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('METADATA')}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg cursor-pointer"
                    >
                      Back to Setup
                    </button>
                    <button
                      type="button"
                      onClick={parseJsonToQuestions}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                    >
                      <Code2 className="w-4 h-4" />
                      <span>Validate & Send to Preview</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: GEMINI AI GENERATOR */}
              {activeTab === 'AI_GEMINI' && (
                <div className="space-y-4 bg-indigo-950/20 p-4 rounded-xl border border-indigo-900/40">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-300 mb-1.5">
                      Syllabus Topic & Generation Prompt
                    </label>
                    <textarea
                      rows={4}
                      value={aiTopicPrompt}
                      onChange={e => setAiTopicPrompt(e.target.value)}
                      placeholder="e.g. Generate MCQs on CG Geography (Mahanadi Drainage System) with authentic CGPSC style questions in Hindi"
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Question Count</label>
                      <select
                        value={aiQuestionCount}
                        onChange={e => setAiQuestionCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value={5}>5 Questions (Rapid Sample)</option>
                        <option value={10}>10 Questions (Sectional)</option>
                        <option value={15}>15 Questions (Standard Batch)</option>
                        <option value={25}>25 Questions (Deep Topic)</option>
                        <option value={50}>50 Questions (Full Paper Section)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                      <select
                        value={aiDifficulty}
                        onChange={e => setAiDifficulty(e.target.value as DifficultyLevel)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="Easy">Easy (Foundation / Basic Facts)</option>
                        <option value="Medium">Medium (Standard CGSSB Vyapam)</option>
                        <option value="Hard">Hard (CGPSC Prelims Analytical)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('METADATA')}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg"
                    >
                      Back to Setup
                    </button>
                    <button
                      type="button"
                      disabled={isGeneratingAi}
                      onClick={generateQuestionsWithAi}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
                    >
                      {isGeneratingAi ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating with Gemini AI...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate {aiQuestionCount} Authentic Questions</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: LIVE PREVIEW & 1-CLICK ATOMIC PUBLISH */}
          {currentStep === 'PREVIEW' && (
            <div className="space-y-4">
              {/* Summary & View Sub-Mode Switcher */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs">
                    {contentType}
                  </span>
                  <span className="font-semibold text-white text-xs">{testTitle}</span>
                  <span className="text-slate-400 text-xs">({parsedQuestions.length} Questions)</span>
                  {targetBundleId && (
                    <span className="inline-flex items-center space-x-1 text-amber-400 font-medium text-xs bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Crown className="w-3 h-3" />
                      <span>Linked to Bundle</span>
                    </span>
                  )}
                </div>

                {/* Sub-Mode Segmented Controller */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-stretch md:self-auto justify-center">
                  <button
                    type="button"
                    onClick={() => setPreviewSubMode('EDITOR')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      previewSubMode === 'EDITOR'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Questions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewSubMode('LIVE_CARD')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      previewSubMode === 'LIVE_CARD'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>⚡ Live Card Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewSubMode('BUNDLE_CARD')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                      previewSubMode === 'BUNDLE_CARD'
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>🎴 Test Card Preview</span>
                  </button>
                </div>
              </div>

              {/* Quick Toolbar (Search, Filter, Language, Add Question) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[150px]">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={previewSearch}
                      onChange={e => setPreviewSearch(e.target.value)}
                      placeholder="Search questions, subject, topic..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Difficulty Filter */}
                  <select
                    value={filterDifficulty}
                    onChange={e => setFilterDifficulty(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>

                  {/* Language Selector */}
                  <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewLanguage('bilingual')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                        previewLanguage === 'bilingual' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Bilingual
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLanguage('hi')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                        previewLanguage === 'hi' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      हिंदी
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLanguage('en')}
                      className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                        previewLanguage === 'en' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {previewSubMode === 'LIVE_CARD' && (
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => setLiveDisplayLayout('list')}
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          liveDisplayLayout === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All Cards
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveDisplayLayout('single')}
                        className={`px-2 py-1 rounded text-[11px] font-bold ${
                          liveDisplayLayout === 'single' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Single Simulator
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddNewQuestion}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW 1: EDIT & REVIEW MODE */}
              {/* ------------------------------------------------------------- */}
              {previewSubMode === 'EDITOR' && (
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredPreviewQuestions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                      No questions match the filter criteria.
                    </div>
                  ) : (
                    filteredPreviewQuestions.map((q, filteredIdx) => {
                      const realIndex = parsedQuestions.findIndex(x => x.id === q.id);
                      const qIndex = realIndex !== -1 ? realIndex : filteredIdx;

                      return (
                        <div
                          key={q.id || qIndex}
                          className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-3"
                        >
                          {/* Card Top Meta & Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-900">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold text-xs flex items-center justify-center">
                                {qIndex + 1}
                              </span>
                              <input
                                type="text"
                                value={q.subject || ''}
                                onChange={e => handleQuestionFieldChange(qIndex, 'subject', e.target.value)}
                                placeholder="Subject"
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-300 w-32 focus:outline-none focus:border-indigo-500"
                              />
                              <input
                                type="text"
                                value={q.topic || ''}
                                onChange={e => handleQuestionFieldChange(qIndex, 'topic', e.target.value)}
                                placeholder="Topic"
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-300 w-32 focus:outline-none focus:border-indigo-500"
                              />
                              <select
                                value={q.difficulty || 'Medium'}
                                onChange={e => handleQuestionFieldChange(qIndex, 'difficulty', e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-bold text-amber-400 focus:outline-none"
                              >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                              </select>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingQuestionModalIndex(qIndex)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs flex items-center space-x-1"
                                title="Full modal editor"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px]">Full Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDuplicateQuestion(qIndex)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                                title="Duplicate question"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePreviewQuestion(qIndex)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition"
                                title="Remove question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Editable Question Text (Hindi & English) */}
                          <div className="space-y-2">
                            {(previewLanguage === 'bilingual' || previewLanguage === 'hi') && (
                              <div>
                                <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-0.5">
                                  Question (हिंदी)
                                </label>
                                <textarea
                                  rows={2}
                                  value={q.questionHindi || ''}
                                  onChange={e => handleQuestionFieldChange(qIndex, 'questionHindi', e.target.value)}
                                  className="w-full p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white font-medium focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            )}

                            {(previewLanguage === 'bilingual' || previewLanguage === 'en') && (
                              <div>
                                <label className="block text-[10px] font-bold text-sky-400 uppercase mb-0.5">
                                  Question (English)
                                </label>
                                <textarea
                                  rows={2}
                                  value={q.questionText || ''}
                                  onChange={e => handleQuestionFieldChange(qIndex, 'questionText', e.target.value)}
                                  className="w-full p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white font-medium focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>

                          {/* Editable Options Grid with 1-Click Correct Answer Toggle */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">
                              Options (Click badge to mark correct answer):
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, oIdx) => {
                                const optKey = (['A', 'B', 'C', 'D'][oIdx] || 'A') as 'A' | 'B' | 'C' | 'D';
                                const isCorrect = q.correctOption === optKey;
                                return (
                                  <div
                                    key={optKey}
                                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs transition ${
                                      isCorrect
                                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleCorrectOptionChange(qIndex, optKey)}
                                      className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 transition cursor-pointer ${
                                        isCorrect
                                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-105'
                                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                                      }`}
                                      title="Click to set as correct answer"
                                    >
                                      {optKey}
                                    </button>
                                    <div className="flex-1 space-y-1">
                                      <input
                                        type="text"
                                        value={opt.textHindi || opt.text || ''}
                                        onChange={e => handleOptionChange(qIndex, opt.id || optKey, e.target.value)}
                                        placeholder={`Option ${optKey}`}
                                        className="w-full bg-transparent text-xs text-white focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Explanation Input */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                              Explanation / व्याख्या:
                            </label>
                            <input
                              type="text"
                              value={q.explanationHindi || q.explanation || ''}
                              onChange={e => {
                                handleQuestionFieldChange(qIndex, 'explanationHindi', e.target.value);
                                handleQuestionFieldChange(qIndex, 'explanation', e.target.value);
                              }}
                              placeholder="Add explanation for candidate review..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW 2: STUDENT LIVE CARD PREVIEW (Realistic Simulator) */}
              {/* ------------------------------------------------------------- */}
              {previewSubMode === 'LIVE_CARD' && (
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                  {liveDisplayLayout === 'single' ? (
                    // Single Question Simulator Card with Next/Prev
                    <div>
                      {(() => {
                        const currentIdx = Math.min(activeLiveCardIndex, Math.max(0, parsedQuestions.length - 1));
                        const q = parsedQuestions[currentIdx];
                        if (!q) return <div className="p-6 text-center text-xs text-slate-400">No questions to preview</div>;

                        const selectedOpt = simulatedAnswers[q.id];
                        const showExp = expandedExplanations[q.id];

                        return (
                          <div className="space-y-4">
                            {/* Simulator Navigation Bar */}
                            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-indigo-400 font-mono">
                                  Question {currentIdx + 1} of {parsedQuestions.length}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-semibold">
                                  {q.subject}
                                </span>
                                {q.topic && (
                                  <span className="text-[11px] text-slate-400 hidden sm:inline">• {q.topic}</span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  disabled={currentIdx === 0}
                                  onClick={() => setActiveLiveCardIndex(prev => Math.max(0, prev - 1))}
                                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                                >
                                  Prev
                                </button>
                                <button
                                  type="button"
                                  disabled={currentIdx === parsedQuestions.length - 1}
                                  onClick={() => setActiveLiveCardIndex(prev => Math.min(parsedQuestions.length - 1, prev + 1))}
                                  className="px-3 py-1 rounded-lg bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-30 cursor-pointer"
                                >
                                  Next
                                </button>
                              </div>
                            </div>

                            {/* Question Action Bar */}
                            <div className="flex items-center justify-between px-1">
                              <div className="flex items-center space-x-2 text-xs">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  +{q.marks || marksPerQuestion} Marks
                                </span>
                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                                  -{q.negativeMarks || negativeMarking} Negative
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleExplanation(q.id)}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{showExp ? 'Hide Solution' : 'Reveal Solution & Key'}</span>
                              </button>
                            </div>

                            {/* Full Production QuestionRenderer */}
                            <div className="bg-slate-950/90 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl">
                              <QuestionRenderer
                                question={q}
                                selectedOption={selectedOpt || null}
                                onSelectOption={(opt) => handleSimulateOptionSelect(q.id, opt)}
                                showSolution={Boolean(showExp)}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    // All Cards Grid in Live View
                    <div className="space-y-6">
                      {filteredPreviewQuestions.map((q, idx) => {
                        const selectedOpt = simulatedAnswers[q.id];
                        const showExp = expandedExplanations[q.id];

                        return (
                          <div
                            key={q.id || idx}
                            className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 space-y-4 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                              <div className="flex items-center space-x-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-black text-xs font-mono">
                                  Q{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-slate-200">{q.subject}</span>
                                {q.topic && <span className="text-xs text-slate-400 font-medium">• {q.topic}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleExplanation(q.id)}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{showExp ? 'Hide Solution' : 'Show Solution'}</span>
                              </button>
                            </div>

                            <QuestionRenderer
                              question={q}
                              selectedOption={selectedOpt || null}
                              onSelectOption={(opt) => handleSimulateOptionSelect(q.id, opt)}
                              showSolution={Boolean(showExp)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SUB-VIEW 3: TEST & BUNDLE CARD LIVE PREVIEW */}
              {/* ------------------------------------------------------------- */}
              {previewSubMode === 'BUNDLE_CARD' && (
                <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Live Mock Test / PYP Card as rendered in Catalog */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 uppercase tracking-wider">
                          Live Portal Test Card
                        </span>
                        <span className="text-[11px] text-amber-400 font-bold">
                          {accessTier === 'free' ? '🟢 Free Preview' : '🔒 Pro Pass'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-black text-white text-base leading-snug">{testTitle}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {authority} • {examName} • {cadre}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-center">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Questions</span>
                          <span className="text-sm font-black text-white">{parsedQuestions.length} Qs</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Duration</span>
                          <span className="text-sm font-black text-indigo-400">{durationMinutes} Min</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-bold">Marks</span>
                          <span className="text-sm font-black text-emerald-400">{parsedQuestions.length * marksPerQuestion}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="text-slate-400">Negative Penalty: -{negativeMarking}</span>
                        <button
                          type="button"
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Start Mock Test</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Bundle Pass Card */}
                    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 uppercase tracking-wider flex items-center space-x-1">
                          <Crown className="w-3 h-3" />
                          <span>Test Series Bundle</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-400">₹199 All-Access</span>
                      </div>

                      <div>
                        <h4 className="font-black text-white text-base">
                          {examName} (Master Test Series)
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Includes full mocks, official previous papers, chapter tests & leaderboards.
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-1.5">
                        <div className="text-indigo-300 font-bold flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Incoming test added to bundle playlist</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">
                          Target Bundle: {allBundles.find(b => b.id === targetBundleId)?.title || 'Direct Exam Pool'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="text-emerald-400 font-bold">✓ Full Bilingual Solutions</span>
                        <span className="text-xs text-slate-400">Instant AI Analytics</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep('INPUT')}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  ← Ingest More Questions
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || parsedQuestions.length === 0}
                  onClick={handleAtomicPublish}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Writing to Cloud Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Publish {parsedQuestions.length} Questions in 1-Click</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* QUESTION FULL-EDIT MODAL (When individual edit is triggered) */}
          {editingQuestionModalIndex !== null && parsedQuestions[editingQuestionModalIndex] && (
            <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-xs">
                      #{editingQuestionModalIndex + 1}
                    </div>
                    <h3 className="text-base font-black text-white">Edit Question Details</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingQuestionModalIndex(null)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-3 text-xs">
                  {/* Type and Classification */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Question Type</label>
                      <select
                        value={parsedQuestions[editingQuestionModalIndex].questionType || parsedQuestions[editingQuestionModalIndex].type || 'mcq'}
                        onChange={e => {
                          const newType = e.target.value as QuestionType;
                          handleQuestionFieldChange(editingQuestionModalIndex, 'questionType', newType);
                          handleQuestionFieldChange(editingQuestionModalIndex, 'type', newType);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="mcq">Standard MCQ</option>
                        <option value="assertion_reason">Assertion & Reason (कथन व कारण)</option>
                        <option value="matching">Matching (सूची - I व सूची - II)</option>
                        <option value="multi_statement">Multi-Statement (कथन 1, 2, 3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Subject Category</label>
                      <select
                        value={parsedQuestions[editingQuestionModalIndex].subjectCategory || 'non_language'}
                        onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'subjectCategory', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="non_language">Non-Language (General Studies / Math)</option>
                        <option value="language">Language (English / Hindi / CG Language)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Language Mode</label>
                      <select
                        value={parsedQuestions[editingQuestionModalIndex].questionLanguage || 'both'}
                        onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'questionLanguage', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="both">Bilingual (Hindi + English)</option>
                        <option value="hi">Hindi Only</option>
                        <option value="en">English Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Question Stem (Hindi)</label>
                    <textarea
                      rows={2}
                      value={parsedQuestions[editingQuestionModalIndex].questionHindi || ''}
                      onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'questionHindi', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Question Stem (English)</label>
                    <textarea
                      rows={2}
                      value={parsedQuestions[editingQuestionModalIndex].questionText || parsedQuestions[editingQuestionModalIndex].question || ''}
                      onChange={e => {
                        handleQuestionFieldChange(editingQuestionModalIndex, 'questionText', e.target.value);
                        handleQuestionFieldChange(editingQuestionModalIndex, 'question', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Assertion & Reason Specific Fields */}
                  {(parsedQuestions[editingQuestionModalIndex].questionType === 'assertion_reason' || parsedQuestions[editingQuestionModalIndex].type === 'assertion_reason') && (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2.5">
                      <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider block">
                        Assertion & Reason Components
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-amber-400 mb-0.5">Assertion [A] (English)</label>
                          <textarea
                            rows={2}
                            value={parsedQuestions[editingQuestionModalIndex].assertion || ''}
                            onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'assertion', e.target.value)}
                            placeholder="Assertion statement..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-amber-400 mb-0.5">अभिकथन [A] (हिंदी)</label>
                          <textarea
                            rows={2}
                            value={parsedQuestions[editingQuestionModalIndex].assertionHindi || ''}
                            onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'assertionHindi', e.target.value)}
                            placeholder="अभिकथन वाक्य..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-cyan-400 mb-0.5">Reason [R] (English)</label>
                          <textarea
                            rows={2}
                            value={parsedQuestions[editingQuestionModalIndex].reason || ''}
                            onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'reason', e.target.value)}
                            placeholder="Reason statement..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-cyan-400 mb-0.5">कारण [R] (हिंदी)</label>
                          <textarea
                            rows={2}
                            value={parsedQuestions[editingQuestionModalIndex].reasonHindi || ''}
                            onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'reasonHindi', e.target.value)}
                            placeholder="कारण वाक्य..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2">
                    <label className="block text-slate-300 font-bold">Options & Correct Answer</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {parsedQuestions[editingQuestionModalIndex].options.map((opt, oIdx) => {
                        const optKey = (['A', 'B', 'C', 'D'][oIdx] || 'A') as 'A' | 'B' | 'C' | 'D';
                        const isCorrect = parsedQuestions[editingQuestionModalIndex].correctOption === optKey;

                        return (
                          <div
                            key={optKey}
                            className={`p-2.5 rounded-xl border flex items-center space-x-2 ${
                              isCorrect ? 'bg-emerald-950/40 border-emerald-500' : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleCorrectOptionChange(editingQuestionModalIndex, optKey)}
                              className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                                isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {optKey}
                            </button>
                            <input
                              type="text"
                              value={opt.textHindi || opt.text || ''}
                              onChange={e => handleOptionChange(editingQuestionModalIndex, opt.id || optKey, e.target.value)}
                              placeholder={`Option ${optKey}`}
                              className="w-full bg-transparent text-xs text-white focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Explanation (व्याख्या)</label>
                    <textarea
                      rows={2}
                      value={parsedQuestions[editingQuestionModalIndex].explanationHindi || parsedQuestions[editingQuestionModalIndex].explanation || ''}
                      onChange={e => {
                        handleQuestionFieldChange(editingQuestionModalIndex, 'explanationHindi', e.target.value);
                        handleQuestionFieldChange(editingQuestionModalIndex, 'explanation', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Subject</label>
                      <input
                        type="text"
                        value={parsedQuestions[editingQuestionModalIndex].subject || ''}
                        onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'subject', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Topic</label>
                      <input
                        type="text"
                        value={parsedQuestions[editingQuestionModalIndex].topic || ''}
                        onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'topic', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Difficulty</label>
                      <select
                        value={parsedQuestions[editingQuestionModalIndex].difficulty || 'Medium'}
                        onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'difficulty', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Marks (+/-)</label>
                      <input
                        type="number"
                        step="0.25"
                        value={parsedQuestions[editingQuestionModalIndex].marks || marksPerQuestion}
                        onChange={e => handleQuestionFieldChange(editingQuestionModalIndex, 'marks', Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingQuestionModalIndex(null)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
                  >
                    Done Editing
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
