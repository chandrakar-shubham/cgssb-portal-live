import React, { useState } from 'react';
import { CMSPage, PageBlock, BlockType } from '../types/cms';
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
  Edit3
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

  // When selected page changes, sync draft
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
      slug: `new-page-${Math.floor(Math.random() * 1000)}`,
      title: 'Untitled Dynamic Page',
      metaTitle: 'Untitled Page | CGSSB Test',
      metaDescription: 'Custom no-code dynamic page',
      isPublished: true,
      blocks: [
        {
          id: `blk-${Date.now()}-1`,
          type: 'hero',
          title: 'Welcome to Our New Page',
          subtitle: 'Custom customizable landing banner built without coding.',
          buttonText: 'Explore Test Series',
          buttonLink: '/test-series',
        },
        {
          id: `blk-${Date.now()}-2`,
          type: 'heading',
          title: 'Important Highlights',
          subtitle: 'Key information for students and candidates.',
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setDraftPage(newPage);
    setSelectedPageId(newId);
    showNotification('New draft page created!');
  };

  const handleAddBlock = (type: BlockType) => {
    if (!draftPage) return;
    const newBlock: PageBlock = {
      id: `blk-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      type,
      title: type === 'hero' ? 'Hero Title' : type === 'faq' ? 'FAQ Section' : 'Block Heading',
      subtitle: 'Enter block description or subtitle here...',
      ...(type === 'features' ? {
        items: [
          { title: 'Feature 1', description: 'Description of feature 1' },
          { title: 'Feature 2', description: 'Description of feature 2' },
        ]
      } : {}),
      ...(type === 'faq' ? {
        faqList: [
          { question: 'Sample Question 1?', answer: 'Detailed answer to sample question 1.' },
          { question: 'Sample Question 2?', answer: 'Detailed answer to sample question 2.' },
        ]
      } : {}),
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
      showNotification('Page saved and published successfully!');
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
      if (remaining.length > 0) {
        setSelectedPageId(remaining[0].id);
      } else {
        setDraftPage(null);
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Toast Notification */}
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
            <Globe className="w-3.5 h-3.5" />
            <span>WordPress-Style Visual No-Code Page Builder</span>
          </div>
          <h1 className="text-2xl font-black text-white">Custom Dynamic Pages Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Build landing pages, syllabus guides, or coaching announcements visually without coding.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition cursor-pointer ${
              isPreviewMode
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{isPreviewMode ? 'Back to Editor' : 'Live Preview'}</span>
          </button>

          <button
            onClick={handleCreateNewPage}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Page</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !draftPage}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save & Publish Page'}</span>
          </button>
        </div>
      </div>

      {isPreviewMode && draftPage ? (
        /* Live Preview Mode */
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <span>PREVIEW ROUTE: /p/{draftPage.slug}</span>
            <span className="text-emerald-400 font-bold">100% Responsive Live Preview</span>
          </div>
          <DynamicPageRenderer page={draftPage} />
        </div>
      ) : (
        /* Visual Editor Mode */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Pages List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase">Pages List ({pages.length})</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono">No-Code</span>
              </div>

              <div className="space-y-1.5">
                {pages.map(p => {
                  const isSelected = p.id === draftPage?.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPageId(p.id)}
                      className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="truncate space-y-0.5">
                        <div className="font-bold text-white truncate">{p.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">/p/{p.slug}</div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(p.id);
                        }}
                        title="Delete Page"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Block Inserter Palette */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase block">Add Block Element</span>
              <div className="grid grid-cols-1 gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => handleAddBlock('hero')}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
                >
                  <Layout className="w-4 h-4 text-indigo-400" />
                  <span>Hero Banner Block</span>
                </button>
                <button
                  onClick={() => handleAddBlock('heading')}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
                >
                  <Type className="w-4 h-4 text-emerald-400" />
                  <span>Section Heading</span>
                </button>
                <button
                  onClick={() => handleAddBlock('paragraph')}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Rich Text / Prose</span>
                </button>
                <button
                  onClick={() => handleAddBlock('features')}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Feature Grid Cards</span>
                </button>
                <button
                  onClick={() => handleAddBlock('faq')}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  <span>FAQ Accordion</span>
                </button>
                <button
                  onClick={() => handleAddBlock('test_series_widget')}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-teal-400" />
                  <span>Test Series Widget</span>
                </button>
                <button
                  onClick={() => handleAddBlock('raw_html')}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white flex items-center space-x-2 transition cursor-pointer"
                >
                  <Code className="w-4 h-4 text-rose-400" />
                  <span>Custom HTML / Embed</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Main Column: Page Settings & Visual Block Editor */}
          {draftPage && (
            <div className="lg:col-span-3 space-y-6">
              {/* Page Metadata Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    <span>Page Settings & URL Slug</span>
                  </h3>
                  <a
                    href={`/p/${draftPage.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <span>/p/{draftPage.slug}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Page Title</label>
                    <input
                      type="text"
                      value={draftPage.title}
                      onChange={e => setDraftPage({ ...draftPage, title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">URL Slug</label>
                    <input
                      type="text"
                      value={draftPage.slug}
                      onChange={e => setDraftPage({ ...draftPage, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">SEO Title Tag</label>
                    <input
                      type="text"
                      value={draftPage.metaTitle || ''}
                      onChange={e => setDraftPage({ ...draftPage, metaTitle: e.target.value })}
                      placeholder="e.g. About Exam Platform | CGSSB Test"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">SEO Description</label>
                    <input
                      type="text"
                      value={draftPage.metaDescription || ''}
                      onChange={e => setDraftPage({ ...draftPage, metaDescription: e.target.value })}
                      placeholder="Meta description for Google search preview..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Block Composition Canvas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">Page Blocks Composition ({draftPage.blocks.length})</h3>
                  <span className="text-xs text-slate-400">Reorder or edit block content below</span>
                </div>

                {draftPage.blocks.map((blk, idx) => (
                  <div
                    key={blk.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition"
                  >
                    {/* Block Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white uppercase tracking-wider">{blk.type.replace('_', ' ')} BLOCK</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveBlock(idx, 'up')}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === draftPage.blocks.length - 1}
                          onClick={() => handleMoveBlock(idx, 'down')}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(idx)}
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Block Edit Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 font-semibold mb-1">Block Main Title</label>
                        <input
                          type="text"
                          value={blk.title || ''}
                          onChange={e => handleUpdateBlock(idx, { ...blk, title: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      {blk.type !== 'raw_html' && (
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 font-semibold mb-1">Subtitle / Description</label>
                          <textarea
                            rows={2}
                            value={blk.subtitle || blk.content || ''}
                            onChange={e => handleUpdateBlock(idx, { ...blk, subtitle: e.target.value, content: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      )}

                      {blk.type === 'hero' && (
                        <>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">CTA Button Text</label>
                            <input
                              type="text"
                              value={blk.buttonText || ''}
                              onChange={e => handleUpdateBlock(idx, { ...blk, buttonText: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-semibold mb-1">CTA Button Link</label>
                            <input
                              type="text"
                              value={blk.buttonLink || ''}
                              onChange={e => handleUpdateBlock(idx, { ...blk, buttonLink: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </>
                      )}

                      {blk.type === 'raw_html' && (
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 font-semibold mb-1">HTML Content / Embed Code</label>
                          <textarea
                            rows={4}
                            value={blk.content || ''}
                            onChange={e => handleUpdateBlock(idx, { ...blk, content: e.target.value })}
                            placeholder="<div>Custom HTML or iframe embed code</div>"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-mono focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
