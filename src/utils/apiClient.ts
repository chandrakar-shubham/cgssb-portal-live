/**
 * Spark-plan Firebase API compatibility layer.
 *
 * The production app no longer depends on Express/Cloud Functions.
 * These helpers keep the existing UI contracts stable while routing
 * reads/writes directly through Firebase Auth + Cloud Firestore.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../firebase/config';

const ADMIN_BOOTSTRAP_EMAIL = 'admin@cgtest.in';

export function getApiBaseUrl(): string {
  return '';
}

export function getAdminToken(): string | null {
  try {
    const saved = sessionStorage.getItem('cgssb_admin_session');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed?.uid || parsed?.token || null;
  } catch {
    return null;
  }
}

export function getAdminHeaders(): Record<string, string> {
  return {};
}

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const decode = (value: string) => decodeURIComponent(value);

async function requireStudentAuth() {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Student authentication is required.');
  return user;
}

async function requireAdminAuth() {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Admin authentication is required.');

  const email = (user.email || '').trim().toLowerCase();
  if (email === ADMIN_BOOTSTRAP_EMAIL) {
    return { user, role: 'superadmin', permissions: { all: true } };
  }

  const memberSnap = await getDoc(doc(db, 'adminMembers', user.uid));
  if (!memberSnap.exists()) throw new Error('This Firebase account is not authorized as an administrator.');
  const member = memberSnap.data() as any;
  return {
    user,
    role: member.role || 'admin',
    permissions: member.permissions || { all: true },
    member,
  };
}

function unwrapList<T>(snap: any): T[] {
  return snap.docs.map((d: any) => d.data() as T);
}

async function readCollection<T>(name: string): Promise<T[]> {
  return unwrapList<T>(await getDocs(collection(db, name)));
}

async function readById<T>(name: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, name, id));
  return snap.exists() ? (snap.data() as T) : null;
}

async function writeDoc(name: string, id: string, value: any) {
  await setDoc(doc(db, name, id), value, { merge: true });
  return value;
}

async function removeDoc(name: string, id: string) {
  await deleteDoc(doc(db, name, id));
  return { success: true };
}

function slugLookup(items: any[], slug: string) {
  const clean = decode(slug).toLowerCase();
  return items.find(item =>
    String(item.slug || '').toLowerCase() === clean ||
    String(item.id || '').toLowerCase() === clean
  ) || null;
}

async function submitAttempt(testId: string, body: any) {
  const user = await requireStudentAuth();
  const test = await readById<any>('mockTests', testId);
  if (!test) throw new Error('Test not found');

  const allQuestions = await readCollection<any>('questions');
  const ids = Array.isArray(test.sections)
    ? test.sections.flatMap((s: any) => Array.isArray(s.questionIds) ? s.questionIds : [])
    : [];
  let testQuestions = allQuestions.filter(q => ids.includes(q.id));
  if (!testQuestions.length) {
    testQuestions = allQuestions.filter(q => q.category === test.category).slice(0, test.questionCount || 100);
  }
  if (!testQuestions.length) testQuestions = allQuestions.slice(0, test.questionCount || 100);

  const responses = body?.responses || {};
  const questionStatuses = body?.questionStatuses || {};
  const timeTakenSeconds = Number(body?.timeTakenSeconds || 600);

  let correctCount = 0, incorrectCount = 0, unattemptedCount = 0;
  let markedForReviewCount = 0, rawScore = 0, negativeMarksDeducted = 0;
  const sectorMap: Record<string, any> = {};

  for (const q of testQuestions) {
    const markedOption = responses[q.id];
    const status = questionStatuses[q.id];
    if (status === 'marked_for_review' || status === 'answered_and_marked') markedForReviewCount++;

    const subject = q.subject || 'General';
    sectorMap[subject] ||= { total: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0, maxScore: 0 };
    sectorMap[subject].total++;
    sectorMap[subject].maxScore += Number(q.marks || 1);

    if (!markedOption) {
      unattemptedCount++;
      sectorMap[subject].unattempted++;
    } else if (markedOption === q.correctOption) {
      correctCount++;
      rawScore += Number(q.marks || 1);
      sectorMap[subject].correct++;
      sectorMap[subject].score += Number(q.marks || 1);
    } else {
      incorrectCount++;
      const penalty = Number(q.negativeMarks ?? ((q.marks || 1) / 3));
      rawScore -= penalty;
      negativeMarksDeducted += penalty;
      sectorMap[subject].incorrect++;
      sectorMap[subject].score -= penalty;
    }
  }

  const attempted = correctCount + incorrectCount;
  const accuracy = attempted ? (correctCount / attempted) * 100 : 0;
  const maxScore = testQuestions.reduce((sum, q) => sum + Number(q.marks || 1), 0);
  const score = Math.max(0, Number(rawScore.toFixed(2)));
  const percentage = maxScore ? (score / maxScore) * 100 : 0;
  const participants = Number(test.attemptsCount || 0) + 1;
  const percentile = Math.min(99.9, Math.max(15, Number((percentage * 0.95 + accuracy * 0.05).toFixed(1))));
  const simulatedRank = Math.max(1, Math.round(participants * (1 - percentile / 100)));

  const sectorAnalysis = Object.entries(sectorMap).map(([subject, s]: any) => {
    const subAttempted = s.correct + s.incorrect;
    return {
      subject, total: s.total, correct: s.correct, incorrect: s.incorrect,
      unattempted: s.unattempted,
      accuracy: subAttempted ? Number(((s.correct / subAttempted) * 100).toFixed(1)) : 0,
      score: Number(s.score.toFixed(2)), maxScore: Number(s.maxScore.toFixed(2)),
      timeSpentSeconds: Math.round(timeTakenSeconds / Math.max(1, Object.keys(sectorMap).length)),
    };
  });

  const attempt = {
    id: String(body?.idempotencyKey || `att-${user.uid}-${Date.now()}`),
    userId: user.uid,
    userName: String(body?.userName || user.displayName || 'Aspirant Student'),
    testId: test.id,
    testTitle: test.title,
    category: test.category,
    submittedAt: new Date().toISOString(),
    timeTakenSeconds,
    totalDurationSeconds: Number(test.durationMinutes || 0) * 60,
    responses,
    questionStatuses,
    score,
    maxScore,
    percentage: Number(percentage.toFixed(1)),
    accuracy: Number(accuracy.toFixed(1)),
    correctCount, incorrectCount, unattemptedCount, markedForReviewCount,
    negativeMarksDeducted: Number(negativeMarksDeducted.toFixed(2)),
    simulatedRank, totalParticipants: participants, percentile, sectorAnalysis,
  };

  await setDoc(doc(db, 'attempts', attempt.id), attempt, { merge: true });
  await setDoc(doc(db, 'mockTests', test.id), { attemptsCount: participants }, { merge: true });

  return { success: true, attempt, solutions: testQuestions };
}

async function leaderboard(testId: string) {
  const [attempts, test] = await Promise.all([
    readCollection<any>('attempts'),
    readById<any>('mockTests', testId),
  ]);
  const filtered = attempts.filter(a => a.testId === testId);
  const best = new Map<string, any>();
  for (const a of filtered) {
    const existing = best.get(a.userId);
    if (!existing || a.score > existing.score || (a.score === existing.score && a.timeTakenSeconds < existing.timeTakenSeconds)) best.set(a.userId, a);
  }
  const ranked = [...best.values()].sort((a,b) => b.score !== a.score ? b.score - a.score : a.timeTakenSeconds - b.timeTakenSeconds);
  const totalParticipants = Math.max(ranked.length, Number(test?.attemptsCount || 1));
  const scores = ranked.map(a => Number(a.score || 0));
  const result = ranked.slice(0,100).map((a,i) => ({
    rank:i+1, userId:a.userId, userName:a.userName || `Aspirant #${i+1}`,
    score:a.score, maxScore:a.maxScore, percentage:a.percentage, accuracy:a.accuracy,
    timeTakenSeconds:a.timeTakenSeconds, submittedAt:a.submittedAt,
    percentile:Number((((totalParticipants-i)/totalParticipants)*100).toFixed(1)),
  }));
  return {
    success:true, testId, testTitle:test?.title || 'Mock Test',
    totalParticipants, avgScore:scores.length ? Number((scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2)) : 0,
    highestScore:scores.length ? Math.max(...scores) : Number(test?.questionCount || 100),
    leaderboard:result,
  };
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const parts = clean.split('/').filter(Boolean);
  const method = (options.method || 'GET').toUpperCase();
  let body: any = undefined;
  if (typeof options.body === 'string' && options.body) {
    try { body = JSON.parse(options.body); } catch { body = options.body; }
  }

  if (options.requireAdmin) await requireAdminAuth();
  else if (options.requireAuth) await requireStudentAuth();

  if (method === 'GET' && clean === '/api/health') return { success:true, status:'ok', platform:'Firebase Spark', api:'firestore-native' } as T;
  if (method === 'GET' && clean === '/api/version') return { success:true, version:'2.5.2', platform:'Firebase Spark' } as T;

  if (parts[0] === 'api' && parts[1] === 'auth' && parts[2] === 'admin-login' && method === 'POST') {
    const identifier = String(body?.username || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!identifier || !password) return { success:false, error:'Admin email and password are required.' } as T;
    try {
      const cred = await signInWithEmailAndPassword(auth, identifier, password);
      const member = identifier === ADMIN_BOOTSTRAP_EMAIL
        ? { role:'superadmin', permissions:{ all:true } }
        : (await getDoc(doc(db,'adminMembers',cred.user.uid))).data();
      if (!member) {
        await signOut(auth);
        return { success:false, error:'This Firebase account is not authorized as an administrator.' } as T;
      }
      return { success:true, uid:cred.user.uid, token:cred.user.uid, user:{
        id:cred.user.uid, uid:cred.user.uid, email:cred.user.email || identifier,
        name:cred.user.displayName || 'Administrator',
        role:member.role || 'admin', permissions:member.permissions || { all:true },
        status:'active'
      } } as T;
    } catch (e:any) {
      return { success:false, error:e?.message || 'Invalid admin credentials.' } as T;
    }
  }

  // Public collections
  if (parts[1] === 'tests' && method === 'GET') {
    const value = parts[2] ? await readById<any>('mockTests', decode(parts[2])) : await readCollection<any>('mockTests');
    return (parts[2] ? value : { success:true, tests:value }) as T;
  }
  if (parts[1] === 'questions' && method === 'GET') {
    const value = parts[2] ? await readById<any>('questions', decode(parts[2])) : await readCollection<any>('questions');
    return (parts[2] ? value : { success:true, questions:value }) as T;
  }
  if (parts[1] === 'pyp' && method === 'GET') {
    const value = await readCollection<any>('pypPapers');
    return { success:true, papers:value } as T;
  }
  if (parts[1] === 'bundles' && method === 'GET') {
    const value = parts[2] ? await readById<any>('bundles', decode(parts[2])) : await readCollection<any>('bundles');
    return (parts[2] ? value : { success:true, bundles:value }) as T;
  }

  // CMS
  if (parts[1] === 'cms' && parts[2] === 'pages' && method === 'GET') {
    const items = await readCollection<any>('pages');
    return { success:true, pages: parts[3] ? [slugLookup(items,parts[3])].filter(Boolean) : items } as T;
  }
  if (parts[1] === 'cms' && parts[2] === 'posts' && method === 'GET') {
    const items = await readCollection<any>('posts');
    return { success:true, posts: parts[3] ? [slugLookup(items,parts[3])].filter(Boolean) : items } as T;
  }
  if (parts[1] === 'cms' && parts[2] === 'series' && method === 'GET') {
    return { success:true, seriesPacks:await readCollection<any>('seriesPacks') } as T;
  }
  if (parts[1] === 'cms' && parts[2] === 'settings' && method === 'GET') {
    return { success:true, settings:await readById<any>('cmsSettings','global') } as T;
  }
  if (parts[1] === 'slider-banners' && method === 'GET') {
    return { success:true, banners:await readCollection<any>('slider_banners') } as T;
  }
  if (clean === '/api/config/remote' && method === 'GET') {
    return { success:true, config:await readById<any>('remoteConfig','global') } as T;
  }

  // Current affairs
  if (parts[1] === 'current-affairs' && method === 'GET') {
    const map:any = { sources:'currentAffairsSources', topics:'currentAffairsTopics', questions:'currentAffairsQuestions', daily:'dailyEditions', monthly:'monthlyEditions' };
    const collectionName = map[parts[2]];
    if (collectionName) return { success:true, items:await readCollection<any>(collectionName) } as T;
  }

  // User data
  if (parts[1] === 'user' && method === 'GET') {
    const user = await requireStudentAuth();
    if (parts[2] === 'bookmarks') {
      const s=await getDoc(doc(db,'userBookmarks',user.uid)); return { success:true, bookmarks:s.exists()?((s.data() as any).bookmarks||[]):[] } as T;
    }
    if (parts[2] === 'mistakes') {
      const s=await getDoc(doc(db,'userMistakes',user.uid)); return { success:true, mistakes:s.exists()?((s.data() as any).mistakes||[]):[] } as T;
    }
    if (parts[2] === 'entitlements') {
      const s=await getDoc(doc(db,'userEntitlements',user.uid)); return { success:true, entitlements:s.exists()?s.data():{userId:user.uid,hasActivePass:false,credits:50,unlockedBundleIds:[],redeemedCoupons:[]} } as T;
    }
    if (parts[2] === 'referrals') {
      const snap=await getDocs(collection(db,'referrals')); const records=snap.docs.map(d=>d.data()).filter((x:any)=>x.referrerId===user.uid||x.refereeId===user.uid);
      return { success:true, records } as T;
    }
  }

  // Admin reads
  if (parts[1] === 'admin' && method === 'GET') {
    await requireAdminAuth();
    if (parts[2] === 'students') return { success:true, students:await readCollection<any>('users') } as T;
    if (parts[2] === 'members') return { success:true, members:await readCollection<any>('adminMembers') } as T;
    if (parts[2] === 'coupons') return { success:true, coupons:await readCollection<any>('discountCoupons') } as T;
  }

  // Leaderboard and attempts
  if (parts[1] === 'tests' && parts[3] === 'leaderboard' && method === 'GET') {
    return await leaderboard(decode(parts[2])) as T;
  }
  if (parts[1] === 'attempts' && method === 'GET') {
    const user=await requireStudentAuth();
    const snap=await getDocs(query(collection(db,'attempts'),where('userId','==',user.uid)));
    return { success:true, attempts:unwrapList<any>(snap) } as T;
  }

  // Writes
  if (method === 'POST' && parts[1] === 'tests') {
    if (parts[3] === 'submit') return await submitAttempt(decode(parts[2]), body) as T;
    await requireAdminAuth();
    const value=await writeDoc('mockTests',String(body.id),body);
    return { success:true, test:value } as T;
  }
  if ((method==='POST' || method==='PUT') && parts[1] === 'questions') {
    await requireAdminAuth();
    if (parts[2]==='bulk') {
      const list=Array.isArray(body?.questions)?body.questions:[];
      for(const q of list) await writeDoc('questions',String(q.id),q);
      return { success:true, inserted:list.length, updated:0 };
    }
    const value=await writeDoc('questions',String(body.id),body); return { success:true, question:value };
  }
  if (method==='POST' && parts[1]==='pyp') {
    await requireAdminAuth(); const value=await writeDoc('pypPapers',String(body.id),body); return { success:true,paper:value };
  }
  if (method==='POST' && parts[1]==='bundles') {
    await requireAdminAuth(); const value=await writeDoc('bundles',String(body.id),body); return { success:true,bundle:value };
  }
  if (method==='POST' && parts[1]==='slider-banners') {
    await requireAdminAuth(); const value=await writeDoc('slider_banners',String(body.id),body); return { success:true,banner:value };
  }
  if (method==='POST' && parts[1]==='cms') {
    await requireAdminAuth();
    const collectionName:any={pages:'pages',posts:'posts',series:'seriesPacks',settings:'cmsSettings'}[parts[2]];
    const id=collectionName==='cmsSettings'?'global':String(body.id);
    const value=await writeDoc(collectionName,id,body);
    return { success:true,[parts[2]==='series'?'seriesPack':parts[2].replace(/s$/,'')]:value };
  }
  if (method==='POST' && parts[1]==='admin' && parts[2]==='config' && parts[3]==='remote') {
    await requireAdminAuth(); const value=await writeDoc('remoteConfig','global',body); return { success:true,config:value };
  }

  if (method==='POST' && parts[1]==='user') {
    const user=await requireStudentAuth();
    if(parts[2]==='bookmarks'){ await setDoc(doc(db,'userBookmarks',user.uid),{userId:user.uid,bookmarks:body?.bookmarks||[],updatedAt:new Date().toISOString()},{merge:true}); return {success:true,bookmarks:body?.bookmarks||[]}; }
    if(parts[2]==='mistakes'){ await setDoc(doc(db,'userMistakes',user.uid),{userId:user.uid,mistakes:body?.mistakes||[],updatedAt:new Date().toISOString()},{merge:true}); return {success:true,mistakes:body?.mistakes||[]}; }
    if(parts[2]==='referrals' && parts[3]==='claim') return {success:false,error:'Referral claiming is temporarily unavailable in Spark mode. Existing referral records remain readable.'} as T;
  }

  if (method==='POST' && parts[1]==='current-affairs') {
    await requireAdminAuth();
    const map:any={currentAffairsSources:'currentAffairsSources',currentAffairsTopics:'currentAffairsTopics',currentAffairsQuestions:'currentAffairsQuestions',dailyEditions:'dailyEditions',monthlyEditions:'monthlyEditions'};
    const value=await writeDoc(map[parts[2]],decode(parts[3]),body);
    return {success:true,item:value} as T;
  }

  if (method==='PUT' && parts[1]==='admin') {
    await requireAdminAuth();
    const collectionName:any={students:'users',members:'adminMembers',coupons:'discountCoupons'}[parts[2]];
    const value=await writeDoc(collectionName,decode(parts[3]),body);
    return {success:true,[parts[2]==='students'?'student':parts[2]==='members'?'member':'coupon']:value} as T;
  }

  if (method==='DELETE') {
    const map:any={
      tests:'mockTests',questions:'questions',pyp:'pypPapers',bundles:'bundles',
      'slider-banners':'slider_banners',
    };
    if (parts[1]==='cms') map[parts[2]]={pages:'pages',posts:'posts',series:'seriesPacks'}[parts[2]];
    if (parts[1]==='current-affairs') map[parts[2]]=parts[2]==='sources'?'currentAffairsSources':parts[2]==='topics'?'currentAffairsTopics':parts[2]==='questions'?'currentAffairsQuestions':parts[2];
    if (parts[1]==='admin') map[parts[2]]={students:'users',members:'adminMembers',coupons:'discountCoupons'}[parts[2]];
    const collectionName=parts[1]==='cms'?map[parts[2]]:map[parts[1]];
    if(collectionName){ await requireAdminAuth(); return await removeDoc(collectionName,decode(parts[3]||parts[2])) as T; }
  }

  if (method==='POST' && parts[1]==='ai') {
    throw new Error('AI generation requires a server-side secret and is disabled in Firebase Spark mode. Use the JSON/manual ingestion workflow.');
  }
  if (method==='POST' && parts[1]==='current-affairs' && parts[2]==='generate-ai') {
    throw new Error('AI generation requires a server-side secret and is disabled in Firebase Spark mode. Use the JSON/manual ingestion workflow.');
  }

  throw new Error(`Unsupported Spark API operation: ${method} ${clean}`);
}

export const api = {
  get: <T = any>(endpoint: string, options?: ApiFetchOptions) => apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any, options?: ApiFetchOptions) => apiFetch<T>(endpoint, { ...options, method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T = any>(endpoint: string, body?: any, options?: ApiFetchOptions) => apiFetch<T>(endpoint, { ...options, method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T = any>(endpoint: string, options?: ApiFetchOptions) => apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
