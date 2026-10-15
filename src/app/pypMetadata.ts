import type { PreviousYearPaper } from '../types';

export function getPypDeleteStorageKey(): string {
  return 'cgssb_deleted_pyp';
}
export function getPypStorageKey(): string {
  return 'cgssb_pyp';
}
export function getPypDisplayYear(paper: PreviousYearPaper): number {
  return paper.year || 2024;
}
