/**
 * Current Affairs Repository & Data Access Utilities
 * Interacts exclusively with approved Current Affairs Firestore collections:
 * /currentAffairsSources, /currentAffairsTopics, /currentAffairsQuestions, /dailyEditions, /monthlyEditions
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { api } from './apiClient';
import {
  CurrentAffairSource,
  CurrentAffairTopic,
  CurrentAffairsQuestion,
  DailyEdition,
  MonthlyEdition,
  MonthlyEditionSection
} from '../types/currentAffairs';

// Approved Current Affairs Collections
const SOURCES_COLLECTION = 'currentAffairsSources';
const TOPICS_COLLECTION = 'currentAffairsTopics';
const QUESTIONS_COLLECTION = 'currentAffairsQuestions';
const DAILY_EDITIONS_COLLECTION = 'dailyEditions';
const MONTHLY_EDITIONS_COLLECTION = 'monthlyEditions';

// ============================================================================
// 1. SOURCES REPOSITORY
// ============================================================================
export async function fetchCurrentAffairsSource(id: string): Promise<CurrentAffairSource | null> {
  try {
    const snap = await getDoc(doc(db, SOURCES_COLLECTION, id));
    return snap.exists() ? (snap.data() as CurrentAffairSource) : null;
  } catch (err) {
    console.warn('Error fetching source:', err);
    return null;
  }
}

export async function fetchAllCurrentAffairsSources(): Promise<CurrentAffairSource[]> {
  try {
    const snap = await getDocs(collection(db, SOURCES_COLLECTION));
    const items: CurrentAffairSource[] = [];
    snap.forEach(d => items.push(d.data() as CurrentAffairSource));
    return items;
  } catch (err) {
    console.warn('Error fetching sources:', err);
    return [];
  }
}

export async function saveCurrentAffairsSource(source: CurrentAffairSource): Promise<void> {
  await api.post(`/api/current-affairs/${SOURCES_COLLECTION}/${encodeURIComponent(source.id)}`, { ...source, updatedAt: new Date().toISOString() }, { requireAuth: true });
}

// ============================================================================
// 2. TOPICS REPOSITORY
// ============================================================================
export async function fetchCurrentAffairsTopic(id: string): Promise<CurrentAffairTopic | null> {
  try {
    const snap = await getDoc(doc(db, TOPICS_COLLECTION, id));
    return snap.exists() ? (snap.data() as CurrentAffairTopic) : null;
  } catch (err) {
    console.warn('Error fetching topic:', err);
    return null;
  }
}

export async function fetchTopicsFiltered(filters?: {
  region?: 'chhattisgarh' | 'india' | 'international';
  status?: string;
  monthYear?: string;
  exam?: string;
  limitCount?: number;
}): Promise<CurrentAffairTopic[]> {
  try {
    let qRef = collection(db, TOPICS_COLLECTION);
    let q = query(qRef, orderBy('date', 'desc'));

    const snap = await getDocs(q);
    let items: CurrentAffairTopic[] = [];
    snap.forEach(d => items.push(d.data() as CurrentAffairTopic));

    // Client-side filtering for flexibility across multiple index combinations
    if (filters) {
      if (filters.region) {
        items = items.filter(t => t.region === filters.region);
      }
      if (filters.status) {
        items = items.filter(t => t.status === filters.status);
      }
      if (filters.monthYear) {
        items = items.filter(t => t.monthYear === filters.monthYear);
      }
      if (filters.exam) {
        items = items.filter(t => t.exams && t.exams.includes(filters.exam as any));
      }
      if (filters.limitCount && filters.limitCount > 0) {
        items = items.slice(0, filters.limitCount);
      }
    }
    return items;
  } catch (err) {
    console.warn('Error fetching filtered topics:', err);
    return [];
  }
}

export async function saveCurrentAffairsTopic(topic: CurrentAffairTopic): Promise<void> {
  await api.post(`/api/current-affairs/${TOPICS_COLLECTION}/${encodeURIComponent(topic.id)}`, { ...topic, updatedAt: new Date().toISOString(), createdAt: topic.createdAt || new Date().toISOString() }, { requireAuth: true });
}

// ============================================================================
// 3. QUESTIONS REPOSITORY (DEDICATED)
// ============================================================================
export async function fetchCurrentAffairsQuestion(id: string): Promise<CurrentAffairsQuestion | null> {
  try {
    const snap = await getDoc(doc(db, QUESTIONS_COLLECTION, id));
    return snap.exists() ? (snap.data() as CurrentAffairsQuestion) : null;
  } catch (err) {
    console.warn('Error fetching CA question:', err);
    return null;
  }
}

export async function fetchQuestionsForTopic(topicId: string): Promise<CurrentAffairsQuestion[]> {
  try {
    const qRef = collection(db, QUESTIONS_COLLECTION);
    const q = query(qRef, where('currentAffairTopicId', '==', topicId));
    const snap = await getDocs(q);
    const items: CurrentAffairsQuestion[] = [];
    snap.forEach(d => items.push(d.data() as CurrentAffairsQuestion));
    return items;
  } catch (err) {
    console.warn('Error fetching questions for topic:', err);
    return [];
  }
}

export async function saveCurrentAffairsQuestion(question: CurrentAffairsQuestion): Promise<void> {
  await api.post(`/api/current-affairs/${QUESTIONS_COLLECTION}/${encodeURIComponent(question.id)}`, { ...question, updatedAt: new Date().toISOString(), createdAt: question.createdAt || new Date().toISOString() }, { requireAuth: true });
}

// ============================================================================
// 4. DAILY EDITIONS REPOSITORY
// ============================================================================
export async function fetchDailyEdition(date: string): Promise<DailyEdition | null> {
  try {
    const snap = await getDoc(doc(db, DAILY_EDITIONS_COLLECTION, date));
    return snap.exists() ? (snap.data() as DailyEdition) : null;
  } catch (err) {
    console.warn('Error fetching daily edition:', err);
    return null;
  }
}

export async function saveDailyEdition(edition: DailyEdition): Promise<void> {
  const id = edition.date || edition.id || '2026-03-27';
  await api.post(`/api/current-affairs/${DAILY_EDITIONS_COLLECTION}/${encodeURIComponent(id)}`, { ...edition, updatedAt: new Date().toISOString(), createdAt: edition.createdAt || new Date().toISOString() }, { requireAuth: true });
}

// ============================================================================
// 5. MONTHLY EDITIONS REPOSITORY (MANIFEST + PROGRESSIVE SECTIONS)
// ============================================================================
export async function fetchMonthlyEditionManifest(yearMonth: string): Promise<MonthlyEdition | null> {
  try {
    const snap = await getDoc(doc(db, MONTHLY_EDITIONS_COLLECTION, yearMonth));
    return snap.exists() ? (snap.data() as MonthlyEdition) : null;
  } catch (err) {
    console.warn('Error fetching monthly edition manifest:', err);
    return null;
  }
}

export async function saveMonthlyEditionManifest(edition: MonthlyEdition): Promise<void> {
  const id = edition.yearMonth || edition.id || '2026-03';
  await api.post(`/api/current-affairs/${MONTHLY_EDITIONS_COLLECTION}/${encodeURIComponent(id)}`, { ...edition, updatedAt: new Date().toISOString(), createdAt: edition.createdAt || new Date().toISOString() }, { requireAuth: true });
}

export async function fetchMonthlySectionContent(yearMonth: string, sectionId: string): Promise<MonthlyEditionSection | null> {
  try {
    const ref = doc(db, MONTHLY_EDITIONS_COLLECTION, yearMonth, 'sections', sectionId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as MonthlyEditionSection) : null;
  } catch (err) {
    console.warn('Error fetching monthly section content:', err);
    return null;
  }
}

export async function deleteMonthlySectionContent(yearMonth: string, sectionId: string): Promise<void> {
  await api.delete(`/api/current-affairs/monthly/${encodeURIComponent(yearMonth)}/sections/${encodeURIComponent(sectionId)}`, { requireAuth: true });
}

export async function deleteCurrentAffairsTopic(id: string): Promise<void> {
  try {
    await api.delete(`/api/current-affairs/${TOPICS_COLLECTION}/${encodeURIComponent(id)}`, { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting topic:', err);
  }
}

export async function deleteCurrentAffairsQuestion(id: string): Promise<void> {
  try {
    await api.delete(`/api/current-affairs/${QUESTIONS_COLLECTION}/${encodeURIComponent(id)}`, { requireAuth: true });
  } catch (err) {
    console.warn('Error deleting question:', err);
  }
}
