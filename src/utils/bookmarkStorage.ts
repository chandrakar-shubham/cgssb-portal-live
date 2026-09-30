import { QuestionBookmark } from '../types';
import { api } from './apiClient';
export type { QuestionBookmark };

export const BOOKMARKS_CHANGED_EVENT = 'cgssb_bookmarks_changed';

let bookmarkCache: QuestionBookmark[] = [];
let bookmarkUserId: string | null = null;
let bookmarksLoaded = false;

export async function initializeBookmarks(userId: string): Promise<QuestionBookmark[]> {
  if (!userId) return [];
  if (bookmarkUserId === userId && bookmarksLoaded) return [...bookmarkCache];
  try {
    const result = await api.get<{ success: boolean; bookmarks?: QuestionBookmark[] }>(
      '/api/user/bookmarks',
      { requireAuth: true }
    );
    bookmarkUserId = userId;
    bookmarkCache = Array.isArray(result.bookmarks) ? result.bookmarks : [];
    bookmarksLoaded = true;
    window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT));
    return [...bookmarkCache];
  } catch (error) {
    console.warn('Could not load bookmarks from server:', error);
    return [...bookmarkCache];
  }
}

export function clearBookmarkCache(): void {
  bookmarkUserId = null;
  bookmarkCache = [];
  bookmarksLoaded = false;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT));
  }
}

export function getBookmarks(): QuestionBookmark[] {
  return [...bookmarkCache];
}

export function isQuestionBookmarked(questionId: string): boolean {
  if (!questionId) return false;
  return bookmarkCache.some(b => b.questionId === questionId);
}

export function getBookmark(questionId: string): QuestionBookmark | undefined {
  if (!questionId) return undefined;
  return bookmarkCache.find(b => b.questionId === questionId);
}

async function persistBookmarks(): Promise<void> {
  if (!bookmarkUserId) {
    throw new Error('Sign in to save bookmarks.');
  }
  await api.post('/api/user/bookmarks', { bookmarks: bookmarkCache }, { requireAuth: true });
}

export function toggleBookmark(
  questionId: string,
  meta?: { note?: string; sourceTestTitle?: string; subject?: string }
): boolean {
  if (!questionId) return false;
  if (!bookmarkUserId) {
    console.warn('Bookmark action ignored because no authenticated student is loaded.');
    return false;
  }

  const index = bookmarkCache.findIndex(b => b.questionId === questionId);
  const next = [...bookmarkCache];

  if (index >= 0) {
    next.splice(index, 1);
  } else {
    next.unshift({
      questionId,
      createdAt: new Date().toISOString(),
      note: meta?.note || '',
      sourceTestTitle: meta?.sourceTestTitle || 'Practice Session',
      subject: meta?.subject,
    });
  }

  bookmarkCache = next;
  window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, {
    detail: { questionId, isBookmarked: index < 0 }
  }));

  persistBookmarks().catch(error => {
    console.error('Failed to persist bookmark change:', error);
  });
  return index < 0;
}

export function saveBookmarkNote(questionId: string, note: string): void {
  if (!questionId || !bookmarkUserId) return;
  const next = [...bookmarkCache];
  const index = next.findIndex(b => b.questionId === questionId);
  if (index >= 0) {
    next[index] = { ...next[index], note };
  } else {
    next.unshift({
      questionId,
      createdAt: new Date().toISOString(),
      note,
      sourceTestTitle: 'Direct Note',
    });
  }
  bookmarkCache = next;
  window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { questionId, note } }));
  persistBookmarks().catch(error => console.error('Failed to persist bookmark note:', error));
}

export function deleteBookmark(questionId: string): void {
  if (!questionId || !bookmarkUserId) return;
  bookmarkCache = bookmarkCache.filter(b => b.questionId !== questionId);
  window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGED_EVENT, { detail: { questionId, isBookmarked: false } }));
  persistBookmarks().catch(error => console.error('Failed to persist bookmark deletion:', error));
}
