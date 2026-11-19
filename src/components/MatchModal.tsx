'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import { ConfirmedMatch, LOGGED_IN_USER } from '../types/discover';

interface MatchModalProps {
  match: ConfirmedMatch | null;
  isOpen: boolean;
  onKeepSwiping: () => void;
  onViewMatches: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  match,
  isOpen,
  onKeepSwiping,
  onViewMatches,
}) => {
  if (!isOpen || !match) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-[380px] rounded-[32px] bg-gradient-to-b from-[#1E222D] to-[#12141A] border border-coy-border p-6 text-center shadow-2xl overflow-hidden"
        >
          {/* Ambient Background Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-coy-primary/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-coy-secondary/20 rounded-full blur-3xl pointer-events-none" />

          {/* Celebratory Icon */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coy-primary/15 border border-coy-primary/30 text-coy-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles size={13} />
            Mutual Connection
          </div>

          <h2
            id="match-modal-title"
            className="text-3xl font-black tracking-tight text-white mt-1 bg-gradient-to-r from-white via-neutral-100 to-neutral-300 bg-clip-text"
          >
            It&apos;s a Match!
          </h2>

          <p className="text-sm text-neutral-300 mt-1.5">
            You and <span className="font-semibold text-white">{match.profile.name}</span> liked each other.
          </p>

          {/* Dual Avatars with Connected Heart */}
          <div className="relative flex items-center justify-center my-7">
            {/* Left Avatar: Logged-in User */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative z-10 w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-coy-primary to-rose-400 shadow-xl"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-coy-card border-2 border-[#12141A]">
                <img
                  src={LOGGED_IN_USER.avatar}
                  alt={LOGGED_IN_USER.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Glowing Heart Connector */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.25, 1] }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="absolute z-20 w-11 h-11 rounded-full bg-gradient-to-r from-coy-primary to-rose-500 flex items-center justify-center shadow-lg shadow-coy-primary/40 border-2 border-[#12141A]"
            >
              <Heart size={20} className="fill-white text-white" />
            </motion.div>

            {/* Right Avatar: Matched Profile */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative z-10 w-24 h-24 rounded-full p-1 bg-gradient-to-tl from-coy-secondary to-purple-400 shadow-xl -ml-3"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-coy-card border-2 border-[#12141A]">
                <img
                  src={match.profile.photo}
                  alt={match.profile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 mt-2">
            <button
              type="button"
              onClick={onViewMatches}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-coy-primary to-[#FF3366] hover:brightness-110 active:scale-[0.98] transition-all font-bold text-white text-sm shadow-lg shadow-coy-primary/25 flex items-center justify-center gap-2"
            >
              <MessageCircle size={17} />
              View Matches
            </button>

            <button
              type="button"
              onClick={onKeepSwiping}
              className="w-full py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all font-semibold text-neutral-300 text-sm flex items-center justify-center gap-1.5"
            >
              Keep Swiping
              <ArrowRight size={15} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
