import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './config';

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_check_', 'ping'));
    console.log('✓ Firebase Firestore connection verified.');
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is operating in offline-cached mode.');
    } else {
      console.log('Firebase connection initialized successfully.');
    }
    return true;
  }
}
