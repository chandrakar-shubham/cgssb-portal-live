import React, { useState } from 'react';
import { CMSPost, PostThemeArchetype, DEFAULT_POST_THEME_TOKENS } from '../types/cms';
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
  Download
} from 'lucide-react';
import { DynamicPostRenderer } from './DynamicPostRenderer';

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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
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
      slug: `exam-update-${Math.floor(Math.random() * 1000)}`,
      title: 'New Official Exam Announcement or Study Material',
      category: 'Exam Notifications',
      excerpt: 'Brief overview for candidate article feed and search cards...',
      content: `The official examination commission has announced vital dates and syllabus guidelines.\n\n### Key Instructions\n1. Review eligibility criteria.\n2. Practice simulated CBT mock tests weekly.\n3. Focus on state GK and Chhattisgarhi language sections.`,
      tags: ['CGPSC', 'Vyapam', 'Notification'],
      author: 'CGSSB Editorial Team',
      isPublished: true,
      publishedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      themeArchetype: 'exam_notification',
      notificationMeta: {
        examName: 'Official Recruitment 2026',
        applicationEndDate: 'May 30, 2026',
        examDate: 'June 2026',
        totalVacancies: '250 Posts',
        officialPdfUrl: 'https://vyapam.cgstate.gov.in',
      },
      checkpointQuiz: {
        question: 'Practice Question: What is the official state animal of Chhattisgarh?',
        questionHindi: 'छत्तीसगढ़ का राजकीय पशु कौन सा है?',
        options: ['वन भैंसा (Wild Water Buffalo)', 'बाघ (Tiger)', 'चीतल (Spotted Deer)', 'हाथी (Elephant)'],
        correctIndex: 0,
        explanation: 'Wild Water Buffalo (वन भैंसा) is the official state animal of Chhattisgarh.',
      },
    };

    setDraftPost(newPost);
    setSelectedPostId(newId);
    showNotification('New post draft initialized.');
  };

  const handleSave = async () => {
    if (!draftPost) return;
    setIsSaving(true);
    try {
      await onSavePost(draftPost);
      showNotification('Article & post published successfully!');
    } catch (err: any) {
      alert('Failed to save post: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
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
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Editorial & Exam Notification Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white">Articles, News & Post Manager</h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish official job alerts, daily current affairs digests, and study guides with dedicated post theme archetypes.
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
            <span>{isPreviewMode ? 'Exit Preview' : 'Preview Article'}</span>
          </button>

          <button
            onClick={handleCreateNewPost}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition border border-slate-700 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Post</span>
          </button>

          {draftPost && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Publish Article'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Sidebar List + Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Posts List */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Articles ({posts.length})</h2>
          <div className="space-y-1.5">
            {posts.map(post => {
              const isSelected = selectedPostId === post.id;
              return (
                <button
                  key={post.id}
                  onClick={() => {
                    setSelectedPostId(post.id);
                    setIsPreviewMode(false);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                      : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  <div className="truncate">
                    <span className="text-xs block truncate">{post.title}</span>
                    <span className="text-[10px] opacity-75 font-mono">{post.category}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/30 shrink-0 ml-1">
                    {post.publishedAt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Post Editor / Preview */}
        <div className="lg:col-span-3 space-y-6">
          {draftPost ? (
            isPreviewMode ? (
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <DynamicPostRenderer
                  posts={[draftPost]}
                  selectedPostSlug={draftPost.slug}
                  onSelectPost={() => {}}
                  onBackToList={() => setIsPreviewMode(false)}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Meta Settings & Post Theme Archetype */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-black text-white">Post Archetype & Core Metadata</h3>
                    <button
                      onClick={() => handleDelete(draftPost.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Post</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-slate-400 font-bold">Article Title</label>
                      <input
                        type="text"
                        value={draftPost.title}
                        onChange={e => setDraftPost({ ...draftPost, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold flex items-center space-x-1">
                        <Palette className="w-3 h-3 text-blue-400" />
                        <span>Post Theme Archetype</span>
                      </label>
                      <select
                        value={draftPost.themeArchetype || 'exam_notification'}
                        onChange={e => setDraftPost({ ...draftPost, themeArchetype: e.target.value as PostThemeArchetype })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      >
                        <option value="exam_notification">1. Official Job & Exam Alert</option>
                        <option value="daily_current_affairs">2. Daily Current Affairs & Digest</option>
                        <option value="study_material_guide">3. Subject Deep-Dive & Study Guide</option>
                        <option value="topper_strategy">4. Topper Strategy & Cutoffs</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">URL Slug (/post/...)</label>
                      <input
                        type="text"
                        value={draftPost.slug}
                        onChange={e => setDraftPost({ ...draftPost, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-blue-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Category</label>
                      <select
                        value={draftPost.category}
                        onChange={e => setDraftPost({ ...draftPost, category: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      >
                        <option value="Exam Notifications">Exam Notifications</option>
                        <option value="Current Affairs">Current Affairs</option>
                        <option value="Study Material">Study Material</option>
                        <option value="Topper Strategy">Topper Strategy</option>
                        <option value="Syllabus & Pattern">Syllabus & Pattern</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-bold">Author Name</label>
                      <input
                        type="text"
                        value={draftPost.author}
                        onChange={e => setDraftPost({ ...draftPost, author: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs pt-1">
                    <label className="text-slate-400 font-bold">Article Excerpt (Brief Summary)</label>
                    <input
                      type="text"
                      value={draftPost.excerpt}
                      onChange={e => setDraftPost({ ...draftPost, excerpt: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300"
                    />
                  </div>
                </div>

                {/* Exam Notification Specific Metadata Box */}
                {draftPost.themeArchetype === 'exam_notification' && (
                  <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center space-x-2 text-rose-400 font-black text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Exam Alert Metadata Box</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Application Deadline</label>
                        <input
                          type="text"
                          value={draftPost.notificationMeta?.applicationEndDate || ''}
                          onChange={e =>
                            setDraftPost({
                              ...draftPost,
                              notificationMeta: {
                                ...(draftPost.notificationMeta || {}),
                                applicationEndDate: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. May 30, 2026"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Exam Date</label>
                        <input
                          type="text"
                          value={draftPost.notificationMeta?.examDate || ''}
                          onChange={e =>
                            setDraftPost({
                              ...draftPost,
                              notificationMeta: {
                                ...(draftPost.notificationMeta || {}),
                                examDate: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. June 2026"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 font-bold block mb-1">Total Vacancies</label>
                        <input
                          type="text"
                          value={draftPost.notificationMeta?.totalVacancies || ''}
                          onChange={e =>
                            setDraftPost({
                              ...draftPost,
                              notificationMeta: {
                                ...(draftPost.notificationMeta || {}),
                                totalVacancies: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. 300 Posts"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-slate-400 font-bold block mb-1">Official Notification PDF Link</label>
                        <input
                          type="text"
                          value={draftPost.notificationMeta?.officialPdfUrl || ''}
                          onChange={e =>
                            setDraftPost({
                              ...draftPost,
                              notificationMeta: {
                                ...(draftPost.notificationMeta || {}),
                                officialPdfUrl: e.target.value,
                              },
                            })
                          }
                          placeholder="https://vyapam.cgstate.gov.in/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive Checkpoint Quiz Builder */}
                <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 text-purple-400 font-black text-xs">
                    <Award className="w-4 h-4" />
                    <span>Interactive "Question of the Day" / Checkpoint Quiz</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Question (English)</label>
                      <input
                        type="text"
                        value={draftPost.checkpointQuiz?.question || ''}
                        onChange={e =>
                          setDraftPost({
                            ...draftPost,
                            checkpointQuiz: {
                              ...(draftPost.checkpointQuiz || {
                                questionHindi: '',
                                options: ['', '', '', ''],
                                correctIndex: 0,
                                explanation: '',
                              }),
                              question: e.target.value,
                            },
                          })
                        }
                        placeholder="e.g. Which district of Chhattisgarh has the highest literacy rate?"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(draftPost.checkpointQuiz?.options || ['', '', '', '']).map((opt, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={draftPost.checkpointQuiz?.correctIndex === i}
                            onChange={() =>
                              setDraftPost({
                                ...draftPost,
                                checkpointQuiz: {
                                  ...(draftPost.checkpointQuiz!),
                                  correctIndex: i,
                                },
                              })
                            }
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const opts = [...(draftPost.checkpointQuiz?.options || ['', '', '', ''])];
                              opts[i] = e.target.value;
                              setDraftPost({
                                ...draftPost,
                                checkpointQuiz: {
                                  ...(draftPost.checkpointQuiz!),
                                  options: opts,
                                },
                              });
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-slate-400 font-bold block mb-1">Answer Explanation</label>
                      <input
                        type="text"
                        value={draftPost.checkpointQuiz?.explanation || ''}
                        onChange={e =>
                          setDraftPost({
                            ...draftPost,
                            checkpointQuiz: {
                              ...(draftPost.checkpointQuiz!),
                              explanation: e.target.value,
                            },
                          })
                        }
                        placeholder="Detailed explanation for candidate review..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Main Article Prose Editor */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
                  <label className="text-xs font-bold text-white block">Main Article Body (Markdown Supported)</label>
                  <textarea
                    rows={12}
                    value={draftPost.content}
                    onChange={e => setDraftPost({ ...draftPost, content: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">No Post Selected</p>
              <p className="text-xs">Select an article from the list or click "New Post" to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
