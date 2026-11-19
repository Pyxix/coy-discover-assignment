'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, RotateCcw, Sparkles, MessageCircle, AlertCircle } from 'lucide-react';
import { ProfileCard } from './ProfileCard';
import { PublicProfile, SwipeAction, ConfirmedMatch } from '../types/discover';

interface SwipeDeckProps {
  profiles: PublicProfile[];
  loading: boolean;
  onSwipeAction: (profileId: string, action: SwipeAction) => Promise<{
    matched: boolean;
    match: ConfirmedMatch | null;
  }>;
  onResetDemo: () => Promise<void>;
  onViewMatches: () => void;
  isModalOpen?: boolean;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  profiles,
  loading,
  onSwipeAction,
  onResetDemo,
  onViewMatches,
  isModalOpen = false,
}) => {
  const [deck, setDeck] = useState<PublicProfile[]>([]);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<SwipeAction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync incoming feed profiles
  useEffect(() => {
    setDeck(profiles);
  }, [profiles]);

  const currentProfile = deck[0] || null;
  const nextProfile = deck[1] || null;

  // Perform swipe handler
  const handleSwipe = useCallback(
    async (action: SwipeAction) => {
      if (!currentProfile || isSwiping) return;

      setIsSwiping(true);
      setSwipeDirection(action);
      setErrorMessage(null);

      const targetId = currentProfile.id;

      try {
        const response = await onSwipeAction(targetId, action);
        // Remove swiped card from local deck state
        setDeck((prev) => prev.slice(1));
      } catch (err) {
        console.error('Failed to swipe:', err);
        setErrorMessage('Failed to submit swipe. Please try again.');
      } finally {
        setIsSwiping(false);
        setSwipeDirection(null);
      }
    },
    [currentProfile, isSwiping, onSwipeAction]
  );

  // Keyboard shortcut support: ArrowLeft = Pass, ArrowRight = Like
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen || isSwiping || !currentProfile) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipe('pass');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipe('like');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSwipe, isModalOpen, isSwiping, currentProfile]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-coy-primary/30 border-t-coy-primary rounded-full animate-spin mb-3" />
        <p className="text-sm text-neutral-400">Discovering people nearby...</p>
      </div>
    );
  }

  // Empty State: All profiles exhausted
  if (!currentProfile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-coy-surface border border-coy-border flex items-center justify-center mb-4 text-neutral-400 shadow-inner">
          <Sparkles size={36} className="text-coy-primary" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">You&apos;re All Caught Up!</h3>
        <p className="text-sm text-neutral-400 mt-2 max-w-[280px] leading-relaxed">
          You&apos;ve swiped through all available profiles in your area. Check your matches or replay the demo.
        </p>

        <div className="flex flex-col gap-3 mt-7 w-full max-w-[240px]">
          <button
            type="button"
            onClick={onViewMatches}
            className="py-3 px-5 rounded-2xl bg-gradient-to-r from-coy-primary to-rose-500 hover:brightness-110 active:scale-95 transition-all text-sm font-bold text-white shadow-lg shadow-coy-primary/20 flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
            View Matches
          </button>

          <button
            type="button"
            onClick={onResetDemo}
            className="py-2.5 px-4 rounded-xl bg-coy-surface hover:bg-coy-border active:scale-95 transition-all text-xs font-semibold text-neutral-300 border border-coy-border flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={13} />
            Reset Demo (Replay)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 max-h-full">
      {/* Error Toast if Network Fails */}
      {errorMessage && (
        <div className="w-full mb-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Card Stack Container */}
      <div className="relative w-full aspect-[3/4.2] max-h-[520px] flex-1">
        {/* Depth Preview Card Behind */}
        {nextProfile && (
          <ProfileCard
            key={nextProfile.id}
            profile={nextProfile}
            isFrontCard={false}
          />
        )}

        {/* Active Front Card */}
        <AnimatePresence>
          <ProfileCard
            key={currentProfile.id}
            profile={currentProfile}
            isFrontCard={true}
            onSwipe={handleSwipe}
            disabled={isSwiping}
          />
        </AnimatePresence>
      </div>

      {/* Tactile Bottom Action Buttons */}
      <div className="w-full flex items-center justify-center gap-8 pt-4 pb-2 z-20">
        {/* Pass Button (✕) */}
        <button
          type="button"
          onClick={() => handleSwipe('pass')}
          disabled={isSwiping}
          aria-label="Pass profile (ArrowLeft)"
          className="group w-16 h-16 rounded-full bg-coy-card border-2 border-rose-500/30 hover:border-rose-500 active:scale-90 transition-all flex items-center justify-center shadow-float hover:shadow-rose-950/40 disabled:opacity-50 disabled:pointer-events-none"
        >
          <X
            size={30}
            className="text-rose-400 group-hover:scale-110 transition-transform stroke-[2.5]"
          />
        </button>

        {/* Small Discreet Reset Demo Helper */}
        <button
          type="button"
          onClick={onResetDemo}
          title="Reset demo swipes (testing helper)"
          aria-label="Reset demo swipes"
          className="w-10 h-10 rounded-full bg-coy-surface hover:bg-coy-border active:scale-90 transition-all flex items-center justify-center text-neutral-400 hover:text-white border border-coy-border"
        >
          <RotateCcw size={16} />
        </button>

        {/* Like Button (♥) */}
        <button
          type="button"
          onClick={() => handleSwipe('like')}
          disabled={isSwiping}
          aria-label="Like profile (ArrowRight)"
          className="group w-16 h-16 rounded-full bg-gradient-to-tr from-coy-primary to-rose-500 hover:brightness-110 active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-coy-primary/30 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Heart
            size={30}
            className="text-white fill-white group-hover:scale-110 transition-transform"
          />
        </button>
      </div>

      {/* Subtle Keyboard Navigation Hint on Desktop */}
      <p className="text-[11px] text-neutral-500 hidden sm:block text-center mt-1">
        Press <span className="text-neutral-400 font-mono">← Left</span> to Pass · <span className="text-neutral-400 font-mono">Right →</span> to Like
      </p>
    </div>
  );
};
