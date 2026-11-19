'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Flame, MessageCircleHeart, RotateCcw } from 'lucide-react';
import { SwipeDeck } from './SwipeDeck';
import { MatchesList } from './MatchesList';
import { MatchModal } from './MatchModal';
import { PublicProfile, ConfirmedMatch, SwipeAction } from '../types/discover';

type DiscoverSubTab = 'swipe' | 'matches';

export const DiscoverView: React.FC = () => {
  const [subTab, setSubTab] = useState<DiscoverSubTab>('swipe');
  const [feedProfiles, setFeedProfiles] = useState<PublicProfile[]>([]);
  const [matches, setMatches] = useState<ConfirmedMatch[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [latestMatch, setLatestMatch] = useState<ConfirmedMatch | null>(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  // Fetch unswiped feed
  const loadFeed = useCallback(async () => {
    try {
      setFeedLoading(true);
      const res = await fetch('/feed', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load feed');
      const data = await res.json();
      setFeedProfiles(data);
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Fetch confirmed mutual matches
  const loadMatches = useCallback(async () => {
    try {
      setMatchesLoading(true);
      const res = await fetch('/matches', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load matches');
      const data = await res.json();
      setMatches(data);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
    loadMatches();
  }, [loadFeed, loadMatches]);

  // Handle swipe action on backend
  const handleSwipe = async (
    profileId: string,
    action: SwipeAction
  ): Promise<{ matched: boolean; match: ConfirmedMatch | null }> => {
    const res = await fetch('/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, action }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit swipe');
    }

    const data = await res.json();

    // If mutual match occurred, show celebratory modal and refresh matches list
    if (data.matched && data.match) {
      setLatestMatch(data.match);
      setIsMatchModalOpen(true);
      setMatches((prev) => [data.match, ...prev]);
    }

    return {
      matched: data.matched,
      match: data.match,
    };
  };

  // Reset demo swipes and matches
  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        await Promise.all([loadFeed(), loadMatches()]);
      }
    } catch (err) {
      console.error('Error resetting demo:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-coy-dark relative">
      {/* Discover Top Header with Pill Switcher */}
      <header className="px-5 pt-4 pb-2 border-b border-coy-border/60 flex items-center justify-between z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-coy-primary to-rose-500 flex items-center justify-center shadow-md shadow-coy-primary/20">
            <Flame size={18} className="text-white fill-white" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">Discover</h1>
        </div>

        {/* Clean Segmented Pill Navigation */}
        <div className="flex items-center p-1 rounded-full bg-coy-surface border border-coy-border">
          <button
            type="button"
            onClick={() => setSubTab('swipe')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
              subTab === 'swipe'
                ? 'bg-coy-primary text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Swipe
          </button>

          <button
            type="button"
            onClick={() => {
              setSubTab('matches');
              loadMatches();
            }}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              subTab === 'matches'
                ? 'bg-coy-primary text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Matches
            {matches.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  subTab === 'matches'
                    ? 'bg-white text-coy-primary'
                    : 'bg-coy-primary text-white'
                }`}
              >
                {matches.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Discover Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {subTab === 'swipe' ? (
          <SwipeDeck
            profiles={feedProfiles}
            loading={feedLoading}
            onSwipeAction={handleSwipe}
            onResetDemo={handleResetDemo}
            onViewMatches={() => {
              setSubTab('matches');
              loadMatches();
            }}
            isModalOpen={isMatchModalOpen}
          />
        ) : (
          <MatchesList
            matches={matches}
            loading={matchesLoading}
            onRefresh={loadMatches}
            onSwitchToSwipe={() => setSubTab('swipe')}
          />
        )}
      </main>

      {/* Celebratory Mutual Match Modal */}
      <MatchModal
        match={latestMatch}
        isOpen={isMatchModalOpen}
        onKeepSwiping={() => setIsMatchModalOpen(false)}
        onViewMatches={() => {
          setIsMatchModalOpen(false);
          setSubTab('matches');
          loadMatches();
        }}
      />
    </div>
  );
};
