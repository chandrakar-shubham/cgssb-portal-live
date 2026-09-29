import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CMSPage,
  PageBlock,
  BlockType,
  PageThemeArchetype,
  PageRevision,
  DEFAULT_PAGE_THEME_TOKENS,
} from '../types/cms';
import {
  FileText,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  Save,
  Globe,
  Sparkles,
  Layout,
  Type,
  HelpCircle,
  Layers,
  Code,
  CheckCircle2,
  ExternalLink,
  Edit3,
  Award,
  Download,
  DollarSign,
  Palette,
  Copy,
  Search,
  Filter,
  Check,
  X,
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  RotateCw,
  History,
  Settings,
  ChevronRight,
  ChevronDown,
  Lock,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Zap,
  Sliders,
  MoreVertical,
  CheckSquare,
  Square,
  Flame,
  FileCode,
  BookOpen,
  Send,
  Compass,
  Link,
  RefreshCw,
} from 'lucide-react';
import { DynamicPageRenderer } from './DynamicPageRenderer';

interface AdminCMSPageBuilderProps {
  pages: CMSPage[];
  onSavePage: (page: CMSPage) => Promise<void>;
  onDeletePage: (id: string) => Promise<void>;
}

type BuilderMode = 'wp_table' | 'elementor_builder';
type BuilderTab = 'widgets' | 'inspector' | 'settings' | 'navigator';
type ViewportMode = 'desktop' | 'tablet' | 'mobile';

interface QuickEditState {
  id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
  author: string;
  themeArchetype: PageThemeArchetype;
}

export const AdminCMSPageBuilder: React.FC<AdminCMSPageBuilderProps> = ({
  pages,
  onSavePage,
  onDeletePage,
}) => {
  // Navigation & View mode
  const [viewMode, setViewMode] = useState<BuilderMode>('wp_table');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(pages[0]?.id || null);

  // WordPress Table States
  const [tableFilter, setTableFilter] = useState<'all' | 'published' | 'drafts' | 'core' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [quickEditState, setQuickEditState] = useState<QuickEditState | null>(null);
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false);

  // Elementor Studio States
  const [activeTab, setActiveTab] = useState<BuilderTab>('widgets');
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isWysiwygPreview, setIsWysiwygPreview] = useState(false);
  const [widgetSearch, setWidgetSearch] = useState('');
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active Draft & Undo/Redo Stacks
  const activePage = useMemo(() => pages.find((p) => p.id === selectedPageId) || pages[0] || null, [pages, selectedPageId]);
  const [draftPage, setDraftPage] = useState<CMSPage | null>(activePage);
  const [historyStack, setHistoryStack] = useState<CMSPage[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Sync draft when page changes
  useEffect(() => {
    const page = pages.find((p) => p.id === selectedPageId);
    if (page) {
      const cloned = JSON.parse(JSON.stringify(page));
      setDraftPage(cloned);
      setHistoryStack([cloned]);
      setHistoryIndex(0);
      setSelectedBlockIdx(null);
    }
  }, [selectedPageId, pages]);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Push state to undo/redo history
  const pushToHistory = (newPage: CMSPage) => {
    const updatedHistory = historyStack.slice(0, historyIndex + 1);
    setHistoryStack([...updatedHistory, JSON.parse(JSON.stringify(newPage))]);
    setHistoryIndex(updatedHistory.length);
    setDraftPage(newPage);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      setHistoryIndex(targetIdx);
      setDraftPage(JSON.parse(JSON.stringify(historyStack[targetIdx])));
      showNotification('Undo applied');
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const targetIdx = historyIndex + 1;
      setHistoryIndex(targetIdx);
      setDraftPage(JSON.parse(JSON.stringify(historyStack[targetIdx])));
      showNotification('Redo applied');
    }
  };

  // Filtering Pages for WordPress Table
  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      // Tab filter
      if (tableFilter === 'published' && !p.isPublished) return false;
      if (tableFilter === 'drafts' && p.isPublished) return false;
      if (tableFilter === 'core' && p.pageType !== 'core_system') return false;
      if (tableFilter === 'custom' && p.pageType === 'core_system') return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchSlug = p.slug.toLowerCase().includes(query);
        const matchMeta = p.metaDescription?.toLowerCase().includes(query);
        if (!matchTitle && !matchSlug && !matchMeta) return false;
      }
      return true;
    });
  }, [pages, tableFilter, searchQuery]);

  // Bulk Actions
  const handleSelectAllRows = () => {
    if (selectedRowIds.size === filteredPages.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredPages.map((p) => p.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedRowIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRowIds(next);
  };

  const handleApplyBulkAction = async () => {
    if (!bulkAction || selectedRowIds.size === 0) return;

    if (bulkAction === 'publish') {
      for (const id of selectedRowIds) {
        const page = pages.find((p) => p.id === id);
        if (page) await onSavePage({ ...page, isPublished: true, updatedAt: new Date().toISOString().split('T')[0] });
      }
      showNotification(`Published ${selectedRowIds.size} pages.`);
    } else if (bulkAction === 'draft') {
      for (const id of selectedRowIds) {
        const page = pages.find((p) => p.id === id);
        if (page) await onSavePage({ ...page, isPublished: false, updatedAt: new Date().toISOString().split('T')[0] });
      }
      showNotification(`Moved ${selectedRowIds.size} pages to drafts.`);
    } else if (bulkAction === 'delete') {
      if (confirm(`Are you sure you want to delete ${selectedRowIds.size} selected page(s)?`)) {
        for (const id of selectedRowIds) {
          await onDeletePage(id);
        }
        showNotification(`Deleted ${selectedRowIds.size} pages.`);
      }
    }
    setSelectedRowIds(new Set());
    setBulkAction('');
  };

  // Quick Edit Submit
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditState) return;
    const page = pages.find((p) => p.id === quickEditState.id);
    if (!page) return;

    const updated: CMSPage = {
      ...page,
      title: quickEditState.title,
      slug: quickEditState.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      metaTitle: quickEditState.metaTitle,
      metaDescription: quickEditState.metaDescription,
      isPublished: quickEditState.isPublished,
      author: quickEditState.author,
      themeArchetype: quickEditState.themeArchetype,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    await onSavePage(updated);
    setQuickEditState(null);
    showNotification(`Quick updated: ${updated.title}`);
  };

  // Duplicate Page
  const handleDuplicatePage = async (pageToDuplicate: CMSPage) => {
    const newId = `page-${Date.now()}`;
    const newSlug = `${pageToDuplicate.slug}-copy-${Math.floor(Math.random() * 100)}`;
    const cloned: CMSPage = {
      ...JSON.parse(JSON.stringify(pageToDuplicate)),
      id: newId,
      slug: newSlug,
      title: `${pageToDuplicate.title} (Copy)`,
      isPublished: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    await onSavePage(cloned);
    showNotification(`Duplicated "${pageToDuplicate.title}"`);
  };

  // Launch Elementor Builder
  const handleOpenElementorBuilder = (pageId: string) => {
    setSelectedPageId(pageId);
    setViewMode('elementor_builder');
    setActiveTab('widgets');
    setSelectedBlockIdx(0);
  };

  // Save Page in Elementor Builder
  const handleSaveDraftOrPublish = async (publishState?: boolean) => {
    if (!draftPage) return;
    setIsSaving(true);

    const now = new Date().toISOString().split('T')[0];
    const newRevision: PageRevision = {
      id: `rev-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + now,
      title: `Saved via Elementor Studio`,
      author: draftPage.author || 'Admin Staff',
      blockCount: draftPage.blocks.length,
      data: JSON.parse(JSON.stringify(draftPage)),
    };

    const updatedRevisions = [newRevision, ...(draftPage.revisions || [])].slice(0, 15);

    const targetPage: CMSPage = {
      ...draftPage,
      isPublished: publishState !== undefined ? publishState : draftPage.isPublished,
      updatedAt: now,
      revisions: updatedRevisions,
    };

    try {
      await onSavePage(targetPage);
      setDraftPage(targetPage);
      showNotification(targetPage.isPublished ? '🚀 Page Published Live to Portal!' : '💾 Draft Saved Successfully');
    } catch (err) {
      console.error(err);
      showNotification('Error saving page.');
    } finally {
      setIsSaving(false);
    }
  };

  // Revert Revision
  const handleRestoreRevision = (rev: PageRevision) => {
    if (confirm(`Restore revision from ${rev.timestamp}? Any unsaved changes in current session will be overwritten.`)) {
      pushToHistory(rev.data);
      setIsRevisionModalOpen(false);
      showNotification(`Restored to revision: ${rev.timestamp}`);
    }
  };

  // Add Elementor Block
  const handleAddBlock = (type: BlockType, insertIndex?: number) => {
    if (!draftPage) return;
    const newBlock: PageBlock = {
      id: `blk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      title:
        type === 'hero'
          ? 'CG State Recruitment 2026 Examination Hub'
          : type === 'syllabus_table'
          ? 'Official Subject Weightage Matrix'
          : type === 'checkpoint_quiz'
          ? 'Knowledge Checkpoint: Practice MCQ'
          : type === 'exam_notification_box'
          ? 'Official Commission Notification Notice'
          : type === 'key_takeaways'
          ? 'Crucial Preparation Strategy Points'
          : type === 'faq'
          ? 'Frequently Asked Questions (FAQ)'
          : type === 'features'
          ? 'Why Choose CGSSB CBT Test Series'
          : type === 'cta'
          ? 'Start Your Exam Simulation Today'
          : 'Section Title',
      subtitle: 'Enter concise summary or context description for students...',
      content:
        type === 'paragraph'
          ? 'Comprehensive breakdown of syllabus concepts, scoring patterns, and preparation tips.'
          : undefined,
      buttonText: type === 'hero' || type === 'cta' ? 'Attempt Free Mock Test' : undefined,
      buttonLink: type === 'hero' || type === 'cta' ? '/test-series' : undefined,
      ...(type === 'syllabus_table'
        ? {
            syllabusData: {
              subjectHeaders: ['Subject Section', 'Key Topics Covered', 'Marks Weightage'],
              rows: [
                { subject: 'Chhattisgarh GK & Heritage', topics: 'Dynasties, Tribes, Geography & Schemes', weightageMarks: '30 Marks' },
                { subject: 'Chhattisgarhi Language & Hana', topics: 'Janula, Muhavare, Sandhi & Literature', weightageMarks: '20 Marks' },
                { subject: 'Computer & Aptitude', topics: 'MS Office, Antivirus, Reasoning & Maths', weightageMarks: '50 Marks' },
              ],
            },
          }
        : {}),
      ...(type === 'checkpoint_quiz'
        ? {
            checkpointQuiz: {
              question: 'Which sacred waterfall in Bastar, Chhattisgarh is famous as the "Niagara of India"?',
              questionHindi: 'बस्तर (छत्तीसगढ़) का कौन सा जलप्रपात "भारत का नियाग्रा" के नाम से प्रसिद्ध है?',
              options: ['चित्रकूट जलप्रपात (Chitrakote)', 'तीरथगढ़ जलप्रपात (Tirathgarh)', 'ताम्र घूमर (Tamra Ghoomar)', 'मेंद्री घूमर (Mendri Ghoomar)'],
              correctIndex: 0,
              explanation: 'Chitrakote Falls on the Indravati river is the widest waterfall in India, often called the Niagara Falls of India.',
            },
          }
        : {}),
      ...(type === 'exam_notification_box'
        ? {
            notificationMeta: {
              examName: 'Chhattisgarh State Recruitment 2026',
              authority: 'CGPSC / CG Vyapam',
              applicationEndDate: 'May 30, 2026',
              examDate: 'June 2026',
              totalVacancies: '450+ Posts',
              eligibilityBrief: '12th Pass / Graduate (Recognized University)',
              officialPdfUrl: 'https://psc.cg.gov.in',
              applyOnlineUrl: 'https://vyapam.cgstate.gov.in',
            },
          }
        : {}),
      ...(type === 'key_takeaways'
        ? {
            keyTakeaways: [
              'Mandatory 50% cutoff in Computer GK for Hostel Warden eligibility.',
              'Negative marking is 1/3rd for CGPSC and 1/4th for CG Vyapam wrong attempts.',
              'Practice simulated TCS iON timer mocks to avoid running out of time in the actual exam.',
            ],
          }
        : {}),
      ...(type === 'faq'
        ? {
            faqList: [
              { question: 'Is the test interface bilingual (Hindi/English)?', answer: 'Yes, full questions and explanations are available in both Hindi and English.' },
              { question: 'Can I view detailed solutions after submitting?', answer: 'Yes! Instant question-by-question explanations, state rank, and percentiles are provided.' },
            ],
          }
        : {}),
      ...(type === 'features'
        ? {
            items: [
              { title: '100% Real Exam Format', description: 'Exact TCS iON interface colors and button layouts.' },
              { title: 'Instant State Rank Analysis', description: 'Compare with thousands of active candidates across Chhattisgarh.' },
              { title: 'PYP Solved Archives', description: 'Solved question papers with detailed step-by-step reasoning.' },
            ],
          }
        : {}),
    };

    const blocks = [...draftPage.blocks];
    const targetIndex = insertIndex !== undefined ? insertIndex : blocks.length;
    blocks.splice(targetIndex, 0, newBlock);

    const updatedPage = { ...draftPage, blocks };
    pushToHistory(updatedPage);
    setSelectedBlockIdx(targetIndex);
    setActiveTab('inspector');
    showNotification(`Added ${newBlock.type} widget.`);
  };

  // Update Block inside Elementor Inspector
  const handleUpdateActiveBlock = (updatedBlock: PageBlock) => {
    if (!draftPage || selectedBlockIdx === null) return;
    const blocks = [...draftPage.blocks];
    blocks[selectedBlockIdx] = updatedBlock;
    const updatedPage = { ...draftPage, blocks };
    pushToHistory(updatedPage);
  };

  // Delete Block
  const handleDeleteBlock = (index: number) => {
    if (!draftPage) return;
    const blocks = draftPage.blocks.filter((_, i) => i !== index);
    const updatedPage = { ...draftPage, blocks };
    pushToHistory(updatedPage);
    setSelectedBlockIdx(null);
    setActiveTab('widgets');
    showNotification('Block deleted.');
  };

  // Move Block Up/Down
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!draftPage) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= draftPage.blocks.length) return;

    const blocks = [...draftPage.blocks];
    const temp = blocks[index];
    blocks[index] = blocks[targetIdx];
    blocks[targetIdx] = temp;

    const updatedPage = { ...draftPage, blocks };
    pushToHistory(updatedPage);
    setSelectedBlockIdx(targetIdx);
  };

  // Duplicate Block
  const handleDuplicateBlock = (index: number) => {
    if (!draftPage) return;
    const blockToCopy = draftPage.blocks[index];
    const newBlock: PageBlock = {
      ...JSON.parse(JSON.stringify(blockToCopy)),
      id: `blk-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      title: blockToCopy.title ? `${blockToCopy.title} (Copy)` : undefined,
    };
    const blocks = [...draftPage.blocks];
    blocks.splice(index + 1, 0, newBlock);

    const updatedPage = { ...draftPage, blocks };
    pushToHistory(updatedPage);
    setSelectedBlockIdx(index + 1);
    showNotification('Block duplicated.');
  };

  // Template Library for New Page Modal
  const handleCreateFromTemplate = async (templateType: 'blank' | 'syllabus' | 'notification' | 'landing') => {
    const newId = `page-${Date.now()}`;
    let newPage: CMSPage;

    if (templateType === 'blank') {
      newPage = {
        id: newId,
        slug: `custom-page-${Math.floor(Math.random() * 1000)}`,
        title: 'New Blank Page',
        metaTitle: 'New Page | CGSSB Portal',
        metaDescription: 'Custom examination preparation page.',
        isPublished: false,
        author: 'Admin Staff',
        pageType: 'custom_landing',
        themeArchetype: 'hero_landing',
        blocks: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
    } else if (templateType === 'syllabus') {
      newPage = {
        id: newId,
        slug: `exam-syllabus-${Math.floor(Math.random() * 1000)}`,
        title: 'State Exam Comprehensive Syllabus & Blueprint 2026',
        metaTitle: 'Exam Syllabus & Marks Weightage 2026 | CGSSB',
        metaDescription: 'Detailed topic-wise syllabus breakdown, recommended study material and negative marking rules.',
        isPublished: false,
        author: 'Academic Wing',
        pageType: 'study_guide',
        themeArchetype: 'institutional_trust',
        blocks: [
          {
            id: `blk-1`,
            type: 'hero',
            title: 'Complete 2026 Examination Blueprint & Marks Matrix',
            subtitle: 'Official subject syllabus breakdown, chapter weightage, and high-yield topics.',
            buttonText: 'Start Test Series',
            buttonLink: '/test-series',
          },
          {
            id: `blk-2`,
            type: 'syllabus_table',
            title: 'Subject Marks Weightage Distribution',
            syllabusData: {
              subjectHeaders: ['Section', 'Topics Included', 'Marks'],
              rows: [
                { subject: 'CG General Studies', topics: 'History, Geography, Culture & Schemes', weightageMarks: '50 Marks' },
                { subject: 'Language & Grammar', topics: 'Hindi & Chhattisgarhi Vyakaran', weightageMarks: '25 Marks' },
                { subject: 'Reasoning & Quantitative', topics: 'Aptitude & Logical Series', weightageMarks: '25 Marks' },
              ],
            },
          },
          {
            id: `blk-3`,
            type: 'key_takeaways',
            title: 'Preparation Guidelines',
            keyTakeaways: [
              'Daily practice of Chhattisgarhi grammar and local current affairs is vital.',
              'Solve at least 2 full length mocks weekly under timed conditions.',
            ],
          },
        ],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
    } else {
      newPage = {
        id: newId,
        slug: `recruitment-alert-${Math.floor(Math.random() * 1000)}`,
        title: 'Mega Recruitment Drive 2026: Vacancy & Application Guide',
        metaTitle: 'Recruitment Notification 2026 | CGSSB',
        metaDescription: 'Application dates, total posts, syllabus requirements, and official PDF.',
        isPublished: false,
        author: 'Job Alerts Wing',
        pageType: 'custom_landing',
        themeArchetype: 'hero_landing',
        blocks: [
          {
            id: `blk-1`,
            type: 'hero',
            title: 'Official Recruitment 2026 Notice & Strategy',
            subtitle: 'Apply online, download PDF syllabus, and attempt high-yield practice mocks.',
            buttonText: 'Attempt Mock Test',
            buttonLink: '/test-series',
          },
          {
            id: `blk-2`,
            type: 'exam_notification_box',
            title: 'Official Notification Snapshot',
            notificationMeta: {
              examName: 'State Recruitment Examination 2026',
              authority: 'CGPSC / Vyapam',
              applicationEndDate: 'June 15, 2026',
              examDate: 'July 2026',
              totalVacancies: '500+ Posts',
              eligibilityBrief: '12th / Graduate from any recognized Board',
              officialPdfUrl: 'https://vyapam.cgstate.gov.in',
              applyOnlineUrl: 'https://vyapam.cgstate.gov.in',
            },
          },
          {
            id: `blk-3`,
            type: 'faq',
            title: 'Frequently Asked Questions',
            faqList: [
              { question: 'What is the age limit?', answer: 'Minimum 21 years and maximum 35 years (with 5 years state domicile relaxation).' },
              { question: 'Is there negative marking?', answer: 'Yes, 1/3rd penalty for incorrect attempts.' },
            ],
          },
        ],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }

    await onSavePage(newPage);
    setIsNewPageModalOpen(false);
    handleOpenElementorBuilder(newPage.id);
    showNotification(`Created page "${newPage.title}"`);
  };

  // Active Block for Inspector
  const activeBlock = useMemo(() => {
    if (!draftPage || selectedBlockIdx === null) return null;
    return draftPage.blocks[selectedBlockIdx] || null;
  }, [draftPage, selectedBlockIdx]);

  // Widget Arsenal Categories
  const widgetLibrary = [
    {
      category: 'Layout & Typography',
      items: [
        { type: 'hero' as BlockType, label: 'Hero Banner', desc: 'High-conversion banner with badge, CTA button & headline', icon: Sparkles },
        { type: 'heading' as BlockType, label: 'Section Heading', desc: 'Title, subtitle and optional kicker text', icon: Type },
        { type: 'paragraph' as BlockType, label: 'Rich Text Paragraph', desc: 'Formatted content, bullet points and bold styling', icon: FileText },
        { type: 'features' as BlockType, label: 'Features & Benefits Grid', desc: '3-4 column grid highlighting trust points', icon: Layout },
        { type: 'cta' as BlockType, label: 'Call to Action (CTA)', desc: 'Full-width colored gradient card with action button', icon: Zap },
        { type: 'image_banner' as BlockType, label: 'Image Banner', desc: 'Responsive media showcase banner', icon: Award },
      ],
    },
    {
      category: 'Exam & Education Tools (FAANG Grade)',
      items: [
        { type: 'exam_notification_box' as BlockType, label: 'Exam Notification Matrix', desc: 'Vacancies, deadline countdown, eligibility and official PDF links', icon: AlertTriangle },
        { type: 'syllabus_table' as BlockType, label: 'Syllabus Breakdown Table', desc: 'Interactive subject, topics and marks weightage matrix', icon: Layers },
        { type: 'checkpoint_quiz' as BlockType, label: 'Live Checkpoint MCQ Quiz', desc: 'Interactive question card with Devnagari Hindi and instant solution', icon: HelpCircle },
        { type: 'key_takeaways' as BlockType, label: 'Key Strategy Takeaways', desc: 'Highlighted list of crucial examination rules', icon: CheckCircle2 },
        { type: 'faq' as BlockType, label: 'Accordion FAQ (SEO Rich)', desc: 'Expandable Q&A accordion with Google FAQ Schema', icon: HelpCircle },
        { type: 'test_series_widget' as BlockType, label: 'Test Series / Bundle Embed', desc: 'Direct launch card for student mock test series', icon: BookOpen },
      ],
    },
    {
      category: 'Monetization & Custom Code',
      items: [
        { type: 'ad_slot' as BlockType, label: 'AdSense Ad Slot', desc: 'Responsive responsive leaderboard/rectangle ad frame', icon: DollarSign },
        { type: 'raw_html' as BlockType, label: 'Custom HTML / Embed', desc: 'Raw embed code (YouTube, Telegram, Google Forms)', icon: Code },
      ],
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-2xl flex items-center space-x-2 border border-indigo-400 animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: WORDPRESS MASTER PAGES DIRECTORY ("Pages > All Pages")            */}
      {/* ========================================================================= */}
      {viewMode === 'wp_table' && (
        <div className="space-y-5">
          {/* Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400">
                <Globe className="w-3.5 h-3.5" />
                <span>WordPress Master CMS / Pages Registry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-3">
                <span>All Pages</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {pages.length} Total
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Authoritative inventory of all public routes, system portals, and custom landing pages across <strong className="text-slate-200">cgtest.in</strong>.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsNewPageModalOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Page</span>
              </button>
            </div>
          </div>

          {/* WordPress Filter Tabs & Search Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              {/* Status Filter Tabs (WordPress Style) */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <button
                  onClick={() => setTableFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    tableFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  All ({pages.length})
                </button>
                <button
                  onClick={() => setTableFilter('published')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    tableFilter === 'published'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Published ({pages.filter((p) => p.isPublished).length})
                </button>
                <button
                  onClick={() => setTableFilter('drafts')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    tableFilter === 'drafts'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Drafts ({pages.filter((p) => !p.isPublished).length})
                </button>
                <button
                  onClick={() => setTableFilter('core')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    tableFilter === 'core'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Core System Routes ({pages.filter((p) => p.pageType === 'core_system').length})
                </button>
                <button
                  onClick={() => setTableFilter('custom')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    tableFilter === 'custom'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Custom Landing Pages ({pages.filter((p) => p.pageType !== 'core_system').length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full lg:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search pages by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="">Bulk Actions</option>
                  <option value="publish">Mark as Published</option>
                  <option value="draft">Move to Drafts</option>
                  <option value="delete">Delete Selected</option>
                </select>
                <button
                  onClick={handleApplyBulkAction}
                  disabled={!bulkAction || selectedRowIds.size === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold transition cursor-pointer"
                >
                  Apply
                </button>
                {selectedRowIds.size > 0 && (
                  <span className="text-slate-400 font-mono text-[11px]">
                    {selectedRowIds.size} page(s) selected
                  </span>
                )}
              </div>

              <div className="text-slate-400 text-xs">
                Showing <strong className="text-white">{filteredPages.length}</strong> of {pages.length} pages
              </div>
            </div>

            {/* Master WordPress Pages Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredPages.length > 0 && selectedRowIds.size === filteredPages.length}
                        onChange={handleSelectAllRows}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Title & Permalink</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Theme Archetype</th>
                    <th className="p-3.5">Blocks</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Last Modified</th>
                    <th className="p-3.5 text-right">Elementor Visual Editor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">
                        <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                        <p className="font-bold text-slate-400">No pages found matching criteria</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((p) => {
                      const isSelected = selectedRowIds.has(p.id);
                      const isCore = p.pageType === 'core_system';
                      const routeUrl = p.slug === 'home' ? '/' : `/p/${p.slug}`;

                      return (
                        <React.Fragment key={p.id}>
                          <tr
                            className={`group hover:bg-slate-800/40 transition ${
                              isSelected ? 'bg-indigo-950/20' : ''
                            }`}
                          >
                            <td className="p-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleRow(p.id)}
                                className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                            </td>

                            {/* Title + WordPress Row Action Bar on Hover */}
                            <td className="p-3.5 max-w-sm">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-slate-100 text-sm hover:text-indigo-400 transition cursor-pointer" onClick={() => handleOpenElementorBuilder(p.id)}>
                                    {p.title}
                                  </span>
                                  {isCore && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                                      Core Route
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-mono">
                                  <Link className="w-3 h-3 text-slate-600" />
                                  <span>{routeUrl}</span>
                                </div>

                                {/* WordPress Row Hover Action Menu */}
                                <div className="flex items-center space-x-2 text-[11px] pt-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenElementorBuilder(p.id)}
                                    className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Edit with Elementor</span>
                                  </button>
                                  <span className="text-slate-700">|</span>
                                  <button
                                    onClick={() =>
                                      setQuickEditState({
                                        id: p.id,
                                        title: p.title,
                                        slug: p.slug,
                                        metaTitle: p.metaTitle || '',
                                        metaDescription: p.metaDescription || '',
                                        isPublished: p.isPublished,
                                        author: p.author || 'Admin Editorial',
                                        themeArchetype: p.themeArchetype || 'hero_landing',
                                      })
                                    }
                                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                                  >
                                    Quick Edit
                                  </button>
                                  <span className="text-slate-700">|</span>
                                  <button
                                    onClick={() => handleDuplicatePage(p)}
                                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                                  >
                                    Clone
                                  </button>
                                  <span className="text-slate-700">|</span>
                                  <button
                                    onClick={() => handleOpenElementorBuilder(p.id)}
                                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                                  >
                                    Preview
                                  </button>
                                  {!isCore && (
                                    <>
                                      <span className="text-slate-700">|</span>
                                      <button
                                        onClick={() => {
                                          if (confirm(`Delete page "${p.title}"?`)) onDeletePage(p.id);
                                        }}
                                        className="text-rose-400 hover:text-rose-300 cursor-pointer"
                                      >
                                        Trash
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Author */}
                            <td className="p-3.5 text-slate-400">{p.author || 'Admin Staff'}</td>

                            {/* Theme Archetype */}
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-mono">
                                {p.themeArchetype || 'hero_landing'}
                              </span>
                            </td>

                            {/* Block Count */}
                            <td className="p-3.5 font-mono text-slate-400">{p.blocks?.length || 0} widgets</td>

                            {/* Status */}
                            <td className="p-3.5">
                              {p.isPublished ? (
                                <span className="inline-flex items-center space-x-1.5 text-emerald-400 font-bold text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Published</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1.5 text-amber-400 font-bold text-[11px]">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  <span>Draft</span>
                                </span>
                              )}
                            </td>

                            {/* Last Modified */}
                            <td className="p-3.5 text-slate-400 font-mono text-[11px]">{p.updatedAt}</td>

                            {/* Launch Elementor Button */}
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => handleOpenElementorBuilder(p.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs transition shadow-md flex items-center space-x-1.5 ml-auto cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>Edit Canvas</span>
                              </button>
                            </td>
                          </tr>

                          {/* Quick Edit Drawer (Inline row expansion) */}
                          {quickEditState?.id === p.id && (
                            <tr className="bg-slate-950 border-y-2 border-indigo-500/50">
                              <td colSpan={8} className="p-5">
                                <form onSubmit={handleSaveQuickEdit} className="space-y-4">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                                      <Zap className="w-4 h-4" />
                                      <span>Quick Edit: {p.title}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setQuickEditState(null)}
                                      className="text-slate-500 hover:text-slate-300"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                                    <div>
                                      <label className="block text-slate-400 mb-1 font-bold">Page Title</label>
                                      <input
                                        type="text"
                                        value={quickEditState.title}
                                        onChange={(e) => setQuickEditState({ ...quickEditState, title: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none font-bold"
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-slate-400 mb-1 font-bold">Slug (URL)</label>
                                      <input
                                        type="text"
                                        value={quickEditState.slug}
                                        onChange={(e) => setQuickEditState({ ...quickEditState, slug: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-indigo-400 font-mono focus:border-indigo-500 focus:outline-none"
                                        required
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-slate-400 mb-1 font-bold">Author</label>
                                      <input
                                        type="text"
                                        value={quickEditState.author}
                                        onChange={(e) => setQuickEditState({ ...quickEditState, author: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-slate-400 mb-1 font-bold">Theme Archetype</label>
                                      <select
                                        value={quickEditState.themeArchetype}
                                        onChange={(e) =>
                                          setQuickEditState({
                                            ...quickEditState,
                                            themeArchetype: e.target.value as PageThemeArchetype,
                                          })
                                        }
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                      >
                                        <option value="hero_landing">Hero Landing</option>
                                        <option value="cbt_exam_focused">CBT Exam Focused</option>
                                        <option value="editorial_magazine">Editorial Magazine</option>
                                        <option value="institutional_trust">Institutional Trust</option>
                                      </select>
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="block text-slate-400 mb-1 font-bold">SEO Meta Title</label>
                                      <input
                                        type="text"
                                        value={quickEditState.metaTitle}
                                        onChange={(e) => setQuickEditState({ ...quickEditState, metaTitle: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="block text-slate-400 mb-1 font-bold">SEO Meta Description</label>
                                      <input
                                        type="text"
                                        value={quickEditState.metaDescription}
                                        onChange={(e) =>
                                          setQuickEditState({ ...quickEditState, metaDescription: e.target.value })
                                        }
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                    <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={quickEditState.isPublished}
                                        onChange={(e) =>
                                          setQuickEditState({ ...quickEditState, isPublished: e.target.checked })
                                        }
                                        className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                                      />
                                      <span className="font-bold">Published (Live to Students)</span>
                                    </label>

                                    <div className="flex items-center space-x-2">
                                      <button
                                        type="button"
                                        onClick={() => setQuickEditState(null)}
                                        className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition font-bold"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="submit"
                                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md cursor-pointer"
                                      >
                                        Update Page
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ELEMENTOR-GRADE LIVE VISUAL WEBSITE BUILDER STUDIO                */}
      {/* ========================================================================= */}
      {viewMode === 'elementor_builder' && draftPage && (
        <div className="space-y-4">
          {/* Top Elementor Studio App Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
            {/* Left Back + Title */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('wp_table')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Pages</span>
              </button>

              <div className="h-5 w-px bg-slate-800" />

              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-white">{draftPage.title}</span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    /{draftPage.slug}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                  <span>Theme: {draftPage.themeArchetype || 'hero_landing'}</span>
                  <span>•</span>
                  <span>{draftPage.blocks.length} sections</span>
                </div>
              </div>
            </div>

            {/* Middle: Responsive Viewport Switcher (Elementor Style) */}
            <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl space-x-1">
              <button
                onClick={() => setViewport('desktop')}
                className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  viewport === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Desktop 1440px"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setViewport('tablet')}
                className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  viewport === 'tablet' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tablet 768px"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                onClick={() => setViewport('mobile')}
                className={`p-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  viewport === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mobile 375px"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* Right: Undo/Redo + Revisions + Save Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= historyStack.length - 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
                title="Redo (Ctrl+Y)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsRevisionModalOpen(true)}
                className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center space-x-1.5"
                title="Revision History"
              >
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Revisions ({draftPage.revisions?.length || 0})</span>
              </button>

              <button
                onClick={() => setIsWysiwygPreview(!isWysiwygPreview)}
                className={`p-2 px-3 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  isWysiwygPreview
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isWysiwygPreview ? 'Edit Mode' : 'Preview'}</span>
              </button>

              <button
                onClick={() => handleSaveDraftOrPublish(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>

              <button
                onClick={() => handleSaveDraftOrPublish(true)}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Live</span>
              </button>
            </div>
          </div>

          {/* 3-Column Studio Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ------------------------------------------------------------- */}
            {/* LEFT COLUMN: ELEMENTOR TOOLBOX & INSPECTOR DOCK (4 Cols)     */}
            {/* ------------------------------------------------------------- */}
            {!isWysiwygPreview && (
              <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-5 sticky top-4 max-h-[85vh] overflow-y-auto">
                {/* Left Dock Tab Bar */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-2xl text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('widgets')}
                    className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
                      activeTab === 'widgets' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Widgets</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('inspector')}
                    className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
                      activeTab === 'inspector' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Style</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
                      activeTab === 'settings' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>SEO</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('navigator')}
                    className={`py-2 rounded-xl transition flex items-center justify-center space-x-1 ${
                      activeTab === 'navigator' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Tree</span>
                  </button>
                </div>

                {/* TAB 1: WIDGETS ARSENAL */}
                {activeTab === 'widgets' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search Elementor widgets..."
                        value={widgetSearch}
                        onChange={(e) => setWidgetSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-4">
                      {widgetLibrary.map((cat, i) => {
                        const matchingItems = cat.items.filter((item) =>
                          item.label.toLowerCase().includes(widgetSearch.toLowerCase()) ||
                          item.desc.toLowerCase().includes(widgetSearch.toLowerCase())
                        );

                        if (matchingItems.length === 0) return null;

                        return (
                          <div key={i} className="space-y-2">
                            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                              {cat.category}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {matchingItems.map((item, idx) => {
                                const Icon = item.icon;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleAddBlock(item.type)}
                                    className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/50 text-left transition group cursor-pointer flex flex-col justify-between space-y-2 shadow-sm"
                                  >
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition w-fit">
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-200 text-xs group-hover:text-indigo-300">
                                        {item.label}
                                      </p>
                                      <p className="text-[10px] text-slate-500 line-clamp-1">{item.desc}</p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: ACTIVE BLOCK CONTENT & STYLE INSPECTOR */}
                {activeTab === 'inspector' && (
                  <div className="space-y-4">
                    {activeBlock && selectedBlockIdx !== null ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                          <div>
                            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">
                              Active Widget #{selectedBlockIdx + 1}
                            </span>
                            <h3 className="text-sm font-black text-white capitalize">{activeBlock.type} Block</h3>
                          </div>
                          <button
                            onClick={() => handleDeleteBlock(selectedBlockIdx)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition"
                            title="Delete Block"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title Input */}
                        <div>
                          <label className="block text-slate-400 text-xs font-bold mb-1">Headline / Title</label>
                          <input
                            type="text"
                            value={activeBlock.title || ''}
                            onChange={(e) => handleUpdateActiveBlock({ ...activeBlock, title: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-bold"
                          />
                        </div>

                        {/* Subtitle Input */}
                        <div>
                          <label className="block text-slate-400 text-xs font-bold mb-1">Subtitle / Context</label>
                          <textarea
                            rows={2}
                            value={activeBlock.subtitle || ''}
                            onChange={(e) => handleUpdateActiveBlock({ ...activeBlock, subtitle: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* Paragraph Content */}
                        {activeBlock.type === 'paragraph' && (
                          <div>
                            <label className="block text-slate-400 text-xs font-bold mb-1">Body Text Content</label>
                            <textarea
                              rows={5}
                              value={activeBlock.content || ''}
                              onChange={(e) => handleUpdateActiveBlock({ ...activeBlock, content: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                            />
                          </div>
                        )}

                        {/* CTA Button Inputs */}
                        {(activeBlock.type === 'hero' || activeBlock.type === 'cta') && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-slate-400 text-[11px] font-bold mb-1">Button Text</label>
                              <input
                                type="text"
                                value={activeBlock.buttonText || ''}
                                onChange={(e) => handleUpdateActiveBlock({ ...activeBlock, buttonText: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 text-[11px] font-bold mb-1">Button Link</label>
                              <input
                                type="text"
                                value={activeBlock.buttonLink || ''}
                                onChange={(e) => handleUpdateActiveBlock({ ...activeBlock, buttonLink: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-indigo-400 focus:outline-none focus:border-indigo-500 font-mono"
                              />
                            </div>
                          </div>
                        )}

                        {/* Exam Notification Box Inspector */}
                        {activeBlock.type === 'exam_notification_box' && (
                          <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                            <span className="font-bold text-indigo-400 block text-[11px]">Notification Parameters</span>
                            <div>
                              <label className="text-[10px] text-slate-500">Exam Title</label>
                              <input
                                type="text"
                                value={activeBlock.notificationMeta?.examName || ''}
                                onChange={(e) =>
                                  handleUpdateActiveBlock({
                                    ...activeBlock,
                                    notificationMeta: { ...activeBlock.notificationMeta!, examName: e.target.value },
                                  })
                                }
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-500">Authority</label>
                                <input
                                  type="text"
                                  value={activeBlock.notificationMeta?.authority || ''}
                                  onChange={(e) =>
                                    handleUpdateActiveBlock({
                                      ...activeBlock,
                                      notificationMeta: { ...activeBlock.notificationMeta!, authority: e.target.value },
                                    })
                                  }
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500">Vacancies</label>
                                <input
                                  type="text"
                                  value={activeBlock.notificationMeta?.totalVacancies || ''}
                                  onChange={(e) =>
                                    handleUpdateActiveBlock({
                                      ...activeBlock,
                                      notificationMeta: { ...activeBlock.notificationMeta!, totalVacancies: e.target.value },
                                    })
                                  }
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 space-y-2">
                        <Sliders className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-xs font-bold text-slate-400">No Block Selected</p>
                        <p className="text-[11px]">Click on any section in the live canvas to inspect & style its parameters.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: PAGE SEO & SETTINGS */}
                {activeTab === 'settings' && (
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Page Title</label>
                      <input
                        type="text"
                        value={draftPage.title}
                        onChange={(e) => pushToHistory({ ...draftPage, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Permalink / Slug</label>
                      <div className="flex items-center">
                        <span className="bg-slate-950 border border-r-0 border-slate-800 px-3 py-2.5 rounded-l-xl text-slate-500 font-mono text-xs">
                          cgtest.in/p/
                        </span>
                        <input
                          type="text"
                          value={draftPage.slug}
                          onChange={(e) => pushToHistory({ ...draftPage, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-r-xl p-2.5 text-indigo-400 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Theme Archetype</label>
                      <select
                        value={draftPage.themeArchetype || 'hero_landing'}
                        onChange={(e) =>
                          pushToHistory({
                            ...draftPage,
                            themeArchetype: e.target.value as PageThemeArchetype,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="hero_landing">Hero Landing (High Conversion)</option>
                        <option value="cbt_exam_focused">CBT Exam Series Focus</option>
                        <option value="editorial_magazine">Editorial Magazine & News</option>
                        <option value="institutional_trust">Institutional & Syllabus</option>
                      </select>
                    </div>

                    {/* Google Search Result Preview */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Google Search Snippet Preview
                      </span>
                      <p className="text-[13px] text-blue-400 hover:underline font-bold truncate">
                        {draftPage.metaTitle || draftPage.title} | cgtest.in
                      </p>
                      <p className="text-[11px] text-emerald-400 font-mono truncate">
                        https://cgtest.in/p/{draftPage.slug}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {draftPage.metaDescription || 'Complete state exam syllabus breakdown, vacancy details, and mock tests.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">SEO Meta Title</label>
                      <input
                        type="text"
                        value={draftPage.metaTitle || ''}
                        onChange={(e) => pushToHistory({ ...draftPage, metaTitle: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">SEO Meta Description</label>
                      <textarea
                        rows={3}
                        value={draftPage.metaDescription || ''}
                        onChange={(e) => pushToHistory({ ...draftPage, metaDescription: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: NAVIGATOR / DOM TREE */}
                {activeTab === 'navigator' && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                      Page Section Hierarchy ({draftPage.blocks.length})
                    </span>
                    <div className="space-y-1.5">
                      {draftPage.blocks.map((b, idx) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedBlockIdx(idx);
                            setActiveTab('inspector');
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer text-xs ${
                            selectedBlockIdx === idx
                              ? 'bg-indigo-600/20 border-indigo-500 text-white font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-[10px] font-mono text-indigo-400">#{idx + 1}</span>
                            <span className="truncate">{b.title || b.type}</span>
                          </div>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBlock(idx, 'up');
                              }}
                              disabled={idx === 0}
                              className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBlock(idx, 'down');
                              }}
                              disabled={idx === draftPage.blocks.length - 1}
                              className="p-1 text-slate-500 hover:text-white disabled:opacity-20"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* CENTER COLUMN: LIVE INTERACTIVE CANVAS (8 or 12 Cols)         */}
            {/* ------------------------------------------------------------- */}
            <div
              className={`${
                isWysiwygPreview ? 'lg:col-span-12' : 'lg:col-span-8'
              } flex flex-col items-center justify-center transition-all duration-300`}
            >
              {/* Responsive Container Framing */}
              <div
                className={`w-full transition-all duration-300 ${
                  viewport === 'desktop'
                    ? 'max-w-5xl'
                    : viewport === 'tablet'
                    ? 'max-w-2xl border-4 border-slate-800 rounded-3xl p-4 shadow-2xl bg-slate-950'
                    : 'max-w-sm border-8 border-slate-800 rounded-[40px] p-4 shadow-2xl bg-slate-950'
                }`}
              >
                {/* Elementor Interactive Canvas Container */}
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl min-h-[600px] relative">
                  {/* Render Live Blocks */}
                  {draftPage.blocks.length === 0 ? (
                    <div className="p-16 border-2 border-dashed border-slate-800 rounded-3xl text-center space-y-3">
                      <Layout className="w-12 h-12 mx-auto text-slate-600" />
                      <h3 className="text-base font-black text-white">Empty Canvas</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Drag & drop or click any widget from the left dock to build high-converting state exam pages.
                      </p>
                      <button
                        onClick={() => handleAddBlock('hero')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md"
                      >
                        + Add Hero Section
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {draftPage.blocks.map((block, idx) => {
                        const isSelected = selectedBlockIdx === idx && !isWysiwygPreview;

                        return (
                          <div
                            key={block.id}
                            onClick={() => {
                              setSelectedBlockIdx(idx);
                              setActiveTab('inspector');
                            }}
                            className={`group relative rounded-2xl transition border ${
                              isSelected
                                ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-950/10'
                                : 'border-transparent hover:border-slate-700/80 hover:bg-slate-900/30'
                            }`}
                          >
                            {/* Elementor Hover Controls Toolbar */}
                            {!isWysiwygPreview && (
                              <div className="absolute -top-3.5 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-slate-900 border border-indigo-500/50 rounded-xl px-2 py-1 shadow-xl">
                                <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase mr-1.5">
                                  {block.type}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveBlock(idx, 'up');
                                  }}
                                  disabled={idx === 0}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                  title="Move Up"
                                >
                                  <MoveUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveBlock(idx, 'down');
                                  }}
                                  disabled={idx === draftPage.blocks.length - 1}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                  title="Move Down"
                                >
                                  <MoveDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateBlock(idx);
                                  }}
                                  className="p-1 text-slate-400 hover:text-white"
                                  title="Duplicate"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteBlock(idx);
                                  }}
                                  className="p-1 text-rose-400 hover:text-rose-300"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Render Dynamic Section */}
                            <div className="p-4 sm:p-6">
                              <DynamicPageRenderer
                                page={{
                                  ...draftPage,
                                  blocks: [block],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Elementor Bottom "+ Add New Section" Dropzone */}
                  {!isWysiwygPreview && (
                    <div className="pt-6 border-t border-dashed border-slate-800">
                      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
                        <span className="text-xs font-bold text-slate-400 block">
                          Add Next Section / Choose Widget
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            onClick={() => handleAddBlock('hero')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                          >
                            + Hero Banner
                          </button>
                          <button
                            onClick={() => handleAddBlock('syllabus_table')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                          >
                            + Syllabus Table
                          </button>
                          <button
                            onClick={() => handleAddBlock('checkpoint_quiz')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                          >
                            + Checkpoint Quiz
                          </button>
                          <button
                            onClick={() => handleAddBlock('exam_notification_box')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                          >
                            + Exam Alert
                          </button>
                          <button
                            onClick={() => handleAddBlock('faq')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                          >
                            + FAQ Accordion
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW PAGE / TEMPLATE LIBRARY                                  */}
      {/* ========================================================================= */}
      {isNewPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Create New Page</h3>
                <p className="text-xs text-slate-400">Select a pre-built conversion template or start from blank canvas.</p>
              </div>
              <button
                onClick={() => setIsNewPageModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleCreateFromTemplate('blank')}
                className="p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-left transition group cursor-pointer space-y-2"
              >
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition w-fit">
                  <Layout className="w-5 h-5" />
                </div>
                <h4 className="font-black text-white text-sm">Blank Canvas</h4>
                <p className="text-xs text-slate-400">Start from scratch with complete creative freedom.</p>
              </button>

              <button
                onClick={() => handleCreateFromTemplate('syllabus')}
                className="p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-left transition group cursor-pointer space-y-2"
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition w-fit">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-black text-white text-sm">Syllabus & Blueprint Guide</h4>
                <p className="text-xs text-slate-400">Pre-built marks weightage tables, chapter breakdown & tips.</p>
              </button>

              <button
                onClick={() => handleCreateFromTemplate('notification')}
                className="p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-left transition group cursor-pointer space-y-2"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition w-fit">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-black text-white text-sm">Recruitment & Vacancy Alert</h4>
                <p className="text-xs text-slate-400">Official PDF links, eligibility matrix, and countdown banner.</p>
              </button>

              <button
                onClick={() => handleCreateFromTemplate('landing')}
                className="p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500 text-left transition group cursor-pointer space-y-2"
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition w-fit">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-black text-white text-sm">High-Converting Hero Landing</h4>
                <p className="text-xs text-slate-400">Hero CTA, features grid, interactive quiz and FAQ accordion.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REVISION HISTORY / UNDO RESTORE                                  */}
      {/* ========================================================================= */}
      {isRevisionModalOpen && draftPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                <History className="w-4 h-4" />
                <span>Revision History for "{draftPage.title}"</span>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {!draftPage.revisions || draftPage.revisions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No previous revisions recorded yet.</p>
              ) : (
                draftPage.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{rev.title}</p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {rev.timestamp} • {rev.blockCount} blocks • {rev.author || 'Admin'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreRevision(rev)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
