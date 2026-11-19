/**
 * Strict Shared Public TypeScript Types
 * CRITICAL PRIVACY INVARIANT:
 * Zero incoming-like fields, flags, or candidate indicators are exposed here.
 */

export interface PublicProfile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string[];
}

export type SwipeAction = 'like' | 'pass';

export interface SwipeRequest {
  profileId: string;
  action: SwipeAction;
}

export interface ConfirmedMatch {
  id: string;
  profileId: string;
  profile: PublicProfile;
  matchedAt: string;
}

export interface SwipeResponse {
  swiped: boolean;
  action: SwipeAction;
  matched: boolean;
  match: ConfirmedMatch | null;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
}

export const LOGGED_IN_USER: UserProfile = {
  id: "current-user-coy",
  name: "Alex Rivera",
  avatar: "/avatars/user-alex.svg"
};
