import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';

export async function testConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timeout')), 3500)
    );
    await Promise.race([
      getDoc(doc(db, '_connection_check_', 'ping')),
      timeoutPromise
    ]);
    return true;
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('offline') || error.message.includes('timeout'))) {
      // Graceful offline fallback
      return false;
    }
    return true;
  }
}
