import { QuestionBookmark } from '../types';
export type { QuestionBookmark };

const STORAGE_KEY = 'cgssb_bookmarks';
export const BOOKMARKS_CHANGED_EVENT = 'cgssb_bookmarks_changed';

export function getBookmarks(): QuestionBookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function isQuestionBookmarked(questionId: string): boolean {
  if (!questionId) return false;
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.questionId === questionId);
}

export function getBookmark(questionId: string): QuestionBookmark | undefined {
  if (!questionId) return undefined;
  const bookmarks = getBookmarks();
  return bookmarks.find(b => b.questionId === questionId);
}

export function toggleBookmark(
  questionId: string,
  meta?: { note?: string; sourceTestTitle?: string; subject?: string }
): boolean {
  if (!questionId) return false;
  const bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.questionId === questionId);
  let isBookmarkedNow = false;

  if (index >= 0) {
    bookmarks.splice(index, 1);
    isBookmarkedNow = false;
  } else {
    bookmarks.unshift({
      questionId,
      createdAt: new Date().toISOString(),
      note: meta?.note || '',
      sourceTestTitle: meta?.sourceTestTitle || 'Practice Session',
      subject: meta?.subject,
    });
    isBookmarkedNow = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { questionId, isBookmarked: isBookmarkedNow } }));
  } catch (err) {
    console.warn('Failed to save bookmark to localStorage:', err);
  }

  return isBookmarkedNow;
}

export function saveBookmarkNote(questionId: string, note: string): void {
  if (!questionId) return;
  const bookmarks = getBookmarks();
  const item = bookmarks.find(b => b.questionId === questionId);
  if (item) {
    item.note = note;
  } else {
    bookmarks.unshift({
      questionId,
      createdAt: new Date().toISOString(),
      note,
      sourceTestTitle: 'Direct Note',
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { questionId, note } }));
  } catch (err) {
    console.warn('Failed to save note to localStorage:', err);
  }
}

export function deleteBookmark(questionId: string): void {
  if (!questionId) return;
  const bookmarks = getBookmarks().filter(b => b.questionId !== questionId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { questionId, isBookmarked: false } }));
  } catch (err) {
    console.warn('Failed to delete bookmark:', err);
  }
}
