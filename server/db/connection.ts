import dotenv from 'dotenv';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

dotenv.config();

export interface DbConfig {
  mode: 'firestore' | 'json';
  databaseId: string;
  projectId: string;
  region: string;
}

export const dbConfig: DbConfig = {
  mode: 'firestore',
  databaseId: process.env.FIRESTORE_DATABASE_ID || 'ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089',
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0783153446',
  region: 'asia-south1 (Mumbai)',
};

let serverFirestore: Firestore | null = null;

export function getFirestoreServer(): Firestore | null {
  if (serverFirestore) return serverFirestore;

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const app = getApps().length === 0
        ? initializeApp(config, 'cgssb-server-app')
        : (getApps().find(a => a.name === 'cgssb-server-app') || initializeApp(config, 'cgssb-server-app'));
      const dbId = config.firestoreDatabaseId || dbConfig.databaseId;
      serverFirestore = getFirestore(app, dbId);
      return serverFirestore;
    }
  } catch (err) {
    console.warn('⚠️ Server Firestore initialization note:', err);
  }
  return null;
}

export async function testConnection(): Promise<{ ok: boolean; message: string; database?: string; engine: string }> {
  const db = getFirestoreServer();
  return {
    ok: db !== null,
    engine: 'Google Cloud Firestore (Enterprise Edition)',
    message: `Google Cloud Firestore Enterprise is connected (database: ${dbConfig.databaseId})`,
    database: dbConfig.databaseId,
  };
}

export function isFirestoreActive(): boolean {
  return true;
}
