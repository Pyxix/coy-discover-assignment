import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { NextRequest } from 'next/server';
import { initSchema } from '../src/server/db/connection';
import { seedDatabase } from '../src/server/db/seed';
import { DiscoverRepository } from '../src/server/repositories/discoverRepository';
import { DiscoverService } from '../src/server/services/discoverService';
import { handleGetFeed, handlePostSwipe, handleGetMatches, handlePostResetDemo } from '../src/server/http/handlers';

describe('Coy Discover Tab: Comprehensive Suite', () => {
  let db: DatabaseSync;
  let repository: DiscoverRepository;
  let service: DiscoverService;

  beforeEach(() => {
    // In-memory isolated database for each test
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    initSchema(db);
    seedDatabase(db, true);

    repository = new DiscoverRepository(db);
    service = new DiscoverService(repository);
  });

  afterEach(() => {
    try {
      db.close();
    } catch {
      // ignore
    }
  });

  describe('1. Seeding & Feed Integrity', () => {
    it('seeds at least 30 realistic profiles with all required fields', () => {
      const feed = service.getFeed();
      expect(feed.length).toBeGreaterThanOrEqual(30);

      for (const profile of feed) {
        expect(profile.id).toBeDefined();
        expect(typeof profile.id).toBe('string');
        expect(profile.name).toBeDefined();
        expect(profile.name.length).toBeGreaterThan(0);
        expect(typeof profile.age).toBe('number');
        expect(profile.age).toBeGreaterThanOrEqual(18);
        expect(profile.photo).toBeDefined();
        expect(profile.photo.length).toBeGreaterThan(0);
        expect(profile.bio).toBeDefined();
        expect(profile.bio.length).toBeGreaterThan(0);
        expect(profile.location).toBeDefined();
        expect(profile.location.length).toBeGreaterThan(0);
        expect(Array.isArray(profile.interests)).toBe(true);
        expect(profile.interests.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('returns all unswiped profiles initially in deterministic order', () => {
      const feed = service.getFeed();
      expect(feed[0].id).toBe('prof_maya_chen');
      expect(feed[1].id).toBe('prof_liam_vasquez');
    });
  });

  describe('2. Swipe & Non-Reappearance Guarantee', () => {
    it('removes passed profile from subsequent feed results', () => {
      const initialFeed = service.getFeed();
      const firstProfile = initialFeed[0];

      const swipeResult = service.swipe(firstProfile.id, 'pass');
      expect(swipeResult.swiped).toBe(true);
      expect(swipeResult.action).toBe('pass');
      expect(swipeResult.matched).toBe(false);

      const nextFeed = service.getFeed();
      expect(nextFeed.length).toBe(initialFeed.length - 1);
      expect(nextFeed.some(p => p.id === firstProfile.id)).toBe(false);
    });

    it('removes liked profile from subsequent feed results', () => {
      const initialFeed = service.getFeed();
      const firstProfile = initialFeed[0];

      const swipeResult = service.swipe(firstProfile.id, 'like');
      expect(swipeResult.swiped).toBe(true);
      expect(swipeResult.action).toBe('like');

      const nextFeed = service.getFeed();
      expect(nextFeed.length).toBe(initialFeed.length - 1);
      expect(nextFeed.some(p => p.id === firstProfile.id)).toBe(false);
    });

    it('persists exclusion of swiped profiles across new repository instances', () => {
      const initialFeed = service.getFeed();
      const targetId = initialFeed[0].id;

      service.swipe(targetId, 'like');

      // Create completely new repository & service on same underlying db
      const newRepo = new DiscoverRepository(db);
      const newService = new DiscoverService(newRepo);

      const feedAfterReload = newService.getFeed();
      expect(feedAfterReload.some(p => p.id === targetId)).toBe(false);
    });
  });

  describe('3. Mutual Matching Logic', () => {
    it('creates a match when liking a profile with an incoming like', () => {
      // prof_liam_vasquez is pre-seeded with incoming like
      const result = service.swipe('prof_liam_vasquez', 'like');

      expect(result.swiped).toBe(true);
      expect(result.action).toBe('like');
      expect(result.matched).toBe(true);
      expect(result.match).not.toBeNull();
      expect(result.match?.profileId).toBe('prof_liam_vasquez');
      expect(result.match?.profile.name).toBe('Liam Vasquez');

      const matches = service.getMatches();
      expect(matches.length).toBe(1);
      expect(matches[0].profileId).toBe('prof_liam_vasquez');
    });

    it('does NOT create a match when liking a profile without an incoming like', () => {
      // prof_maya_chen does NOT have incoming like
      const result = service.swipe('prof_maya_chen', 'like');

      expect(result.swiped).toBe(true);
      expect(result.action).toBe('like');
      expect(result.matched).toBe(false);
      expect(result.match).toBeNull();

      const matches = service.getMatches();
      expect(matches.length).toBe(0);
    });

    it('does NOT create a match when passing a profile that liked the user', () => {
      // prof_liam_vasquez has incoming like, but user passes
      const result = service.swipe('prof_liam_vasquez', 'pass');

      expect(result.swiped).toBe(true);
      expect(result.action).toBe('pass');
      expect(result.matched).toBe(false);
      expect(result.match).toBeNull();

      const matches = service.getMatches();
      expect(matches.length).toBe(0);
    });
  });

  describe('4. Privacy Edge Cases (CRITICAL)', () => {
    it('GET /feed contains zero private keys or hints of incoming likes', async () => {
      const response = await handleGetFeed(service);
      expect(response.status).toBe(200);

      const feed = await response.json();
      expect(Array.isArray(feed)).toBe(true);

      const forbiddenKeys = [
        'incoming',
        'hasLiked',
        'hasLikedMe',
        'liked',
        'likedCurrentUser',
        'isMatchCandidate',
        'mutual',
        'admirer',
      ];

      function assertNoForbiddenKeys(obj: unknown) {
        if (!obj || typeof obj !== 'object') return;

        for (const [key, val] of Object.entries(obj)) {
          for (const forbidden of forbiddenKeys) {
            expect(key.toLowerCase()).not.toContain(forbidden.toLowerCase());
          }
          if (typeof val === 'object') {
            assertNoForbiddenKeys(val);
          }
        }
      }

      assertNoForbiddenKeys(feed);
    });

    it('POST /swipe returns identical response shape for pass on incoming-like vs normal profile', async () => {
      // prof_maya_chen has NO incoming like
      const req1 = new NextRequest('http://localhost/swipe', {
        method: 'POST',
        body: JSON.stringify({ profileId: 'prof_maya_chen', action: 'pass' }),
      });
      const res1 = await handlePostSwipe(req1, service);
      const data1 = await res1.json();

      // prof_liam_vasquez HAS incoming like
      const req2 = new NextRequest('http://localhost/swipe', {
        method: 'POST',
        body: JSON.stringify({ profileId: 'prof_liam_vasquez', action: 'pass' }),
      });
      const res2 = await handlePostSwipe(req2, service);
      const data2 = await res2.json();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      expect(data1).toEqual({
        swiped: true,
        action: 'pass',
        matched: false,
        match: null,
      });

      expect(data2).toEqual({
        swiped: true,
        action: 'pass',
        matched: false,
        match: null,
      });

      expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort());
    });

    it('rejects duplicate swipes with 409 Conflict (anti-probing guard)', async () => {
      // Pass on profile with incoming like
      const req1 = new NextRequest('http://localhost/swipe', {
        method: 'POST',
        body: JSON.stringify({ profileId: 'prof_liam_vasquez', action: 'pass' }),
      });
      const res1 = await handlePostSwipe(req1, service);
      expect(res1.status).toBe(200);

      // Attempt second swipe with 'like' to probe if they had liked
      const req2 = new NextRequest('http://localhost/swipe', {
        method: 'POST',
        body: JSON.stringify({ profileId: 'prof_liam_vasquez', action: 'like' }),
      });
      const res2 = await handlePostSwipe(req2, service);
      expect(res2.status).toBe(409);

      const errData = await res2.json();
      expect(errData.error).toContain('already been swiped on');
    });
  });

  describe('5. Input Validation & Edge Cases', () => {
    it('returns 400 Bad Request for missing profileId or invalid action', async () => {
      const invalidReq1 = new NextRequest('http://localhost/swipe', {
        method: 'POST',
        body: JSON.stringify({ action: 'like' }),
      });
      const res1 = await handlePostSwipe(invalidReq1, service);
      expect(res1.status).toBe(400);

      const invalidReq2 = new NextRequest('http://localhost/swipe', {
        method: 'POST',
        body: JSON.stringify({ profileId: 'prof_maya_chen', action: 'superlike' }),
      });
      const res2 = await handlePostSwipe(invalidReq2, service);
      expect(res2.status).toBe(400);
    });

    it('returns 400 Bad Request on malformed JSON', async () => {
      const malformedReq = new NextRequest('http://localhost/swipe', {
        method: 'POST',
        body: 'invalid-json{',
      });
      const res = await handlePostSwipe(malformedReq, service);
      expect(res.status).toBe(400);
    });

    it('returns 404 Not Found for non-existent profileId', async () => {
      const req = new NextRequest('http://localhost/swipe', {
        method: 'POST',
        body: JSON.stringify({ profileId: 'prof_ghost_9999', action: 'like' }),
      });
      const res = await handlePostSwipe(req, service);
      expect(res.status).toBe(404);
    });

    it('exhausting the feed results in an empty array cleanly', () => {
      const allProfiles = service.getFeed();
      for (const p of allProfiles) {
        service.swipe(p.id, 'pass');
      }

      const emptyFeed = service.getFeed();
      expect(emptyFeed).toEqual([]);
    });

    it('resetDemo restores unswiped feed and preserves seeded incoming likes', async () => {
      // Swipe on Liam (incoming like) and Maya
      service.swipe('prof_liam_vasquez', 'like');
      service.swipe('prof_maya_chen', 'pass');

      expect(service.getMatches().length).toBe(1);
      const feedBeforeReset = service.getFeed();

      // Reset demo
      const resetRes = await handlePostResetDemo(service);
      expect(resetRes.status).toBe(200);

      const feedAfterReset = service.getFeed();
      expect(feedAfterReset.length).toBeGreaterThan(feedBeforeReset.length);
      expect(service.getMatches().length).toBe(0);

      // Re-swipe on Liam and verify incoming like was preserved
      const reSwipe = service.swipe('prof_liam_vasquez', 'like');
      expect(reSwipe.matched).toBe(true);
      expect(service.getMatches().length).toBe(1);
    });
  });
});
