/**
 * Centralized student/admin route parsing and SEO metadata.
 * Keep route behavior stable while keeping App.tsx focused on rendering.
 */

export type AppRoute = {
  route: 'student' | 'admin';
  tab: string;
  pageSlug?: string;
  postSlug?: string;
  studentSlug?: string;
};

export function parseAppRoute(pathname?: string, hashValue?: string): AppRoute {
  const path = (pathname ?? (typeof window === 'undefined' ? '/' : window.location.pathname)).toLowerCase();
  const hash = (hashValue ?? (typeof window === 'undefined' ? '' : window.location.hash)).toLowerCase();

  const studentTestsMatch = path.match(/^\/u\/([^/]+)\/tests(?:\/.*)?$/i);
  if (studentTestsMatch) {
    return { route: 'student', tab: 'student-tests', studentSlug: decodeURIComponent(studentTestsMatch[1]) };
  }
  if (path.startsWith('/admin') || hash.startsWith('#/admin') || hash === '#admin') {
    return { route: 'admin', tab: 'admin-pyp' };
  }
  if (path.startsWith('/page/') || path.startsWith('/pages/') || path.startsWith('/p/')) {
    const parts = path.split('/');
    return { route: 'student', tab: 'page', pageSlug: parts[2] || '' };
  }
  if (path === '/about' || path === '/syllabus-guide' || path === '/legal') {
    return { route: 'student', tab: 'page', pageSlug: path.replace('/', '') };
  }
  if (path.startsWith('/post/') || path.startsWith('/posts/')) {
    const parts = path.split('/');
    return { route: 'student', tab: 'posts', postSlug: parts[2] || '' };
  }
  if (path.includes('chapter') || hash.includes('chapter')) return { route: 'student', tab: 'chapters' };
  if (path.includes('practice') || hash.includes('practice')) return { route: 'student', tab: 'practice' };
  if (path.includes('leaderboard') || hash.includes('leaderboard')) return { route: 'student', tab: 'leaderboard' };
  if (path.includes('cgpsc') || hash.includes('cgpsc')) return { route: 'student', tab: 'cgpsc' };
  if (path.includes('cgssb') || hash.includes('cgssb') || path.includes('vyapam') || hash.includes('vyapam')) {
    return { route: 'student', tab: 'cgssb' };
  }
  if (path.includes('pass') || hash.includes('pass')) return { route: 'student', tab: 'pass' };
  if (path.includes('pyp') || hash.includes('pyp')) return { route: 'student', tab: 'pyp' };
  if (path.includes('analytics') || hash.includes('analytics')) return { route: 'student', tab: 'analytics' };
  if (path.includes('mistakes') || hash.includes('mistakes')) return { route: 'student', tab: 'mistakes' };
  if (path.includes('bookmarks') || hash.includes('bookmarks')) return { route: 'student', tab: 'bookmarks' };
  if (path.includes('posts') || hash.includes('posts')) return { route: 'student', tab: 'posts' };
  if (path.includes('chhattisgarh') || hash.includes('chhattisgarh') || path.includes('flashcards')) {
    return { route: 'student', tab: 'chhattisgarh-deck' };
  }
  if (path.includes('referral') || hash.includes('referral') || path.includes('invite') || hash.includes('invite')) {
    return { route: 'student', tab: 'referral' };
  }
  return { route: 'student', tab: 'tests' };
}

export function getStudentTabPath(tab: string, studentSlug?: string): string {
  switch (tab) {
    case 'student-tests': return studentSlug ? `/u/${studentSlug}/tests` : '/';
    case 'tests': return '/';
    case 'chapters': return '/cgvyapam-cgssb/chapter-tests';
    case 'practice': return '/cgvyapam-cgssb/practice-drills';
    case 'leaderboard': return '/leaderboard';
    case 'cgpsc': return '/cgpsc/mock-tests';
    case 'cgssb': return '/cgvyapam/mock-tests';
    case 'pass': return '/pass';
    case 'pyp': return '/cgvyapam/pyp-papers';
    case 'analytics': return '/analytics';
    case 'mistakes': return '/mistakes';
    case 'bookmarks': return '/bookmarks';
    case 'chhattisgarh-deck': return '/chhattisgarhi-revision';
    case 'referral': return '/invite-earn';
    case 'posts': return '/posts';
    default: return '/';
  }
}

export function getStudentPageTitle(tab: string): string {
  switch (tab) {
    case 'chapters': return 'CG Vyapam & CGPSC Chapter Tests (Topic-wise Quizzes) | cgtest.in';
    case 'practice': return 'CG Vyapam Daily Practice Drills & Solved MCQs | cgtest.in';
    case 'leaderboard': return 'State-Wide Live Merit Leaderboard & Percentile Ranks | cgtest.in';
    case 'cgpsc': return 'CGPSC Prelims & Forest Service Mock Tests 2026 | cgtest.in';
    case 'cgssb': return 'CG Vyapam Hostel Warden, Patwari & RI Tests 2026 | cgtest.in';
    case 'pass': return 'CG Exam Pass Pro - Unlimited Test Series Access | cgtest.in';
    case 'pyp': return 'CGPSC & Vyapam Previous Year Papers (PYQ Bank) | cgtest.in';
    case 'analytics': return 'Performance Analytics & Simulated Rank | cgtest.in';
    case 'mistakes': return 'Mistake Notebook & Error Log (कमज़ोर विषय री-टेस्ट) | cgtest.in';
    case 'bookmarks': return 'Starred Questions & Personal Notes (बुकमार्क) | cgtest.in';
    case 'chhattisgarh-deck': return 'Chhattisgarhi Language & GK Flashcards Revision | cgtest.in';
    case 'referral': return 'Invite & Earn (+1 Mo Free) | Student Referral Program | cgtest.in';
    default: return 'cgtest.in | CGPSC, CG Vyapam & Teacher Recruitment Mock Tests';
  }
}
