import { dbConfig } from './connection.ts';
import { getRepositoryStats } from './repository.ts';

export async function bootstrapAndMigrate(): Promise<{ success: boolean; message: string; stats?: any }> {
  console.log(`🔌 Initializing Database in [FIRESTORE ENTERPRISE] mode (Database: ${dbConfig.databaseId})...`);

  // Firestore is the authoritative source of truth. Read live counts only;
  // do not perform a two-way sync into process-local state during startup.
  const stats = await getRepositoryStats();

  console.log(
    `✅ Cloud Firestore verified: ${stats.questions} questions, ` +
    `${stats.mockTests} tests, ${stats.pypPapers} PYPs, ${stats.attempts} attempts.`
  );

  return {
    success: true,
    message: `Cloud Firestore Enterprise active (${dbConfig.databaseId})`,
    stats,
  };
}
