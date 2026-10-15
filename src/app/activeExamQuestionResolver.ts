import type { MockTest, Question } from '../types';
import { resolveQuestionsForTest } from './examQuestionSet';
export function resolveActiveExamQuestions(activeQuestions: Question[], test: MockTest, catalogQuestions: Question[]): Question[] { return activeQuestions.length > 0 ? activeQuestions : resolveQuestionsForTest(test, catalogQuestions); }
