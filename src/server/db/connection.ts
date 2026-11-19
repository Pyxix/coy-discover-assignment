import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { seedDatabase } from './seed';

let dbInstance: DatabaseSync | null = null;
let currentDbPath: string | null = null;

export function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      photo TEXT NOT NULL,
      bio TEXT NOT NULL,
      location TEXT NOT NULL,
      interests TEXT NOT NULL,
      display_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incoming_likes (
      profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS swipes (
      profile_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      profile_id TEXT NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
      matched_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_profiles_display_order ON profiles(display_order);
    CREATE INDEX IF NOT EXISTS idx_swipes_action ON swipes(action);
    CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON matches(matched_at DESC);
  `);
}

export function getDatabase(): DatabaseSync {
  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/coy.db');

  // If path changed or instance not initialized yet
  if (!dbInstance || currentDbPath !== dbPath) {
    if (dbInstance) {
      try {
        dbInstance.close();
      } catch {
        // ignore close error on previous db
      }
    }

    if (dbPath !== ':memory:') {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON;');
    if (dbPath !== ':memory:') {
      try {
        db.exec('PRAGMA journal_mode = WAL;');
      } catch {
        // WAL might fail in some virtual file systems, non-fatal
      }
    }

    initSchema(db);
    seedDatabase(db, false);

    dbInstance = db;
    currentDbPath = dbPath;
  }

  return dbInstance;
}

/**
 * Runs a function inside an immediate SQLite transaction.
 */
export function runInTransaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // rollback may fail if already aborted
    }
    throw err;
  }
}

/**
 * Closes the current database connection (useful for isolated tests).
 */
export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
    currentDbPath = null;
  }
}
