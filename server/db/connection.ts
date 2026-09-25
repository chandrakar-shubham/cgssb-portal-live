import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export interface DbConfig {
  mode: 'mysql' | 'json';
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  connectionLimit: number;
}

export const dbConfig: DbConfig = {
  mode: (process.env.DATABASE_MODE === 'mysql' ? 'mysql' : 'json'),
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'cgssb_db',
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 30),
};

let pool: mysql.Pool | null = null;
let isMysqlConnected = false;

export function getPool(): mysql.Pool | null {
  if (dbConfig.mode !== 'mysql') return null;
  if (!pool) {
    try {
      pool = mysql.createPool({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        waitForConnections: true,
        connectionLimit: dbConfig.connectionLimit,
        queueLimit: 0,
        charset: 'utf8mb4',
        decimalNumbers: true,
      });
    } catch (err) {
      console.warn('⚠️ Could not initialize MySQL pool:', err);
      pool = null;
    }
  }
  return pool;
}

export async function testConnection(): Promise<{ ok: boolean; message: string; database?: string }> {
  if (dbConfig.mode !== 'mysql') {
    return { ok: true, message: 'Running in Local JSON Storage mode' };
  }

  try {
    const currentPool = getPool();
    if (!currentPool) {
      return { ok: false, message: 'MySQL pool is not initialized' };
    }
    const [rows] = await currentPool.query('SELECT 1 as val');
    isMysqlConnected = true;
    return { ok: true, message: 'MySQL connection established successfully', database: dbConfig.database };
  } catch (err: any) {
    isMysqlConnected = false;
    return { ok: false, message: `MySQL connection failed: ${err.message}` };
  }
}

export function isMysqlActive(): boolean {
  return dbConfig.mode === 'mysql' && isMysqlConnected;
}
