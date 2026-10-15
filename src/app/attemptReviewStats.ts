import type { QuestionPaletteStatus } from '../types';

export function countMarkedForReview(statuses: Record<string, QuestionPaletteStatus>): number {
  return Object.values(statuses).filter(status => status === 'marked_for_review' || status === 'answered_and_marked').length;
}
