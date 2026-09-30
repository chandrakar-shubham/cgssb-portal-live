import { App, cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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

function loadServiceAccount(): Record<string, any> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`FATAL DATABASE CONFIG ERROR: FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    try {
      return JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    } catch (err) {
      throw new Error(`FATAL DATABASE CONFIG ERROR: Unable to read GOOGLE_APPLICATION_CREDENTIALS: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const localConfigPath = path.resolve(process.cwd(), 'firebase-service-account.json');
  if (process.env.NODE_ENV !== 'production' && fs.existsSync(localConfigPath)) {
    try {
      return JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
    } catch (err) {
      throw new Error(`FATAL DATABASE CONFIG ERROR: Unable to read local service account: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return null;
}

export function getFirestoreServer(): Firestore {
  if (serverFirestore) return serverFirestore;

  try {
    const existingApp = getApps().find(a => a.name === 'cgssb-server-admin');
    let app: App;

    if (existingApp) {
      app = existingApp;
    } else {
      const serviceAccount = loadServiceAccount();
      app = serviceAccount
        ? initializeApp({
            credential: cert(serviceAccount as any),
            projectId: serviceAccount.project_id || dbConfig.projectId,
          }, 'cgssb-server-admin')
        : initializeApp({
            credential: applicationDefault(),
            projectId: dbConfig.projectId,
          }, 'cgssb-server-admin');
    }

    serverFirestore = getFirestore(app, dbConfig.databaseId);
    return serverFirestore;
  } catch (err: any) {
    console.error('[Firestore Admin Init Error]', err?.message || err);
    throw new Error(`FATAL DATABASE ERROR: Failed to initialize Cloud Firestore database (${dbConfig.databaseId}): ${err?.message || err}`);
  }
}

export async function testConnection(): Promise<{ ok: boolean; message: string; database: string; engine: string }> {
  try {
    const db = getFirestoreServer();
    await Promise.race([
      db.collection('__health').doc('connection').get(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore health check timed out after 3000ms')), 3000)),
    ]);

    return {
      ok: true,
      engine: 'Google Cloud Firestore via Firebase Admin SDK',
      message: `Google Cloud Firestore is live and connected (database: ${dbConfig.databaseId})`,
      database: dbConfig.databaseId,
    };
  } catch (err: any) {
    console.warn('[Firestore Connection Check Failed]', err?.message || err);
    return {
      ok: false,
      engine: 'Google Cloud Firestore via Firebase Admin SDK',
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
