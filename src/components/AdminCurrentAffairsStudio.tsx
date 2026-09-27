/**
 * Admin Current Affairs Studio Component (Phase 3.3 AI Production Engine Integration)
 * Integrated with automated AI research, editorial synthesis, 50-question generation,
 * QC validation, and draft/preview/publish lifecycle.
 */

import React, { useState, useEffect } from 'react';
import {
  Globe,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Save,
  Check,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FolderPlus,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Send,
  XCircle,
  RotateCcw,
  Upload,
  Bot
} from 'lucide-react';
import {
  CurrentAffairSource,
  CurrentAffairTopic,
  CurrentAffairsQuestion,
  DailyEdition,
  ContentStatus
} from '../types/currentAffairs';
import {
  fetchAllCurrentAffairsSources,
  saveCurrentAffairsSource,
  fetchTopicsFiltered,
  saveCurrentAffairsTopic,
  fetchQuestionsForTopic,
  saveCurrentAffairsQuestion,
  saveDailyEdition,
  deleteCurrentAffairsTopic,
  deleteCurrentAffairsQuestion
} from '../utils/currentAffairsRepository';
import {
  validateSource,
  validateTopic,
  validateQuestion,
  QCResult
} from '../utils/currentAffairsQC';
import { QuestionRenderer } from './QuestionRenderer';
import { Question, QuestionType, QuestionOption, DifficultyLevel, ExamCategory } from '../types';
import { mapRawJsonToQuestion } from '../utils/jsonQuestionMapper';
import { CG_MASTER_SYLLABUS } from '../data/cgMasterSyllabus';
import { generateAICurrentAffairsPackage, AIGenerationOptions } from '../utils/currentAffairsAI';

export const AdminCurrentAffairsStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'sources' | 'questions' | 'ingest' | 'ai-engine' | 'quiz-creator'>('ai-engine');
  
  // Data States
  const [sources, setSources] = useState<CurrentAffairSource[]>([]);
  const [topics, setTopics] = useState<CurrentAffairTopic[]>([]);
  const [questions, setQuestions] = useState<CurrentAffairsQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters for Posts
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Editor States
  const [editingSource, setEditingSource] = useState<CurrentAffairSource | null>(null);
  const [editingTopic, setEditingTopic] = useState<CurrentAffairTopic | null>(null);
  const [editingQuizQuestionsTopic, setEditingQuizQuestionsTopic] = useState<CurrentAffairTopic | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<CurrentAffairsQuestion | null>(null);
  const [previewTopic, setPreviewTopic] = useState<CurrentAffairTopic | null>(null);
  const [viewMode, setViewMode] = useState<'studio' | 'preview'>('studio');
  const [activeEditTab, setActiveEditTab] = useState<'general' | 'editorial' | 'syllabus' | 'questions'>('general');
  const [quizSearch, setQuizSearch] = useState('');
  const [quizDiffFilter, setQuizDiffFilter] = useState('ALL');
  const [quizLang, setQuizLang] = useState<'bilingual' | 'hi' | 'en'>('bilingual');

  // Helpers for safe array handling
  const ensureArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  const normalizeTopic = (t: CurrentAffairTopic | null): CurrentAffairTopic | null => {
    if (!t) return null;
    return {
      ...t,
      subjects: ensureArray(t.subjects),
      syllabusMapping: ensureArray(t.syllabusMapping),
      keywords: ensureArray(t.keywords),
      tags: ensureArray(t.tags),
      exams: ensureArray(t.exams) as ExamCategory[],
      examAngle: {
        ...t.examAngle,
        keyFacts: ensureArray(t.examAngle?.keyFacts),
        examTakeaways: ensureArray(t.examAngle?.examTakeaways),
        importantTerms: ensureArray(t.examAngle?.importantTerms),
      }
    };
  };

  // QC Validation Report state
  const [qcReport, setQcReport] = useState<QCResult | null>(null);

  // Preview Quiz Interaction State
  const [simulatedAnswers, setSimulatedAnswers] = useState<Record<string, string>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // One-Click JSON Ingestion State
  const [oneClickJson, setOneClickJson] = useState('');
  const [ingestionLog, setIngestionLog] = useState<string | null>(null);

  // AI Generation Engine State
  const [aiRunning, setAiRunning] = useState(false);
  const [aiGenerationDate, setAiGenerationDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiRegionScope, setAiRegionScope] = useState<'all' | 'chhattisgarh' | 'national'>('all');
  const [aiExamFocus, setAiExamFocus] = useState<'CGPSC' | 'CGSSB' | 'UPSC' | 'Combined'>('Combined');
  const [aiLanguage, setAiLanguage] = useState<'bilingual' | 'en' | 'hi'>('bilingual');
  const [aiLastRunStats, setAiLastRunStats] = useState<{
    timestamp: string;
    topicsCount: number;
    questionsCount: number;
    cgCount: number;
    natCount: number;
    qcPassed: boolean;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const allSources = await fetchAllCurrentAffairsSources();
      const allTopics = await fetchTopicsFiltered();
      setSources(allSources);
      setTopics(allTopics);

      let allQuestions: CurrentAffairsQuestion[] = [];
      for (const t of allTopics) {
        const tQs = await fetchQuestionsForTopic(t.id);
        allQuestions = [...allQuestions, ...tQs];
      }
      setQuestions(allQuestions);
    } catch (err) {
      console.warn('Error loading CA admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Posts (Topics)
  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) || t.titleHindi.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Source CRUD
  const handleSaveSource = async () => {
    if (!editingSource) return;
    const res = validateSource(editingSource);
    setQcReport(res);
    if (!res.isValid) {
      showToast('Validation failed. Fix errors before saving.');
      return;
    }
    await saveCurrentAffairsSource(editingSource);
    showToast('Source saved successfully!');
    setEditingSource(null);
    loadData();
  };

  // Topic / Post CRUD
  const handleSaveTopic = async () => {
    if (!editingTopic) return;
    const sourceIds = sources.map(s => s.id);
    const res = validateTopic(editingTopic, sourceIds);
    setQcReport(res);
    if (!res.isValid) {
      showToast('Topic validation failed. Fix errors before saving.');
      return;
    }
    await saveCurrentAffairsTopic(editingTopic);
    showToast('Topic saved as Draft & validated!');
    setEditingTopic(null);
    loadData();
  };

  // Publish workflow with QC guard
  const handlePublishTopic = async (topic: CurrentAffairTopic) => {
    const sourceIds = sources.map(s => s.id);
    const res = validateTopic(topic, sourceIds);
    if (!res.isValid) {
      alert(`Cannot Publish! Central QC failed with errors:\n\n${res.errors.join('\n')}`);
      return;
    }

    const updated: CurrentAffairTopic = {
      ...topic,
      status: 'published',
      lastUpdatedDate: new Date().toISOString().split('T')[0]
    };
    await saveCurrentAffairsTopic(updated);
    showToast(`Topic "${topic.titleEn}" published successfully!`);
    loadData();
  };

  // Unpublish workflow
  const handleUnpublishTopic = async (topic: CurrentAffairTopic) => {
    const updated: CurrentAffairTopic = {
      ...topic,
      status: 'draft',
      lastUpdatedDate: new Date().toISOString().split('T')[0]
    };
    await saveCurrentAffairsTopic(updated);
    showToast(`Topic "${topic.titleEn}" unpublished (reverted to Draft).`);
    loadData();
  };

  // Delete workflow
  const handleDeleteTopic = async (topic: CurrentAffairTopic) => {
    if (!confirm(`Are you sure you want to delete topic "${topic.titleEn}"? This will also remove linked questions.`)) {
      return;
    }
    // Optimistic state update
    setTopics(prev => prev.filter(t => t.id !== topic.id));
    setQuestions(prev => prev.filter(q => q.currentAffairTopicId !== topic.id));
    if (previewTopic?.id === topic.id) {
      setPreviewTopic(null);
      setViewMode('studio');
    }
    if (editingTopic?.id === topic.id) {
      setEditingTopic(null);
    }

    try {
      const tQs = await fetchQuestionsForTopic(topic.id);
      for (const q of tQs) {
        await deleteCurrentAffairsQuestion(q.id);
      }
      await deleteCurrentAffairsTopic(topic.id);
      showToast(`Topic "${topic.titleEn}" deleted successfully.`);
    } catch (err: any) {
      console.warn('Error deleting topic:', err);
      showToast(`Error deleting topic: ${err?.message || err}`);
    }
    loadData();
  };

  const handleCopyJson = () => {
    if (!previewTopic) return;
    const topicQs = questions.filter(q => q.currentAffairTopicId === previewTopic.id);
    const exportData = {
      topic: previewTopic,
      questions: topicQs
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    showToast("Topic & Questions JSON copied to clipboard!");
  };

  const handleCopyJsonForTopic = (topic: CurrentAffairTopic) => {
    const topicQs = questions.filter(q => q.currentAffairTopicId === topic.id);
    const exportData = {
      topic: topic,
      questions: topicQs
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    showToast(`Topic "${topic.titleEn}" JSON copied to clipboard!`);
  };

  // Run AI Production Engine Generation
  const handleRunAIGeneration = async () => {
    setAiRunning(true);
    showToast('AI Production Engine running research & question synthesis...');
    try {
      const options: AIGenerationOptions = {
        date: aiGenerationDate,
        regionScope: aiRegionScope,
        examFocus: aiExamFocus,
        language: aiLanguage
      };

      const result = await generateAICurrentAffairsPackage(options);
      if (!result.success) {
        alert(`AI Generation failed: ${result.error || 'Unknown error'}`);
        setAiRunning(false);
        return;
      }

      // Persist Sources
      for (const src of result.sources) {
        await saveCurrentAffairsSource(src);
      }

      // Persist Topics
      for (const top of result.topics) {
        await saveCurrentAffairsTopic(top);
      }

      // Persist Questions
      for (const q of result.questions) {
        await saveCurrentAffairsQuestion(q);
      }

      const cgQCount = result.questions.filter(q => q.region === 'chhattisgarh').length;
      const natQCount = result.questions.filter(q => q.region === 'india' || q.region === 'international').length;

      setAiLastRunStats({
        timestamp: new Date().toLocaleTimeString(),
        topicsCount: result.topics.length,
        questionsCount: result.questions.length,
        cgCount: cgQCount,
        natCount: natQCount,
        qcPassed: result.qcReport.isValid
      });

      showToast(`AI Generation completed successfully! ${result.questions.length} questions created as DRAFT.`);
      loadData();
      setActiveSubTab('posts');
    } catch (err: any) {
      alert(`AI Generation error: ${err?.message || err}`);
    } finally {
      setAiRunning(false);
    }
  };

  // Process JSON Payload
  const processJsonPayload = async (rawJsonString: string) => {
    try {
      const payload = JSON.parse(rawJsonString);
      const date = payload.date || payload.post?.date || payload.dailyEdition?.date || new Date().toISOString().split('T')[0];
      const monthYear = date.substring(0, 7);
      const region = payload.region || payload.post?.region || 'chhattisgarh';

      // 1. Process Sources
      const incomingSources = payload.sources || payload.post?.sources || [];
      const savedSourceIds: string[] = [];
      for (const src of incomingSources) {
        const sId = src.id || `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const sourceRecord: CurrentAffairSource = {
          id: sId,
          name: src.name || 'Official Gazette / DPR',
          type: src.type || 'government',
          organization: src.organization || 'Govt of Chhattisgarh',
          url: src.url || src.sourceUrl,
          publicationDate: src.publicationDate || src.publishedAt || date,
          region: src.region || region,
          verificationStatus: src.verificationStatus || 'verified',
          verificationDate: src.verificationDate || date
        };
        await saveCurrentAffairsSource(sourceRecord);
        savedSourceIds.push(sId);
      }
      if (savedSourceIds.length === 0 && sources.length > 0) {
        savedSourceIds.push(sources[0].id);
      }
      if (savedSourceIds.length === 0) {
        const defaultSrcId = `src-default-${date}`;
        await saveCurrentAffairsSource({
          id: defaultSrcId,
          name: 'Chhattisgarh DPR Official Bulletin',
          type: 'government',
          organization: 'Govt of Chhattisgarh',
          publicationDate: date,
          region: 'chhattisgarh',
          verificationStatus: 'verified',
          verificationDate: date
        });
        savedSourceIds.push(defaultSrcId);
      }

      // 2. Process Topics
      const incomingTopics = payload.topics || (payload.post ? [payload.post] : [payload]);
      const savedTopicIds: string[] = [];
      const allParsedQuestions: CurrentAffairsQuestion[] = [];

      for (let tIdx = 0; tIdx < incomingTopics.length; tIdx++) {
        const t = incomingTopics[tIdx];
        const topicId = t.id || `top-${date}-${tIdx + 1}`;
        savedTopicIds.push(topicId);

        const examAngle = t.examAngle || {};
        const topicRecord: CurrentAffairTopic = {
          id: topicId,
          titleEn: t.titleEn || t.title || 'Untitled Current Affairs Topic',
          titleHindi: t.titleHindi || t.titleHi || 'शीर्षक',
          slug: (t.titleEn || t.title || 'topic').toLowerCase().replace(/\s+/g, '-'),
          region: t.region || region,
          subjects: t.subjects || ['CG General Knowledge', 'Economy'],
          exams: t.exams || ['CGPSC', 'CGSSB'],
          difficulty: t.difficulty || 'Medium',
          importance: t.importance || 'high',
          date: t.date || date,
          monthYear: t.monthYear || monthYear,
          examAngle: {
            whyInNews: examAngle.whyInNews || t.whyInNews || t.digestSummaryEn || '',
            background: examAngle.background || t.background || '',
            keyFacts: examAngle.keyFacts || t.keyFacts || [],
            staticConnection: examAngle.staticConnection || t.staticConnection || '',
            chhattisgarhConnection: examAngle.chhattisgarhConnection || t.chhattisgarhConnection || '',
            budgetConnection: examAngle.budgetConnection || t.budgetConnection || '',
            economicSurveyConnection: examAngle.economicSurveyConnection || t.economicSurveyConnection || '',
            examTakeaways: examAngle.examTakeaways || t.examTakeaways || [],
            importantTerms: examAngle.importantTerms || t.importantTerms || [],
            mainsDimensions: examAngle.mainsDimensions || t.mainsDimensions || {
              analyticalDimensions: '',
              challenges: '',
              wayForward: ''
            }
          },
          staticTopics: t.staticTopics || [],
          syllabusMapping: t.syllabusMapping || t.syllabus || [],
          budgetLinks: t.budgetLinks || [],
          economicSurveyLinks: t.economicSurveyLinks || [],
          sourceIds: t.sourceIds || savedSourceIds,
          linkedQuestionIds: [],
          keywords: t.keywords || ['CGPSC', 'Current Affairs'],
          tags: t.tags || ['Chhattisgarh'],
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await saveCurrentAffairsTopic(topicRecord);

        // 3. Process Questions
        const topicQuestions = t.questions || payload.questions || [];
        const linkedQIds: string[] = [];

        for (let qIdx = 0; qIdx < topicQuestions.length; qIdx++) {
          const rawQ = topicQuestions[qIdx];
          const qId = rawQ.id || `ca-q-${topicId}-${qIdx + 1}`;
          const qType = rawQ.questionType || rawQ.type || 'mcq';

          const caQ: CurrentAffairsQuestion = {
            id: qId,
            currentAffairTopicId: topicId,
            sourceIds: savedSourceIds,
            category: rawQ.category || 'CGPSC',
            subject: rawQ.subject || (Array.isArray(topicRecord.subjects) ? topicRecord.subjects[0] : topicRecord.subjects) || 'Chhattisgarh General Studies',
            topic: rawQ.topic || topicRecord.titleEn,
            difficulty: rawQ.difficulty || 'Medium',
            marks: rawQ.marks || 2,
            negativeMarks: rawQ.negativeMarks || 0.67,
            questionType: qType,
            questionText: rawQ.questionText || rawQ.question || rawQ.text || 'Sample question',
            questionHindi: rawQ.questionHindi || rawQ.textHindi || '',
            statements: rawQ.statements || [],
            columnA: rawQ.columnA || [],
            columnB: rawQ.columnB || [],
            assertion: rawQ.assertion || '',
            assertionHindi: rawQ.assertionHindi || '',
            reason: rawQ.reason || '',
            reasonHindi: rawQ.reasonHindi || '',
            options: Array.isArray(rawQ.options) ? rawQ.options : [
              { id: 'A', text: 'Option A', textHindi: 'विकल्प क' },
              { id: 'B', text: 'Option B', textHindi: 'विकल्प ख' },
              { id: 'C', text: 'Option C', textHindi: 'विकल्प ग' },
              { id: 'D', text: 'Option D', textHindi: 'विकल्प घ' }
            ],
            correctOption: rawQ.correctOption || rawQ.answer || 'A',
            explanation: rawQ.explanation || 'See detailed study notes.',
            explanationHindi: rawQ.explanationHindi || 'विस्तृत अध्ययन नोट्स देखें।',
            region: rawQ.region || topicRecord.region,
            exams: rawQ.exams || topicRecord.exams,
            date: date,
            monthYear: monthYear,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await saveCurrentAffairsQuestion(caQ);
          linkedQIds.push(qId);
          allParsedQuestions.push(caQ);
        }

        topicRecord.linkedQuestionIds = linkedQIds;
        await saveCurrentAffairsTopic(topicRecord);
      }

      // 4. Process Daily Edition
      const incomingDe = payload.dailyEdition || payload.post?.dailyEdition || {};
      const allQIds = allParsedQuestions.map(q => q.id);
      const cgCount = allParsedQuestions.filter(q => q.region === 'chhattisgarh').length;
      const natCount = allParsedQuestions.filter(q => q.region === 'india' || q.region === 'international').length;

      const dailyEditionRecord: DailyEdition = {
        date: date,
        title: incomingDe.title || `Current Affairs Daily Edition — ${date}`,
        digestSummaryEn: incomingDe.digestSummaryEn || 'Comprehensive daily current affairs package.',
        digestSummaryHi: incomingDe.digestSummaryHi || 'व्यापक दैनिक समसामयिक पैकेज।',
        topicIds: savedTopicIds,
        questionIds: allQIds,
        quizId: incomingDe.quizId || `quiz-${date}`,
        chhattisgarhQuestionCount: incomingDe.chhattisgarhQuestionCount || (cgCount > 0 ? cgCount : 20),
        indiaWorldQuestionCount: incomingDe.indiaWorldQuestionCount || (natCount > 0 ? natCount : 30),
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveDailyEdition(dailyEditionRecord);

      setIngestionLog(`Successfully imported Current Affairs JSON: ${savedSourceIds.length} sources, ${savedTopicIds.length} topics, and ${allQIds.length} questions saved & linked!`);
      showToast(`Imported successfully with ${allQIds.length} questions!`);
      await loadData();
      setActiveSubTab('posts');
    } catch (err: any) {
      setIngestionLog(`JSON Import Error: ${err?.message || err}`);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setOneClickJson(content);
        processJsonPayload(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-indigo-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phase 3.3 AI Production Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Current Affairs AI Engine & Editorial Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Automated research, editorial synthesis, 50-question generation (20 CG + 30 National), QC guard, and draft lifecycle.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700">
          {[
            { id: 'ai-engine', label: 'AI Production Engine', icon: Bot },
            { id: 'posts', label: 'Posts', icon: BookOpen },
            { id: 'quiz-creator', label: '🧩 Quiz Creator', icon: Sparkles },
            { id: 'sources', label: 'Sources', icon: Globe },
            { id: 'questions', label: 'Question Bank', icon: HelpCircle },
            { id: 'ingest', label: '⚡ Create from JSON', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 0: AI PRODUCTION ENGINE */}
      {activeSubTab === 'ai-engine' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Configuration Controls */}
            <div className="lg:col-span-1 bg-slate-900 border border-indigo-950 rounded-3xl p-6 space-y-6 shadow-xl">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>AI Generation Configuration</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Generation Date</label>
                  <input
                    type="date"
                    value={aiGenerationDate}
                    onChange={e => setAiGenerationDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Region Scope</label>
                  <select
                    value={aiRegionScope}
                    onChange={e => setAiRegionScope(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="all">Chhattisgarh + India + International</option>
                    <option value="chhattisgarh">Chhattisgarh Only</option>
                    <option value="national">India + International Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Exam Focus</label>
                  <select
                    value={aiExamFocus}
                    onChange={e => setAiExamFocus(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="Combined">Combined (CGPSC + CGSSB + UPSC)</option>
                    <option value="CGPSC">CGPSC State Services</option>
                    <option value="CGSSB">CG Vyapam / CGSSB</option>
                    <option value="UPSC">UPSC Civil Services</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Language</label>
                  <select
                    value={aiLanguage}
                    onChange={e => setAiLanguage(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="bilingual">Bilingual (English + Hindi)</option>
                    <option value="en">English Only</option>
                    <option value="hi">Hindi Only</option>
                  </select>
                </div>

                <button
                  onClick={handleRunAIGeneration}
                  disabled={aiRunning}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-2xl transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {aiRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  <span>{aiRunning ? 'Running AI Synthesis...' : "GENERATE TODAY'S CURRENT AFFAIRS"}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Engine Status & Summary Dashboard */}
            <div className="lg:col-span-2 bg-slate-900 border border-indigo-950 rounded-3xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white">Production Engine Status & Metrics</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    aiRunning ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {aiRunning ? 'Running Research...' : 'Ready for Generation'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Configured Sources</span>
                    <p className="text-lg font-black text-white">{sources.length} Primary</p>
                  </div>
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Generated Topics</span>
                    <p className="text-lg font-black text-indigo-400">{topics.length}</p>
                  </div>
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Questions</span>
                    <p className="text-lg font-black text-emerald-400">{questions.length} / 50</p>
                  </div>
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">CG / National Split</span>
                    <p className="text-xs font-mono font-bold text-amber-400">20 CG / 30 Nat</p>
                  </div>
                </div>

                {aiLastRunStats && (
                  <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/30 space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Last Successful Run ({aiLastRunStats.timestamp})</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-mono space-y-1">
                      <div>Topics Generated: {aiLastRunStats.topicsCount}</div>
                      <div>Questions Created: {aiLastRunStats.questionsCount} (CG: {aiLastRunStats.cgCount}, National: {aiLastRunStats.natCount})</div>
                      <div>Central QC Status: {aiLastRunStats.qcPassed ? 'PASSED (0 Errors)' : 'REVIEW REQUIRED'}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  onClick={() => setActiveSubTab('posts')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer flex items-center space-x-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>View Generated Posts ({topics.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: POSTS MANAGEMENT */}
      {activeSubTab === 'posts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-indigo-950">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search posts by title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                {['ALL', 'draft', 'published'].map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition ${
                      statusFilter === st ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('ai-engine')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span>AI Production Engine</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-indigo-950 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-700">
                    <th className="p-4">Post Title</th>
                    <th className="p-4">Region</th>
                    <th className="p-4">Published Date & Time</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Editorial Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                  {filteredTopics.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No current affairs posts found. Run the AI Production Engine to generate posts.
                      </td>
                    </tr>
                  ) : (
                    filteredTopics.map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-bold text-white max-w-sm">
                          <div>{t.titleEn}</div>
                          <div className="text-[11px] font-normal text-slate-400">{t.titleHindi}</div>
                          <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                            <span>🧩 Quiz: {questions.filter(q => q.currentAffairTopicId === t.id).length} Questions</span>
                          </div>
                        </td>
                        <td className="p-4 uppercase text-[10px] font-extrabold text-indigo-400">{t.region}</td>
                        <td className="p-4 font-mono text-slate-400 text-xs">
                          <div>{t.date}</div>
                          <div className="text-[10px] text-slate-500">{t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            t.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setPreviewTopic(t);
                              setCurrentQuizIndex(0);
                              setQuizSubmitted(false);
                              setSimulatedAnswers({});
                              setViewMode('preview');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold text-xs transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => {
                              setEditingTopic(t);
                              setQcReport(validateTopic(t, sources.map(s => s.id)));
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCopyJsonForTopic(t)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 font-bold text-xs transition cursor-pointer"
                          >
                            Copy JSON
                          </button>
                          {t.status === 'published' ? (
                            <button
                              onClick={() => handleUnpublishTopic(t)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 font-bold text-xs transition cursor-pointer"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublishTopic(t)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTopic(t)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold text-xs transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: QUIZ CREATOR & MANAGER */}
      {activeSubTab === 'quiz-creator' && (
        <div className="space-y-8">
          <div className="bg-slate-900 border border-indigo-950 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Quiz Creator & Ingester Engine</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create any type of quiz in future (Daily, Weekly, Monthly, Yearly, Custom) using JSON input. Load demo JSON or paste your custom quiz payload.
                </p>
              </div>
              <button
                onClick={() => {
                  const demoJson = {
                    "topic": {
                      "id": `quiz-${Date.now()}`,
                      "titleEn": "Weekly Comprehensive Current Affairs Quiz — March 2026",
                      "titleHindi": "साप्ताहिक व्यापक समसामयिक क्विज़ — मार्च 2026",
                      "region": "chhattisgarh",
                      "subjects": ["Polity", "Economy", "Environment"],
                      "exams": ["CGPSC", "CGSSB", "UPSC"],
                      "difficulty": "Medium",
                      "importance": "high",
                      "date": "2026-03-27",
                      "monthYear": "2026-03",
                      "examAngle": {
                        "whyInNews": "Weekly review of top state and national developments.",
                        "background": "Designed for comprehensive revision.",
                        "keyFacts": ["Fact 1", "Fact 2"],
                        "examTakeaways": ["Takeaway 1"]
                      },
                      "keywords": ["Weekly Quiz", "CGPSC"],
                      "tags": ["Quiz"]
                    },
                    "questions": [
                      {
                        "id": `q-demo-1`,
                        "category": "CGPSC",
                        "subject": "Chhattisgarh General Studies",
                        "topic": "Weekly Quiz",
                        "difficulty": "Medium",
                        "marks": 2,
                        "negativeMarks": 0.67,
                        "questionType": "mcq",
                        "questionText": "What is the primary focus of the Chhattisgarh State Innovation Mission?",
                        "questionHindi": "छत्तीसगढ़ राज्य नवाचार मिशन का मुख्य फोकस क्या है?",
                        "options": [
                          {"id": "A", "text": "Institutional capacity & regional growth", "textHindi": "संस्थागत क्षमता और क्षेत्रीय विकास"},
                          {"id": "B", "text": "Urban areas only", "textHindi": "केवल शहरी क्षेत्र"},
                          {"id": "C", "text": "No financial allocation", "textHindi": "कोई वित्तीय आवंटन नहीं"},
                          {"id": "D", "text": "None of the above", "textHindi": "इनमें से कोई नहीं"}
                        ],
                        "correctOption": "A",
                        "explanation": "It enhances institutional capacity and regional growth.",
                        "explanationHindi": "यह संस्थागत क्षमता और क्षेत्रीय विकास को बढ़ाता है।"
                      }
                    ]
                  };
                  setOneClickJson(JSON.stringify(demoJson, null, 2));
                  showToast('Loaded sample quiz JSON into editor!');
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shrink-0"
              >
                <FileText className="w-4 h-4" />
                <span>Load Demo Quiz JSON</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-indigo-500/40 border-dashed rounded-2xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition">
                  <div className="flex flex-col items-center justify-center pt-4 pb-5">
                    <Upload className="w-7 h-7 mb-2 text-indigo-400" />
                    <p className="mb-1 text-xs font-bold text-white">Click to upload Quiz JSON file</p>
                  </div>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <textarea
                rows={10}
                placeholder="Paste Quiz JSON here or click 'Load Demo Quiz JSON' above..."
                value={oneClickJson}
                onChange={e => setOneClickJson(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
              />

              <button
                onClick={() => processJsonPayload(oneClickJson)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-2xl transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create & Publish Quiz from JSON</span>
              </button>

              {ingestionLog && (
                <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-indigo-300">
                  {ingestionLog}
                </div>
              )}
            </div>
          </div>

          {/* Section: All Quizzes Manager */}
          <div className="bg-slate-900 border border-indigo-950 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <span>All Created Quizzes & Topics ({topics.length})</span>
                </h3>
                <p className="text-xs text-slate-400">Manage all quizzes, preview, edit, publish/unpublish, delete, or copy JSON.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-700">
                    <th className="p-4">Quiz / Post Title</th>
                    <th className="p-4">Region</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                  {topics.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No quizzes found. Use the Quiz Creator above or AI Engine to create quizzes.
                      </td>
                    </tr>
                  ) : (
                    topics.map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-bold text-white max-w-sm">
                          <div>{t.titleEn}</div>
                          <div className="text-[11px] font-normal text-slate-400">{t.titleHindi}</div>
                          <div className="mt-1 inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                            <span>🧩 Quiz Set: {questions.filter(q => q.currentAffairTopicId === t.id).length} Questions</span>
                          </div>
                        </td>
                        <td className="p-4 uppercase text-[10px] font-extrabold text-indigo-400">{t.region}</td>
                        <td className="p-4 font-mono text-slate-400 text-xs">{t.date}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            t.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setPreviewTopic(t);
                              setCurrentQuizIndex(0);
                              setQuizSubmitted(false);
                              setSimulatedAnswers({});
                              setViewMode('preview');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold text-xs transition cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => setEditingQuizQuestionsTopic(t)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold text-xs transition cursor-pointer"
                          >
                            Edit Questions
                          </button>
                          <button
                            onClick={() => handleCopyJsonForTopic(t)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 font-bold text-xs transition cursor-pointer"
                          >
                            Copy JSON
                          </button>
                          {t.status === 'published' ? (
                            <button
                              onClick={() => handleUnpublishTopic(t)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 font-bold text-xs transition cursor-pointer"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublishTopic(t)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md"
                            >
                              Publish
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTopic(t)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 font-bold text-xs transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SOURCE MANAGEMENT */}
      {activeSubTab === 'sources' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-indigo-950">
            <span className="text-xs text-slate-400">Manage official government primary sources</span>
            <button
              onClick={() => {
                setEditingSource({
                  id: `src-${Date.now()}`,
                  name: '',
                  type: 'government',
                  organization: 'Govt of Chhattisgarh',
                  publicationDate: new Date().toISOString().split('T')[0],
                  region: 'chhattisgarh',
                  verificationStatus: 'verified',
                  verificationDate: new Date().toISOString().split('T')[0]
                });
                setQcReport(null);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Official Source</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map(src => {
              const usageCount = topics.filter(t => t.sourceIds?.includes(src.id)).length;
              return (
                <div key={src.id} className="bg-slate-900 border border-indigo-950 rounded-2xl p-5 space-y-3 shadow-xl">
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      src.verificationStatus === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {src.verificationStatus}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{src.publicationDate}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{src.name}</h3>
                    <p className="text-xs text-slate-400">{src.organization}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <span>Used by {usageCount} posts</span>
                    <button
                      onClick={() => {
                        setEditingSource(src);
                        setQcReport(validateSource(src));
                      }}
                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
                    >
                      Edit Source
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: QUESTION BANK */}
      {activeSubTab === 'questions' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-indigo-950 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>Dedicated Current Affairs Question Bank Repository (/currentAffairsQuestions)</span>
            </h3>
          </div>

          <div className="bg-slate-900 border border-indigo-950 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-700">
                    <th className="p-4">Question Stem</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Linked Topic ID</th>
                    <th className="p-4">Difficulty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
                  {questions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No questions in the Question Bank yet. Run AI Generation or import JSON.
                      </td>
                    </tr>
                  ) : (
                    questions.map(q => (
                      <tr key={q.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4 font-bold text-white max-w-md truncate">{q.questionText || q.questionHindi}</td>
                        <td className="p-4 uppercase text-[10px] text-indigo-400 font-extrabold">{q.questionType}</td>
                        <td className="p-4 font-mono text-slate-400">{q.currentAffairTopicId}</td>
                        <td className="p-4 font-semibold text-amber-400">{q.difficulty}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: JSON INGESTION */}
      {activeSubTab === 'ingest' && (
        <div className="space-y-6 bg-slate-900 border border-indigo-950 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Manual JSON Post Ingestion</span>
              </div>
              <h2 className="text-xl font-black text-white">Import Complete Current Affairs JSON</h2>
              <p className="text-xs text-slate-300">
                Paste JSON or upload a `.json` file. Converges into the exact same downstream pipeline as AI generation.
              </p>
            </div>
            <button
              onClick={() => {
                const demoJson = {
                  "date": "2026-03-27",
                  "region": "chhattisgarh",
                  "sources": [
                    {
                      "id": "src-demo-001",
                      "name": "Chhattisgarh DPR Official Bulletin",
                      "type": "government",
                      "organization": "Govt of Chhattisgarh",
                      "url": "https://dprcg.gov.in",
                      "publicationDate": "2026-03-27",
                      "region": "chhattisgarh",
                      "verificationStatus": "verified"
                    }
                  ],
                  "topics": [
                    {
                      "id": "top-demo-001",
                      "titleEn": "Chhattisgarh State Innovation & Rural Technology Mission",
                      "titleHindi": "छत्तीसगढ़ राज्य नवाचार एवं ग्रामीण प्रौद्योगिकी मिशन",
                      "slug": "chhattisgarh-rural-technology-mission",
                      "region": "chhattisgarh",
                      "subjects": ["CG General Knowledge", "Economy"],
                      "exams": ["CGPSC", "CGSSB"],
                      "difficulty": "Medium",
                      "importance": "high",
                      "date": "2026-03-27",
                      "monthYear": "2026-03",
                      "examAngle": {
                        "whyInNews": "State government expanded rural technology incubation centers across tribal districts to boost decentralized livelihood generation.",
                        "background": "Focuses on grassroots innovation through science and technology in Bastar and Surguja.",
                        "keyFacts": ["50 incubation hubs established.", "Trained 10,000 rural youth."],
                        "staticConnection": "Rural development schemes in CG.",
                        "chhattisgarhConnection": "Directly benefits Bastar division.",
                        "budgetConnection": "Funded via State Innovation Fund 2026.",
                        "economicSurveyConnection": "Highlighted in Chapter 4 of CG Economic Survey.",
                        "examTakeaways": ["Rural tech incubation", "Grassroots livelihood"],
                        "importantTerms": ["Incubation Hub", "Agri-Tech"],
                        "mainsDimensions": {
                          "analyticalDimensions": "Bridging technology divide in rural regions.",
                          "challenges": "Skill retention and digital literacy.",
                          "wayForward": "Public-private partnership in grassroots innovation."
                        }
                      },
                      "syllabusMapping": ["CGPSC GS Paper 3 - Economy & Science"],
                      "sourceIds": ["src-demo-001"],
                      "keywords": ["Innovation", "Rural Technology", "CGPSC"],
                      "tags": ["Chhattisgarh", "Economy"],
                      "status": "draft",
                      "questions": [
                        {
                          "id": "q-demo-001",
                          "questionType": "mcq",
                          "subject": "Chhattisgarh General Studies",
                          "difficulty": "Medium",
                          "marks": 2,
                          "negativeMarks": 0.67,
                          "questionText": "Consider the following regarding the Chhattisgarh Rural Technology Mission: Which districts are primarily targeted for the initial phase?",
                          "questionHindi": "छत्तीसगढ़ ग्रामीण प्रौद्योगिकी मिशन के संबंध में निम्नलिखित पर विचार करें: प्रारंभिक चरण के लिए किन जिलों को मुख्य रूप से लक्षित किया गया है?",
                          "options": [
                            {"id": "A", "text": "Bastar and Surguja divisions", "textHindi": "बस्तर और सरगुजा संभाग"},
                            {"id": "B", "text": "Raipur and Durg only", "textHindi": "केवल रायपुर और दुर्ग"},
                            {"id": "C", "text": "Bilaspur and Raigarh only", "textHindi": "केवल बिलासपुर और रायगढ़"},
                            {"id": "D", "text": "All districts uniformly", "textHindi": "सभी जिलों में समान रूप से"}
                          ],
                          "correctOption": "A",
                          "explanation": "The initiative specifically prioritizes tribal-dominated Bastar and Surguja divisions for decentralized livelihood incubation.",
                          "explanationHindi": "यह पहल विशेष रूप से बस्तर और सरगुजा संभाग को प्राथमिकता देती है।"
                        },
                        {
                          "id": "q-demo-002",
                          "questionType": "multi_statement",
                          "subject": "Chhattisgarh General Studies",
                          "difficulty": "Hard",
                          "marks": 2,
                          "negativeMarks": 0.67,
                          "questionText": "Consider the following statements regarding the State Innovation Fund:\n1. It supports grassroots tech incubators.\n2. It is funded entirely by central grants.\nWhich of the statements given above is/are correct?",
                          "questionHindi": "राज्य नवाचार कोष के संबंध में निम्नलिखित कथनों पर विचार करें...",
                          "statements": [
                            "It supports grassroots tech incubators.",
                            "It is funded entirely by central grants."
                          ],
                          "options": [
                            {"id": "A", "text": "1 only", "textHindi": "केवल 1"},
                            {"id": "B", "text": "2 only", "textHindi": "केवल 2"},
                            {"id": "C", "text": "Both 1 and 2", "textHindi": "1 और 2 दोनों"},
                            {"id": "D", "text": "Neither 1 nor 2", "textHindi": "न तो 1, न ही 2"}
                          ],
                          "correctOption": "A",
                          "explanation": "Statement 1 is correct. Statement 2 is incorrect because the fund is state-sponsored.",
                          "explanationHindi": "कथन 1 सही है। कथन 2 गलत है क्योंकि यह राज्य प्रायोजित है।"
                        },
                        {
                          "id": "q-demo-003",
                          "questionType": "assertion_reason",
                          "subject": "Chhattisgarh General Studies",
                          "difficulty": "Medium",
                          "marks": 2,
                          "negativeMarks": 0.67,
                          "questionText": "Assertion (A): Rural technology missions are vital for tribal empowerment in Chhattisgarh.\nReason (R): They provide decentralized skill development and local micro-enterprises.",
                          "questionHindi": "अभिकथन (A): ग्रामीण प्रौद्योगिकी मिशन छत्तीसगढ़ में जनजातीय सशक्तिकरण के लिए महत्वपूर्ण हैं...",
                          "assertion": "Rural technology missions are vital for tribal empowerment in Chhattisgarh.",
                          "reason": "They provide decentralized skill development and local micro-enterprises.",
                          "options": [
                            {"id": "A", "text": "Both A and R are true and R is the correct explanation of A", "textHindi": "A और R दोनों सत्य हैं और R, A की सही व्याख्या है"},
                            {"id": "B", "text": "Both A and R are true but R is NOT the correct explanation of A", "textHindi": "A और R दोनों सत्य हैं लेकिन R, A की सही व्याख्या नहीं है"},
                            {"id": "C", "text": "A is true but R is false", "textHindi": "A सत्य है लेकिन R असत्य है"},
                            {"id": "D", "text": "A is false but R is true", "textHindi": "A असत्य है लेकिन R सत्य है"}
                          ],
                          "correctOption": "A",
                          "explanation": "Both assertion and reason are correct and logically connected.",
                          "explanationHindi": "अभिकथन और कारण दोनों सही हैं।"
                        },
                        {
                          "id": "q-demo-004",
                          "questionType": "matching",
                          "subject": "Chhattisgarh General Studies",
                          "difficulty": "Hard",
                          "marks": 2,
                          "negativeMarks": 0.67,
                          "questionText": "Match List I (Initiative) with List II (Focus Area):",
                          "questionHindi": "सूची I (पहल) को सूची II (फोकस क्षेत्र) से सुमेलित करें:",
                          "columnA": [
                            "1. Rural Tech Mission",
                            "2. State Innovation Fund",
                            "3. Agri-Tech Hub"
                          ],
                          "columnB": [
                            "a. Grassroots incubation",
                            "b. Financial backing",
                            "c. Crop productivity"
                          ],
                          "options": [
                            {"id": "A", "text": "1-a, 2-b, 3-c", "textHindi": "1-a, 2-b, 3-c"},
                            {"id": "B", "text": "1-b, 2-a, 3-c", "textHindi": "1-b, 2-a, 3-c"},
                            {"id": "C", "text": "1-c, 2-b, 3-a", "textHindi": "1-c, 2-b, 3-a"},
                            {"id": "D", "text": "1-a, 2-c, 3-b", "textHindi": "1-a, 2-c, 3-b"}
                          ],
                          "correctOption": "A",
                          "explanation": "Correct matching pairs are 1-a, 2-b, 3-c.",
                          "explanationHindi": "सही मिलान 1-a, 2-b, 3-c है।"
                        }
                      ]
                    }
                  ],
                  "dailyEdition": {
                    "date": "2026-03-27",
                    "title": "Current Affairs Daily Edition — 2026-03-27",
                    "digestSummaryEn": "Comprehensive daily current affairs package covering Chhattisgarh and national affairs.",
                    "digestSummaryHi": "व्यापक दैनिक समसामयिक पैकेज।",
                    "chhattisgarhQuestionCount": 20,
                    "indiaWorldQuestionCount": 30
                  }
                };
                setOneClickJson(JSON.stringify(demoJson, null, 2));
                showToast('Loaded comprehensive demo JSON format into editor!');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition cursor-pointer shadow-lg shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>Load Demo JSON Format</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-500/40 border-dashed rounded-2xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-indigo-400" />
                  <p className="mb-1 text-xs font-bold text-white">Click to upload JSON file</p>
                </div>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={12}
              placeholder="Paste JSON here or click 'Load Demo JSON Format' above..."
              value={oneClickJson}
              onChange={e => setOneClickJson(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
            />

            <button
              onClick={() => processJsonPayload(oneClickJson)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-2xl transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Draft from JSON</span>
            </button>

            {ingestionLog && (
              <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-indigo-300">
                {ingestionLog}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT MODAL: OFFICIAL SOURCE EDITOR */}
      {editingSource && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-950 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Official Primary Source Editor</h2>
              <button onClick={() => setEditingSource(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Source Name</label>
                <input
                  type="text"
                  value={editingSource.name}
                  onChange={e => setEditingSource({ ...editingSource, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              {qcReport && (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  qcReport.isValid ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'
                }`}>
                  <div className="flex items-center space-x-2 font-bold text-xs text-white">
                    {qcReport.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>Source QC Report</span>
                  </div>
                  {qcReport.errors.map((err, i) => (
                    <div key={i} className="text-[11px] text-rose-300 font-mono">ERROR: {err}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingSource(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSource}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg cursor-pointer"
              >
                Save Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL: WORDPRESS COMPREHENSIVE POST EDITOR */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-950 rounded-3xl max-w-4xl w-full p-6 space-y-6 max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">WordPress Comprehensive Post Editor</h2>
                <p className="text-xs text-slate-400">Edit every editorial attribute, SEO slug, exam angle, connection, and syllabus mapping.</p>
              </div>
              <button onClick={() => setEditingTopic(null)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            {/* WordPress Tabs */}
            <div className="flex flex-wrap bg-slate-800 p-1.5 rounded-2xl border border-slate-700 w-fit gap-1">
              {[
                { id: 'general', label: '1. General & SEO' },
                { id: 'editorial', label: '2. Editorial & Exam Angle' },
                { id: 'syllabus', label: '3. Syllabus & Exams' },
                { id: 'questions', label: '4. Quiz Questions' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEditTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeEditTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              {activeEditTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">English Title</label>
                      <input
                        type="text"
                        value={editingTopic.titleEn}
                        onChange={e => setEditingTopic({ ...editingTopic, titleEn: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Hindi Title</label>
                      <input
                        type="text"
                        value={editingTopic.titleHindi}
                        onChange={e => setEditingTopic({ ...editingTopic, titleHindi: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Published Date</label>
                      <input
                        type="date"
                        value={editingTopic.date}
                        onChange={e => setEditingTopic({ ...editingTopic, date: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">URL Slug</label>
                      <input
                        type="text"
                        value={editingTopic.slug}
                        onChange={e => setEditingTopic({ ...editingTopic, slug: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Region</label>
                      <select
                        value={editingTopic.region}
                        onChange={e => setEditingTopic({ ...editingTopic, region: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-bold"
                      >
                        <option value="chhattisgarh">Chhattisgarh</option>
                        <option value="india">India</option>
                        <option value="international">International</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Publication Status</label>
                      <select
                        value={editingTopic.status}
                        onChange={e => setEditingTopic({ ...editingTopic, status: e.target.value as any })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-bold"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'editorial' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Why in News / Summary</label>
                    <textarea
                      rows={3}
                      value={editingTopic.examAngle?.whyInNews || ''}
                      onChange={e => setEditingTopic({
                        ...editingTopic,
                        examAngle: { ...editingTopic.examAngle, whyInNews: e.target.value }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Background & Context</label>
                    <textarea
                      rows={3}
                      value={editingTopic.examAngle?.background || ''}
                      onChange={e => setEditingTopic({
                        ...editingTopic,
                        examAngle: { ...editingTopic.examAngle, background: e.target.value }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">Key Facts for Prelims (Comma separated)</label>
                    <input
                      type="text"
                      value={editingTopic.examAngle?.keyFacts?.join(', ') || ''}
                      onChange={e => setEditingTopic({
                        ...editingTopic,
                        examAngle: { ...editingTopic.examAngle, keyFacts: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }
                      })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Static Connection</label>
                      <input
                        type="text"
                        value={editingTopic.examAngle?.staticConnection || ''}
                        onChange={e => setEditingTopic({
                          ...editingTopic,
                          examAngle: { ...editingTopic.examAngle, staticConnection: e.target.value }
                        })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Chhattisgarh Connection</label>
                      <input
                        type="text"
                        value={editingTopic.examAngle?.chhattisgarhConnection || ''}
                        onChange={e => setEditingTopic({
                          ...editingTopic,
                          examAngle: { ...editingTopic.examAngle, chhattisgarhConnection: e.target.value }
                        })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'syllabus' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Subjects (Comma separated)</label>
                      <input
                        type="text"
                        value={ensureArray(editingTopic.subjects).join(', ')}
                        onChange={e => setEditingTopic({
                          ...editingTopic,
                          subjects: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1">Syllabus Mapping</label>
                      <input
                        type="text"
                        value={ensureArray(editingTopic.syllabusMapping).join(', ')}
                        onChange={e => setEditingTopic({
                          ...editingTopic,
                          syllabusMapping: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'questions' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                    <div>
                      <h3 className="text-sm font-bold text-white">Quiz Questions Manager ({questions.filter(q => q.currentAffairTopicId === editingTopic.id).length} Questions)</h3>
                      <p className="text-xs text-slate-400">Add, edit, or delete questions attached to this quiz set.</p>
                    </div>
                    <button
                      onClick={() => {
                        const newQ: any = {
                          id: `q-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                          currentAffairTopicId: editingTopic.id,
                          sourceIds: editingTopic.sourceIds || [],
                          category: editingTopic.exams?.[0] || 'CGPSC',
                          subject: editingTopic.subjects?.[0] || 'General Studies',
                          topic: editingTopic.titleEn,
                          difficulty: editingTopic.difficulty || 'Medium',
                          marks: 2,
                          negativeMarks: 0.67,
                          questionType: 'mcq',
                          questionText: 'New Question Text in English...',
                          questionHindi: 'नया प्रश्न हिंदी में...',
                          options: [
                            { id: 'A', text: 'Option A', textHindi: 'विकल्प ए' },
                            { id: 'B', text: 'Option B', textHindi: 'विकल्प बी' },
                            { id: 'C', text: 'Option C', textHindi: 'विकल्प सी' },
                            { id: 'D', text: 'Option D', textHindi: 'विकल्प डी' }
                          ],
                          correctOption: 'A',
                          explanation: 'Explanation here...',
                          explanationHindi: 'स्पष्टीकरण यहाँ...'
                        };
                        setEditingQuestion(newQ);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Question</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {questions.filter(q => q.currentAffairTopicId === editingTopic.id).length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs font-mono">
                        No questions in this quiz set yet. Click "Add New Question" above.
                      </div>
                    ) : (
                      questions.filter(q => q.currentAffairTopicId === editingTopic.id).map((q, idx) => (
                        <div key={q.id} className="bg-slate-800/60 border border-slate-700/80 p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
                                Q{idx + 1} • {(q.questionType as string || 'mcq').toUpperCase()} • {q.marks} Marks
                              </span>
                              <div className="text-xs font-bold text-white">{q.questionText}</div>
                              <div className="text-[11px] text-slate-400">{q.questionHindi}</div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                onClick={() => setEditingQuestion(q)}
                                className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("Delete this question?")) {
                                    await deleteCurrentAffairsQuestion(q.id);
                                    showToast("Question deleted.");
                                    loadData();
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-bold transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {qcReport && (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  qcReport.isValid ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'
                }`}>
                  <div className="flex items-center space-x-2 font-bold text-xs text-white">
                    {qcReport.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>Central QC Validation Report</span>
                  </div>
                  {qcReport.errors.map((err, i) => (
                    <div key={i} className="text-[11px] text-rose-300 font-mono">ERROR: {err}</div>
                  ))}
                  {qcReport.warnings.map((warn, i) => (
                    <div key={i} className="text-[11px] text-amber-300 font-mono">WARNING: {warn}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete topic "${editingTopic.titleEn}"?`)) {
                    handleDeleteTopic(editingTopic);
                    setEditingTopic(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setEditingTopic(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTopic}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg cursor-pointer"
                >
                  Save Draft Revision & QC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT-FACING SEPARATE FULL PAGE PREVIEW */}
      {viewMode === 'preview' && previewTopic && (
        <div className="space-y-8 bg-slate-950 p-6 sm:p-12 min-h-screen text-slate-100 shadow-2xl">
          {/* WordPress Admin Toolbar Top Bar */}
          <div className="bg-slate-900 border border-indigo-900/60 px-6 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl sticky top-4 z-50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span>WordPress Separate Page Preview</span>
              </div>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">Slug: /current-affairs/{previewTopic.monthYear}/{previewTopic.slug}</span>
              <span className="text-xs text-slate-400 font-mono hidden md:inline">Published: {previewTopic.date}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                previewTopic.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {previewTopic.status}
              </span>
              <button
                onClick={() => {
                  const t = previewTopic;
                  setPreviewTopic(null);
                  setViewMode('studio');
                  setEditingTopic(normalizeTopic(t));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Post</span>
              </button>
              <button
                onClick={handleCopyJson}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </button>
              <button
                onClick={() => {
                  handleDeleteTopic(previewTopic);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
              <button
                onClick={() => {
                  setPreviewTopic(null);
                  setViewMode('studio');
                }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <span>← Back to Studio</span>
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* SEO Snippet Preview */}
            <div className="bg-slate-900/90 border border-indigo-950 p-5 rounded-2xl space-y-1.5 text-xs font-mono text-slate-400">
              <div className="text-indigo-300 font-bold uppercase tracking-wider text-[10px]">Google Search SEO Snippet Preview</div>
              <div className="text-blue-400 font-bold text-sm truncate">{previewTopic.titleEn} — CGSSB Test</div>
              <div className="text-emerald-400 truncate">https://cgssbtest.com/current-affairs/{previewTopic.monthYear}/{previewTopic.slug}</div>
              <div className="text-slate-300 text-[11px] line-clamp-2">{previewTopic.examAngle?.whyInNews}</div>
            </div>

            {/* Metadata Breadcrumb */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold uppercase">{previewTopic.region}</span>
              <span>•</span>
              <span>Published: {previewTopic.date}</span>
              <span>•</span>
              <span>Author: CGSSB Editorial Board</span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 uppercase text-[10px] font-bold">{previewTopic.status}</span>
            </div>

            {/* Article Titles */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">{previewTopic.titleEn}</h1>
              <h2 className="text-xl sm:text-2xl font-bold text-indigo-300">{previewTopic.titleHindi}</h2>
            </div>

            {/* Why in News */}
            <div className="bg-indigo-950/40 border border-indigo-500/30 p-8 rounded-3xl space-y-3 shadow-2xl">
              <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Why in News</span>
              </h3>
              <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-medium">{previewTopic.examAngle?.whyInNews}</p>
            </div>

            {/* Background & Key Facts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {previewTopic.examAngle?.background && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-lg">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Background & Context</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{previewTopic.examAngle.background}</p>
                </div>
              )}

              {previewTopic.examAngle?.keyFacts && previewTopic.examAngle.keyFacts.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 shadow-lg">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Key Facts for Prelims</h3>
                  <ul className="list-disc list-inside text-xs sm:text-sm text-slate-300 space-y-2">
                    {ensureArray(previewTopic.examAngle.keyFacts).map((fact, idx) => (
                      <li key={idx}>{fact}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Connections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {previewTopic.examAngle?.staticConnection && (
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase">Static Connection</h4>
                  <p className="text-xs text-slate-300">{previewTopic.examAngle.staticConnection}</p>
                </div>
              )}
              {previewTopic.examAngle?.chhattisgarhConnection && (
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase">Chhattisgarh Connection</h4>
                  <p className="text-xs text-slate-300">{previewTopic.examAngle.chhattisgarhConnection}</p>
                </div>
              )}
              {previewTopic.examAngle?.budgetConnection && (
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-300 uppercase">Budget Connection</h4>
                  <p className="text-xs text-slate-300">{previewTopic.examAngle.budgetConnection}</p>
                </div>
              )}
              {previewTopic.examAngle?.economicSurveyConnection && (
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-purple-300 uppercase">Economic Survey Connection</h4>
                  <p className="text-xs text-slate-300">{previewTopic.examAngle.economicSurveyConnection}</p>
                </div>
              )}
            </div>

            {/* Exam Takeaways & Terms */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Exam Takeaways & Important Terms</h3>
              <div className="flex flex-wrap gap-2">
                {ensureArray(previewTopic.examAngle?.examTakeaways).map((takeaway, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-indigo-950/60 text-indigo-300 text-xs font-semibold border border-indigo-800/40">
                    {takeaway}
                  </span>
                ))}
                {ensureArray(previewTopic.examAngle?.importantTerms).map((term, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-purple-950/60 text-purple-300 text-xs font-semibold border border-purple-800/40">
                    {term}
                  </span>
                ))}
              </div>
            </div>

            {/* Google Search AI Quiz Mode Section (1 Question per page with Next/Previous and Submit Scorecard) */}
            <div className="space-y-6 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-indigo-400" />
                  <span>Practice Quiz ({questions.filter(q => q.currentAffairTopicId === previewTopic.id).length} Questions)</span>
                </h3>
                <span className="text-xs font-mono text-indigo-400 font-bold">Google Search AI Interactive Quiz</span>
              </div>

              {(() => {
                const topicQuestions = questions.filter(q => q.currentAffairTopicId === previewTopic.id);
                if (topicQuestions.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800">
                      No questions linked to this topic yet.
                    </div>
                  );
                }

                if (quizSubmitted) {
                  return (
                    <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 space-y-8 shadow-2xl">
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>Quiz Submitted Successfully</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white">Performance & Score Summary</h2>
                        <p className="text-xs text-slate-400">Detailed breakdown of your attempt for "{previewTopic.titleEn}"</p>
                      </div>

                      {/* Score Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(() => {
                          let correctCount = 0;
                          let attemptedCount = 0;
                          let totalMarks = 0;
                          let obtainedMarks = 0;

                          topicQuestions.forEach(q => {
                            const userAns = simulatedAnswers[q.id];
                            const qMarks = q.marks || 2;
                            totalMarks += qMarks;
                            if (userAns != null) {
                              attemptedCount++;
                              if (userAns === q.correctOption) {
                                correctCount++;
                                obtainedMarks += qMarks;
                              } else {
                                obtainedMarks -= (q.negativeMarks || 0.67);
                              }
                            }
                          });
                          const percentage = Math.max(0, Math.round((obtainedMarks / totalMarks) * 100));

                          return (
                            <>
                              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Score</span>
                                <p className="text-xl font-black text-emerald-400">{obtainedMarks.toFixed(1)} / {totalMarks}</p>
                              </div>
                              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Accuracy</span>
                                <p className="text-xl font-black text-indigo-400">{attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0}%</p>
                              </div>
                              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Correct / Attempted</span>
                                <p className="text-xl font-black text-white">{correctCount} / {attemptedCount} ({topicQuestions.length})</p>
                              </div>
                              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-1 text-center">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Performance</span>
                                <p className="text-xs font-black text-amber-400 pt-1">{percentage >= 75 ? '🌟 Excellent' : percentage >= 40 ? '👍 Good' : '📚 Needs Practice'}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => {
                            setQuizSubmitted(false);
                            setCurrentQuizIndex(0);
                            setSimulatedAnswers({});
                          }}
                          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer flex items-center space-x-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Reattempt Quiz</span>
                        </button>
                      </div>

                      {/* Review All Questions & Answers */}
                      <div className="space-y-6 pt-6 border-t border-slate-800">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detailed Answers & Solutions Review</h3>
                        {topicQuestions.map((q, idx) => {
                          const userAns = simulatedAnswers[q.id];
                          const isCorrect = userAns === q.correctOption;
                          return (
                            <div key={q.id || idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-300">Q{idx + 1}. {q.subject}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  userAns == null ? 'bg-slate-800 text-slate-400' : isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {userAns == null ? 'Unattempted' : isCorrect ? 'Correct (+2)' : 'Incorrect (-0.67)'}
                                </span>
                              </div>
                              <QuestionRenderer
                                question={q as any}
                                selectedOption={userAns || null}
                                showSolution={true}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const currentQ = topicQuestions[currentQuizIndex];
                const selectedOpt = simulatedAnswers[currentQ.id];

                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                    {/* Question Nav Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div className="flex items-center space-x-3">
                        <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs">
                          Question {currentQuizIndex + 1} of {topicQuestions.length} ({((currentQ.questionType || currentQ.type || 'mcq')).toUpperCase()})
                        </span>
                        <span className="text-xs font-bold text-slate-300 hidden sm:inline">{currentQ.subject}</span>
                        <span className="text-[10px] font-mono text-slate-400">({currentQ.marks || 2} Marks)</span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-amber-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Google AI Quiz Mode</span>
                      </div>
                    </div>

                    {/* Question Renderer (Schema compliant with matching, multi-statement, assertion-reason, etc.) */}
                    <QuestionRenderer
                      question={currentQ as any}
                      selectedOption={selectedOpt || null}
                      onSelectOption={(opt) => setSimulatedAnswers((prev: Record<string, string>) => ({ ...prev, [currentQ.id]: opt }) as Record<string, string>)}
                      showSolution={false}
                    />

                    {/* Pagination & Submit Navigation (Previous, Next, and Submit Quiz available at all times) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentQuizIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuizIndex === 0}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
                        >
                          <span>← Previous</span>
                        </button>
                        <button
                          onClick={() => setCurrentQuizIndex(prev => Math.min(topicQuestions.length - 1, prev + 1))}
                          disabled={currentQuizIndex === topicQuestions.length - 1}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex items-center space-x-1.5"
                        >
                          <span>Next →</span>
                        </button>
                      </div>

                      <div className="text-xs text-slate-400 font-mono">
                        Question <strong className="text-white">{currentQuizIndex + 1}</strong> of <strong className="text-white">{topicQuestions.length}</strong>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to submit the quiz?")) {
                            setQuizSubmitted(true);
                          }
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg flex items-center space-x-1.5"
                      >
                        <span>Submit Quiz 🏆</span>
                      </button>
                    </div>

                    {/* Question Grid Palette for 1 to 50+ Questions (Placed Below Prev/Next Navigation) */}
                    <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
                        <span>Question Palette ({Object.keys(simulatedAnswers).length} of {topicQuestions.length} Attempted)</span>
                        <span className="text-[10px] text-indigo-400 font-mono">Click number to jump</span>
                      </div>
                      <div className="max-h-36 overflow-y-auto grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 lg:grid-cols-20 gap-1.5 p-1.5 bg-slate-900/60 rounded-xl border border-slate-800">
                        {topicQuestions.map((q, i) => {
                          const isAttempted = simulatedAnswers[q.id] != null;
                          const isCurrent = currentQuizIndex === i;
                          return (
                            <button
                              key={i}
                              onClick={() => setCurrentQuizIndex(i)}
                              className={`h-8 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400'
                                  : isAttempted
                                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                              }`}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* EDIT MODAL: INDIVIDUAL QUESTION EDITOR */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-950 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white">Quiz Question Editor</h2>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Question Type</label>
                  <select
                    value={editingQuestion.questionType}
                    onChange={e => setEditingQuestion({ ...editingQuestion, questionType: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white uppercase font-bold"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="multi_statement">Multi-Statement</option>
                    <option value="assertion_reason">Assertion & Reason</option>
                    <option value="matching">Matching Pairs</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">Marks</label>
                  <input
                    type="number"
                    value={editingQuestion.marks}
                    onChange={e => setEditingQuestion({ ...editingQuestion, marks: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Question Text (English)</label>
                <textarea
                  rows={3}
                  value={editingQuestion.questionText}
                  onChange={e => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Question Text (Hindi)</label>
                <textarea
                  rows={3}
                  value={editingQuestion.questionHindi}
                  onChange={e => setEditingQuestion({ ...editingQuestion, questionHindi: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Correct Option (e.g. A, B, C, D)</label>
                <input
                  type="text"
                  value={editingQuestion.correctOption}
                  onChange={e => setEditingQuestion({ ...editingQuestion, correctOption: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Explanation (English)</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Explanation (Hindi)</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanationHindi || ''}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanationHindi: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              {/* Specialized Schema Fields based on Question Type */}
              {editingQuestion.questionType === 'matching' && (
                <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-3 bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl">
                  <div>
                    <label className="text-xs font-bold text-purple-300 block mb-1">Column A / List I (Comma separated)</label>
                    <textarea
                      rows={3}
                      value={Array.isArray(editingQuestion.columnA) ? editingQuestion.columnA.map((x:any) => typeof x === 'string' ? x : (x.text || '')).join(', ') : (editingQuestion.columnA || '')}
                      onChange={e => setEditingQuestion({ ...editingQuestion, columnA: e.target.value.split(',').map(s => s.trim()).filter(Boolean) as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-300 block mb-1">Column B / List II (Comma separated)</label>
                    <textarea
                      rows={3}
                      value={Array.isArray(editingQuestion.columnB) ? editingQuestion.columnB.map((x:any) => typeof x === 'string' ? x : (x.text || '')).join(', ') : (editingQuestion.columnB || '')}
                      onChange={e => setEditingQuestion({ ...editingQuestion, columnB: e.target.value.split(',').map(s => s.trim()).filter(Boolean) as any })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {editingQuestion.questionType === 'assertion_reason' && (
                <div className="space-y-3 bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl">
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">Assertion (A)</label>
                    <textarea
                      rows={2}
                      value={editingQuestion.assertion || ''}
                      onChange={e => setEditingQuestion({ ...editingQuestion, assertion: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">Reason (R)</label>
                    <textarea
                      rows={2}
                      value={editingQuestion.reason || ''}
                      onChange={e => setEditingQuestion({ ...editingQuestion, reason: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {editingQuestion.questionType === 'multi_statement' && (
                <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-2xl">
                  <label className="text-xs font-bold text-blue-300 block mb-1">Statements (Comma separated)</label>
                  <textarea
                    rows={3}
                    value={Array.isArray(editingQuestion.statements) ? editingQuestion.statements.map((s:any) => typeof s === 'string' ? s : (s.text || '')).join(', ') : (editingQuestion.statements || '')}
                    onChange={e => setEditingQuestion({ ...editingQuestion, statements: e.target.value.split(',').map(s => s.trim()).filter(Boolean) as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await saveCurrentAffairsQuestion(editingQuestion);
                  showToast("Question saved successfully!");
                  setEditingQuestion(null);
                  loadData();
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg cursor-pointer"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
      {/* EDIT MODAL: QUIZ QUESTIONS MANAGER (UNIVERSAL INGESTION STUDIO STYLE) */}
      {editingQuizQuestionsTopic && (() => {
        const topicQs = questions.filter(q => q.currentAffairTopicId === editingQuizQuestionsTopic.id);
        const filteredQs = topicQs.filter(q => {
          const matchSearch = (q.questionText || '').toLowerCase().includes(quizSearch.toLowerCase()) ||
                              (q.questionHindi || '').toLowerCase().includes(quizSearch.toLowerCase()) ||
                              (q.subject || '').toLowerCase().includes(quizSearch.toLowerCase()) ||
                              (q.topic || '').toLowerCase().includes(quizSearch.toLowerCase());
          const matchDiff = quizDiffFilter === 'ALL' || q.difficulty === quizDiffFilter;
          return matchSearch && matchDiff;
        });

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-indigo-950 rounded-3xl max-w-5xl w-full p-6 space-y-6 max-h-[95vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>Universal Ingestion Studio: {editingQuizQuestionsTopic.titleEn}</span>
                  </h2>
                  <p className="text-xs text-slate-400">Advanced Master Engine — Edit questions, options, bilingual text, correct answers & explanations.</p>
                </div>
                <button onClick={() => setEditingQuizQuestionsTopic(null)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
              </div>

              <div className="space-y-4">
                {/* Quick Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                    <div className="relative flex-1 min-w-[160px]">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={quizSearch}
                        onChange={e => setQuizSearch(e.target.value)}
                        placeholder="Search questions, subject, topic..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <select
                      value={quizDiffFilter}
                      onChange={e => setQuizDiffFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="ALL">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>

                    <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setQuizLang('bilingual')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                          quizLang === 'bilingual' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Bilingual
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizLang('hi')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                          quizLang === 'hi' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        हिंदी
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuizLang('en')}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                          quizLang === 'en' ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newQ: any = {
                        id: `q-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                        currentAffairTopicId: editingQuizQuestionsTopic.id,
                        sourceIds: editingQuizQuestionsTopic.sourceIds || [],
                        category: editingQuizQuestionsTopic.exams?.[0] || 'CGPSC',
                        subject: editingQuizQuestionsTopic.subjects?.[0] || 'General Studies',
                        topic: editingQuizQuestionsTopic.titleEn,
                        difficulty: editingQuizQuestionsTopic.difficulty || 'Medium',
                        marks: 2,
                        negativeMarks: 0.67,
                        questionType: 'mcq',
                        questionText: 'New Question Text in English...',
                        questionHindi: 'नया प्रश्न हिंदी में...',
                        options: [
                          { id: 'A', text: 'Option A', textHindi: 'विकल्प ए' },
                          { id: 'B', text: 'Option B', textHindi: 'विकल्प बी' },
                          { id: 'C', text: 'Option C', textHindi: 'विकल्प सी' },
                          { id: 'D', text: 'Option D', textHindi: 'विकल्प डी' }
                        ],
                        correctOption: 'A',
                        explanation: 'Explanation here...',
                        explanationHindi: 'स्पष्टीकरण यहाँ...'
                      };
                      setEditingQuestion(newQ);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Question</span>
                  </button>
                </div>

                {/* Questions List */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {filteredQs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                      No questions match the filter criteria.
                    </div>
                  ) : (
                    filteredQs.map((q, filteredIdx) => {
                      const realIndex = topicQs.findIndex(x => x.id === q.id);
                      const qIndex = realIndex !== -1 ? realIndex : filteredIdx;

                      return (
                        <div key={q.id || qIndex} className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-3">
                          {/* Card Top Meta & Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-900">
                            <div className="flex items-center space-x-2">
                              <span className="w-6 h-6 rounded-md bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-mono font-bold text-xs flex items-center justify-center">
                                {qIndex + 1}
                              </span>
                              <input
                                type="text"
                                value={q.subject || ''}
                                onChange={async e => {
                                  const updated = questions.map(item => item.id === q.id ? { ...item, subject: e.target.value } : item);
                                  setQuestions(updated);
                                  await saveCurrentAffairsQuestion({ ...q, subject: e.target.value });
                                }}
                                placeholder="Subject"
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-300 w-32 focus:outline-none focus:border-indigo-500"
                              />
                              <input
                                type="text"
                                value={q.topic || ''}
                                onChange={async e => {
                                  const updated = questions.map(item => item.id === q.id ? { ...item, topic: e.target.value } : item);
                                  setQuestions(updated);
                                  await saveCurrentAffairsQuestion({ ...q, topic: e.target.value });
                                }}
                                placeholder="Topic"
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] font-semibold text-slate-300 w-32 focus:outline-none focus:border-indigo-500"
                              />
                              <select
                                value={q.difficulty || 'Medium'}
                                onChange={async e => {
                                  const updated = questions.map(item => item.id === q.id ? { ...item, difficulty: e.target.value as any } : item);
                                  setQuestions(updated);
                                  await saveCurrentAffairsQuestion({ ...q, difficulty: e.target.value as any });
                                }}
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
                                onClick={() => setEditingQuestion(q)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition text-xs flex items-center space-x-1"
                                title="Full modal editor"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px]">Full Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm("Delete this question?")) {
                                    await deleteCurrentAffairsQuestion(q.id);
                                    showToast("Question deleted.");
                                    loadData();
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition"
                                title="Remove question"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Editable Question Text (Hindi & English) */}
                          <div className="space-y-2">
                            {(quizLang === 'bilingual' || quizLang === 'hi') && (
                              <div>
                                <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-0.5">
                                  Question (हिंदी)
                                </label>
                                <textarea
                                  rows={2}
                                  value={q.questionHindi || ''}
                                  onChange={async e => {
                                    const val = e.target.value;
                                    const updated = questions.map(item => item.id === q.id ? { ...item, questionHindi: val } : item);
                                    setQuestions(updated);
                                    await saveCurrentAffairsQuestion({ ...q, questionHindi: val });
                                  }}
                                  className="w-full p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white font-medium focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            )}

                            {(quizLang === 'bilingual' || quizLang === 'en') && (
                              <div>
                                <label className="block text-[10px] font-bold text-sky-400 uppercase mb-0.5">
                                  Question (English)
                                </label>
                                <textarea
                                  rows={2}
                                  value={q.questionText || ''}
                                  onChange={async e => {
                                    const val = e.target.value;
                                    const updated = questions.map(item => item.id === q.id ? { ...item, questionText: val } : item);
                                    setQuestions(updated);
                                    await saveCurrentAffairsQuestion({ ...q, questionText: val });
                                  }}
                                  className="w-full p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-white font-medium focus:border-indigo-500 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>

                          {/* Specialized Schema Fields (Matching, Assertion-Reason, Multi-Statement) */}
                          {q.questionType === 'matching' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-purple-950/20 border border-purple-500/30 p-3 rounded-xl">
                              <div>
                                <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">Column A / List I (Comma separated)</label>
                                <textarea
                                  rows={2}
                                  value={Array.isArray(q.columnA) ? q.columnA.map((x:any) => typeof x === 'string' ? x : (x.text || '')).join(', ') : (q.columnA || '')}
                                  onChange={async e => {
                                    const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    const updated = questions.map(item => item.id === q.id ? { ...item, columnA: val as any } : item);
                                    setQuestions(updated);
                                    await saveCurrentAffairsQuestion({ ...q, columnA: val as any });
                                  }}
                                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-purple-300 uppercase mb-1">Column B / List II (Comma separated)</label>
                                <textarea
                                  rows={2}
                                  value={Array.isArray(q.columnB) ? q.columnB.map((x:any) => typeof x === 'string' ? x : (x.text || '')).join(', ') : (q.columnB || '')}
                                  onChange={async e => {
                                    const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                    const updated = questions.map(item => item.id === q.id ? { ...item, columnB: val as any } : item);
                                    setQuestions(updated);
                                    await saveCurrentAffairsQuestion({ ...q, columnB: val as any });
                                  }}
                                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                                />
                              </div>
                            </div>
                          )}

                          {q.questionType === 'assertion_reason' && (
                            <div className="space-y-2 bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl">
                              <div>
                                <label className="block text-[10px] font-bold text-amber-300 uppercase mb-1">Assertion (A)</label>
                                <textarea
                                  rows={2}
                                  value={q.assertion || ''}
                                  onChange={async e => {
                                    const val = e.target.value;
                                    const updated = questions.map(item => item.id === q.id ? { ...item, assertion: val } : item);
                                    setQuestions(updated);
                                    await saveCurrentAffairsQuestion({ ...q, assertion: val });
                                  }}
                                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-amber-300 uppercase mb-1">Reason (R)</label>
                                <textarea
                                  rows={2}
                                  value={q.reason || ''}
                                  onChange={async e => {
                                    const val = e.target.value;
                                    const updated = questions.map(item => item.id === q.id ? { ...item, reason: val } : item);
                                    setQuestions(updated);
                                    await saveCurrentAffairsQuestion({ ...q, reason: val });
                                  }}
                                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                                />
                              </div>
                            </div>
                          )}

                          {q.questionType === 'multi_statement' && (
                            <div className="bg-blue-950/20 border border-blue-500/30 p-3 rounded-xl">
                              <label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Statements (Comma separated)</label>
                              <textarea
                                rows={2}
                                value={Array.isArray(q.statements) ? q.statements.map((s:any) => typeof s === 'string' ? s : (s.text || '')).join(', ') : (q.statements || '')}
                                onChange={async e => {
                                  const val = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                  const updated = questions.map(item => item.id === q.id ? { ...item, statements: val as any } : item);
                                  setQuestions(updated);
                                  await saveCurrentAffairsQuestion({ ...q, statements: val as any });
                                }}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                              />
                            </div>
                          )}

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
                                    key={opt.id || oIdx}
                                    className={`p-2 rounded-xl border flex items-center space-x-2 transition ${
                                      isCorrect
                                        ? 'bg-emerald-950/40 border-emerald-500/60 ring-1 ring-emerald-500/40'
                                        : 'bg-slate-900/60 border-slate-800'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const updated = questions.map(item => item.id === q.id ? { ...item, correctOption: optKey } : item);
                                        setQuestions(updated);
                                        await saveCurrentAffairsQuestion({ ...q, correctOption: optKey });
                                        showToast(`Marked option ${optKey} as correct.`);
                                      }}
                                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center transition cursor-pointer shrink-0 ${
                                        isCorrect
                                          ? 'bg-emerald-600 text-white shadow-md'
                                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                      }`}
                                      title="Click to mark as correct answer"
                                    >
                                      {optKey}
                                    </button>
                                    <div className="flex-1 space-y-1">
                                      <input
                                        type="text"
                                        value={opt.text || ''}
                                        onChange={async e => {
                                          const val = e.target.value;
                                          const newOpts = [...q.options];
                                          newOpts[oIdx] = { ...newOpts[oIdx], text: val };
                                          const updated = questions.map(item => item.id === q.id ? { ...item, options: newOpts } : item);
                                          setQuestions(updated);
                                          await saveCurrentAffairsQuestion({ ...q, options: newOpts });
                                        }}
                                        placeholder={`Option ${optKey} (EN)`}
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => setEditingQuizQuestionsTopic(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  Close & Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
