import fs from 'fs';
import path from 'path';
import { CurrentAffairsTopic, DailyEdition, MonthlyEdition, CurrentAffairsSourceRegistryItem } from '../../src/types/currentAffairs';
import { INITIAL_OFFICIAL_SOURCES } from '../../src/data/officialSources';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const CA_DB_FILE = path.join(DATA_DIR, 'current-affairs-db.json');

export interface CADatabaseShape {
  topics: CurrentAffairsTopic[];
  dailyEditions: DailyEdition[];
  monthlyEditions: MonthlyEdition[];
  sources: CurrentAffairsSourceRegistryItem[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadCaDb(): CADatabaseShape {
  ensureDataDir();
  try {
    if (fs.existsSync(CA_DB_FILE)) {
      const raw = fs.readFileSync(CA_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        dailyEditions: Array.isArray(parsed.dailyEditions) ? parsed.dailyEditions : [],
        monthlyEditions: Array.isArray(parsed.monthlyEditions) ? parsed.monthlyEditions : [],
        sources: Array.isArray(parsed.sources) && parsed.sources.length > 0 ? parsed.sources : [...INITIAL_OFFICIAL_SOURCES],
      };
    }
  } catch (err) {
    console.warn('⚠️ Failed to load persistent CA DB, seeding defaults:', err);
  }
  return {
    topics: [],
    dailyEditions: [],
    monthlyEditions: [],
    sources: [...INITIAL_OFFICIAL_SOURCES],
  };
}

let caDb: CADatabaseShape = loadCaDb();

export function saveCaDb() {
  try {
    ensureDataDir();
    fs.writeFileSync(CA_DB_FILE, JSON.stringify(caDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ Failed to save CA DB snapshot:', err);
  }
}

export function getAllCaTopics(): CurrentAffairsTopic[] {
  return caDb.topics;
}

export function saveCaTopic(topic: CurrentAffairsTopic): CurrentAffairsTopic {
  const idx = caDb.topics.findIndex(t => t.id === topic.id);
  if (idx >= 0) {
    caDb.topics[idx] = { ...topic, updatedAt: new Date().toISOString() };
  } else {
    caDb.topics.push({ ...topic, createdAt: topic.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveCaDb();
  return topic;
}

export function deleteCaTopic(id: string) {
  caDb.topics = caDb.topics.filter(t => t.id !== id);
  saveCaDb();
}

export function getAllDailyEditions(): DailyEdition[] {
  return caDb.dailyEditions;
}

export function saveDailyEdition(edition: DailyEdition): DailyEdition {
  const idx = caDb.dailyEditions.findIndex(e => e.id === edition.id || e.date === edition.date);
  if (idx >= 0) {
    caDb.dailyEditions[idx] = { ...edition, updatedAt: new Date().toISOString() };
  } else {
    caDb.dailyEditions.push({ ...edition, createdAt: edition.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveCaDb();
  return edition;
}

export function getAllMonthlyEditions(): MonthlyEdition[] {
  return caDb.monthlyEditions;
}

export function saveMonthlyEdition(edition: MonthlyEdition): MonthlyEdition {
  const idx = caDb.monthlyEditions.findIndex(e => e.id === edition.id);
  if (idx >= 0) {
    caDb.monthlyEditions[idx] = { ...edition, updatedAt: new Date().toISOString() };
  } else {
    caDb.monthlyEditions.push({ ...edition, createdAt: edition.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveCaDb();
  return edition;
}

export function getAllSources(): CurrentAffairsSourceRegistryItem[] {
  return caDb.sources;
}

export function saveSource(source: CurrentAffairsSourceRegistryItem): CurrentAffairsSourceRegistryItem {
  const idx = caDb.sources.findIndex(s => s.id === source.id);
  if (idx >= 0) {
    caDb.sources[idx] = source;
  } else {
    caDb.sources.push(source);
  }
  saveCaDb();
  return source;
}
