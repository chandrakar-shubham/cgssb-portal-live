import fs from 'fs';
import path from 'path';
import { getPool, isMysqlActive, testConnection, dbConfig } from './connection.ts';
import {
  saveQuestion,
  saveMockTest,
  savePypPaper,
  saveTestAttempt,
  getLocalSnapshot,
} from './repository.ts';

export async function bootstrapAndMigrate(): Promise<{ success: boolean; message: string; stats?: any }> {
  console.log(`🔌 Initializing Database in [${dbConfig.mode.toUpperCase()}] mode...`);

  if (dbConfig.mode !== 'mysql') {
    const snapshot = getLocalSnapshot();
    console.log(`✅ Running on local JSON persistence: ${snapshot.questions.length} Qs, ${snapshot.mockTests.length} tests, ${snapshot.pypPapers.length} PYPs.`);
    return {
      success: true,
      message: 'Local JSON persistence active',
      stats: {
        questions: snapshot.questions.length,
        mockTests: snapshot.mockTests.length,
        pypPapers: snapshot.pypPapers.length,
        attempts: snapshot.attempts.length,
      },
    };
  }

  const connTest = await testConnection();
  if (!connTest.ok) {
    console.warn(`⚠️ MySQL Connection could not be established (${connTest.message}). Falling back to local JSON database.`);
    const snapshot = getLocalSnapshot();
    return {
      success: false,
      message: connTest.message,
      stats: {
        questions: snapshot.questions.length,
        mockTests: snapshot.mockTests.length,
        pypPapers: snapshot.pypPapers.length,
      },
    };
  }

  const pool = getPool();
  if (!pool) {
    return { success: false, message: 'Pool is null' };
  }

  try {
    // 1. Run DDL schema
    const schemaPath = path.join(process.cwd(), 'server', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const ddl = fs.readFileSync(schemaPath, 'utf-8');
      const statements = ddl
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        await pool.query(stmt);
      }
      console.log('✅ MySQL schema tables verified/created successfully.');
    }

    // 2. Check if database already has questions
    const [[qCountRes]]: any = await pool.query('SELECT COUNT(*) as count FROM questions');
    const existingCount = Number(qCountRes.count) || 0;

    const snapshot = getLocalSnapshot();
    let migratedQuestions = 0;
    let migratedTests = 0;
    let migratedPyps = 0;

    if (existingCount === 0) {
      console.log(`📦 Seeding MySQL database from JSON snapshot (${snapshot.questions.length} questions, ${snapshot.mockTests.length} tests)...`);
      
      for (const q of snapshot.questions) {
        await saveQuestion(q);
        migratedQuestions++;
      }

      for (const t of snapshot.mockTests) {
        await saveMockTest(t);
        migratedTests++;
      }

      for (const p of snapshot.pypPapers) {
        await savePypPaper(p);
        migratedPyps++;
      }

      for (const a of snapshot.attempts) {
        await saveTestAttempt(a);
      }

      console.log(`🎉 Migration complete: ${migratedQuestions} questions, ${migratedTests} tests, ${migratedPyps} PYPs seeded into MySQL.`);
    } else {
      console.log(`✅ MySQL database already contains ${existingCount} questions.`);
    }

    return {
      success: true,
      message: 'MySQL database connected and ready',
      stats: {
        questions: existingCount || migratedQuestions,
        mockTests: migratedTests || snapshot.mockTests.length,
        pypPapers: migratedPyps || snapshot.pypPapers.length,
      },
    };
  } catch (err: any) {
    console.error('❌ Failed during MySQL bootstrap/migration:', err);
    return { success: false, error: err.message } as any;
  }
}
