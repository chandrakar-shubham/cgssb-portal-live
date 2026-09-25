import React, { useState } from 'react';
import { CMSPost } from '../types/cms';
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
  Edit3
} from 'lucide-react';

interface AdminCMSPostManagerProps {
  posts: CMSPost[];
  onSavePost: (post: CMSPost) => Promise<void>;
  onDeletePost: (id: string) => Promise<void>;
}

export const AdminCMSPostManager: React.FC<AdminCMSPostManagerProps> = ({
  posts,
  onSavePost,
  onDeletePost,
}) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    posts[0]?.id || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activePost = posts.find(p => p.id === selectedPostId) || posts[0] || null;
  const [draftPost, setDraftPost] = useState<CMSPost | null>(activePost);

  React.useEffect(() => {
    const p = posts.find(x => x.id === selectedPostId);
    if (p) setDraftPost(JSON.parse(JSON.stringify(p)));
  }, [selectedPostId, posts]);

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateNewPost = () => {
    const newId = `post-${Date.now()}`;
    const newPost: CMSPost = {
      id: newId,
      slug: `new-post-${Math.floor(Math.random() * 1000)}`,
      title: 'New Exam Notification or Article',
      category: 'Exam Notifications',
      excerpt: 'Short summary of the article for blog feed list cards...',
      content: '### Main Article Section\n\nWrite detailed exam updates or study tips here.',
      tags: ['CGPSC', 'Vyapam', 'Syllabus'],
      author: 'CGSSB Editorial Team',
      isPublished: true,
      publishedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setDraftPost(newPost);
    setSelectedPostId(newId);
    showNotification('New post draft created.');
  };

  const handleSave = async () => {
    if (!draftPost) return;
    setIsSaving(true);
    try {
      await onSavePost(draftPost);
      showNotification('Post published successfully!');
    } catch (err: any) {
      alert('Failed to save post: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await onDeletePost(id);
      showNotification('Post deleted.');
      const remaining = posts.filter(p => p.id !== id);
      if (remaining.length > 0) setSelectedPostId(remaining[0].id);
      else setDraftPost(null);
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Posts, News & Exam Notifications Publisher</span>
          </div>
          <h1 className="text-2xl font-black text-white">Articles & News Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish official exam updates, syllabus guides, and study tips to the public portal.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleCreateNewPost}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-2 border border-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Post</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !draftPost}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Publishing...' : 'Publish Post'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Posts List */}
        <div className="lg:col-span-1 space-y-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase">Articles ({posts.length})</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-blue-300 font-mono">CMS</span>
          </div>

          <div className="space-y-1.5">
            {posts.map(p => {
              const isSelected = p.id === draftPost?.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPostId(p.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="truncate space-y-0.5">
                    <div className="font-bold text-white truncate">{p.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{p.category}</div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Post Editor */}
        {draftPost && (
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <span>Post Editor</span>
                </h3>
                <a
                  href={`/posts/${draftPost.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>/posts/{draftPost.slug}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Article Title</label>
                  <input
                    type="text"
                    value={draftPost.title}
                    onChange={e => setDraftPost({ ...draftPost, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={draftPost.slug}
                    onChange={e => setDraftPost({ ...draftPost, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={draftPost.category}
                    onChange={e => setDraftPost({ ...draftPost, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Exam Notifications">Exam Notifications</option>
                    <option value="Study Material & Tips">Study Material & Tips</option>
                    <option value="Syllabus Updates">Syllabus Updates</option>
                    <option value="Answer Keys & Results">Answer Keys & Results</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Short Excerpt (Summary)</label>
                  <textarea
                    rows={2}
                    value={draftPost.excerpt}
                    onChange={e => setDraftPost({ ...draftPost, excerpt: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Full Article Body (Markdown / Prose)</label>
                  <textarea
                    rows={12}
                    value={draftPost.content}
                    onChange={e => setDraftPost({ ...draftPost, content: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-slate-200 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Author Name</label>
                  <input
                    type="text"
                    value={draftPost.author}
                    onChange={e => setDraftPost({ ...draftPost, author: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Comma-Separated Tags</label>
                  <input
                    type="text"
                    value={draftPost.tags.join(', ')}
                    onChange={e => setDraftPost({ ...draftPost, tags: e.target.value.split(',').map(t => t.trim()) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
