import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Search,
  Plus,
  Check,
  Building2,
  FolderTree,
  UserCheck,
  FileSpreadsheet,
  Sparkles,
  X
} from 'lucide-react';
import {
  HierarchyRecord,
  getAvailableAuthorities,
  getAvailableCategories,
  getAvailablePosts,
  getAvailableExamNames,
} from '../utils/examHierarchy';

export interface ExamHierarchyValue {
  authority: string;
  category: string;
  postName?: string;
  examName: string;
}

interface ExamHierarchySelectorProps {
  value: ExamHierarchyValue;
  onChange: (newValue: ExamHierarchyValue, matchedRecord?: HierarchyRecord) => void;
  allRecords: HierarchyRecord[];
  compact?: boolean;
  disabled?: boolean;
}

export const ExamHierarchySelector: React.FC<ExamHierarchySelectorProps> = ({
  value,
  onChange,
  allRecords,
  compact = false,
  disabled = false,
}) => {
  // Dropdown Open States
  const [isAuthorityOpen, setIsAuthorityOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [isExamNameOpen, setIsExamNameOpen] = useState(false);

  // Search Input States inside dropdowns
  const [authoritySearch, setAuthoritySearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [examNameSearch, setExamNameSearch] = useState('');

  // Refs for click outside handling
  const authorityRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const examNameRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (authorityRef.current && !authorityRef.current.contains(event.target as Node)) {
        setIsAuthorityOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (postRef.current && !postRef.current.contains(event.target as Node)) {
        setIsPostOpen(false);
      }
      if (examNameRef.current && !examNameRef.current.contains(event.target as Node)) {
        setIsExamNameOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute available options at each level
  const availableAuthorities = useMemo(() => {
    return getAvailableAuthorities(allRecords);
  }, [allRecords]);

  const availableCategories = useMemo(() => {
    return getAvailableCategories(allRecords, value.authority);
  }, [allRecords, value.authority]);

  const availablePosts = useMemo(() => {
    return getAvailablePosts(allRecords, value.authority, value.category);
  }, [allRecords, value.authority, value.category]);

  const availableExamRecords = useMemo(() => {
    return getAvailableExamNames(allRecords, value.authority, value.category, value.postName);
  }, [allRecords, value.authority, value.category, value.postName]);

  // Filtered lists based on search inputs
  const filteredAuthorities = useMemo(() => {
    if (!authoritySearch.trim()) return availableAuthorities;
    const q = authoritySearch.toLowerCase().trim();
    return availableAuthorities.filter(a => a.toLowerCase().includes(q));
  }, [availableAuthorities, authoritySearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return availableCategories;
    const q = categorySearch.toLowerCase().trim();
    return availableCategories.filter(c => c.toLowerCase().includes(q));
  }, [availableCategories, categorySearch]);

  const filteredPosts = useMemo(() => {
    if (!postSearch.trim()) return availablePosts;
    const q = postSearch.toLowerCase().trim();
    return availablePosts.filter(p => p.toLowerCase().includes(q));
  }, [availablePosts, postSearch]);

  const filteredExamRecords = useMemo(() => {
    if (!examNameSearch.trim()) return availableExamRecords;
    const q = examNameSearch.toLowerCase().trim();
    return availableExamRecords.filter(r =>
      r.examName.toLowerCase().includes(q) ||
      (r.year && String(r.year).includes(q))
    );
  }, [availableExamRecords, examNameSearch]);

  // Check if current values match registered records
  const isExistingAuthority = availableAuthorities.some(
    a => a.toLowerCase() === value.authority.toLowerCase()
  );
  const isExistingCategory = availableCategories.some(
    c => c.toLowerCase() === value.category.toLowerCase()
  );
  const matchedExamRecord = availableExamRecords.find(
    r => r.examName.toLowerCase() === value.examName.toLowerCase()
  );

  // Handlers for selection
  const handleSelectAuthority = (newAuthority: string) => {
    setIsAuthorityOpen(false);
    setAuthoritySearch('');

    const validCats = getAvailableCategories(allRecords, newAuthority);
    const nextCategory = validCats.includes(value.category)
      ? value.category
      : validCats[0] || value.category;

    const validPosts = getAvailablePosts(allRecords, newAuthority, nextCategory);
    const nextPost = validPosts.includes(value.postName || '')
      ? value.postName
      : validPosts[0] || value.postName;

    onChange(
      {
        authority: newAuthority,
        category: nextCategory,
        postName: nextPost,
        examName: value.examName,
      },
      undefined
    );
  };

  const handleSelectCategory = (newCategory: string) => {
    setIsCategoryOpen(false);
    setCategorySearch('');

    const validPosts = getAvailablePosts(allRecords, value.authority, newCategory);
    const nextPost = validPosts.includes(value.postName || '')
      ? value.postName
      : validPosts[0] || value.postName;

    const validExams = getAvailableExamNames(allRecords, value.authority, newCategory, nextPost);
    const existingExamMatch = validExams.find(
      r => r.examName.toLowerCase() === value.examName.toLowerCase()
    );

    onChange(
      {
        authority: value.authority,
        category: newCategory,
        postName: nextPost,
        examName: existingExamMatch ? value.examName : validExams[0]?.examName || value.examName,
      },
      existingExamMatch || validExams[0]
    );
  };

  const handleSelectPost = (newPost: string) => {
    setIsPostOpen(false);
    setPostSearch('');

    const validExams = getAvailableExamNames(allRecords, value.authority, value.category, newPost);
    const existingExamMatch = validExams.find(
      r => r.examName.toLowerCase() === value.examName.toLowerCase()
    );

    onChange(
      {
        authority: value.authority,
        category: value.category,
        postName: newPost,
        examName: existingExamMatch ? value.examName : validExams[0]?.examName || value.examName,
      },
      existingExamMatch || validExams[0]
    );
  };

  const handleSelectExamRecord = (rec: HierarchyRecord) => {
    setIsExamNameOpen(false);
    setExamNameSearch('');

    onChange(
      {
        authority: rec.authority || value.authority,
        category: rec.category || value.category,
        postName: rec.postName || value.postName,
        examName: rec.examName,
      },
      rec
    );
  };

  return (
    <div className="space-y-3">
      {/* 4-Level Selector Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-3 text-xs`}>
        {/* LEVEL 1: AUTHORITY */}
        <div className="relative" ref={authorityRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-300 font-bold flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>1. Authority</span>
            </label>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                isExistingAuthority
                  ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isExistingAuthority ? 'Standard' : 'Custom'}
            </span>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsAuthorityOpen(!isAuthorityOpen);
              setIsCategoryOpen(false);
              setIsPostOpen(false);
              setIsExamNameOpen(false);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2.5 text-left flex items-center justify-between text-white font-semibold shadow-sm focus:outline-none focus:border-blue-500 transition cursor-pointer disabled:opacity-50"
          >
            <span className="truncate pr-2">{value.authority || 'Select Authority...'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {isAuthorityOpen && (
            <div className="absolute left-0 right-0 z-50 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={authoritySearch}
                  onChange={e => setAuthoritySearch(e.target.value)}
                  placeholder="Search or add authority..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                />
                {authoritySearch && (
                  <button
                    type="button"
                    onClick={() => setAuthoritySearch('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                {filteredAuthorities.map(auth => {
                  const isSelected = auth.toLowerCase() === value.authority.toLowerCase();
                  return (
                    <button
                      key={auth}
                      type="button"
                      onClick={() => handleSelectAuthority(auth)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 text-blue-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{auth}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}

                {authoritySearch.trim() &&
                  !availableAuthorities.some(
                    a => a.toLowerCase() === authoritySearch.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleSelectAuthority(authoritySearch.trim())}
                      className="w-full text-left px-2.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 flex items-center space-x-2 text-xs font-bold transition cursor-pointer mt-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create New: "{authoritySearch.trim()}"</span>
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* LEVEL 2: RECRUITMENT DRIVE / CATEGORY */}
        <div className="relative" ref={categoryRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-300 font-bold flex items-center space-x-1.5">
              <FolderTree className="w-3.5 h-3.5 text-purple-400" />
              <span>2. Recruitment Drive</span>
            </label>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                isExistingCategory
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}
            >
              {isExistingCategory ? 'Registered' : 'Custom'}
            </span>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsCategoryOpen(!isCategoryOpen);
              setIsAuthorityOpen(false);
              setIsPostOpen(false);
              setIsExamNameOpen(false);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2.5 text-left flex items-center justify-between text-white font-semibold shadow-sm focus:outline-none focus:border-purple-500 transition cursor-pointer disabled:opacity-50"
          >
            <span className="truncate pr-2">{value.category || 'Select Drive...'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {isCategoryOpen && (
            <div className="absolute left-0 right-0 z-50 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  placeholder="Search or add drive (e.g. Teacher Recruitment 2026)..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                {filteredCategories.map(cat => {
                  const isSelected = cat.toLowerCase() === value.category.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/20 text-purple-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}

                {categorySearch.trim() &&
                  !availableCategories.some(
                    c => c.toLowerCase() === categorySearch.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(categorySearch.trim())}
                      className="w-full text-left px-2.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 flex items-center space-x-2 text-xs font-bold transition cursor-pointer mt-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create New: "{categorySearch.trim()}"</span>
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* LEVEL 3: POST / CADRE (e.g. CG Lecturer 2026) */}
        <div className="relative" ref={postRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-300 font-bold flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Cadre / Post</span>
            </label>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Cadre
            </span>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsPostOpen(!isPostOpen);
              setIsAuthorityOpen(false);
              setIsCategoryOpen(false);
              setIsExamNameOpen(false);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2.5 text-left flex items-center justify-between text-white font-semibold shadow-sm focus:outline-none focus:border-amber-500 transition cursor-pointer disabled:opacity-50"
          >
            <span className="truncate pr-2">{value.postName || 'Select Post (e.g. CG Lecturer 2026)...'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {isPostOpen && (
            <div className="absolute left-0 right-0 z-50 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={postSearch}
                  onChange={e => setPostSearch(e.target.value)}
                  placeholder="Search or add cadre (e.g. CG Lecturer 2026)..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                />
                {postSearch && (
                  <button
                    type="button"
                    onClick={() => setPostSearch('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                {filteredPosts.map(post => {
                  const isSelected = (value.postName || '').toLowerCase() === post.toLowerCase();
                  return (
                    <button
                      key={post}
                      type="button"
                      onClick={() => handleSelectPost(post)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600/20 text-amber-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{post}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}

                {postSearch.trim() &&
                  !availablePosts.some(
                    p => p.toLowerCase() === postSearch.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleSelectPost(postSearch.trim())}
                      className="w-full text-left px-2.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 flex items-center space-x-2 text-xs font-bold transition cursor-pointer mt-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create New Cadre: "{postSearch.trim()}"</span>
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* LEVEL 4: SPECIFIC EXAM / SUBJECT (e.g. CG English Lecturer 2026) */}
        <div className="relative" ref={examNameRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-300 font-bold flex items-center space-x-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>4. Specific Exam</span>
            </label>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                matchedExamRecord
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {matchedExamRecord ? 'Auto-linked' : 'New Paper'}
            </span>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsExamNameOpen(!isExamNameOpen);
              setIsAuthorityOpen(false);
              setIsCategoryOpen(false);
              setIsPostOpen(false);
            }}
            className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2.5 text-left flex items-center justify-between text-white font-semibold shadow-sm focus:outline-none focus:border-emerald-500 transition cursor-pointer disabled:opacity-50"
          >
            <span className="truncate pr-2">{value.examName || 'Select exam subject (e.g. CG English Lecturer)...'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          {isExamNameOpen && (
            <div className="absolute left-0 right-0 z-50 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex items-center space-x-2">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={examNameSearch}
                  onChange={e => setExamNameSearch(e.target.value)}
                  placeholder="Search existing or type new exam subject..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-medium"
                />
                {examNameSearch && (
                  <button
                    type="button"
                    onClick={() => setExamNameSearch('')}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                {filteredExamRecords.map(rec => {
                  const isSelected = rec.examName.toLowerCase() === value.examName.toLowerCase();
                  return (
                    <button
                      key={rec.examName}
                      type="button"
                      onClick={() => handleSelectExamRecord(rec)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start justify-between text-xs transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600/20 text-emerald-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="pr-2 overflow-hidden">
                        <span className="block truncate font-semibold">{rec.examName}</span>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          {rec.postName && <span className="text-amber-300">{rec.postName}</span>}
                          {rec.year && <span>• {rec.year}</span>}
                          {rec.durationMinutes && <span>• {rec.durationMinutes}m</span>}
                        </div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-1" />}
                    </button>
                  );
                })}

                {examNameSearch.trim() &&
                  !availableExamRecords.some(
                    r => r.examName.toLowerCase() === examNameSearch.trim().toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsExamNameOpen(false);
                        const newName = examNameSearch.trim();
                        setExamNameSearch('');
                        onChange(
                          {
                            authority: value.authority,
                            category: value.category,
                            postName: value.postName,
                            examName: newName,
                          },
                          undefined
                        );
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 flex items-center space-x-2 text-xs font-bold transition cursor-pointer mt-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Create New Exam: "{examNameSearch.trim()}"</span>
                    </button>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Population & Hierarchy Feedback Ribbon */}
      {matchedExamRecord && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg text-[11px] text-emerald-300">
          <span className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Matched Hierarchy: <strong>{matchedExamRecord.authority}</strong> &gt; <strong>{matchedExamRecord.category}</strong> &gt; <strong>{matchedExamRecord.postName || 'Cadre'}</strong> &gt; <strong>{matchedExamRecord.examName}</strong>
            </span>
          </span>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            {matchedExamRecord.year} • {matchedExamRecord.durationMinutes}m • {matchedExamRecord.negativeMarkingRatio}
          </span>
        </div>
      )}
    </div>
  );
};
