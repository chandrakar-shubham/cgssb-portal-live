import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';

const adminSecret = defineSecret('ADMIN_SECRET');

setGlobalOptions({
  region: 'asia-south1',
  maxInstances: 100,
});

let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    process.env.FIREBASE_FUNCTIONS = 'true';
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_MODE = 'firestore';
    process.env.FIRESTORE_DATABASE_ID =
      process.env.FIRESTORE_DATABASE_ID ||
      'ai-studio-cgssbtest-ed944dbb-7a88-46c1-8fe0-4ad38fcd1089';
    process.env.FIREBASE_PROJECT_ID =
      process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0783153446';
    process.env.ALLOWED_ORIGINS =
      process.env.ALLOWED_ORIGINS ||
      'https://cgtest.in,https://www.cgtest.in';
    process.env.ADMIN_SECRET = adminSecret.value();

    const { startServer } = await import('./server.ts');
    appPromise = startServer({ listen: false });
  }
  return appPromise;
}

export const api = onRequest(
  {
    secrets: [adminSecret],
    concurrency: 80,
    timeoutSeconds: 60,
  },
  async (req, res) => {
    try {
      const app = await getApp();
      return app(req, res);
    } catch (error: any) {
      console.error('Firebase API initialization failed:', error);
      return res.status(503).json({
        success: false,
        error: 'API initialization failed',
      });
    }
  }
);
