/**
 * SEO & Canonical URL Helper for CGSSB & CG Vyapam Exam Portal
 * Standardizes high-intent search engine keyword URLs and Schema.org JSON-LD generators.
 */

import { Question, MockTest, PreviousYearPaper } from '../types';

/**
 * Transliterates Hindi Devanagari and English strings into clean, hyphenated SEO slugs.
 */
export function slugifyText(text: string, maxLength: number = 60): string {
  if (!text) return 'cg-exam-question';
  
  // Basic romanization mapping for common Hindi terms
  const transliterated = text
    .replace(/छत्तीसगढ़/g, 'chhattisgarh')
    .replace(/व्यापम/g, 'vyapam')
    .replace(/शिक्षक/g, 'shikshak')
    .replace(/सहायक/g, 'sahayak')
    .replace(/पटवारी/g, 'patwari')
    .replace(/छात्रावास/g, 'hostel')
    .replace(/अधीक्षक/g, 'warden')
    .replace(/कलचुरि/g, 'kalchuri')
    .replace(/महानदी/g, 'mahanadi')
    .replace(/प्रश्न/g, 'prashna')
    .replace(/उत्तर/g, 'uttar');

  const clean = transliterated
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F-]/g, '') // keep letters, numbers, spaces, and devanagari
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');

  return clean.slice(0, maxLength).replace(/-$/, '') || 'cg-question';
}

/**
 * Generates keyword-optimized SEO URLs for questions
 * Example: /cgvyapam-cgssb/mcq/kalchuri-vansh-kuldevi-q-104
 */
export function getQuestionSeoUrl(q: Question): string {
  const authorityPrefix = (q.authority || q.category || 'cgvyapam').toLowerCase().replace(/[^a-z0-9]/g, '');
  const prefix = authorityPrefix.includes('psc') ? 'cgpsc' : 'cgvyapam-cgssb';
  const slug = slugifyText(q.questionHindi || q.questionText || q.subject || 'mcq', 50);
  const qIdSuffix = (q.id || 'q').replace(/[^a-zA-Z0-9-]/g, '').slice(-10);
  return `/${prefix}/mcq/${slug}-${qIdSuffix}`;
}

/**
 * Generates keyword-optimized SEO URLs for Mock Tests
 * Example: /cgvyapam/mock-test/assistant-teacher-recruitment-2026-mock-01
 */
export function getMockTestSeoUrl(test: MockTest): string {
  const prefix = (test.category || 'cgssb').toLowerCase().includes('psc') ? 'cgpsc' : 'cgvyapam';
  const slug = slugifyText(test.title || test.examName || 'mock-test', 60);
  return `/${prefix}/mock-test/${slug}`;
}

/**
 * Generates keyword-optimized SEO URLs for Previous Year Papers
 * Example: /cgvyapam/pyp/cg-patwari-official-solved-paper-2024
 */
export function getPypSeoUrl(pyp: PreviousYearPaper): string {
  const prefix = (pyp.examCategory || 'cgssb').toLowerCase().includes('psc') ? 'cgpsc' : 'cgvyapam';
  const slug = slugifyText(pyp.title || `${pyp.examName}-${pyp.year}-solved-paper`, 60);
  return `/${prefix}/pyp/${slug}`;
}

/**
 * Generates keyword-optimized SEO URLs for Chapter / Topic Tests
 * Example: /cgvyapam-cgssb/chapter-test/chhattisgarh-gk/kalchuri-dynasty
 */
export function getChapterTestSeoUrl(subject: string, topic: string): string {
  const subjSlug = slugifyText(subject, 30);
  const topicSlug = slugifyText(topic, 40);
  return `/cgvyapam-cgssb/chapter-test/${subjSlug}/${topicSlug}`;
}

/**
 * Generates schema.org QAPage JSON-LD structured data for Google Search snippet indexing
 */
export function generateQuestionSchemaJsonLd(q: Question, pageUrl?: string) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cgtest.in';
  const url = pageUrl || `${siteUrl}${getQuestionSeoUrl(q)}`;
  const correctOpt = q.options?.find(o => o.id === q.correctOption);
  const otherOpts = q.options?.filter(o => o.id !== q.correctOption) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: (q.questionHindi || q.questionText || 'CG Vyapam & CGPSC MCQ Question').slice(0, 150),
      text: `${q.questionHindi || ''}\n${q.questionText || ''}`.trim(),
      answerCount: q.options?.length || 4,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Option (${q.correctOption}): ${correctOpt?.textHindi || correctOpt?.text || ''}. Explanation: ${q.explanationHindi || q.explanation || 'Official key verified.'}`,
        url: url,
      },
      suggestedAnswer: otherOpts.map(o => ({
        '@type': 'Answer',
        text: `Option (${o.id}): ${o.textHindi || o.text || ''}`,
      })),
    },
  };
}
