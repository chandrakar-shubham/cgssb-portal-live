import type { MockTest, Question } from '../types';
export function canSubmitExam(test: MockTest | null | undefined, questions: Question[]): boolean { return Boolean(test && questions.length > 0); }
