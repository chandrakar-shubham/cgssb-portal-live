import React, { useState, useMemo } from 'react';
import { CMSPost, DEFAULT_POST_THEME_TOKENS, ThemeTokens, PostThemeArchetype } from '../types/cms';
import { AdSlotRenderer } from './AdSlotRenderer';
import {
  FileText,
  Calendar,
  User,
  Tag,
  ArrowLeft,
  Share2,
  Download,
  Award,
  Check,
  X,
  Sparkles,
  Search,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface DynamicPostRendererProps {
  posts: CMSPost[];
  selectedPostSlug?: string | null;
  onSelectPost: (slug: string) => void;
  onBackToList: () => void;
  siteSettingsTheme?: ThemeTokens;
}

export const DynamicPostRenderer: React.FC<DynamicPostRendererProps> = ({
  posts,
  selectedPostSlug,
  onSelectPost,
  onBackToList,
  siteSettingsTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [quizAnswerState, setQuizAnswerState] = useState<number | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const activePost = selectedPostSlug
    ? posts.find(p => p.slug === selectedPostSlug || p.id === selectedPostSlug)
    : null;

  // Resolve theme for active post
  const archetype: PostThemeArchetype = activePost?.themeArchetype || 'exam_notification';
  const defaultTokens = DEFAULT_POST_THEME_TOKENS[archetype] || DEFAULT_POST_THEME_TOKENS.exam_notification;
  const activeTheme: ThemeTokens = {
    ...defaultTokens,
    ...(siteSettingsTheme || {}),
    ...(activePost?.themeOverride || {}),
  };

  const handleShareClick = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  // SINGLE POST DETAIL VIEW
  if (activePost) {
    const isQuizAnswered = quizAnswerState !== null;
    const isQuizCorrect =
      isQuizAnswered &&
      activePost.checkpointQuiz &&
      quizAnswerState === activePost.checkpointQuiz.correctIndex;

    return (
      <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
        {/* Navigation & Share */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <button
            onClick={onBackToList}
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back to All Articles & News Feed</span>
          </button>

          {activeTheme.showSocialShare && (
            <button
              onClick={handleShareClick}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'Link Copied!' : 'Share Article'}</span>
            </button>
          )}
        </div>

        {/* Top Leaderboard Ad */}
        {activeTheme.adDensity !== 'none' && (
          <AdSlotRenderer slotType="topLeaderboard" theme={activeTheme} />
        )}

        {/* Post Meta Header */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r ${activeTheme.accentGradient} text-white shadow-md`}
            >
              {activePost.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-400">
              Theme: {activeTheme.name}
            </span>
          </div>

          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight ${activeTheme.headingFont}`}>
            {activePost.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activePost.author}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activePost.publishedAt}</span>
            </span>
          </div>
        </div>

        {/* Official Notification Meta Box if present */}
        {activePost.notificationMeta && (
          <div className={`p-6 bg-slate-900/90 border border-rose-500/30 ${activeTheme.borderRadius} space-y-4 shadow-xl`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Exam Announcement Summary</span>
              </span>
              {activePost.notificationMeta.officialPdfUrl && (
                <a
                  href={activePost.notificationMeta.officialPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Official Notification PDF</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Application Deadline</span>
                <span className="text-white font-black">{activePost.notificationMeta.applicationEndDate || 'Active'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Exam Date</span>
                <span className="text-amber-400 font-black">{activePost.notificationMeta.examDate || 'Scheduled 2026'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Vacancies</span>
                <span className="text-emerald-400 font-black">{activePost.notificationMeta.totalVacancies || 'Multiple'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Post Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Main Prose Box */}
            <div className={`bg-slate-900/80 border border-slate-800 ${activeTheme.borderRadius} p-6 sm:p-8 text-slate-200 text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans shadow-lg`}>
              {activePost.content}
            </div>

            {/* In-Content Native Ad Slot */}
            {activeTheme.adDensity !== 'none' && (
              <AdSlotRenderer slotType="inContent" theme={activeTheme} />
            )}

            {/* Interactive Checkpoint Quiz Widget */}
            {activePost.checkpointQuiz && (
              <div className={`p-6 bg-slate-900 border border-purple-500/30 ${activeTheme.borderRadius} space-y-4 shadow-xl`}>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30 flex items-center space-x-1">
                    <Award className="w-3 h-3" />
                    <span>Self-Check Practice Question</span>
                  </span>
                  {isQuizAnswered && (
                    <span className={`text-xs font-black ${isQuizCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isQuizCorrect ? '✓ Correct Answer!' : '✗ Incorrect Attempt'}
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-white leading-snug">{activePost.checkpointQuiz.question}</p>
                {activePost.checkpointQuiz.questionHindi && (
                  <p className="text-xs text-slate-300 font-serif leading-snug">{activePost.checkpointQuiz.questionHindi}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {activePost.checkpointQuiz.options.map((opt, idx) => {
                    const isSelected = quizAnswerState === idx;
                    const isThisCorrect = isQuizAnswered && idx === activePost.checkpointQuiz!.correctIndex;
                    return (
                      <button
                        key={idx}
                        disabled={isQuizAnswered}
                        onClick={() => setQuizAnswerState(idx)}
                        className={`p-3 rounded-xl text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                          isThisCorrect
                            ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300'
                            : isSelected && !isThisCorrect
                            ? 'bg-rose-500/20 border border-rose-500 text-rose-300'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{opt}</span>
                        {isThisCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        {isSelected && !isThisCorrect && <X className="w-4 h-4 text-rose-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {isQuizAnswered && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1 animate-fade-in">
                    <span className="font-bold text-indigo-400 block">Explanation:</span>
                    <p className="leading-relaxed">{activePost.checkpointQuiz.explanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {activePost.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-bold text-slate-400">Related Exam Tags:</span>
                {activePost.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Sidebar Sticky Ad Slot */}
            {activeTheme.adDensity !== 'none' && (
              <AdSlotRenderer slotType="sidebar" theme={activeTheme} />
            )}

            {/* Test Series Promo Card */}
            <div className={`p-6 bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 ${activeTheme.borderRadius} space-y-4 shadow-xl`}>
              <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                <BookOpen className="w-3 h-3" />
                <span>Test Series Pass</span>
              </div>
              <h4 className="text-base font-black text-white">Ace Chhattisgarh State Exams</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Practice full-length mock tests with state ranks, percentile graphs, and detailed solutions.
              </p>
              <a
                href="/tests"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-600/30"
              >
                <span>Explore Mock Series</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Ad Slot */}
        {activeTheme.adDensity !== 'none' && (
          <AdSlotRenderer slotType="postFooter" theme={activeTheme} />
        )}
      </article>
    );
  }

  // POSTS LIST FEED VIEW
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-6 space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
          <FileText className="w-3.5 h-3.5" />
          <span>Latest Exam News, Notifications & Study Guides</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">CGSSB Official Knowledge Hub</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
          Stay updated with CGPSC and Vyapam official announcements, syllabus breakdowns, and exam prep strategies.
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search articles & exams..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Feed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map(post => {
          const postArchetype = post.themeArchetype || 'exam_notification';
          const postTheme = DEFAULT_POST_THEME_TOKENS[postArchetype] || DEFAULT_POST_THEME_TOKENS.exam_notification;

          return (
            <div
              key={post.id}
              onClick={() => onSelectPost(post.slug)}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition cursor-pointer shadow-lg hover:shadow-xl group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase bg-gradient-to-r ${postTheme.accentGradient} text-white`}>
                    {post.category}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">{post.publishedAt}</span>
                </div>

                <h3 className="text-base font-black text-white group-hover:text-blue-400 transition leading-snug">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 text-[11px]">By {post.author}</span>
                <span className="text-blue-400 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1">
                  <span>Read Article</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
