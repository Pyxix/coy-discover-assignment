'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Calendar, Heart, X, MessageSquare, ArrowLeft } from 'lucide-react';
import { ConfirmedMatch, PublicProfile } from '../types/discover';

interface MatchesListProps {
  matches: ConfirmedMatch[];
  loading: boolean;
  onRefresh: () => void;
  onSwitchToSwipe: () => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}

export const MatchesList: React.FC<MatchesListProps> = ({
  matches,
  loading,
  onRefresh,
  onSwitchToSwipe,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<ConfirmedMatch | null>(null);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-coy-primary/30 border-t-coy-primary rounded-full animate-spin mb-3" />
        <p className="text-sm text-neutral-400">Loading your matches...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-coy-surface border border-coy-border flex items-center justify-center mb-4 text-coy-primary/50 shadow-inner">
          <Heart size={36} className="text-coy-primary" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">No matches yet</h3>
        <p className="text-sm text-neutral-400 mt-2 max-w-[280px] leading-relaxed">
          Mutual matches will appear here when someone you liked also likes your profile.
        </p>
        <button
          type="button"
          onClick={onSwitchToSwipe}
          className="mt-6 py-3 px-6 rounded-2xl bg-gradient-to-r from-coy-primary to-rose-500 hover:brightness-110 active:scale-95 transition-all text-sm font-bold text-white shadow-lg shadow-coy-primary/20 flex items-center gap-2"
        >
          <Sparkles size={16} />
          Start Swiping
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {/* Matches Grid / List */}
      <div className="grid grid-cols-2 gap-3 pb-6">
        {matches.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMatch(item)}
            className="group relative rounded-2xl overflow-hidden bg-coy-surface border border-coy-border shadow-md cursor-pointer transition-colors hover:border-coy-primary/40 flex flex-col"
          >
            {/* Photo with Overlay */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/30">
              <img
                src={item.profile.photo}
                alt={item.profile.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Timestamp Badge */}
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-neutral-300 flex items-center gap-1">
                <Calendar size={10} className="text-coy-primary" />
                {formatRelativeTime(item.matchedAt)}
              </div>

              {/* Card Bottom Identity */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <div className="flex items-baseline gap-1.5">
                  <h4 className="text-base font-bold text-white truncate">{item.profile.name}</h4>
                  <span className="text-sm font-semibold text-neutral-300">{item.profile.age}</span>
                </div>
                <p className="text-[11px] text-neutral-300 truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-coy-primary flex-shrink-0" />
                  {item.profile.location}
                </p>
              </div>
            </div>

            {/* Interest tag snippet */}
            <div className="p-2.5 bg-coy-card flex-1 flex flex-col justify-between">
              <div className="flex flex-wrap gap-1">
                {item.profile.interests.slice(0, 2).map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-neutral-300 border border-white/5 truncate max-w-full"
                  >
                    {interest}
                  </span>
                ))}
                {item.profile.interests.length > 2 && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-neutral-400">
                    +{item.profile.interests.length - 2}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Match Detail Modal Drawer */}
      <AnimatePresence>
        {selectedMatch && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-[430px] max-h-[85vh] rounded-t-[32px] sm:rounded-[32px] bg-coy-card border border-coy-border shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white"
                aria-label="Close detail view"
              >
                <X size={18} />
              </button>

              {/* Photo Banner */}
              <div className="relative h-64 w-full bg-black/40">
                <img
                  src={selectedMatch.profile.photo}
                  alt={selectedMatch.profile.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-coy-card via-transparent to-transparent" />
              </div>

              {/* Scrollable details */}
              <div className="p-6 overflow-y-auto space-y-4 -mt-8 relative z-10">
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-white">{selectedMatch.profile.name}</h3>
                    <span className="text-2xl font-medium text-neutral-300">{selectedMatch.profile.age}</span>
                  </div>
                  <p className="text-sm text-neutral-300 flex items-center gap-1.5 mt-1 font-medium">
                    <MapPin size={15} className="text-coy-primary" />
                    {selectedMatch.profile.location}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                    <Calendar size={13} className="text-emerald-400" />
                    Matched {formatRelativeTime(selectedMatch.matchedAt)}
                  </p>
                </div>

                <div className="border-t border-coy-border pt-3">
                  <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">About</h5>
                  <p className="text-sm text-neutral-200 leading-relaxed">{selectedMatch.profile.bio}</p>
                </div>

                <div className="border-t border-coy-border pt-3">
                  <h5 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Interests</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMatch.profile.interests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-neutral-200 border border-white/10"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => alert(`Starting conversation with ${selectedMatch.profile.name}...`)}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-coy-primary to-rose-500 font-bold text-white text-sm shadow-lg shadow-coy-primary/25 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    <MessageSquare size={17} />
                    Message {selectedMatch.profile.name}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
