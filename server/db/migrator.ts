import { dbConfig } from './connection.ts';
import { getLocalSnapshot, syncWithFirestore } from './repository.ts';

export async function bootstrapAndMigrate(): Promise<{ success: boolean; message: string; stats?: any }> {
  console.log(`🔌 Initializing Database in [FIRESTORE ENTERPRISE] mode (Database: ${dbConfig.databaseId})...`);

  // Perform two-way sync with live Cloud Firestore
  const syncResults = await syncWithFirestore();
  const snapshot = getLocalSnapshot();

  console.log(
    `✅ Cloud Firestore synchronized: ${syncResults.syncedQuestions} questions, ` +
    `${syncResults.syncedTests} tests, ${snapshot.pypPapers.length} PYPs, ${syncResults.syncedAttempts} attempts.`
  );

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
