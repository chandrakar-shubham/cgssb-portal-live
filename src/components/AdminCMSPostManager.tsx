import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CMSPost,
  PostThemeArchetype,
  PageRevision,
  DEFAULT_POST_THEME_TOKENS,
} from '../types/cms';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Tag,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
  Edit3,
  Sparkles,
  Award,
  Palette,
  Eye,
  Download,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Code,
  Table as TableIcon,
  RotateCcw,
  RotateCw,
  HelpCircle,
  Scissors,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Globe,
  Lock,
  History,
  AlertTriangle,
  BookOpen,
  Share2,
  Zap,
  MoreVertical,
  Type,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { DynamicPostRenderer } from './DynamicPostRenderer';

interface AdminCMSPostManagerProps {
  posts: CMSPost[];
  onSavePost: (post: CMSPost) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
}

type EditorMode = 'wp_all_posts' | 'classic_editor';
type ContentTab = 'visual' | 'text';

interface QuickEditPostState {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  author: string;
  isPublished: boolean;
  publishedAt: string;
  themeArchetype: PostThemeArchetype;
}

export const AdminCMSPostManager: React.FC<AdminCMSPostManagerProps> = ({
  posts,
  onSavePost,
  onDeletePost,
}) => {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<EditorMode>('wp_all_posts');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(posts[0]?.id || null);

  // All Posts Table States
  const [tableFilter, setTableFilter] = useState<'all' | 'published' | 'drafts'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [quickEditState, setQuickEditState] = useState<QuickEditPostState | null>(null);

  // Classic Post Editor States
  const [contentTab, setContentTab] = useState<ContentTab>('visual');
  const [showKitchenSink, setShowKitchenSink] = useState(true);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaCaptionInput, setMediaCaptionInput] = useState('');
  const [mediaAlignInput, setMediaAlignInput] = useState<'left' | 'center' | 'right' | 'none'>('center');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');
  const [isSpecialCharModalOpen, setIsSpecialCharModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isPreviewLiveModalOpen, setIsPreviewLiveModalOpen] = useState(false);
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);

  // Active Draft & Undo/Redo
  const activePost = useMemo(() => posts.find((p) => p.id === selectedPostId) || posts[0] || null, [posts, selectedPostId]);
  const [draftPost, setDraftPost] = useState<CMSPost | null>(activePost);
  const [historyStack, setHistoryStack] = useState<CMSPost[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync draft when post changes
  useEffect(() => {
    const p = posts.find((x) => x.id === selectedPostId);
    if (p) {
      const cloned = JSON.parse(JSON.stringify(p));
      setDraftPost(cloned);
      setHistoryStack([cloned]);
      setHistoryIndex(0);
      setIsSlugEditing(false);
    }
  }, [selectedPostId, posts]);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Push to Undo/Redo Stack
  const pushToHistory = (newPost: CMSPost) => {
    const updatedHistory = historyStack.slice(0, historyIndex + 1);
    setHistoryStack([...updatedHistory, JSON.parse(JSON.stringify(newPost))]);
    setHistoryIndex(updatedHistory.length);
    setDraftPost(newPost);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      setHistoryIndex(targetIdx);
      setDraftPost(JSON.parse(JSON.stringify(historyStack[targetIdx])));
      showNotification('Undo');
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const targetIdx = historyIndex + 1;
      setHistoryIndex(targetIdx);
      setDraftPost(JSON.parse(JSON.stringify(historyStack[targetIdx])));
      showNotification('Redo');
    }
  };

  // Filtering Posts
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (tableFilter === 'published' && !p.isPublished) return false;
      if (tableFilter === 'drafts' && p.isPublished) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(query);
        const matchSlug = p.slug.toLowerCase().includes(query);
        const matchAuthor = p.author.toLowerCase().includes(query);
        const matchTags = p.tags.some((t) => t.toLowerCase().includes(query));
        if (!matchTitle && !matchSlug && !matchAuthor && !matchTags) return false;
      }
      return true;
    });
  }, [posts, tableFilter, categoryFilter, searchQuery]);

  // Bulk Actions
  const handleSelectAllRows = () => {
    if (selectedRowIds.size === filteredPosts.length) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredPosts.map((p) => p.id)));
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
        const p = posts.find((x) => x.id === id);
        if (p) await onSavePost({ ...p, isPublished: true, updatedAt: new Date().toISOString().split('T')[0] });
      }
      showNotification(`Published ${selectedRowIds.size} post(s).`);
    } else if (bulkAction === 'draft') {
      for (const id of selectedRowIds) {
        const p = posts.find((x) => x.id === id);
        if (p) await onSavePost({ ...p, isPublished: false, updatedAt: new Date().toISOString().split('T')[0] });
      }
      showNotification(`Moved ${selectedRowIds.size} post(s) to drafts.`);
    } else if (bulkAction === 'delete') {
      if (confirm(`Move ${selectedRowIds.size} post(s) to Trash?`)) {
        for (const id of selectedRowIds) {
          await onDeletePost(id);
        }
        showNotification(`Deleted ${selectedRowIds.size} post(s).`);
      }
    }
    setSelectedRowIds(new Set());
    setBulkAction('');
  };

  // Quick Edit Submit
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditState) return;
    const post = posts.find((p) => p.id === quickEditState.id);
    if (!post) return;

    const updated: CMSPost = {
      ...post,
      title: quickEditState.title,
      slug: quickEditState.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      category: quickEditState.category,
      tags: quickEditState.tags,
      author: quickEditState.author,
      isPublished: quickEditState.isPublished,
      publishedAt: quickEditState.publishedAt,
      themeArchetype: quickEditState.themeArchetype,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    await onSavePost(updated);
    setQuickEditState(null);
    showNotification(`Quick updated: "${updated.title}"`);
  };

  // Create New Post (WordPress "Add New Post")
  const handleAddNewPost = () => {
    const newId = `post-${Date.now()}`;
    const newPost: CMSPost = {
      id: newId,
      slug: `exam-post-${Math.floor(Math.random() * 1000)}`,
      title: '',
      category: 'Exam Notifications',
      excerpt: '',
      content: '',
      tags: ['CGPSC', 'Vyapam', '2026'],
      author: 'Admin Staff',
      isPublished: false,
      publishedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      themeArchetype: 'exam_notification',
      notificationMeta: {
        examName: 'Official CG State Exam 2026',
        authority: 'CGPSC / Vyapam',
        applicationEndDate: 'May 30, 2026',
        examDate: 'June 2026',
        totalVacancies: '350 Posts',
        officialPdfUrl: 'https://psc.cg.gov.in',
      },
      checkpointQuiz: {
        question: 'Sample Question: What is the capital of Chhattisgarh?',
        questionHindi: 'छत्तीसगढ़ की राजधानी कौन सी है?',
        options: ['रायपुर (Raipur)', 'बिलासपुर (Bilaspur)', 'दुर्ग (Durg)', 'जगदलपुर (Jagdalpur)'],
        correctIndex: 0,
        explanation: 'Raipur is the capital city of Chhattisgarh.',
      },
    };

    setDraftPost(newPost);
    setSelectedPostId(newId);
    setViewMode('classic_editor');
    showNotification('New post initialized in Classic Editor.');
  };

  // Launch Classic Editor
  const handleOpenClassicEditor = (postId: string) => {
    setSelectedPostId(postId);
    setViewMode('classic_editor');
  };

  // Save Post Action in Classic Editor
  const handleSaveDraftOrPublish = async (publishState?: boolean) => {
    if (!draftPost) return;
    setIsSaving(true);

    const now = new Date().toISOString().split('T')[0];
    const newRevision: PageRevision = {
      id: `rev-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + now,
      title: `Saved via Classic Editor`,
      author: draftPost.author || 'Admin Staff',
      blockCount: draftPost.content ? draftPost.content.split('\n\n').length : 1,
      data: JSON.parse(JSON.stringify(draftPost)),
    };

    const updatedRevisions = [newRevision, ...(draftPost.revisions || [])].slice(0, 20);

    const targetPost: CMSPost = {
      ...draftPost,
      title: draftPost.title.trim() || 'Untitled Post',
      isPublished: publishState !== undefined ? publishState : draftPost.isPublished,
      updatedAt: now,
      revisions: updatedRevisions,
    };

    try {
      await onSavePost(targetPost);
      setDraftPost(targetPost);
      showNotification(targetPost.isPublished ? '🚀 Post Published Live!' : '💾 Draft Saved Successfully');
    } catch (err: any) {
      alert('Error saving post: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Text formatting insertion helper for TinyMCE / Classic Editor
  const insertFormatting = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current || !draftPost) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = el.value.substring(start, end);
    const replacement = `${prefix}${selectedText || 'Text'}${suffix}`;

    const newContent = el.value.substring(0, start) + replacement + el.value.substring(end);
    pushToHistory({ ...draftPost, content: newContent });

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 50);
  };

  const insertMediaTag = () => {
    if (!mediaUrlInput.trim() || !draftPost) return;
    const caption = mediaCaptionInput ? `\n*${mediaCaptionInput}*` : '';
    const imgMarkdown = `\n![${mediaCaptionInput || 'Image'}](${mediaUrlInput.trim()})${caption}\n`;
    insertFormatting('', imgMarkdown);
    setIsMediaModalOpen(false);
    setMediaUrlInput('');
    setMediaCaptionInput('');
    showNotification('Media inserted into post content.');
  };

  const insertLinkTag = () => {
    if (!linkUrlInput.trim() || !draftPost) return;
    const text = linkTextInput.trim() || 'Link Text';
    const linkMarkdown = `[${text}](${linkUrlInput.trim()})`;
    insertFormatting('', linkMarkdown);
    setIsLinkModalOpen(false);
    setLinkUrlInput('');
    setLinkTextInput('');
    showNotification('Link inserted.');
  };

  const insertSpecialChar = (char: string) => {
    insertFormatting(char, '');
    setIsSpecialCharModalOpen(false);
  };

  const insertTable = () => {
    const tableTemplate = `\n| Section / Subject | Topics Included | Marks Weightage |\n| :--- | :--- | :--- |\n| Chhattisgarh GK | History, Geography & Culture | 30 Marks |\n| Chhattisgarhi Bhasha | Grammar, Hana & Janula | 20 Marks |\n| Reasoning & Maths | Aptitude & Logical Series | 25 Marks |\n\n`;
    insertFormatting('', tableTemplate);
    showNotification('Table matrix inserted.');
  };

  // Tag Management
  const handleAddTag = () => {
    if (!newTagInput.trim() || !draftPost) return;
    const tag = newTagInput.trim();
    if (!draftPost.tags.includes(tag)) {
      pushToHistory({ ...draftPost, tags: [...draftPost.tags, tag] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!draftPost) return;
    pushToHistory({ ...draftPost, tags: draftPost.tags.filter((t) => t !== tagToRemove) });
  };

  // Category Management
  const handleAddNewCategory = () => {
    if (!newCategoryInput.trim() || !draftPost) return;
    const cat = newCategoryInput.trim();
    pushToHistory({ ...draftPost, category: cat });
    setNewCategoryInput('');
    setIsAddingNewCat(false);
    showNotification(`Category "${cat}" added.`);
  };

  // Word & Character count
  const wordCount = useMemo(() => {
    if (!draftPost?.content) return 0;
    return draftPost.content.trim().split(/\s+/).filter(Boolean).length;
  }, [draftPost?.content]);

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
      {/* VIEW 1: WORDPRESS ALL POSTS MASTER CATALOG ("Posts > All Posts")          */}
      {/* ========================================================================= */}
      {viewMode === 'wp_all_posts' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400">
                <FileText className="w-3.5 h-3.5" />
                <span>WordPress Master CMS / Posts Directory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center space-x-3">
                <span>Posts</span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {posts.length} Total
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Publish exam notifications, daily current affairs digests, syllabus guides, and strategy articles.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={handleAddNewPost}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Post</span>
              </button>
            </div>
          </div>

          {/* WordPress Filter Tabs & Search Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 space-y-4 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <button
                  onClick={() => setTableFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    tableFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  All ({posts.length})
                </button>
                <button
                  onClick={() => setTableFilter('published')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    tableFilter === 'published'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Published ({posts.filter((p) => p.isPublished).length})
                </button>
                <button
                  onClick={() => setTableFilter('drafts')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    tableFilter === 'drafts'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  Drafts ({posts.filter((p) => !p.isPublished).length})
                </button>
              </div>

              {/* Category Filter & Search Box */}
              <div className="flex items-center space-x-2 w-full lg:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="relative w-full lg:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search posts..."
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
                  <option value="delete">Move to Trash</option>
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
                    {selectedRowIds.size} post(s) selected
                  </span>
                )}
              </div>

              <div className="text-slate-400 text-xs">
                Showing <strong className="text-white">{filteredPosts.length}</strong> of {posts.length} posts
              </div>
            </div>

            {/* WordPress Posts Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredPosts.length > 0 && selectedRowIds.size === filteredPosts.length}
                        onChange={handleSelectAllRows}
                        className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Title & Permalink</th>
                    <th className="p-3.5">Author</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Tags</th>
                    <th className="p-3.5">Format Archetype</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5 text-right">Classic Editor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-500">
                        <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                        <p className="font-bold text-slate-400">No posts found matching criteria</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((p) => {
                      const isSelected = selectedRowIds.has(p.id);

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

                            {/* Title & WordPress Row Hover Actions */}
                            <td className="p-3.5 max-w-sm">
                              <div className="space-y-1">
                                <span
                                  onClick={() => handleOpenClassicEditor(p.id)}
                                  className="font-bold text-slate-100 text-sm hover:text-indigo-400 transition cursor-pointer line-clamp-1"
                                >
                                  {p.title || '(No title)'}
                                </span>

                                <div className="text-[11px] text-slate-500 font-mono">
                                  /posts/{p.slug}
                                </div>

                                {/* WordPress Row Hover Action Menu */}
                                <div className="flex items-center space-x-2 text-[11px] pt-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenClassicEditor(p.id)}
                                    className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Edit (Classic Editor)</span>
                                  </button>
                                  <span className="text-slate-700">|</span>
                                  <button
                                    onClick={() =>
                                      setQuickEditState({
                                        id: p.id,
                                        title: p.title,
                                        slug: p.slug,
                                        category: p.category,
                                        tags: p.tags,
                                        author: p.author,
                                        isPublished: p.isPublished,
                                        publishedAt: p.publishedAt,
                                        themeArchetype: p.themeArchetype || 'exam_notification',
                                      })
                                    }
                                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                                  >
                                    Quick Edit
                                  </button>
                                  <span className="text-slate-700">|</span>
                                  <button
                                    onClick={() => handleOpenClassicEditor(p.id)}
                                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                                  >
                                    View
                                  </button>
                                  <span className="text-slate-700">|</span>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Move "${p.title}" to Trash?`)) onDeletePost(p.id);
                                    }}
                                    className="text-rose-400 hover:text-rose-300 cursor-pointer"
                                  >
                                    Trash
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Author */}
                            <td className="p-3.5 text-slate-400">{p.author || 'Admin Staff'}</td>

                            {/* Category */}
                            <td className="p-3.5">
                              <span className="text-indigo-400 font-medium">{p.category}</span>
                            </td>

                            {/* Tags */}
                            <td className="p-3.5 text-slate-400">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {p.tags.map((t, idx) => (
                                  <span key={idx} className="text-[10px] text-slate-400 font-mono">
                                    #{t}{idx < p.tags.length - 1 ? ',' : ''}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Format Archetype */}
                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-mono">
                                {p.themeArchetype || 'exam_notification'}
                              </span>
                            </td>

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

                            {/* Date */}
                            <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                              <div>{p.publishedAt}</div>
                              <div className="text-[10px] text-slate-500">Last Mod: {p.updatedAt}</div>
                            </td>

                            {/* Launch Classic Editor Button */}
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => handleOpenClassicEditor(p.id)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition flex items-center space-x-1.5 ml-auto border border-slate-700 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Edit Post</span>
                              </button>
                            </td>
                          </tr>

                          {/* Quick Edit Drawer for Posts */}
                          {quickEditState?.id === p.id && (
                            <tr className="bg-slate-950 border-y-2 border-indigo-500/50">
                              <td colSpan={9} className="p-5">
                                <form onSubmit={handleSaveQuickEdit} className="space-y-4">
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                                    <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                                      <Zap className="w-4 h-4" />
                                      <span>Quick Edit Post: {p.title}</span>
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
                                      <label className="block text-slate-400 mb-1 font-bold">Post Title</label>
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
                                      <label className="block text-slate-400 mb-1 font-bold">Category</label>
                                      <select
                                        value={quickEditState.category}
                                        onChange={(e) => setQuickEditState({ ...quickEditState, category: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                      >
                                        <option value="Exam Notifications">Exam Notifications</option>
                                        <option value="Daily Current Affairs">Daily Current Affairs</option>
                                        <option value="Study Material">Study Material</option>
                                        <option value="Syllabus & Pattern">Syllabus & Pattern</option>
                                        <option value="Topper Strategy">Topper Strategy</option>
                                      </select>
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

                                    <div className="sm:col-span-2">
                                      <label className="block text-slate-400 mb-1 font-bold">Tags (Comma-separated)</label>
                                      <input
                                        type="text"
                                        value={quickEditState.tags.join(', ')}
                                        onChange={(e) =>
                                          setQuickEditState({
                                            ...quickEditState,
                                            tags: e.target.value
                                              .split(',')
                                              .map((t) => t.trim())
                                              .filter(Boolean),
                                          })
                                        }
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="block text-slate-400 mb-1 font-bold">Format Archetype</label>
                                      <select
                                        value={quickEditState.themeArchetype}
                                        onChange={(e) =>
                                          setQuickEditState({
                                            ...quickEditState,
                                            themeArchetype: e.target.value as PostThemeArchetype,
                                          })
                                        }
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:border-indigo-500 focus:outline-none"
                                      >
                                        <option value="exam_notification">Exam Notification Alert</option>
                                        <option value="daily_current_affairs">Daily Current Affairs & News</option>
                                        <option value="study_material_guide">Study Material & Guide</option>
                                        <option value="topper_strategy">Topper Strategy & Cutoff</option>
                                      </select>
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
                                      <span className="font-bold">Published (Live)</span>
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
                                        Update Post
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
      {/* VIEW 2: AUTHENTIC WORDPRESS "WRITE POST" CLASSIC EDITOR WORKSPACE         */}
      {/* ========================================================================= */}
      {viewMode === 'classic_editor' && draftPost && (
        <div className="space-y-4">
          {/* Top Bar Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('wp_all_posts')}
                className="p-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Posts</span>
              </button>

              <div className="h-5 w-px bg-slate-800" />

              <div className="flex items-center space-x-2">
                <span className="text-xs font-black text-white">
                  {draftPost.title ? `Edit Post: "${draftPost.title}"` : 'Add New Post'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  (WordPress Classic TinyMCE Mode)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPreviewLiveModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 border border-slate-700 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preview Post</span>
              </button>
              <button
                onClick={() => handleSaveDraftOrPublish(false)}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => handleSaveDraftOrPublish(true)}
                disabled={isSaving}
                className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black transition flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{draftPost.isPublished ? 'Update Post' : 'Publish'}</span>
              </button>
            </div>
          </div>

          {/* 2-Column Classic Layout: Main Editor (Left) & Meta Boxes Sidebar (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ------------------------------------------------------------- */}
            {/* MAIN CLASSIC EDITOR COLUMN (8 Cols)                           */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-4">
              {/* Post Title Field (WordPress Big Input) */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter title here"
                  value={draftPost.title}
                  onChange={(e) => pushToHistory({ ...draftPost, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xl sm:text-2xl font-black text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 shadow-xl"
                />

                {/* WordPress Permalink Box */}
                <div className="flex flex-wrap items-center space-x-2 text-xs bg-slate-950 border border-slate-800/80 p-2.5 px-4 rounded-xl">
                  <span className="text-slate-500 font-mono">
                    <strong>Permalink:</strong> https://cgtest.in/posts/
                  </span>

                  {isSlugEditing ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="text"
                        value={draftPost.slug}
                        onChange={(e) =>
                          pushToHistory({
                            ...draftPost,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
                          })
                        }
                        className="bg-slate-900 border border-indigo-500 text-indigo-400 font-mono text-xs px-2 py-0.5 rounded focus:outline-none"
                      />
                      <button
                        onClick={() => setIsSlugEditing(false)}
                        className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold text-[11px]"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setIsSlugEditing(false)}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-indigo-400 font-bold">{draftPost.slug}</span>
                      <button
                        onClick={() => setIsSlugEditing(true)}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setIsPreviewLiveModalOpen(true)}
                        className="text-indigo-400 hover:underline text-[11px]"
                      >
                        View Post
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Add Media Bar (WordPress Classic) */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-2 border border-slate-700 cursor-pointer shadow-sm"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Add Media</span>
                </button>

                {/* Visual vs Text Tab Switcher */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-bold">
                  <button
                    onClick={() => setContentTab('visual')}
                    className={`px-3 py-1 rounded-lg transition ${
                      contentTab === 'visual'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setContentTab('text')}
                    className={`px-3 py-1 rounded-lg transition ${
                      contentTab === 'text'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Text (HTML)
                  </button>
                </div>
              </div>

              {/* WordPress TinyMCE 2-Row Rich Toolbar */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* TOOLBAR ROW 1 */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-950 border-b border-slate-800/80 text-slate-300">
                  {/* Paragraph Formats Dropdown */}
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'h1') insertFormatting('# ', '\n');
                      else if (val === 'h2') insertFormatting('## ', '\n');
                      else if (val === 'h3') insertFormatting('### ', '\n');
                      else if (val === 'h4') insertFormatting('#### ', '\n');
                      else if (val === 'quote') insertFormatting('> ', '\n');
                      else if (val === 'code') insertFormatting('```\n', '\n```');
                      e.target.value = '';
                    }}
                    className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-bold mr-1"
                  >
                    <option value="">Paragraph</option>
                    <option value="h1">Heading 1 (H1)</option>
                    <option value="h2">Heading 2 (H2)</option>
                    <option value="h3">Heading 3 (H3)</option>
                    <option value="h4">Heading 4 (H4)</option>
                    <option value="quote">Blockquote</option>
                    <option value="code">Preformatted</option>
                  </select>

                  <div className="h-4 w-px bg-slate-800 mx-1" />

                  {/* Standard Text Formatting Buttons */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('~~', '~~')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-slate-800 mx-1" />

                  {/* Lists & Quotes */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n- ', '\n- \n- ')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Bulleted List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n1. ', '\n2. \n3. ')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n> ', '\n')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Blockquote"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-slate-800 mx-1" />

                  {/* Alignments */}
                  <button
                    type="button"
                    onClick={() => insertFormatting('<div align="left">\n', '\n</div>')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<div align="center">\n', '\n</div>')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Align Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<div align="right">\n', '\n</div>')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-slate-800 mx-1" />

                  {/* Links & Read More */}
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                    title="Insert/Edit Link"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n<!--more-->\n', '')}
                    className="p-1.5 px-2 rounded-lg hover:bg-slate-800 hover:text-white transition text-[11px] font-bold"
                    title="Insert Read More Tag"
                  >
                    more
                  </button>

                  {/* Kitchen Sink Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowKitchenSink(!showKitchenSink)}
                    className={`p-1.5 rounded-lg transition ml-auto ${
                      showKitchenSink ? 'bg-slate-800 text-indigo-400' : 'hover:bg-slate-800 text-slate-400'
                    }`}
                    title="Toggle Kitchen Sink (Row 2)"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* TOOLBAR ROW 2 (KITCHEN SINK) */}
                {showKitchenSink && (
                  <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-950/60 border-b border-slate-800/80 text-slate-400 text-xs">
                    <button
                      type="button"
                      onClick={() => insertFormatting('<u>', '</u>')}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                      title="Underline (Ctrl+U)"
                    >
                      <UnderlineIcon className="w-3.5 h-3.5" />
                    </button>

                    {/* Text Color Swatches */}
                    <div className="flex items-center space-x-1 px-1.5">
                      <button
                        type="button"
                        onClick={() => insertFormatting('<span style="color:#10b981">', '</span>')}
                        className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:scale-125 transition"
                        title="Emerald Accent"
                      />
                      <button
                        type="button"
                        onClick={() => insertFormatting('<span style="color:#6366f1">', '</span>')}
                        className="w-3.5 h-3.5 rounded-full bg-indigo-500 hover:scale-125 transition"
                        title="Indigo Accent"
                      />
                      <button
                        type="button"
                        onClick={() => insertFormatting('<span style="color:#f59e0b">', '</span>')}
                        className="w-3.5 h-3.5 rounded-full bg-amber-500 hover:scale-125 transition"
                        title="Amber Accent"
                      />
                      <button
                        type="button"
                        onClick={() => insertFormatting('<span style="color:#ef4444">', '</span>')}
                        className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:scale-125 transition"
                        title="Rose Accent"
                      />
                    </div>

                    <div className="h-4 w-px bg-slate-800 mx-1" />

                    <button
                      type="button"
                      onClick={insertTable}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
                      title="Insert Table"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSpecialCharModalOpen(true)}
                      className="p-1.5 px-2 rounded-lg hover:bg-slate-800 hover:text-white transition text-[11px] font-bold"
                      title="Special Characters (Ω, ©, ®, ₹)"
                    >
                      Ω
                    </button>

                    <div className="h-4 w-px bg-slate-800 mx-1" />

                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
                      title="Undo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={historyIndex >= historyStack.length - 1}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-30 transition"
                      title="Redo"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsShortcutsModalOpen(true)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition ml-auto"
                      title="Keyboard Shortcuts"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* EDITOR TEXTAREA BODY */}
                <div className="p-4 bg-slate-900">
                  <textarea
                    ref={textareaRef}
                    rows={18}
                    value={draftPost.content}
                    onChange={(e) => pushToHistory({ ...draftPost, content: e.target.value })}
                    placeholder="Type or paste examination notification text, subject study guide, or daily current affairs bulletin..."
                    className="w-full bg-transparent text-slate-100 placeholder:text-slate-600 focus:outline-none resize-y text-sm sm:text-base leading-relaxed font-sans"
                  />
                </div>

                {/* BOTTOM EDITOR STATUS BAR (WordPress Word Count) */}
                <div className="flex flex-wrap items-center justify-between p-3 px-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center space-x-3">
                    <span>
                      Word count: <strong className="text-slate-300">{wordCount}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Characters: <strong className="text-slate-300">{draftPost.content.length}</strong>
                    </span>
                  </div>
                  <div>
                    Last edited: <span className="text-slate-300">{draftPost.updatedAt}</span>
                  </div>
                </div>
              </div>

              {/* Excerpt Meta Box (Below Editor in Classic WP) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Excerpt</h3>
                  <span className="text-[10px] text-slate-500">Summary for search cards & feeds</span>
                </div>
                <textarea
                  rows={3}
                  value={draftPost.excerpt}
                  onChange={(e) => pushToHistory({ ...draftPost, excerpt: e.target.value })}
                  placeholder="Write a custom excerpt for this post (optional)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Examination Notification & Vacancy Matrix Meta Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Official Commission Notification Meta (CG Exam Extension)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Exam / Cadre Name</label>
                    <input
                      type="text"
                      value={draftPost.notificationMeta?.examName || ''}
                      onChange={(e) =>
                        pushToHistory({
                          ...draftPost,
                          notificationMeta: { ...draftPost.notificationMeta!, examName: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Total Vacancies</label>
                    <input
                      type="text"
                      value={draftPost.notificationMeta?.totalVacancies || ''}
                      onChange={(e) =>
                        pushToHistory({
                          ...draftPost,
                          notificationMeta: { ...draftPost.notificationMeta!, totalVacancies: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Application Last Date</label>
                    <input
                      type="text"
                      value={draftPost.notificationMeta?.applicationEndDate || ''}
                      onChange={(e) =>
                        pushToHistory({
                          ...draftPost,
                          notificationMeta: { ...draftPost.notificationMeta!, applicationEndDate: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Official Notification PDF URL</label>
                    <input
                      type="text"
                      value={draftPost.notificationMeta?.officialPdfUrl || ''}
                      onChange={(e) =>
                        pushToHistory({
                          ...draftPost,
                          notificationMeta: { ...draftPost.notificationMeta!, officialPdfUrl: e.target.value },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-400 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Checkpoint Quiz / Question of the Day Meta Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs border-b border-slate-800 pb-3">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Embedded "Question of the Day" Checkpoint MCQ</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Question (Hindi / English)</label>
                    <input
                      type="text"
                      value={draftPost.checkpointQuiz?.questionHindi || draftPost.checkpointQuiz?.question || ''}
                      onChange={(e) =>
                        pushToHistory({
                          ...draftPost,
                          checkpointQuiz: {
                            ...draftPost.checkpointQuiz!,
                            question: e.target.value,
                            questionHindi: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(draftPost.checkpointQuiz?.options || ['Option A', 'Option B', 'Option C', 'Option D']).map(
                      (opt, idx) => (
                        <div key={idx}>
                          <label className="text-[10px] text-slate-500 block mb-1">
                            Option {String.fromCharCode(65 + idx)}{' '}
                            {draftPost.checkpointQuiz?.correctIndex === idx && (
                              <span className="text-emerald-400 font-bold">(Correct Answer)</span>
                            )}
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="correctAnswerOption"
                              checked={draftPost.checkpointQuiz?.correctIndex === idx}
                              onChange={() =>
                                pushToHistory({
                                  ...draftPost,
                                  checkpointQuiz: {
                                    ...draftPost.checkpointQuiz!,
                                    correctIndex: idx,
                                  },
                                })
                              }
                              className="text-emerald-500"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(draftPost.checkpointQuiz?.options || [])];
                                newOpts[idx] = e.target.value;
                                pushToHistory({
                                  ...draftPost,
                                  checkpointQuiz: {
                                    ...draftPost.checkpointQuiz!,
                                    options: newOpts,
                                  },
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs"
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* RIGHT SIDEBAR: WORDPRESS META BOXES (4 Cols)                  */}
            {/* ------------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-5">
              {/* META BOX 1: PUBLISH BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                  Publish
                </h3>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleSaveDraftOrPublish(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreviewLiveModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    Preview
                  </button>
                </div>

                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold">
                      {draftPost.isPublished ? (
                        <span className="text-emerald-400">Published</span>
                      ) : (
                        <span className="text-amber-400">Draft</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Visibility:</span>
                    <span className="font-bold text-white">Public</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Revisions:</span>
                    <button
                      type="button"
                      onClick={() => setIsRevisionModalOpen(true)}
                      className="text-indigo-400 hover:underline font-bold"
                    >
                      {draftPost.revisions?.length || 1} Revisions
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Published on:</span>
                    <span className="font-mono text-slate-200">{draftPost.publishedAt}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Move this post to trash?`)) {
                        onDeletePost(draftPost.id);
                        setViewMode('wp_all_posts');
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 text-xs underline cursor-pointer"
                  >
                    Move to Trash
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveDraftOrPublish(true)}
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/25 cursor-pointer"
                  >
                    {draftPost.isPublished ? 'Update' : 'Publish'}
                  </button>
                </div>
              </div>

              {/* META BOX 2: FORMAT / ARCHETYPE BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                  Format / Post Theme
                </h3>

                <div className="space-y-2 text-xs">
                  {[
                    { id: 'exam_notification', label: 'Official Job & Exam Alert' },
                    { id: 'daily_current_affairs', label: 'Daily Current Affairs Digest' },
                    { id: 'study_material_guide', label: 'Study Material & Subject Guide' },
                    { id: 'topper_strategy', label: 'Topper Strategy & Cut-Off' },
                  ].map((fmt) => (
                    <label
                      key={fmt.id}
                      className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition cursor-pointer text-slate-300"
                    >
                      <input
                        type="radio"
                        name="postFormat"
                        value={fmt.id}
                        checked={draftPost.themeArchetype === fmt.id}
                        onChange={(e) =>
                          pushToHistory({
                            ...draftPost,
                            themeArchetype: e.target.value as PostThemeArchetype,
                          })
                        }
                        className="text-indigo-600"
                      />
                      <span>{fmt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* META BOX 3: CATEGORIES BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                  Categories
                </h3>

                <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
                  {[
                    'Exam Notifications',
                    'Daily Current Affairs',
                    'Study Material',
                    'Syllabus & Pattern',
                    'Topper Strategy',
                    'General Knowledge',
                  ].map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center space-x-2 p-1 rounded-lg hover:bg-slate-800/60 transition cursor-pointer text-slate-300"
                    >
                      <input
                        type="radio"
                        name="postCategoryGroup"
                        checked={draftPost.category === cat}
                        onChange={() => pushToHistory({ ...draftPost, category: cat })}
                        className="text-indigo-600"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>

                {isAddingNewCat ? (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="New category name..."
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs"
                      >
                        Add Category
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewCat(false)}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(true)}
                    className="text-indigo-400 hover:underline text-xs font-bold pt-1 block"
                  >
                    + Add New Category
                  </button>
                )}
              </div>

              {/* META BOX 4: TAGS BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                  Tags
                </h3>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add tag..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                {/* Tag Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {draftPost.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] font-mono"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-slate-500 hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* META BOX 5: FEATURED IMAGE BOX */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider pb-2 border-b border-slate-800">
                  Featured Image
                </h3>

                {draftPost.featuredImage ? (
                  <div className="space-y-2">
                    <img
                      src={draftPost.featuredImage}
                      alt="Featured"
                      className="w-full h-36 object-cover rounded-xl border border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => pushToHistory({ ...draftPost, featuredImage: '' })}
                      className="text-rose-400 hover:underline text-xs block"
                    >
                      Remove featured image
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="https://image-url.com/photo.jpg"
                      onChange={(e) => pushToHistory({ ...draftPost, featuredImage: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white placeholder:text-slate-600"
                    />
                    <p className="text-[11px] text-slate-500">
                      Paste direct banner image URL for header showcase and social sharing cards.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INSERT MEDIA MODAL (WordPress "+ Add Media")                      */}
      {/* ========================================================================= */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-white font-black text-sm">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Insert Media into Post</span>
              </div>
              <button onClick={() => setIsMediaModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={mediaUrlInput}
                  onChange={(e) => setMediaUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Caption / Alt Text</label>
                <input
                  type="text"
                  placeholder="e.g. CGPSC 2026 Notification Banner"
                  value={mediaCaptionInput}
                  onChange={(e) => setMediaCaptionInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertMediaTag}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Insert into post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: INSERT LINK MODAL                                                */}
      {/* ========================================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-black text-white text-sm">Insert / Edit Link</span>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">URL</label>
                <input
                  type="text"
                  placeholder="https://vyapam.cgstate.gov.in"
                  value={linkUrlInput}
                  onChange={(e) => setLinkUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-indigo-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Link Text</label>
                <input
                  type="text"
                  placeholder="e.g. Download Official PDF"
                  value={linkTextInput}
                  onChange={(e) => setLinkTextInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={insertLinkTag}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SPECIAL CHARACTERS MODAL (Ω)                                     */}
      {/* ========================================================================= */}
      {isSpecialCharModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-black text-white text-sm">Select Special Character</span>
              <button onClick={() => setIsSpecialCharModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 text-center text-sm font-bold">
              {['₹', '©', '®', '™', '★', '→', '←', '✔', '⚡', '✦', '§', '¶', '°', '±', '÷', '×', '½', '¼'].map(
                (ch) => (
                  <button
                    key={ch}
                    onClick={() => insertSpecialChar(ch)}
                    className="p-3 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white border border-slate-800 transition"
                  >
                    {ch}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: LIVE STUDENT PREVIEW MODAL                                       */}
      {/* ========================================================================= */}
      {isPreviewLiveModalOpen && draftPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur py-2 z-10">
              <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400">
                <Eye className="w-4 h-4" />
                <span>Live Student View Simulation</span>
              </div>
              <button onClick={() => setIsPreviewLiveModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <DynamicPostRenderer
              posts={[draftPost]}
              selectedPostSlug={draftPost.slug}
              onSelectPost={() => {}}
              onBackToList={() => setIsPreviewLiveModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: REVISION HISTORY MODAL                                           */}
      {/* ========================================================================= */}
      {isRevisionModalOpen && draftPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                <History className="w-4 h-4" />
                <span>Post Revisions for "{draftPost.title}"</span>
              </div>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {!draftPost.revisions || draftPost.revisions.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No previous revisions recorded yet.</p>
              ) : (
                draftPost.revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-200">{rev.title}</p>
                      <p className="text-[10px] font-mono text-slate-500">{rev.timestamp}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Restore revision from ${rev.timestamp}?`)) {
                          pushToHistory(rev.data as any);
                          setIsRevisionModalOpen(false);
                          showNotification('Revision restored.');
                        }
                      }}
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

      {/* ========================================================================= */}
      {/* MODAL 6: KEYBOARD SHORTCUTS HELP MODAL                                    */}
      {/* ========================================================================= */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-black text-white text-sm">Classic Editor Keyboard Shortcuts</span>
              <button onClick={() => setIsShortcutsModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 divide-y divide-slate-800">
              <div className="flex items-center justify-between py-1">
                <span>Bold</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono">Ctrl + B</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Italic</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono">Ctrl + I</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Underline</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono">Ctrl + U</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Undo</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono">Ctrl + Z</kbd>
              </div>
              <div className="flex items-center justify-between py-1">
                <span>Redo</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono">Ctrl + Y</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
