import React from 'react';
import { CMSPost } from '../types/cms';
import {
  FileText,
  Calendar,
  User,
  Tag,
  ArrowLeft,
  Share2
} from 'lucide-react';

interface DynamicPostRendererProps {
  posts: CMSPost[];
  selectedPostSlug?: string | null;
  onSelectPost: (slug: string) => void;
  onBackToList: () => void;
}

export const DynamicPostRenderer: React.FC<DynamicPostRendererProps> = ({
  posts,
  selectedPostSlug,
  onSelectPost,
  onBackToList,
}) => {
  const activePost = selectedPostSlug
    ? posts.find(p => p.slug === selectedPostSlug)
    : null;

  if (activePost) {
    return (
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <button
          onClick={onBackToList}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles & News Feed</span>
        </button>

        {/* Post Meta Header */}
        <div className="space-y-4 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
            <Tag className="w-3.5 h-3.5" />
            <span>{activePost.category}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {activePost.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>{activePost.author}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activePost.publishedAt}</span>
            </span>
          </div>
        </div>

        {/* Post Content */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 text-slate-200 text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans">
          {activePost.content}
        </div>

        {/* Tags */}
        {activePost.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-xs font-bold text-slate-400">Tags:</span>
            {activePost.tags.map(tag => (
              <span
                key={tag}
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    );
  }

  // Posts List Feed View
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
          <FileText className="w-3.5 h-3.5" />
          <span>Latest Exam News, Notifications & Study Guides</span>
        </div>
        <h1 className="text-3xl font-black text-white">CGSSB Official Knowledge Hub</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Stay updated with CGPSC and Vyapam official announcements, syllabus changes, and prep strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map(post => (
          <div
            key={post.id}
            onClick={() => onSelectPost(post.slug)}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 hover:border-blue-500/50 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                  {post.category}
                </span>
                <span className="text-slate-400 font-mono text-[10px]">{post.publishedAt}</span>
              </div>

              <h2 className="text-lg font-bold text-white group-hover:text-blue-300 transition line-clamp-2">
                {post.title}
              </h2>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
              <span>Read Full Article</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
