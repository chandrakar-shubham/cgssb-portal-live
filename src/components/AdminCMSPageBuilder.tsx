import React, { useState } from 'react';
import { CMSPage, PageBlock, BlockType, PageThemeArchetype, DEFAULT_PAGE_THEME_TOKENS } from '../types/cms';
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
  Copy
} from 'lucide-react';
import { DynamicPageRenderer } from './DynamicPageRenderer';

interface AdminCMSPageBuilderProps {
  pages: CMSPage[];
  onSavePage: (page: CMSPage) => Promise<void>;
  onDeletePage: (id: string) => Promise<void>;
}

export const AdminCMSPageBuilder: React.FC<AdminCMSPageBuilderProps> = ({
  pages,
  onSavePage,
  onDeletePage,
}) => {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    pages[0]?.id || null
  );
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Active working draft page
  const activePage = pages.find(p => p.id === selectedPageId) || pages[0] || null;
  const [draftPage, setDraftPage] = useState<CMSPage | null>(activePage);

  React.useEffect(() => {
    const page = pages.find(p => p.id === selectedPageId);
    if (page) {
      setDraftPage(JSON.parse(JSON.stringify(page)));
    }
  }, [selectedPageId, pages]);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateNewPage = () => {
    const newId = `page-${Date.now()}`;
    const newPage: CMSPage = {
      id: newId,
      slug: `exam-guide-${Math.floor(Math.random() * 1000)}`,
      title: 'New State Exam Notification & Prep Guide',
      metaTitle: 'Exam Guide & Syllabus 2026 | CGSSB Test',
      metaDescription: 'Complete syllabus breakdown, vacancy details, and mock test preparation.',
      isPublished: true,
      themeArchetype: 'hero_landing',
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          type: 'hero',
          title: 'CGPSC & Vyapam 2026 Complete Guide',
          subtitle: 'Official subject-wise marks distribution, eligibility, and simulated CBT test series.',
          buttonText: 'Attempt Mock Test',
          buttonLink: '/tests',
        },
        {
          id: `blk-${Date.now()}-2`,
          type: 'exam_notification_box',
          title: 'Official Notification Breakdown',
          notificationMeta: {
            examName: 'Chhattisgarh State Service Recruitment 2026',
            authority: 'CGPSC / CG Vyapam',
            applicationEndDate: 'May 15, 2026',
            examDate: 'June 2026',
            totalVacancies: '250+ Posts',
            eligibilityBrief: 'Graduate in any discipline',
            officialPdfUrl: 'https://psc.cg.gov.in',
            applyOnlineUrl: 'https://psc.cg.gov.in',
          },
        },
        {
          id: `blk-${Date.now()}-3`,
          type: 'syllabus_table',
          title: 'Subject Marks Weightage',
          syllabusData: {
            subjectHeaders: ['Subject', 'Topics Included', 'Weightage'],
            rows: [
              { subject: 'CG General Knowledge', topics: 'History, Culture, Geography & Tribes of CG', weightageMarks: '50 Marks' },
              { subject: 'Chhattisgarhi Language', topics: 'Grammar, Hana, Janula & Literature', weightageMarks: '25 Marks' },
              { subject: 'General Science & Aptitude', topics: 'Maths, Logical Reasoning & General Science', weightageMarks: '25 Marks' },
            ],
          },
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setDraftPage(newPage);
    setSelectedPageId(newId);
    showNotification('New page created with default template.');
  };

  const handleAddBlock = (type: BlockType) => {
    if (!draftPage) return;
    const newBlock: PageBlock = {
      id: `blk-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      type,
      title:
        type === 'hero'
          ? 'Hero Banner'
          : type === 'syllabus_table'
          ? 'Syllabus Breakdown Table'
          : type === 'checkpoint_quiz'
          ? 'Interactive MCQ Checkpoint'
          : type === 'exam_notification_box'
          ? 'Official Notification Details'
          : type === 'key_takeaways'
          ? 'Crucial Preparation Points'
          : type === 'faq'
          ? 'Frequently Asked Questions'
          : 'Section Title',
      subtitle: 'Enter section summary or description...',
      ...(type === 'syllabus_table'
        ? {
            syllabusData: {
              subjectHeaders: ['Subject', 'Topics', 'Weightage'],
              rows: [
                { subject: 'Chhattisgarh GK', topics: 'History & Culture', weightageMarks: '30 Marks' },
                { subject: 'Chhattisgarhi Bhasha', topics: 'Hana & Janula', weightageMarks: '20 Marks' },
              ],
            },
          }
        : {}),
      ...(type === 'checkpoint_quiz'
        ? {
            checkpointQuiz: {
              question: 'Sample Practice Question: What is the official state bird of Chhattisgarh?',
              questionHindi: 'छत्तीसगढ़ का राजकीय पक्षी कौन सा है?',
              options: ['पहाड़ी मैना (Hill Myna)', 'मोर (Peacock)', 'हंस (Swan)', 'तोता (Parrot)'],
              correctIndex: 0,
              explanation: 'Bastar Hill Myna (पहाड़ी मैना) is the official state bird of Chhattisgarh.',
            },
          }
        : {}),
      ...(type === 'exam_notification_box'
        ? {
            notificationMeta: {
              examName: 'Recruitment 2026',
              authority: 'CG Vyapam',
              applicationEndDate: 'April 30, 2026',
              examDate: 'May 2026',
              totalVacancies: '300 Posts',
              eligibilityBrief: '12th Pass / Graduate',
              officialPdfUrl: 'https://vyapam.cgstate.gov.in',
            },
          }
        : {}),
      ...(type === 'key_takeaways'
        ? {
            keyTakeaways: [
              'Dedicated preparation for Chhattisgarh state GK is required.',
              'Negative marking is 1/3rd for wrong attempts.',
            ],
          }
        : {}),
      ...(type === 'faq'
        ? {
            faqList: [
              { question: 'What is the syllabus for this exam?', answer: 'Detailed subject syllabus listed above.' },
              { question: 'Is test series available on this portal?', answer: 'Yes, full mock tests are playable with state ranks.' },
            ],
          }
        : {}),
      ...(type === 'features'
        ? {
            items: [
              { title: 'Full Length CBT Mocks', description: 'Simulated real exam environment' },
              { title: 'Instant Solution Analysis', description: 'Detailed bilingual explanation' },
            ],
          }
        : {}),
    };

    setDraftPage({
      ...draftPage,
      blocks: [...draftPage.blocks, newBlock],
    });
  };

  const handleUpdateBlock = (index: number, updatedBlock: PageBlock) => {
    if (!draftPage) return;
    const blocks = [...draftPage.blocks];
    blocks[index] = updatedBlock;
    setDraftPage({ ...draftPage, blocks });
  };

  const handleDeleteBlock = (index: number) => {
    if (!draftPage) return;
    const blocks = draftPage.blocks.filter((_, i) => i !== index);
    setDraftPage({ ...draftPage, blocks });
  };

  const handleDuplicateBlock = (index: number) => {
    if (!draftPage) return;
    const blockToCopy = draftPage.blocks[index];
    const newBlock: PageBlock = {
      ...JSON.parse(JSON.stringify(blockToCopy)),
      id: `blk-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    };
    const blocks = [...draftPage.blocks];
    blocks.splice(index + 1, 0, newBlock);
    setDraftPage({ ...draftPage, blocks });
    showNotification('Block duplicated.');
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!draftPage) return;
    const blocks = [...draftPage.blocks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const temp = blocks[index];
    blocks[index] = blocks[targetIdx];
    blocks[targetIdx] = temp;
    setDraftPage({ ...draftPage, blocks });
  };

  const handleSave = async () => {
    if (!draftPage) return;
    setIsSaving(true);
    try {
      await onSavePage(draftPage);
      showNotification('Page saved and live across student portal!');
    } catch (err: any) {
      alert('Failed to save page: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page?')) return;
    try {
      await onDeletePage(id);
      showNotification('Page deleted.');
      const remaining = pages.filter(p => p.id !== id);
      if (remaining.length > 0) setSelectedPageId(remaining[0].id);
      else setDraftPage(null);
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
            <Layout className="w-3.5 h-3.5" />
            <span>Elementor-Grade Block Page Studio</span>
          </div>
          <h1 className="text-2xl font-black text-white">Visual Dynamic Page Builder</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build custom exam guides, syllabus pages, and landing pages with standardized FAANG theme archetypes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer border ${
              isPreviewMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isPreviewMode ? 'Exit Live Preview' : 'Live Theme Preview'}</span>
          </button>

          <button
            onClick={handleCreateNewPage}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition border border-slate-700 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Page</span>
          </button>

          {draftPage && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Publishing...' : 'Publish Page'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: Left Sidebar List + Right Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Pages List */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Published Pages ({pages.length})</h2>
          <div className="space-y-1.5">
            {pages.map(page => {
              const isSelected = selectedPageId === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPageId(page.id);
                    setIsPreviewMode(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  <div className="truncate">
                    <span className="text-xs block truncate">{page.title}</span>
                    <span className="text-[10px] opacity-75 font-mono">/page/{page.slug}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/30 shrink-0 ml-1">
                    {page.blocks?.length || 0} blks
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Page Editor / Preview */}
        <div className="lg:col-span-3 space-y-6">
          {draftPage ? (
            isPreviewMode ? (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold mb-6 flex items-center justify-between">
                  <span>Live Student View Preview (Theme: {draftPage.themeArchetype || 'hero_landing'})</span>
                  <button onClick={() => setIsPreviewMode(false)} className="text-white underline cursor-pointer">
                    Back to Edit Mode
                  </button>
                </div>
                <DynamicPageRenderer page={draftPage} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Meta Settings & Theme Archetype Picker */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <h3 className="text-sm font-black text-white">Page Settings & FAANG Theme Archetype</h3>
                      <p className="text-xs text-slate-400">Configure page slug, SEO title, and visual theme archetype.</p>
                    </div>
                    <button
                      onClick={() => handleDelete(draftPage.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Page</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Page Title</label>
                      <input
                        type="text"
                        value={draftPage.title}
                        onChange={e => setDraftPage({ ...draftPage, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">URL Slug (/page/...)</label>
                      <input
                        type="text"
                        value={draftPage.slug}
                        onChange={e => setDraftPage({ ...draftPage, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-indigo-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold flex items-center space-x-1">
                        <Palette className="w-3 h-3 text-indigo-400" />
                        <span>Theme Archetype</span>
                      </label>
                      <select
                        value={draftPage.themeArchetype || 'hero_landing'}
                        onChange={e => setDraftPage({ ...draftPage, themeArchetype: e.target.value as PageThemeArchetype })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      >
                        <option value="hero_landing">1. High-Conversion Hero Landing</option>
                        <option value="cbt_exam_focused">2. CBT Exam Series Focus</option>
                        <option value="editorial_magazine">3. Editorial & Magazine</option>
                        <option value="institutional_trust">4. Official Institutional & Syllabus</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Blocks Palette Picker */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                    + Add Elementor-Style Block Widget
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: 'hero', label: 'Hero Banner', icon: Layout },
                      { type: 'exam_notification_box', label: 'Exam Alert Box', icon: Sparkles },
                      { type: 'syllabus_table', label: 'Syllabus Table', icon: FileText },
                      { type: 'checkpoint_quiz', label: 'Interactive Quiz', icon: Award },
                      { type: 'key_takeaways', label: 'Key Takeaways', icon: CheckCircle2 },
                      { type: 'faq', label: 'FAQ Accordion', icon: HelpCircle },
                      { type: 'features', label: 'Feature Grid', icon: Layers },
                      { type: 'paragraph', label: 'Rich Text Box', icon: Type },
                      { type: 'cta', label: 'CTA Conversion Banner', icon: ExternalLink },
                      { type: 'ad_slot', label: 'Google AdSense Slot', icon: DollarSign },
                    ].map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          onClick={() => handleAddBlock(item.type as BlockType)}
                          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Icon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Page Blocks Reordering & Editing Stack */}
                <div className="space-y-4">
                  {draftPage.blocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
                    >
                      {/* Block Controls Header */}
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                            Block {idx + 1}: {block.type}
                          </span>
                          <span className="text-xs font-bold text-white truncate max-w-xs">{block.title || 'Untitled Block'}</span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleMoveBlock(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveBlock(idx, 'down')}
                            disabled={idx === draftPage.blocks.length - 1}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateBlock(idx)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
                            title="Duplicate Block"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBlock(idx)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                            title="Delete Block"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Block Specific Edit Fields */}
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-400 font-bold block mb-1">Block Title</label>
                            <input
                              type="text"
                              value={block.title || ''}
                              onChange={e => handleUpdateBlock(idx, { ...block, title: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 font-bold block mb-1">Subtitle / Summary</label>
                            <input
                              type="text"
                              value={block.subtitle || ''}
                              onChange={e => handleUpdateBlock(idx, { ...block, subtitle: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300"
                            />
                          </div>
                        </div>

                        {/* If Hero or CTA: Button configuration */}
                        {(block.type === 'hero' || block.type === 'cta') && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="text-slate-400 font-bold block mb-1">Button Text</label>
                              <input
                                type="text"
                                value={block.buttonText || ''}
                                onChange={e => handleUpdateBlock(idx, { ...block, buttonText: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-slate-400 font-bold block mb-1">Button Destination Link</label>
                              <input
                                type="text"
                                value={block.buttonLink || ''}
                                onChange={e => handleUpdateBlock(idx, { ...block, buttonLink: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-indigo-400"
                              />
                            </div>
                          </div>
                        )}

                        {/* If Paragraph */}
                        {block.type === 'paragraph' && (
                          <div className="pt-2">
                            <label className="text-slate-400 font-bold block mb-1">Content Body</label>
                            <textarea
                              rows={4}
                              value={block.content || block.subtitle || ''}
                              onChange={e => handleUpdateBlock(idx, { ...block, content: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">No Page Selected</p>
              <p className="text-xs">Select an existing page from the sidebar or click "New Page" to start building.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
