import assert from 'node:assert/strict';
import { toStudentQuestion, toStudentQuestions } from '../src/utils/studentQuestionProjection';

const canonical = {
  id: 'q-1',
  category: 'CGPSC',
  subject: 'Polity',
  topic: 'Constitution',
  difficulty: 'Medium',
  marks: 2,
  negativeMarks: 0.66,
  questionText: 'Which option is correct?',
  options: [{ label: 'A', text: 'Option A', textHindi: 'विकल्प A', isCorrect: true, answerKey: 'A' }],
  statements: [{ id: 1, text: 'Statement', textHindi: 'कथन', correct: true, explanation: 'private' }],
  columnA: [{ id: 'a', text: 'Left', isAnswer: true }],
  correctOption: 'A',
  correctAnswer: 'A',
  modelKey: 'B',
  finalAmendedKey: 'C',
  explanation: 'Private grading explanation',
  explanationHindi: 'निजी व्याख्या',
  isCancelled: true,
  status: 'internal-review',
  moderationNotes: 'Do not expose',
  newlyAddedInternalField: 'not allowlisted',
};

const projected = toStudentQuestion(canonical);
for (const field of [
  'correctOption', 'correctAnswer', 'modelKey', 'finalAmendedKey',
  'explanation', 'explanationHindi', 'isCancelled', 'status',
  'moderationNotes', 'newlyAddedInternalField',
]) {
  assert.equal(Object.prototype.hasOwnProperty.call(projected, field), false, `leaked field: ${field}`);
}
assert.equal(projected.id, 'q-1');
assert.equal(projected.questionText, 'Which option is correct?');
assert.deepEqual(projected.options, [{ label: 'A', text: 'Option A', textHindi: 'विकल्प A' }]);
assert.deepEqual(projected.statements, [{ id: 1, text: 'Statement', textHindi: 'कथन' }]);
assert.deepEqual(projected.columnA, [{ id: 'a', text: 'Left' }]);
assert.equal('isCorrect' in projected.options[0], false);
assert.equal('answerKey' in projected.options[0], false);
assert.equal('correct' in projected.statements![0], false);
assert.equal('explanation' in projected.statements![0], false);
assert.equal('isAnswer' in projected.columnA![0], false);

const many = toStudentQuestions([canonical, { ...canonical, id: 'q-2' }]);
assert.equal(many.length, 2);
assert.equal(many[1].id, 'q-2');
assert.equal(Object.prototype.hasOwnProperty.call(many[0], 'correctOption'), false);

console.log('PASS student question projection allowlist and answer-key exclusion');
