import React, { useState, useEffect } from 'react';
import {
  TestSeriesBundle,
  BundleTestItem,
  BundleSyllabusSection,
} from '../data/bundleCatalog';
import { MockTest, Question, PreviousYearPaper } from '../types';
import {
  getStoredBundles,
  saveStoredBundles,
  saveSingleBundle,
  deleteStoredBundle,
  toggleBundlePublish,
  syncBundlesFromFirestore,
  doesTestMatchBundle,
  reconcileAllTestsWithBundles,
  convertMockTestToBundleItem,
  getTrashItems,
  moveToTrashBundle,
  restoreBundleFromTrash,
  moveToTrashTest,
  restoreTestFromTrash,
  purgeTrashItem,
  cleanTestFromAllBundles,
  findBundlesContainingTest,
  cascadeBundlePublishStatus,
  TrashedItem,
} from '../utils/bundleStore';
import { BulkImportPreviewModal, IngestionPaperConfig } from './BulkImportPreviewModal';
import { mapRawJsonToQuestion } from '../utils/jsonQuestionMapper';
import { saveBundleToFirestore } from '../firebase/firestoreService';
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
  EyeOff,
  ArrowLeft,
  Save,
  Check,
  Tag,
  GraduationCap,
  FileCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MoveUp,
  MoveDown,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  CloudDownload,
  ListPlus,
  FileSpreadsheet,
  HelpCircle,
  Flame,
  Award,
  Link as LinkIcon,
  RefreshCw,
  FolderPlus,
  FileCode,
  CheckSquare,
  Square,
  X,
  Archive,
  RotateCcw,
  AlertTriangle,
  Zap,
  Play,
} from 'lucide-react';

interface AdminBundleStudioProps {
  availableTests: MockTest[];
  availableQuestions: Question[];
  onNavigateToPreview: (bundle: TestSeriesBundle) => void;
  onTestsAdded?: (newTests: MockTest[]) => void;
  onQuestionsAdded?: (newQuestions: Question[]) => void;
  onOpenUniversalIngest?: (config?: {
    type?: 'MOCK_TEST' | 'PYP' | 'CHAPTER_TEST' | 'QUESTION_BANK';
    lockType?: boolean;
    authority?: string;
    examName?: string;
    cadre?: string;
    bundleId?: string;
  }) => void;
  onDeleteTest?: (testId: string) => void;
  onTogglePublishTest?: (testId: string) => void;
  onStartTest?: (test: MockTest) => void;
}

export type IngestionTargetSection = 'mock' | 'chapter' | 'pyp';

const SYLLABUS_TOPIC_PRESETS: Record<string, string[]> = {
  'Child Development & Pedagogy': [
    'विकास की अवधारणा एवं अधिगम से उसका संबंध',
    'बाल विकास के सिद्धांत (Piaget, Kohlberg, Vygotsky)',
    'समावेशी शिक्षा की अवधारणा एवं विशेष आवश्यकता वाले बच्चे',
    'अधिगम एवं शिक्षणशास्त्र (Learning & Pedagogy)',
    'सतत एवं समग्र मूल्यांकन (CCE)',
  ],
  'General Hindi': [
    'वर्ण विचार: स्वर, व्यंजन, वर्तनी व संधि',
    'शब्द रचना: उपसर्ग, प्रत्यय, समास',
    'शब्द प्रकार: तत्सम, तद्भव, देशज, विदेशी',
    'संज्ञा, सर्वनाम, क्रिया, विशेषण, कारक, लिंग, वचन',
    'पर्यायवाची, विलोम शब्द, मुहावरे एवं लोकोक्तियां (छत्तीसगढ़ी हाना सहित)',
  ],
  'General English': [
    'Reading Comprehension & Unseen Passages',
    'Grammar: Tenses, Prepositions, Articles, Active/Passive Voice',
    'Direct and Indirect Speech, Modal Auxiliaries',
    'Vocabulary: Synonyms, Antonyms, One Word Substitution',
    'Pedagogy of English Language Teaching (Class 1-5 / 6-8)',
  ],
  'Mathematics': [
    'संख्या प्रणाली (Number System) एवं भिन्न',
    'वर्गमूल, घनमूल, ल.स.प. एवं म.स.प. (LCM & HCF)',
    'प्रतिशत, लाभ-हानि, साधारण एवं चक्रवृद्धि ब्याज',
    'अनुपात-समानुपात, समय एवं कार्य, चाल-दूरी-समय',
    'ज्यामिति: कोण, त्रिभुज, चतुर्भुज एवं वृत्त (Mensuration 2D/3D)',
  ],
  'Environmental Studies (EVS)': [
    'स्वयं के पर्यावरण को समझना व परिवेशीय अध्ययन',
    'पारिस्थितिकी तंत्र (Ecosystem), जैव विविधता एवं संरक्षण',
    'पर्यावरण प्रदूषण एवं निवारण के उपाय',
    'छत्तीसगढ़ की नदियां, जलप्रपात, वन एवं राष्ट्रीय उद्यान',
    'पर्यावरण अध्ययन शिक्षण विधियां (EVS Pedagogy)',
  ],
  'Computer Knowledge': [
    'Computer Hardware & Architecture (CPU, RAM, ROM)',
    'Input and Output Devices (Printer, Scanner, OCR)',
    'Operating Systems (Windows, Linux, Android)',
    'Internet, Email, MS Office (Word, Excel, PowerPoint)',
    'Cyber Security, Virus and Antivirus Fundamentals',
  ],
  'Chhattisgarh GK': [
    'छत्तीसगढ़ का इतिहास एवं प्रमुख राजवंश (कलचुरी, मराठा, ब्रिटिश काल)',
    'छत्तीसगढ़ का भूगोल: नदियां, मिट्टी, जलवायु, खनिज एवं उद्योग',
    'छत्तीसगढ़ की जनजातियां, लोक कला, संस्कृति, तीज-त्यौहार एवं नृत्य',
    'छत्तीसगढ़ की प्रशासनिक संरचना एवं पंचायती राज',
    'छत्तीसगढ़ समसामयिकी एवं प्रमुख शासकीय योजनाएं',
  ],
};

export const AdminBundleStudio: React.FC<AdminBundleStudioProps> = ({
  availableTests,
  availableQuestions,
  onNavigateToPreview,
  onTestsAdded,
  onQuestionsAdded,
  onOpenUniversalIngest,
  onDeleteTest,
  onTogglePublishTest,
  onStartTest,
}) => {
  const [bundles, setBundles] = useState<TestSeriesBundle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorityFilter, setAuthorityFilter] = useState<'ALL' | 'CGSSB' | 'CGPSC'>('ALL');
  const [publishFilter, setPublishFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
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

  // Cloud & Remote URL Sync State
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Syllabus Breakdown Topics State
  const [bulkTopicsSectionIdx, setBulkTopicsSectionIdx] = useState<number | null>(null);
  const [bulkTopicsText, setBulkTopicsText] = useState('');
  const [newTopicInputs, setNewTopicInputs] = useState<Record<number, string>>({});

  // =========================================================================
  // ENTERPRISE GOVERNANCE & CASCADE MODAL STATES
  // =========================================================================
  const [testDeleteCandidate, setTestDeleteCandidate] = useState<{
    item: BundleTestItem;
    section: IngestionTargetSection;
    index: number;
    otherBundles: TestSeriesBundle[];
  } | null>(null);

  const [cascadePublishCandidate, setCascadePublishCandidate] = useState<{
    bundle: TestSeriesBundle;
    targetPublishStatus: boolean;
    attachedCount: number;
  } | null>(null);

  const [isTrashHubOpen, setIsTrashHubOpen] = useState(false);
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);

  useEffect(() => {
    setTrashedItems(getTrashItems());
    const handleTrashUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setTrashedItems(e.detail);
      }
    };
    window.addEventListener('cgssb-trash-updated', handleTrashUpdate);
    return () => window.removeEventListener('cgssb-trash-updated', handleTrashUpdate);
  }, []);

  useEffect(() => {
    let initialList = getStoredBundles();
    if (availableTests && availableTests.length > 0) {
      initialList = reconcileAllTestsWithBundles(availableTests);
    }
    setBundles(initialList);

    syncBundlesFromFirestore().then(({ list }) => {
      if (Array.isArray(list)) {
        if (availableTests && availableTests.length > 0) {
          const reconciled = reconcileAllTestsWithBundles(availableTests);
          setBundles(reconciled);
        } else {
          setBundles(list);
        }
      }
    }).catch(() => null);

    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBundles(e.detail);
      }
    };
    window.addEventListener('cgssb-bundles-updated', handleUpdate);
    return () => window.removeEventListener('cgssb-bundles-updated', handleUpdate);
  }, [availableTests]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSyncFromCloud = async (customUrl?: string) => {
    setIsSyncingCloud(true);
    try {
      const { list, count, source } = await syncBundlesFromFirestore(customUrl);
      setBundles(list);
      showToast(`Synced ${count} test series bundles successfully from ${source}!`);
      setIsSyncModalOpen(false);
    } catch (err: any) {
      showToast(`Cloud sync error: ${err.message || 'Failed to sync'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Triggered when unpublishing / publishing a bundle with cascade options
  const handleTogglePublishWithCascade = (bundle: TestSeriesBundle) => {
    const isCurrentlyPublished = bundle.isPublished !== false && !bundle.isDraft;
    const targetStatus = !isCurrentlyPublished;
    const attachedCount = (bundle.testItems?.length || 0) + (bundle.chapterTests?.length || 0) + (bundle.pypTests?.length || 0);

    // If unpublishing and bundle has attached tests, prompt with cascade dialog
    if (!targetStatus && attachedCount > 0) {
      setCascadePublishCandidate({
        bundle,
        targetPublishStatus: false,
        attachedCount
      });
      return;
    }

    // Direct toggle
    const { updatedList, newStatus } = toggleBundlePublish(bundle.id);
    setBundles(updatedList);
    showToast(
      newStatus
        ? `Published "${bundle.title}" — Live on Student Portal!`
        : `Unpublished "${bundle.title}" — Moved to Drafts.`
    );
  };

  const handleConfirmCascadePublish = (cascadeToTests: boolean) => {
    if (!cascadePublishCandidate) return;
    const { bundle, targetPublishStatus } = cascadePublishCandidate;

    const { affectedTestIds } = cascadeBundlePublishStatus(bundle.id, targetPublishStatus);
    
    // If cascade to tests requested, toggle tests in global catalog too
    if (cascadeToTests && affectedTestIds.length > 0) {
      affectedTestIds.forEach(tId => {
        const testObj = availableTests.find(t => t.id === tId);
        if (testObj && testObj.isPublished !== targetPublishStatus && onTogglePublishTest) {
          onTogglePublishTest(tId);
        }
      });
    }

    setBundles(getStoredBundles());
    setCascadePublishCandidate(null);
    showToast(`Unpublished "${bundle.title}"${cascadeToTests ? ` and cascaded to ${affectedTestIds.length} attached tests.` : '.'}`);
  };

  // Triggered when deleting a test item from within a bundle in Tab 7
  const handleRequestDeleteTestItem = (item: BundleTestItem, section: IngestionTargetSection, idx: number) => {
    const otherBundles = findBundlesContainingTest(item.id).filter(b => b.id !== editingBundle?.id);
    setTestDeleteCandidate({
      item,
      section,
      index: idx,
      otherBundles
    });
  };

  const handleConfirmUnlinkOnly = () => {
    if (!testDeleteCandidate || !editingBundle) return;
    const { section, index, item } = testDeleteCandidate;

    if (section === 'mock') {
      const updated = editingBundle.testItems.filter((_, i) => i !== index);
      setEditingBundle({ ...editingBundle, testItems: updated });
    } else if (section === 'chapter') {
      const updated = (editingBundle.chapterTests || []).filter((_, i) => i !== index);
      setEditingBundle({ ...editingBundle, chapterTests: updated });
    } else if (section === 'pyp') {
      const updated = (editingBundle.pypTests || []).filter((_, i) => i !== index);
      setEditingBundle({ ...editingBundle, pypTests: updated });
    }

    setTestDeleteCandidate(null);
    showToast(`Unlinked "${item.title}" from this bundle (remains in mock catalog).`);
  };

  const handleConfirmUniversalDelete = () => {
    if (!testDeleteCandidate || !editingBundle) return;
    const { section, index, item } = testDeleteCandidate;

    // 1. Remove from editing bundle
    if (section === 'mock') {
      const updated = editingBundle.testItems.filter((_, i) => i !== index);
      setEditingBundle({ ...editingBundle, testItems: updated });
    } else if (section === 'chapter') {
      const updated = (editingBundle.chapterTests || []).filter((_, i) => i !== index);
      setEditingBundle({ ...editingBundle, chapterTests: updated });
    } else if (section === 'pyp') {
      const updated = (editingBundle.pypTests || []).filter((_, i) => i !== index);
      setEditingBundle({ ...editingBundle, pypTests: updated });
    }

    // 2. Remove from all other bundles
    cleanTestFromAllBundles(item.id);

    // 3. Move to soft-delete Trash Recovery Bin
    const targetTest = availableTests.find(t => t.id === item.id) || item.mockTestRef || {
      id: item.id,
      title: item.title,
      titleHindi: item.titleHindi,
      category: 'CGSSB' as any,
      description: '',
      durationMinutes: item.durationMinutes,
      marksPerQuestion: 1,
      negativeMarksPerQuestion: 0.33,
      sections: [],
      questionCount: item.questionCount,
      attemptsCount: item.attemptsCount,
    };
    moveToTrashTest(targetTest);

    // 4. Delete globally from tests catalog & Firestore & API if prop passed
    if (onDeleteTest) {
      onDeleteTest(item.id);
    }

    setTestDeleteCandidate(null);
    showToast(`Deleted "${item.title}" universally across all bundles & moved to Trash Bin.`);
  };

  // Soft-delete bundle (Moves to Trash Bin)
  const handleDeleteBundle = (bundleId: string, title: string) => {
    const target = bundles.find(b => b.id === bundleId);
    if (!target) return;

    moveToTrashBundle(target);
    const updated = getStoredBundles();
    setBundles(updated);
    showToast(`Test Series "${title}" moved to Trash Bin.`);
  };

  const handleRestoreBundle = (bundleId: string) => {
    const restored = restoreBundleFromTrash(bundleId);
    if (restored) {
      setBundles(getStoredBundles());
      showToast(`Restored "${restored.title}" back to active Test Series!`);
    }
  };

  const handleRestoreTest = (testId: string) => {
    const restored = restoreTestFromTrash(testId);
    if (restored) {
      if (onTestsAdded) onTestsAdded([restored]);
      showToast(`Restored "${restored.title}" back to Mock Tests catalog!`);
    }
  };

  const handlePurgeTrash = (itemId: string, title: string) => {
    if (window.confirm(`Permanently purge "${title}"? This cannot be undone.`)) {
      purgeTrashItem(itemId);
      setTrashedItems(getTrashItems());
      showToast(`Permanently purged "${title}".`);
    }
  };

};
