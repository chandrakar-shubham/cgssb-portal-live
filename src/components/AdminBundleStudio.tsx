import React, { useState, useEffect, useMemo } from 'react';
import {
  TestSeriesBundle,
  BundleTestItem,
  BundleSyllabusSection,
  OFFICIAL_BUNDLES_CATALOG
} from '../data/bundleCatalog';
import { MockTest, Question, PreviousYearPaper } from '../types';
import {
  getStoredBundles,
  saveStoredBundles,
  saveSingleBundle,
  deleteStoredBundle,
  resetBundlesToDefault
} from '../utils/bundleStore';
import { BulkImportPreviewModal, IngestionPaperConfig } from './BulkImportPreviewModal';
import { mapRawJsonToQuestion } from '../utils/jsonQuestionMapper';
import { extractHierarchyFromApp } from '../utils/examHierarchy';
import {
  Crown,
  Plus,
  Search,
  Filter,
  Layers,
  FileText,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Share2,
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  Download,
  Eye,
  ArrowLeft,
  Save,
  Check,
  Tag,
  GraduationCap,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  HelpCircle,
  Flame,
  Award,
  Link as LinkIcon,
  RefreshCw,
  FolderPlus,
  FileCode,
  CheckSquare,
  Square,
  X
} from 'lucide-react';

interface AdminBundleStudioProps {
  availableTests: MockTest[];
  availableQuestions: Question[];
  onNavigateToPreview: (bundle: TestSeriesBundle) => void;
  onTestsAdded?: (newTests: MockTest[]) => void;
  onQuestionsAdded?: (newQuestions: Question[]) => void;
}

export type IngestionTargetSection = 'mock' | 'chapter' | 'pyp';

export const AdminBundleStudio: React.FC<AdminBundleStudioProps> = ({
  availableTests,
  availableQuestions,
  onNavigateToPreview,
  onTestsAdded,
  onQuestionsAdded,
}) => {
  const [bundles, setBundles] = useState<TestSeriesBundle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorityFilter, setAuthorityFilter] = useState<'ALL' | 'CGSSB' | 'CGPSC'>('ALL');
  const [editingBundle, setEditingBundle] = useState<TestSeriesBundle | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'dates' | 'eligibility' | 'links' | 'pricing' | 'syllabus' | 'tests' | 'faqs' | 'seo'>('basic');
  
  // Proven Ingestion Engine State (BulkImportPreviewModal from Picture 1)
  const [isIngestionEngineOpen, setIsIngestionEngineOpen] = useState(false);
  const [ingestionTargetSection, setIngestionTargetSection] = useState<IngestionTargetSection>('mock');
  const [questionsForIngestion, setQuestionsForIngestion] = useState<Question[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);

  // Quick JSON Upload / Paste Prompt Dialog State
  const [isJsonLoaderOpen, setIsJsonLoaderOpen] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [jsonLoaderError, setJsonLoaderError] = useState<string | null>(null);

  // Attach Existing Tests Modal State
  const [isAttachExistingModalOpen, setIsAttachExistingModalOpen] = useState(false);
  const [attachTargetSection, setAttachTargetSection] = useState<IngestionTargetSection>('mock');
  const [existingTestSearch, setExistingTestSearch] = useState('');

  // Share & SEO Preview Modal State
  const [sharePreviewBundle, setSharePreviewBundle] = useState<TestSeriesBundle | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setBundles(getStoredBundles());
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const allHierarchyRecords = useMemo(() => {
    return extractHierarchyFromApp(availableTests, [], availableQuestions);
  }, [availableTests, availableQuestions]);

  const handleCreateNewBundle = () => {
    const newId = `bundle-custom-${Date.now().toString(36)}`;
    const newBundle: TestSeriesBundle = {
      id: newId,
      slug: `cg-exam-series-${Date.now().toString(36)}`,
      title: 'New CG Test Series 2026',
      titleHindi: 'नवीन छत्तीसगढ़ टेस्ट सीरीज़ 2026',
      authority: 'CGSSB',
      targetPost: 'Exam Aspirants',
      targetYear: 2026,
      badge: 'New Series',
      badgeColor: 'emerald',
      shortDescription: 'Comprehensive test series with full mocks, chapter tests and previous year papers.',
      fullDescription: 'Strictly structured according to the latest official examination blueprint with bilingual questions and instant ranking.',
      price: 149,
      originalPrice: 499,
      isProOnly: false,
      totalTestsCount: 1,
      freeTestsCount: 1,
      enrolledStudentsCount: 120,
      rating: 4.9,
      validity: 'Till Exam Date 2026',
      languageDisplay: 'द्विभाषी (Hindi + English)',
      examPattern: {
        totalQuestions: 100,
        totalMarks: 100,
        durationMinutes: 120,
        markingScheme: '+1.0 Mark for correct answer',
        negativeMarkPenalty: '-0.25 Negative marking per incorrect answer',
        language: 'Bilingual (Hindi / English)',
        cadre: 'Direct Recruitment Cadre',
        keyRules: [
          'Equal weightage for each question.',
          '¼th negative marking penalty for incorrect responses.',
          'Bilingual Hindi and English questions.'
        ]
      },
      syllabusBreakdown: [
        {
          subject: 'Chhattisgarh General Knowledge',
          subjectHindi: 'छत्तीसगढ़ सामान्य ज्ञान',
          marks: 50,
          questionCount: 50,
          weightagePercentage: 50,
          topics: ['इतिहास', 'भूगोल', 'संस्कृति', 'प्रशासनिक ढांचा', 'समसामयिकी']
        },
        {
          subject: 'General Studies & Reasoning',
          subjectHindi: 'सामान्य अध्ययन एवं तार्किक क्षमता',
          marks: 50,
          questionCount: 50,
          weightagePercentage: 50,
          topics: ['भारतीय संविधान', 'गणित', 'हिन्दी व्याकरण', 'कंप्यूटर ज्ञान']
        }
      ],
      features: [
        'Full-Length Model Mocks with latest syllabus pattern',
        'Topic-wise Chapter tests for conceptual clarity',
        'Official Previous Year Papers (PYQ Bank)',
        'State-wide Merit Rank & Percentile calculation',
        'Bilingual Hindi & English test interface'
      ],
      testItems: [
        {
          id: `test-init-${Date.now()}`,
          title: 'Official Model Mock Test 01',
          titleHindi: 'आधिकारिक मॉडल मॉक टेस्ट 01',
          type: 'full_mock',
          questionCount: 100,
          durationMinutes: 120,
          marks: 100,
          isFreePreview: true,
          statusText: 'Free Preview',
          attemptsCount: 240
        }
      ],
      chapterTests: [],
      pypTests: [],
      faqs: [
        {
          question: 'Is this test series according to the latest official pattern?',
          answer: 'Yes, all tests are modelled strictly on official syllabus and previous examination blueprints.'
        }
      ],
      importantDates: {
        notificationDate: 'To be announced',
        formStartDate: 'Upcoming',
        formEndDate: 'Upcoming',
        admitCardDate: '7 Days before exam',
        examDate: '2026',
        resultDate: 'Post Exam',
        status: 'upcoming'
      },
      eligibility: {
        minAge: 21,
        maxAge: 35,
        ageRelaxation: 'As per Chhattisgarh State Government reservation rules.',
        qualification: 'Graduate / Higher Secondary as per specific cadre notification.',
        domicile: 'Bonafide Resident of Chhattisgarh State.',
        experience: 'Freshers and experienced candidates eligible.'
      },
      officialLinks: {
        applyUrl: 'https://vyapam.cgstate.gov.in',
        notificationPdfUrl: 'https://vyapam.cgstate.gov.in',
        officialWebsiteUrl: 'https://vyapam.cgstate.gov.in'
      }
    };

    setEditingBundle(newBundle);
    setActiveTab('basic');
  };

  const handleSaveBundle = () => {
    if (!editingBundle) return;
    
    // Calculate total counts
    const chapterCount = editingBundle.chapterTests?.length || 0;
    const pypCount = editingBundle.pypTests?.length || 0;
    const mockCount = editingBundle.testItems?.length || 0;
    const totalCount = chapterCount + pypCount + mockCount;

    const freeChapterCount = editingBundle.chapterTests?.filter(t => t.isFreePreview).length || 0;
    const freePypCount = editingBundle.pypTests?.filter(t => t.isFreePreview).length || 0;
    const freeMockCount = editingBundle.testItems?.filter(t => t.isFreePreview).length || 0;
    const totalFreeCount = freeChapterCount + freePypCount + freeMockCount;

    const bundleToSave: TestSeriesBundle = {
      ...editingBundle,
      totalTestsCount: totalCount > 0 ? totalCount : 1,
      freeTestsCount: totalFreeCount,
    };

    const updatedList = saveSingleBundle(bundleToSave);
    setBundles(updatedList);
    setEditingBundle(null);
    showToast(`Test Series "${bundleToSave.title}" saved successfully!`);
  };

  const handleDelete = (bundleId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const updated = deleteStoredBundle(bundleId);
      setBundles(updated);
      showToast(`Test Series "${title}" removed.`);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all test series back to official catalog? Custom changes will be restored to defaults.')) {
      const reset = resetBundlesToDefault();
      setBundles(reset);
      showToast('Restored all 6 official Test Series.');
    }
  };

  // --------------------------------------------------------------------------
  // INGESTION STUDIO TRIGGER (Picture 1 Flow)
  // --------------------------------------------------------------------------
  const handleOpenIngestionTrigger = (section: IngestionTargetSection) => {
    setIngestionTargetSection(section);
    setPastedJsonText('');
    setJsonLoaderError(null);
    setIsJsonLoaderOpen(true);
  };

  // Load Sample Questions for Instant Test
  const handleLoadSampleQuestions = () => {
    const isChapter = ingestionTargetSection === 'chapter';
    const isPyp = ingestionTargetSection === 'pyp';
    
    const sampleQuestions: any[] = [
      {
        questionText: isChapter 
          ? 'Which Constitutional Article grants special legislative powers to Chhattisgarh State Assembly?' 
          : 'In which year was the Chhattisgarh State Board of Secondary Education established?',
        questionHindi: isChapter 
          ? 'भारतीय संविधान का कौन सा अनुच्छेद छत्तीसगढ़ राज्य विधानसभा को विशेष विधायी शक्तियां प्रदान करता है?' 
          : 'छत्तीसगढ़ माध्यमिक शिक्षा मण्डल (CGBSE) की स्थापना किस वर्ष हुई थी?',
        options: [
          { text: 'Article 244(A)', textHindi: 'अनुच्छेद 244(क)' },
          { text: 'Article 371(A)', textHindi: 'अनुच्छेद 371(क)' },
          { text: 'Article 356', textHindi: 'अनुच्छेद 356' },
          { text: 'Article 243(M)', textHindi: 'अनुच्छेद 243(एम)' }
        ],
        correctOption: 'A',
        explanation: 'Official explanation with constitutional reference.',
        explanationHindi: 'विस्तृत व्याख्या: आधिकारिक उत्तर विकल्प A है।',
        subject: isChapter ? 'CG Polity & Administration' : 'General Knowledge',
        topic: 'Constitutional Framework',
        difficulty: 'Medium',
        marks: 1.0,
        negativeMarks: 0.25
      },
      {
        questionText: 'Which river is known as the lifeline (Jeevan Rekha) of Chhattisgarh?',
        questionHindi: 'छत्तीसगढ़ की जीवन रेखा किस नदी को कहा जाता है?',
        options: [
          { text: 'Mahanadi', textHindi: 'महानदी' },
          { text: 'Indravati', textHindi: 'इन्द्रावती' },
          { text: 'Shivnath', textHindi: 'शिवनाथ' },
          { text: 'Hasdeo', textHindi: 'हसदेव' }
        ],
        correctOption: 'A',
        explanation: 'Mahanadi originates from Sihawa mountain in Dhamtari district and flows through the center of Chhattisgarh.',
        explanationHindi: 'महानदी धमतरी के सिहावा पर्वत से निकलती है और छत्तीसगढ़ के मध्य भाग को सिंचित करती है।',
        subject: 'Chhattisgarh Geography',
        topic: 'Drainage System of CG',
        difficulty: 'Easy',
        marks: 1.0,
        negativeMarks: 0.25
      }
    ];

    const mapped = sampleQuestions.map((q, idx) => mapRawJsonToQuestion(q, idx));
    setQuestionsForIngestion(mapped);
    setIsJsonLoaderOpen(false);
    setIsIngestionEngineOpen(true);
  };

  // Process File Upload for JSON or CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        parseAndLaunchIngestionEngine(content);
      } catch (err: any) {
        setJsonLoaderError(`Invalid File format: ${err.message}`);
      } finally {
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleParsePastedJson = () => {
    if (!pastedJsonText.trim()) {
      setJsonLoaderError('Please paste JSON data or select a sample template.');
      return;
    }
    parseAndLaunchIngestionEngine(pastedJsonText);
  };

  const parseAndLaunchIngestionEngine = (rawText: string) => {
    try {
      let parsed = JSON.parse(rawText);
      let records: any[] = [];
      if (Array.isArray(parsed)) {
        records = parsed;
      } else if (parsed && Array.isArray(parsed.questions)) {
        records = parsed.questions;
      } else if (parsed && Array.isArray(parsed.data)) {
        records = parsed.data;
      } else if (typeof parsed === 'object') {
        records = [parsed];
      }

      if (records.length === 0) {
        throw new Error('No valid question objects found in JSON payload.');
      }

      const mapped = records.map((r, idx) => mapRawJsonToQuestion(r, idx));
      setQuestionsForIngestion(mapped);
      setIsJsonLoaderOpen(false);
      setJsonLoaderError(null);
      setIsIngestionEngineOpen(true);
    } catch (err: any) {
      setJsonLoaderError(err.message || 'JSON Parse error. Please check formatting.');
    }
  };

  // Confirm Handler from BulkImportPreviewModal (Picture 1 Engine)
  const handleConfirmIngestionFromEngine = (
    paperConfig: IngestionPaperConfig,
    finalQuestions: Question[]
  ) => {
    if (!editingBundle || finalQuestions.length === 0) return;
    setIsIngesting(true);

    try {
      const timestamp = Date.now();
      const testId = `test-${ingestionTargetSection}-${timestamp}`;
      const questionCount = finalQuestions.length;
      const duration = paperConfig.durationMinutes || (ingestionTargetSection === 'chapter' ? 30 : 120);
      const marks = paperConfig.marks || questionCount;

      const taggedQuestions: Question[] = finalQuestions.map(q => ({
        ...q,
        authority: paperConfig.authority || editingBundle.authority,
        category: paperConfig.examCategory,
        subCategory: paperConfig.subCategory || editingBundle.targetPost,
        postName: paperConfig.postName || editingBundle.targetPost,
        examName: paperConfig.examName || paperConfig.title,
        year: paperConfig.year || editingBundle.targetYear,
      }));

      // Generate Playable MockTest Object
      const newMockTest: MockTest = {
        id: testId,
        title: paperConfig.title,
        description: paperConfig.paperSummary || `${paperConfig.title} - Official simulation test.`,
        authority: paperConfig.authority || editingBundle.authority,
        category: paperConfig.examCategory,
        subCategory: paperConfig.subCategory,
        postName: paperConfig.postName,
        examName: paperConfig.examName,
        durationMinutes: duration,
        totalMarks: marks,
        marksPerQuestion: 1.0,
        negativeMarksPerQuestion: 0.25,
        questionCount: questionCount,
        attemptsCount: 0,
        isPublished: true,
        isPro: false,
        isPYP: ingestionTargetSection === 'pyp',
        sections: [
          {
            id: `sec-${testId}-1`,
            name: ingestionTargetSection === 'chapter' ? 'Topic Quiz' : 'All Sections',
            questionIds: taggedQuestions.map(q => q.id)
          }
        ],
        createdAt: new Date().toISOString()
      };

      // Create Bundle Test Item
      const newBundleItem: BundleTestItem = {
        id: testId,
        title: paperConfig.title,
        titleHindi: paperConfig.title,
        type: ingestionTargetSection === 'pyp' ? 'pyp' : (ingestionTargetSection === 'chapter' ? 'sectional' : 'full_mock'),
        questionCount: questionCount,
        durationMinutes: duration,
        marks: marks,
        isFreePreview: true,
        attemptsCount: 0,
        statusText: 'Free Preview'
      };

      // Attach to corresponding bundle section
      if (ingestionTargetSection === 'chapter') {
        const currentList = editingBundle.chapterTests || [];
        setEditingBundle({
          ...editingBundle,
          chapterTests: [newBundleItem, ...currentList]
        });
      } else if (ingestionTargetSection === 'pyp') {
        const currentList = editingBundle.pypTests || [];
        setEditingBundle({
          ...editingBundle,
          pypTests: [newBundleItem, ...currentList]
        });
      } else {
        const currentList = editingBundle.testItems || [];
        setEditingBundle({
          ...editingBundle,
          testItems: [newBundleItem, ...currentList]
        });
      }

      // Save into global repositories
      if (onTestsAdded) onTestsAdded([newMockTest]);
      if (onQuestionsAdded) onQuestionsAdded(taggedQuestions);

      setIsIngestionEngineOpen(false);
      showToast(`🎉 "${paperConfig.title}" ingested & attached to ${editingBundle.title}!`);
    } catch (err: any) {
      alert(`Ingestion error: ${err.message}`);
    } finally {
      setIsIngesting(false);
    }
  };

  // --------------------------------------------------------------------------
  // ATTACH EXISTING TESTS FROM REPOSITORY
  // --------------------------------------------------------------------------
  const handleOpenAttachExistingModal = (section: IngestionTargetSection) => {
    setAttachTargetSection(section);
    setExistingTestSearch('');
    setIsAttachExistingModalOpen(true);
  };

  const handleAttachExistingTest = (test: MockTest) => {
    if (!editingBundle) return;

    const newBundleItem: BundleTestItem = {
      id: test.id,
      title: test.title,
      titleHindi: test.title,
      type: attachTargetSection === 'pyp' ? 'pyp' : (attachTargetSection === 'chapter' ? 'sectional' : 'full_mock'),
      questionCount: test.questionCount || 100,
      durationMinutes: test.durationMinutes || 120,
      marks: test.totalMarks || test.questionCount || 100,
      isFreePreview: true,
      attemptsCount: test.attemptsCount || 0,
      statusText: 'Free Preview'
    };

    if (attachTargetSection === 'chapter') {
      const currentList = editingBundle.chapterTests || [];
      if (currentList.some(t => t.id === test.id)) {
        showToast('This test is already in Chapter Tests.');
        return;
      }
      setEditingBundle({
        ...editingBundle,
        chapterTests: [newBundleItem, ...currentList]
      });
    } else if (attachTargetSection === 'pyp') {
      const currentList = editingBundle.pypTests || [];
      if (currentList.some(t => t.id === test.id)) {
        showToast('This test is already in PYQ Papers.');
        return;
      }
      setEditingBundle({
        ...editingBundle,
        pypTests: [newBundleItem, ...currentList]
      });
    } else {
      const currentList = editingBundle.testItems || [];
      if (currentList.some(t => t.id === test.id)) {
        showToast('This test is already in Full Mock Tests.');
        return;
      }
      setEditingBundle({
        ...editingBundle,
        testItems: [newBundleItem, ...currentList]
      });
    }

    showToast(`✓ Attached "${test.title}" to ${editingBundle.title}!`);
  };

  const filteredBundles = bundles.filter(b => {
    const matchesAuth = authorityFilter === 'ALL' || b.authority === authorityFilter;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.titleHindi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.targetPost.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAuth && matchesSearch;
  });

  const totalSeriesCount = bundles.length;
  const totalAttachedTests = bundles.reduce((acc, b) => 
    acc + (b.testItems?.length || 0) + (b.chapterTests?.length || 0) + (b.pypTests?.length || 0), 0
  );
  const totalEnrolled = bundles.reduce((acc, b) => acc + (b.enrolledStudentsCount || 0), 0);

  // --------------------------------------------------------------------------
  // RENDER: EDITING VIEW
  // --------------------------------------------------------------------------
  if (editingBundle) {
    return (
      <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
        
        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* PROVEN INGESTION STUDIO ENGINE (Picture 1 Component)               */}
        {/* ================================================================= */}
        <BulkImportPreviewModal
          isOpen={isIngestionEngineOpen}
          records={questionsForIngestion}
          onClose={() => setIsIngestionEngineOpen(false)}
          onConfirm={handleConfirmIngestionFromEngine}
          isImporting={isIngesting}
          allRecords={allHierarchyRecords}
          existingTests={availableTests}
        />

        {/* ================================================================= */}
        {/* QUICK JSON / CSV LOADER DIALOG (Feeds directly to Ingestion Studio) */}
        {/* ================================================================= */}
        {isJsonLoaderOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Load Questions for Ingestion Studio
                    </h3>
                    <p className="text-xs text-slate-400">
                      Target: <span className="text-emerald-400 font-bold uppercase">{ingestionTargetSection} TEST</span> for "{editingBundle.title}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsJsonLoaderOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleQuestions}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load 2026 Sample Questions</span>
                  </button>
                </div>

                <label className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer">
                  <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                  <span>Upload .JSON / .CSV File</span>
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste Textarea */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Or Paste Raw JSON Questions Array / Exam Object:
                </label>
                <textarea
                  rows={8}
                  value={pastedJsonText}
                  onChange={e => {
                    setPastedJsonText(e.target.value);
                    setJsonLoaderError(null);
                  }}
                  placeholder={`[\n  {\n    "questionText": "When was Chhattisgarh state formed?",\n    "questionHindi": "छत्तीसगढ़ राज्य का गठन कब हुआ था?",\n    "options": ["1 Nov 2000", "1 Nov 2001", "15 Aug 2000", "26 Jan 2000"],\n    "correctOption": "A",\n    "subject": "Chhattisgarh GK"\n  }\n]`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {jsonLoaderError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jsonLoaderError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIsJsonLoaderOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParsePastedJson}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Ingestion Studio Engine</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* ATTACH EXISTING TESTS MODAL                                        */}
        {/* ================================================================= */}
        {isAttachExistingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Attach Existing Test from Repository
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select any existing mock or PYP test to link directly into <span className="text-emerald-400 font-bold uppercase">{attachTargetSection} TESTS</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAttachExistingModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={existingTestSearch}
                  onChange={e => setExistingTestSearch(e.target.value)}
                  placeholder="Search existing mock tests, PYP papers, or categories..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Available Tests List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {availableTests
                  .filter(t => {
                    const q = existingTestSearch.toLowerCase();
                    return t.title.toLowerCase().includes(q) ||
                      (t.category && t.category.toLowerCase().includes(q)) ||
                      (t.subCategory && t.subCategory.toLowerCase().includes(q));
                  })
                  .map(test => {
                    const isAlreadyAttached = 
                      (editingBundle.testItems || []).some(item => item.id === test.id) ||
                      (editingBundle.chapterTests || []).some(item => item.id === test.id) ||
                      (editingBundle.pypTests || []).some(item => item.id === test.id);

                    return (
                      <div
                        key={test.id}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                          isAlreadyAttached
                            ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1 max-w-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{test.title}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {test.category}
                            </span>
                            {test.isPYP && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                                PYP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                            <span>{test.questionCount} Questions</span>
                            <span>•</span>
                            <span>{test.durationMinutes} Mins</span>
                            <span>•</span>
                            <span>{test.totalMarks || test.questionCount} Marks</span>
                          </div>
                        </div>

                        <div>
                          {isAlreadyAttached ? (
                            <span className="text-[11px] font-bold text-slate-500 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                              ✓ Already Attached
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAttachExistingTest(test)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Attach to Series</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAttachExistingModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Studio Top Control Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setEditingBundle(null)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Back to series catalog"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  editingBundle.authority === 'CGPSC' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {editingBundle.authority} Official
                </span>
                <span className="text-xs text-slate-400 font-mono">/series/{editingBundle.slug}</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">{editingBundle.title}</h2>
              <p className="text-xs text-slate-400">{editingBundle.titleHindi}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateToPreview(editingBundle)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview Live Page</span>
            </button>
            <button
              type="button"
              onClick={() => setSharePreviewBundle(editingBundle)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>SEO & Share Card</span>
            </button>
            <button
              type="button"
              onClick={handleSaveBundle}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Editor Navigation Tabs */}
        <div className="flex overflow-x-auto scrollbar-none space-x-2 p-1.5 bg-slate-900/80 border border-slate-800/80 rounded-2xl">
          {[
            { id: 'basic', label: '1. Basic Info', icon: Crown },
            { id: 'dates', label: '2. Exam Dates & Timeline', icon: Calendar },
            { id: 'eligibility', label: '3. Eligibility & Rules', icon: GraduationCap },
            { id: 'links', label: '4. Official Apply Links', icon: LinkIcon },
            { id: 'pricing', label: '5. Pricing & Access', icon: Tag },
            { id: 'syllabus', label: '6. Syllabus & Pattern', icon: BookOpen },
            { id: 'tests', label: '7. Attached Tests & Ingestion Engine', icon: Layers, highlight: true },
            { id: 'faqs', label: '8. FAQs & Features', icon: HelpCircle },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : tab.highlight
                    ? 'bg-indigo-950/40 text-indigo-300 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: BASIC INFO */}
        {activeTab === 'basic' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Crown className="w-5 h-5 text-indigo-400" />
              <span>Basic Series Information & Branding</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Title (English)</label>
                <input
                  type="text"
                  value={editingBundle.title}
                  onChange={e => {
                    const title = e.target.value;
                    const autoSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEditingBundle({
                      ...editingBundle,
                      title,
                      slug: editingBundle.slug.startsWith('cg-exam-series-') ? autoSlug : editingBundle.slug
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Assistant Teacher 2026 Test Series"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Title (Hindi / हिन्दी)</label>
                <input
                  type="text"
                  value={editingBundle.titleHindi}
                  onChange={e => setEditingBundle({ ...editingBundle, titleHindi: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="सहायक शिक्षक भर्ती परीक्षा 2026"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">URL Slug (Dedicated SEO Page)</label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-slate-950 border border-r-0 border-slate-800 rounded-l-xl text-xs text-slate-500 font-mono">
                    /series/
                  </span>
                  <input
                    type="text"
                    value={editingBundle.slug}
                    onChange={e => setEditingBundle({ ...editingBundle, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-r-xl p-3 text-xs font-mono text-emerald-400 focus:border-indigo-500 focus:outline-none"
                    placeholder="assistant-teacher-2026"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Authority Exam Board</label>
                <select
                  value={editingBundle.authority}
                  onChange={e => setEditingBundle({ ...editingBundle, authority: e.target.value as 'CGSSB' | 'CGPSC' })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="CGSSB">CGSSB / CG Vyapam (व्यापम बोर्ड)</option>
                  <option value="CGPSC">CGPSC (छत्तीसगढ़ लोक सेवा आयोग)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Target Post / Cadre</label>
                <input
                  type="text"
                  value={editingBundle.targetPost}
                  onChange={e => setEditingBundle({ ...editingBundle, targetPost: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Primary Teacher (Class 1 to 5)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Target Year</label>
                  <input
                    type="number"
                    value={editingBundle.targetYear}
                    onChange={e => setEditingBundle({ ...editingBundle, targetYear: Number(e.target.value) || 2026 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Badge Text</label>
                  <input
                    type="text"
                    value={editingBundle.badge}
                    onChange={e => setEditingBundle({ ...editingBundle, badge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="High Yield / Newly Launched"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Short Summary (Shown on Cards)</label>
                <textarea
                  rows={2}
                  value={editingBundle.shortDescription}
                  onChange={e => setEditingBundle({ ...editingBundle, shortDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Summary for test series listing card..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Full Detailed Overview</label>
                <textarea
                  rows={4}
                  value={editingBundle.fullDescription}
                  onChange={e => setEditingBundle({ ...editingBundle, fullDescription: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Detailed blueprint description, features, and preparation methodology..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IMPORTANT DATES & TIMELINE */}
        {activeTab === 'dates' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>Official Exam Dates & Live Notification Timeline</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                These dates power the countdown timer, status badge, and official timeline on the dedicated test series page.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Exam Status Stage</label>
                <select
                  value={editingBundle.importantDates?.status || 'upcoming'}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    importantDates: {
                      ...editingBundle.importantDates,
                      status: e.target.value as any
                    }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none font-bold"
                >
                  <option value="upcoming">⏳ Upcoming / Notification Expected</option>
                  <option value="ongoing">🟢 Application Form Active (Live)</option>
                  <option value="admit_card_out">🎟️ Admit Card Released</option>
                  <option value="exam_completed">📝 Exam Concluded / Answer Key</option>
                  <option value="result_declared">🏆 Final Merit Result Declared</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Notification Release Date</label>
                <input
                  type="text"
                  value={editingBundle.importantDates?.notificationDate || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    importantDates: { ...editingBundle.importantDates, notificationDate: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 15 Jan 2026"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Application Form Start Date</label>
                <input
                  type="text"
                  value={editingBundle.importantDates?.formStartDate || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    importantDates: { ...editingBundle.importantDates, formStartDate: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 01 Feb 2026"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Application Form Last Date</label>
                <input
                  type="text"
                  value={editingBundle.importantDates?.formEndDate || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    importantDates: { ...editingBundle.importantDates, formEndDate: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none font-bold text-rose-300"
                  placeholder="e.g. 28 Feb 2026 (11:59 PM)"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Correction Window Last Date</label>
                <input
                  type="text"
                  value={editingBundle.importantDates?.correctionLastDate || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    importantDates: { ...editingBundle.importantDates, correctionLastDate: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 03 Mar 2026"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Admit Card Release Date</label>
                <input
                  type="text"
                  value={editingBundle.importantDates?.admitCardDate || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    importantDates: { ...editingBundle.importantDates, admitCardDate: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 10 Apr 2026"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Official Exam Date (Target)</label>
                <input
                  type="text"
                  value={editingBundle.importantDates?.examDate || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    importantDates: { ...editingBundle.importantDates, examDate: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none font-black text-emerald-400"
                  placeholder="e.g. 26 Apr 2026 (Sunday)"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Result & Model Answer Date</label>
                <input
                  type="text"
                  value={editingBundle.importantDates?.resultDate || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    importantDates: { ...editingBundle.importantDates, resultDate: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. May/June 2026"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ELIGIBILITY & RULES */}
        {activeTab === 'eligibility' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>Eligibility Criteria & Domicile Guidelines</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Minimum Age Limit</label>
                  <input
                    type="number"
                    value={editingBundle.eligibility?.minAge || 21}
                    onChange={e => setEditingBundle({
                      ...editingBundle,
                      eligibility: { ...editingBundle.eligibility, minAge: Number(e.target.value) }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 mb-1.5 block">Maximum Age Limit</label>
                  <input
                    type="number"
                    value={editingBundle.eligibility?.maxAge || 35}
                    onChange={e => setEditingBundle({
                      ...editingBundle,
                      eligibility: { ...editingBundle.eligibility, maxAge: Number(e.target.value) }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Age Relaxation Rules</label>
                <input
                  type="text"
                  value={editingBundle.eligibility?.ageRelaxation || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    eligibility: { ...editingBundle.eligibility, ageRelaxation: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="5 years relaxation for SC/ST/OBC and women residents..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Educational Qualifications (शैक्षणिक अर्हता)</label>
                <textarea
                  rows={2}
                  value={editingBundle.eligibility?.qualification || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    eligibility: { ...editingBundle.eligibility, qualification: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Higher Secondary (10+2) + D.El.Ed / B.Ed + Qualified CG-TET / CTET..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Domicile & Residence Condition (मूल निवास प्रमाण पत्र)</label>
                <input
                  type="text"
                  value={editingBundle.eligibility?.domicile || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    eligibility: { ...editingBundle.eligibility, domicile: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Candidate must be a Bonafide resident of Chhattisgarh state."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OFFICIAL APPLY LINKS */}
        {activeTab === 'links' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-emerald-400" />
                <span>Official Vyapam / CGPSC Application & PDF Links</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Provides direct CTA buttons for students to apply directly on the official government portals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Official Online Apply Portal URL</label>
                <input
                  type="url"
                  value={editingBundle.officialLinks?.applyUrl || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    officialLinks: { ...editingBundle.officialLinks, applyUrl: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-400 font-mono focus:border-indigo-500 focus:outline-none"
                  placeholder="https://vyapam.cgstate.gov.in/online-application"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Official Notification PDF Link</label>
                <input
                  type="url"
                  value={editingBundle.officialLinks?.notificationPdfUrl || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    officialLinks: { ...editingBundle.officialLinks, notificationPdfUrl: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-blue-400 font-mono focus:border-indigo-500 focus:outline-none"
                  placeholder="https://vyapam.cgstate.gov.in/notifications/exam-2026.pdf"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Official Board Website</label>
                <input
                  type="url"
                  value={editingBundle.officialLinks?.officialWebsiteUrl || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    officialLinks: { ...editingBundle.officialLinks, officialWebsiteUrl: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                  placeholder="https://vyapam.cgstate.gov.in or https://psc.cg.gov.in"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Detailed Syllabus PDF Link</label>
                <input
                  type="url"
                  value={editingBundle.officialLinks?.syllabusPdfUrl || ''}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    officialLinks: { ...editingBundle.officialLinks, syllabusPdfUrl: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                  placeholder="https://vyapam.cgstate.gov.in/syllabus/2026.pdf"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PRICING & ACCESS */}
        {activeTab === 'pricing' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <Tag className="w-5 h-5 text-emerald-400" />
              <span>Pricing, Discounts & Access Control</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Offer Price (₹)</label>
                <input
                  type="number"
                  value={editingBundle.price}
                  onChange={e => setEditingBundle({ ...editingBundle, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-emerald-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Original Price (₹ MRP)</label>
                <input
                  type="number"
                  value={editingBundle.originalPrice}
                  onChange={e => setEditingBundle({ ...editingBundle, originalPrice: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 line-through focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Pass Validity Display</label>
                <input
                  type="text"
                  value={editingBundle.validity}
                  onChange={e => setEditingBundle({ ...editingBundle, validity: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Till Exam Date 2026"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Simulated Enrolled Count</label>
                <input
                  type="number"
                  value={editingBundle.enrolledStudentsCount}
                  onChange={e => setEditingBundle({ ...editingBundle, enrolledStudentsCount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Rating Score (1.0 to 5.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={editingBundle.rating}
                  onChange={e => setEditingBundle({ ...editingBundle, rating: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-400 font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Language Display</label>
                <input
                  type="text"
                  value={editingBundle.languageDisplay}
                  onChange={e => setEditingBundle({ ...editingBundle, languageDisplay: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="द्विभाषी (Hindi + English)"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SYLLABUS & PATTERN */}
        {activeTab === 'syllabus' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Official Exam Pattern & Subject Syllabus Breakdown</span>
            </h3>

            {/* Pattern Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">Total Questions</label>
                <input
                  type="number"
                  value={editingBundle.examPattern?.totalQuestions || 100}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    examPattern: { ...editingBundle.examPattern, totalQuestions: Number(e.target.value) }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">Total Marks</label>
                <input
                  type="number"
                  value={editingBundle.examPattern?.totalMarks || 100}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    examPattern: { ...editingBundle.examPattern, totalMarks: Number(e.target.value) }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">Duration (Minutes)</label>
                <input
                  type="number"
                  value={editingBundle.examPattern?.durationMinutes || 120}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    examPattern: { ...editingBundle.examPattern, durationMinutes: Number(e.target.value) }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">Negative Marking</label>
                <input
                  type="text"
                  value={editingBundle.examPattern?.negativeMarkPenalty || '-0.25'}
                  onChange={e => setEditingBundle({
                    ...editingBundle,
                    examPattern: { ...editingBundle.examPattern, negativeMarkPenalty: e.target.value }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-rose-400"
                />
              </div>
            </div>

            {/* Subject Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Subject Breakdown ({editingBundle.syllabusBreakdown?.length || 0} Sections)</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = editingBundle.syllabusBreakdown || [];
                    setEditingBundle({
                      ...editingBundle,
                      syllabusBreakdown: [
                        ...current,
                        {
                          subject: 'New Subject',
                          subjectHindi: 'नया विषय',
                          marks: 25,
                          questionCount: 25,
                          weightagePercentage: 25,
                          topics: ['Topic 1', 'Topic 2']
                        }
                      ]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Subject Section</span>
                </button>
              </div>

              <div className="space-y-3">
                {editingBundle.syllabusBreakdown?.map((sec, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Subject Name (EN)</label>
                        <input
                          type="text"
                          value={sec.subject}
                          onChange={e => {
                            const updated = [...editingBundle.syllabusBreakdown];
                            updated[idx].subject = e.target.value;
                            setEditingBundle({ ...editingBundle, syllabusBreakdown: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Subject Name (HI)</label>
                        <input
                          type="text"
                          value={sec.subjectHindi}
                          onChange={e => {
                            const updated = [...editingBundle.syllabusBreakdown];
                            updated[idx].subjectHindi = e.target.value;
                            setEditingBundle({ ...editingBundle, syllabusBreakdown: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 block mb-1">Marks</label>
                          <input
                            type="number"
                            value={sec.marks}
                            onChange={e => {
                              const updated = [...editingBundle.syllabusBreakdown];
                              updated[idx].marks = Number(e.target.value);
                              setEditingBundle({ ...editingBundle, syllabusBreakdown: updated });
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-emerald-400 font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingBundle.syllabusBreakdown.filter((_, i) => i !== idx);
                            setEditingBundle({ ...editingBundle, syllabusBreakdown: updated });
                          }}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 mt-4 transition"
                          title="Remove subject"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ATTACHED TESTS & INGESTION STUDIO ENGINE */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            
            {/* Top Ingestion CTA Cards (Using the Proven Ingestion Studio Engine) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Option A: Chapter Test JSON */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-indigo-900/40 hover:border-indigo-500/40 transition flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-indigo-300">Chapter & Topic Quizzes</span>
                    </div>
                    <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-bold border border-indigo-500/30">
                      Ingestion Studio
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white">Import Chapter Test</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingest topic-wise test with live question editor, hierarchy tagging, and subject weightage.
                  </p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenIngestionTrigger('chapter')}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Import JSON to Chapter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAttachExistingModal('chapter')}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-700"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Attach Existing Chapter Test</span>
                  </button>
                </div>
              </div>

              {/* Option B: Full Mock Test JSON */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-emerald-900/40 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-300">100-150 Qs Full Mocks</span>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                      Ingestion Studio
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white">Import Full Mock Test</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Load 100-150 bilingual questions with live card preview, timer, and automatic section distribution.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenIngestionTrigger('mock')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Import JSON to Full Mock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAttachExistingModal('mock')}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-700"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attach Existing Mock Test</span>
                  </button>
                </div>
              </div>

              {/* Option C: PYP Test JSON */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-amber-900/40 hover:border-amber-500/40 transition flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-amber-300">Original Past Papers</span>
                    </div>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                      Ingestion Studio
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white">Import PYQ / Past Paper</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Attach past year official question papers tagged with examination year, shift, and syllabus mapping.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenIngestionTrigger('pyp')}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-amber-600/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Import JSON to PYQ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAttachExistingModal('pyp')}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-700"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Attach Existing PYQ Paper</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Attached Tests Lists */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              
              {/* Section 1: Full Mock Tests */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-black text-white">Full-Length Mock Tests ({editingBundle.testItems?.length || 0})</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAttachExistingModal('mock')}
                      className="text-xs text-slate-400 hover:text-white font-bold flex items-center space-x-1"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Attach Existing</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => handleOpenIngestionTrigger('mock')}
                      className="text-xs text-emerald-400 hover:underline font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ingest New JSON</span>
                    </button>
                  </div>
                </div>

                {(!editingBundle.testItems || editingBundle.testItems.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                    No full-length mock tests attached yet. Use the buttons above to import or attach tests.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingBundle.testItems.map((test, idx) => (
                      <div key={test.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{test.title}</span>
                            {test.isFreePreview ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Free Preview</span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">Pro Only</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span>{test.questionCount} Questions</span>
                            <span>•</span>
                            <span>{test.durationMinutes} Mins</span>
                            <span>•</span>
                            <span>{test.marks} Marks</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editingBundle.testItems];
                              updated[idx].isFreePreview = !updated[idx].isFreePreview;
                              setEditingBundle({ ...editingBundle, testItems: updated });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                          >
                            Toggle Free
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editingBundle.testItems.filter((_, i) => i !== idx);
                              setEditingBundle({ ...editingBundle, testItems: updated });
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Chapter / Sectional Tests */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-black text-white">Chapter & Sectional Tests ({editingBundle.chapterTests?.length || 0})</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAttachExistingModal('chapter')}
                      className="text-xs text-slate-400 hover:text-white font-bold flex items-center space-x-1"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Attach Existing</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => handleOpenIngestionTrigger('chapter')}
                      className="text-xs text-indigo-400 hover:underline font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ingest New JSON</span>
                    </button>
                  </div>
                </div>

                {(!editingBundle.chapterTests || editingBundle.chapterTests.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                    No chapter tests attached. Use the buttons above to import topic quizzes via Ingestion Studio.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingBundle.chapterTests.map((test, idx) => (
                      <div key={test.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{test.title}</span>
                            {test.isFreePreview && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Free Preview</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span>{test.questionCount} Questions</span>
                            <span>•</span>
                            <span>{test.durationMinutes} Mins</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(editingBundle.chapterTests || [])];
                              updated[idx].isFreePreview = !updated[idx].isFreePreview;
                              setEditingBundle({ ...editingBundle, chapterTests: updated });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                          >
                            Toggle Free
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingBundle.chapterTests || []).filter((_, i) => i !== idx);
                              setEditingBundle({ ...editingBundle, chapterTests: updated });
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: PYP Papers */}
              <div className="pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-black text-white">Previous Year Question Papers ({editingBundle.pypTests?.length || 0})</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAttachExistingModal('pyp')}
                      className="text-xs text-slate-400 hover:text-white font-bold flex items-center space-x-1"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Attach Existing</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => handleOpenIngestionTrigger('pyp')}
                      className="text-xs text-amber-400 hover:underline font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ingest New JSON</span>
                    </button>
                  </div>
                </div>

                {(!editingBundle.pypTests || editingBundle.pypTests.length === 0) ? (
                  <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                    No past year papers attached yet. Click "Ingest New JSON" or "Attach Existing" to add official papers.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingBundle.pypTests.map((test, idx) => (
                      <div key={test.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{test.title}</span>
                            {test.isFreePreview && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Free Preview</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span>{test.questionCount} Questions</span>
                            <span>•</span>
                            <span>{test.durationMinutes} Mins</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(editingBundle.pypTests || [])];
                              updated[idx].isFreePreview = !updated[idx].isFreePreview;
                              setEditingBundle({ ...editingBundle, pypTests: updated });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                          >
                            Toggle Free
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingBundle.pypTests || []).filter((_, i) => i !== idx);
                              setEditingBundle({ ...editingBundle, pypTests: updated });
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 8: FAQS & FEATURES */}
        {activeTab === 'faqs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-base font-black text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>Frequently Asked Questions & Key Highlights</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">FAQs List</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = editingBundle.faqs || [];
                    setEditingBundle({
                      ...editingBundle,
                      faqs: [...current, { question: 'New Question', answer: 'Detailed answer here...' }]
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add FAQ Item</span>
                </button>
              </div>

              <div className="space-y-3">
                {editingBundle.faqs?.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={e => {
                          const updated = [...editingBundle.faqs];
                          updated[idx].question = e.target.value;
                          setEditingBundle({ ...editingBundle, faqs: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-bold text-white mr-2"
                        placeholder="Question..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingBundle.faqs.filter((_, i) => i !== idx);
                          setEditingBundle({ ...editingBundle, faqs: updated });
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={e => {
                        const updated = [...editingBundle.faqs];
                        updated[idx].answer = e.target.value;
                        setEditingBundle({ ...editingBundle, faqs: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                      placeholder="Answer..."
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: CATALOG LIST VIEW
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* SEO & Share Preview Modal */}
      {sharePreviewBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">Google Indexing & Social Share Preview</h3>
              </div>
              <button
                onClick={() => setSharePreviewBundle(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Google Search Result Preview */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Google Search Result Rich Snippet
              </span>
              <div className="p-4 rounded-2xl bg-white text-slate-900 shadow-lg space-y-1 font-sans">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <span className="font-medium text-emerald-700">https://cgssb-portal.in › series › {sharePreviewBundle.slug}</span>
                </div>
                <h4 className="text-base text-[#1a0dab] hover:underline font-medium leading-tight">
                  {sharePreviewBundle.title} (2026) – Syllabus, Eligibility & Mock Tests
                </h4>
                <p className="text-xs text-slate-700 line-clamp-2">
                  {sharePreviewBundle.shortDescription} Exam Pattern: {sharePreviewBundle.examPattern?.totalMarks} Marks ({sharePreviewBundle.examPattern?.durationMinutes} Mins). Includes Official Syllabus and Free Preview Mock Tests.
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-amber-700 pt-1 font-semibold">
                  <span>★★★★★ Rating: {sharePreviewBundle.rating}</span>
                  <span>•</span>
                  <span>{sharePreviewBundle.enrolledStudentsCount} Aspirants Enrolled</span>
                  <span>•</span>
                  <span>Free & Pass Pro</span>
                </div>
              </div>
            </div>

            {/* WhatsApp / Social Card Preview */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                WhatsApp & Telegram Social Card Preview
              </span>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="h-28 rounded-xl bg-gradient-to-r from-indigo-900 via-slate-900 to-emerald-950 border border-indigo-500/20 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500 text-white">
                      {sharePreviewBundle.authority} Official Series
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">₹{sharePreviewBundle.price}</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white">{sharePreviewBundle.title}</h5>
                    <p className="text-[11px] text-slate-300">{sharePreviewBundle.titleHindi}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">{sharePreviewBundle.title}</span> – Mock tests, chapter tests, syllabus & previous year papers.
                </div>
              </div>
            </div>

            {/* Share Link Actions */}
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : 'https://cgssb-portal.in'}/series/${sharePreviewBundle.slug}`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-emerald-400 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/series/${sharePreviewBundle.slug}`;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 flex items-center space-x-1.5 transition"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Management Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20">
                <Crown className="w-5 h-5" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 tracking-wide uppercase">
                Test Series & Bundle Studio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Manage Exam Series, Syllabi & Curriculum
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Create, edit, and organize individual test series bundles with dedicated indexing URLs, syllabus breakdowns, eligibility guidelines, application dates, and the full Ingestion Studio engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex items-center space-x-2 transition cursor-pointer"
              title="Reset default catalog"
            >
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={handleCreateNewBundle}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs shadow-xl shadow-indigo-600/30 flex items-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Test Series</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Total Live Series</span>
            <span className="text-xl font-black text-white">{totalSeriesCount} Bundles</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Attached Tests</span>
            <span className="text-xl font-black text-emerald-400">{totalAttachedTests} Tests</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Aspirants Enrolled</span>
            <span className="text-xl font-black text-indigo-300">{totalEnrolled.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Indexing Status</span>
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 inline-block mt-1">
              ✓ OpenGraph & SEO Ready
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search test series by title, cadre, or slug..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'CGSSB', 'CGPSC'] as const).map(auth => (
            <button
              key={auth}
              onClick={() => setAuthorityFilter(auth)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                authorityFilter === auth
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {auth === 'ALL' ? 'All Boards' : auth}
            </button>
          ))}
        </div>
      </div>

      {/* Series Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBundles.map(bundle => {
          const totalTests = (bundle.testItems?.length || 0) + (bundle.chapterTests?.length || 0) + (bundle.pypTests?.length || 0);
          const isCgpsc = bundle.authority === 'CGPSC';

          return (
            <div
              key={bundle.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 hover:border-indigo-500/40 transition flex flex-col justify-between shadow-xl relative group"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isCgpsc
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  }`}>
                    {bundle.authority} • {bundle.targetYear}
                  </span>
                  
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {bundle.badge || 'Active'}
                  </span>
                </div>

                <h3 className="text-base font-black text-white group-hover:text-indigo-400 transition leading-snug">
                  {bundle.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{bundle.titleHindi}</p>

                {/* Slug Badge */}
                <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">/series/{bundle.slug}</span>
                </div>

                {/* Important Date Pill */}
                {bundle.importantDates?.examDate && (
                  <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-amber-300 bg-amber-950/30 px-2.5 py-1 rounded-xl border border-amber-500/20">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Target Exam: <strong>{bundle.importantDates.examDate}</strong></span>
                  </div>
                )}

                {/* Content Breakdown Tags */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Mocks</span>
                    <span className="font-black text-white">{bundle.testItems?.length || 0}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Chapters</span>
                    <span className="font-black text-indigo-400">{bundle.chapterTests?.length || 0}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">PYQ Papers</span>
                    <span className="font-black text-amber-400">{bundle.pypTests?.length || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs">
                  <div className="flex items-center space-x-1 text-slate-300">
                    <span className="text-base font-black text-emerald-400">₹{bundle.price}</span>
                    <span className="text-[11px] text-slate-500 line-through">₹{bundle.originalPrice}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">{bundle.freeTestsCount || 1} Free Previews</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSharePreviewBundle(bundle)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Share preview & SEO card"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToPreview(bundle)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 transition"
                  title="View Dedicated Student Page"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBundle(bundle);
                    setActiveTab('basic');
                  }}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Series</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(bundle.id, bundle.title)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                  title="Delete Series"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
