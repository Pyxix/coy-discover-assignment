import { DatabaseSync } from 'node:sqlite';
import { SEED_PROFILES } from './seedData';

/**
 * Idempotently seeds the profiles and incoming_likes tables.
 * @param db DatabaseSync instance
 * @param force If true, clears existing tables before seeding
 */
export function seedDatabase(db: DatabaseSync, force = false): void {
  if (force) {
    db.exec('DELETE FROM matches;');
    db.exec('DELETE FROM swipes;');
    db.exec('DELETE FROM incoming_likes;');
    db.exec('DELETE FROM profiles;');
  }

  const countRow = db.prepare('SELECT COUNT(*) as count FROM profiles;').get() as { count: number | bigint };
  const count = Number(countRow.count);

  if (count > 0 && !force) {
    return; // Already seeded
  }

  const insertProfile = db.prepare(`
    INSERT INTO profiles (id, name, age, photo, bio, location, interests, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
  `);

  const insertIncomingLike = db.prepare(`
    INSERT INTO incoming_likes (profile_id, created_at)
    VALUES (?, ?);
  `);

  const now = new Date().toISOString();

  // Seed inside an immediate transaction for atomic write
  db.exec('BEGIN IMMEDIATE;');
  try {
    for (const profile of SEED_PROFILES) {
      insertProfile.run(
        profile.id,
        profile.name,
        profile.age,
        profile.photo,
        profile.bio,
        profile.location,
        JSON.stringify(profile.interests),
        profile.displayOrder
      );

      if (profile.hasIncomingLike) {
        insertIncomingLike.run(profile.id, now);
      }
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

/**
 * Resets swipes and matches for reviewer demo replay while preserving
 * seeded profiles and incoming likes.
 */
export function resetDemoState(db: DatabaseSync): void {
  db.exec('BEGIN IMMEDIATE;');
  try {
    db.exec('DELETE FROM matches;');
    db.exec('DELETE FROM swipes;');
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
