import dotenv from 'dotenv';
import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

dotenv.config();

export interface DbConfig {
  mode: 'firestore';
  databaseId: string;
  projectId: string;
  region: string;
}

const REQUIRED_DATABASE_ID = 'ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089';

export const dbConfig: DbConfig = {
  mode: 'firestore',
  databaseId: process.env.FIRESTORE_DATABASE_ID || REQUIRED_DATABASE_ID,
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0783153446',
  region: 'asia-south1 (Mumbai)',
};

let serverFirestore: Firestore | null = null;

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email, or private_key.');
    }
    return cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: String(parsed.private_key).replace(/\\n/g, '\n'),
    });
  } catch (err: any) {
    throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${err?.message || err}`);
  }
}

export function getFirestoreServer(): Firestore {
  if (serverFirestore) return serverFirestore;

  try {
    const existingApp = getApps().find(app => app.name === 'cgssb-admin');
    const app = existingApp || initializeApp({
      credential: getServiceAccount() || applicationDefault(),
      projectId: dbConfig.projectId,
    }, 'cgssb-admin');

    serverFirestore = getFirestore(app, dbConfig.databaseId);
    return serverFirestore;
  } catch (err: any) {
    console.error('[Firestore Admin Init Error]', err?.message || err);
    throw new Error(`FATAL DATABASE ERROR: Failed to initialize privileged Cloud Firestore database (${dbConfig.databaseId}): ${err?.message || err}`);
  }
}

export async function testConnection(): Promise<{ ok: boolean; message: string; database: string; engine: string }> {
  try {
    const db = getFirestoreServer();
    await Promise.race([
      db.collection('_connection_check_').doc('server').set({
        checkedAt: new Date().toISOString(),
        source: 'server',
      }, { merge: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
    ]);

    return {
      ok: true,
      engine: 'Google Cloud Firestore',
      message: `Privileged Firestore connection is live (database: ${dbConfig.databaseId})`,
      database: dbConfig.databaseId,
    };
  } catch (err: any) {
    console.warn('[Firestore Connection Check Failed]', err?.message || err);
    return {
      ok: false,
      engine: 'Google Cloud Firestore',
      message: `Google Cloud Firestore connection failed (database: ${dbConfig.databaseId}): ${err?.message || err}`,
      database: dbConfig.databaseId,
    };
  }
}

export function isFirestoreActive(): boolean {
  return true;
}

export function canServerWriteFirestore(): boolean {
  return true;
}
