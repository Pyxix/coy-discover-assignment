import { DatabaseSync } from 'node:sqlite';
import { getDatabase, runInTransaction } from '../db/connection';
import { PublicProfile, ConfirmedMatch, SwipeAction } from '../../types/discover';

export interface DbProfileRow {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string; // JSON string in DB
  display_order: number;
}

export interface DbSwipeRow {
  profile_id: string;
  action: SwipeAction;
  created_at: string;
}

export interface DbMatchRow {
  id: string;
  profile_id: string;
  matched_at: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string;
}

export class DiscoverRepository {
  private db: DatabaseSync;

  constructor(db?: DatabaseSync) {
    this.db = db || getDatabase();
  }

  /**
   * Fetches unswiped profiles ordered by display_order.
   * STRICT PRIVACY GUARANTEE: Never joins or inspects incoming_likes.
   */
  getUnswipedProfiles(): PublicProfile[] {
    const stmt = this.db.prepare(`
      SELECT p.id, p.name, p.age, p.photo, p.bio, p.location, p.interests
      FROM profiles p
      LEFT JOIN swipes s ON p.id = s.profile_id
      WHERE s.profile_id IS NULL
      ORDER BY p.display_order ASC;
    `);

    const rows = stmt.all() as unknown as Omit<DbProfileRow, 'display_order'>[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      age: Number(row.age),
      photo: row.photo,
      bio: row.bio,
      location: row.location,
      interests: JSON.parse(row.interests),
    }));
  }

  /**
   * Fetches single profile by ID (public projection).
   */
  getProfileById(profileId: string): PublicProfile | null {
    const stmt = this.db.prepare(`
      SELECT id, name, age, photo, bio, location, interests
      FROM profiles
      WHERE id = ?;
    `);

    const row = stmt.get(profileId) as unknown as Omit<DbProfileRow, 'display_order'> | undefined;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      age: Number(row.age),
      photo: row.photo,
      bio: row.bio,
      location: row.location,
      interests: JSON.parse(row.interests),
    };
  }

  /**
   * Checks if a profile has already been swiped on.
   */
  getSwipe(profileId: string): DbSwipeRow | null {
    const stmt = this.db.prepare(`
      SELECT profile_id, action, created_at
      FROM swipes
      WHERE profile_id = ?;
    `);

    const row = stmt.get(profileId) as unknown as DbSwipeRow | undefined;
    return row || null;
  }

  /**
   * Checks strictly on backend if this profile has an incoming like.
   * INTERNAL ONLY: Never exposed to client.
   */
  private checkIncomingLike(profileId: string): boolean {
    const stmt = this.db.prepare(`
      SELECT 1 FROM incoming_likes WHERE profile_id = ? LIMIT 1;
    `);
    const row = stmt.get(profileId);
    return !!row;
  }

  /**
   * Records a swipe action atomically.
   * Enforces uniqueness (409 Conflict if already swiped).
   * Creates a match if and only if action is 'like' and mutual.
   */
  recordSwipe(
    profileId: string,
    action: SwipeAction
  ): {
    matched: boolean;
    match: ConfirmedMatch | null;
  } {
    return runInTransaction(this.db, () => {
      // 1. Verify profile existence
      const profile = this.getProfileById(profileId);
      if (!profile) {
        throw new Error('PROFILE_NOT_FOUND');
      }

      // 2. Anti-Probing Guard: Check if already swiped
      const existingSwipe = this.getSwipe(profileId);
      if (existingSwipe) {
        throw new Error('ALREADY_SWIPED');
      }

      const now = new Date().toISOString();

      // 3. Record swipe atomically
      const insertSwipe = this.db.prepare(`
        INSERT INTO swipes (profile_id, action, created_at)
        VALUES (?, ?, ?);
      `);
      insertSwipe.run(profileId, action, now);

      // 4. Handle mutual match logic
      if (action === 'like') {
        const hasMutualLike = this.checkIncomingLike(profileId);

        if (hasMutualLike) {
          const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          const insertMatch = this.db.prepare(`
            INSERT INTO matches (id, profile_id, matched_at)
            VALUES (?, ?, ?);
          `);
          insertMatch.run(matchId, profileId, now);

          return {
            matched: true,
            match: {
              id: matchId,
              profileId,
              profile,
              matchedAt: now,
            },
          };
        }
      }

      // If action is 'pass' or non-mutual 'like', return matched: false, match: null
      return {
        matched: false,
        match: null,
      };
    });
  }

  /**
   * Fetches all confirmed mutual matches ordered most recent first.
   */
  getConfirmedMatches(): ConfirmedMatch[] {
    const stmt = this.db.prepare(`
      SELECT m.id, m.profile_id, m.matched_at,
             p.name, p.age, p.photo, p.bio, p.location, p.interests
      FROM matches m
      JOIN profiles p ON m.profile_id = p.id
      ORDER BY m.matched_at DESC;
    `);

    const rows = stmt.all() as unknown as DbMatchRow[];

    return rows.map(row => ({
      id: row.id,
      profileId: row.profile_id,
      matchedAt: row.matched_at,
      profile: {
        id: row.profile_id,
        name: row.name,
        age: Number(row.age),
        photo: row.photo,
        bio: row.bio,
        location: row.location,
        interests: JSON.parse(row.interests),
      },
    }));
  }

  /**
   * Resets demo swipes and matches.
   */
  resetDemo(): void {
    runInTransaction(this.db, () => {
      this.db.exec('DELETE FROM matches;');
      this.db.exec('DELETE FROM swipes;');
    });
  }
}
