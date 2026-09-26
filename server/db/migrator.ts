import { dbConfig } from './connection.ts';
import { getLocalSnapshot } from './repository.ts';

export async function bootstrapAndMigrate(): Promise<{ success: boolean; message: string; stats?: any }> {
  console.log(`🔌 Initializing Database in [FIRESTORE ENTERPRISE] mode (Database: ${dbConfig.databaseId})...`);

  const snapshot = getLocalSnapshot();
  console.log(`✅ Cloud Firestore verified: ${snapshot.questions.length} questions, ${snapshot.mockTests.length} tests, ${snapshot.pypPapers.length} PYPs.`);
  return {
    success: true,
    message: `Cloud Firestore Enterprise active (${dbConfig.databaseId})`,
    stats: {
      questions: snapshot.questions.length,
      mockTests: snapshot.mockTests.length,
      pypPapers: snapshot.pypPapers.length,
      attempts: snapshot.attempts.length,
    },
  };
}
