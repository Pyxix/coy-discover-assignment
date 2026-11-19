import { DiscoverRepository } from '../repositories/discoverRepository';
import { PublicProfile, ConfirmedMatch, SwipeAction, SwipeResponse } from '../../types/discover';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DiscoverService {
  private repository: DiscoverRepository;

  constructor(repository?: DiscoverRepository) {
    this.repository = repository || new DiscoverRepository();
  }

  /**
   * Returns unswiped profiles with strict public fields only.
   */
  getFeed(): PublicProfile[] {
    return this.repository.getUnswipedProfiles();
  }

  /**
   * Processes a swipe action atomically.
   */
  swipe(profileId: string, action: SwipeAction): SwipeResponse {
    try {
      const result = this.repository.recordSwipe(profileId, action);
      return {
        swiped: true,
        action,
        matched: result.matched,
        match: result.match,
      };
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message === 'PROFILE_NOT_FOUND') {
          throw new NotFoundError(`Profile with ID '${profileId}' not found`);
        }
        if (err.message === 'ALREADY_SWIPED') {
          throw new ConflictError(`Profile '${profileId}' has already been swiped on`);
        }
      }
      throw err;
    }
  }

  /**
   * Returns all confirmed mutual matches, ordered most recent first.
   */
  getMatches(): ConfirmedMatch[] {
    return this.repository.getConfirmedMatches();
  }

  /**
   * Resets demo swipes and matches for reviewer evaluation.
   */
  resetDemo(): { success: boolean; message: string } {
    this.repository.resetDemo();
    return {
      success: true,
      message: 'Demo state reset successfully. All profiles restored to unswiped feed.',
    };
  }
}
