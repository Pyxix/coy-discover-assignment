'use client';

import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { MapPin, Info, Sparkles, Heart, X, CheckCircle2 } from 'lucide-react';
import { PublicProfile } from '../types/discover';

interface ProfileCardProps {
  profile: PublicProfile;
  isFrontCard: boolean;
  onSwipe?: (direction: 'like' | 'pass') => void;
  disabled?: boolean;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isFrontCard,
  onSwipe,
  disabled = false,
}) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Motion values for smooth drag and tilt
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-16, 16]);

  // Dynamic stamp opacities and scales
  const likeOpacity = useTransform(x, [15, 80], [0, 1]);
  const likeScale = useTransform(x, [15, 80], [0.8, 1.1]);

  const passOpacity = useTransform(x, [-15, -80], [0, 1]);
  const passScale = useTransform(x, [-15, -80], [0.8, 1.1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (disabled || !onSwipe) return;

    const threshold = 95;
    const velocityThreshold = 450;

    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      onSwipe('like');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      onSwipe('pass');
    }
  };

  // If this is the background card, render non-draggable preview with depth
  if (!isFrontCard) {
    return (
      <div
        className="absolute inset-0 rounded-[28px] overflow-hidden bg-coy-card border border-coy-border shadow-card select-none pointer-events-none transition-transform duration-300"
        style={{
          transform: 'scale(0.95) translateY(12px)',
          opacity: 0.65,
          zIndex: 1,
        }}
      >
        <img
          src={profile.photo}
          alt={profile.name}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 text-white/70">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-white">{profile.name}</h3>
            <span className="text-xl font-medium text-neutral-300">{profile.age}</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
            <MapPin size={13} className="text-coy-primary" />
            {profile.location}
          </p>
        </div>
      </div>
    );
  }

  // Active front card with drag physics
  return (
    <motion.div
      className="absolute inset-0 rounded-[28px] overflow-hidden bg-coy-card border border-coy-border shadow-card select-none cursor-grab active:cursor-grabbing will-change-transform"
      style={{
        x,
        rotate,
        zIndex: 10,
      }}
      drag={disabled ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.75}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Profile Photo with Graceful Fallback */}
      <div className="relative w-full h-full bg-[#181A20]">
        {!imgError ? (
          <img
            src={profile.photo}
            alt={profile.name}
            className="w-full h-full object-cover object-center pointer-events-none"
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-coy-primary/20 to-coy-secondary/20 p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-coy-surface flex items-center justify-center mb-4 text-3xl font-bold text-coy-primary border border-coy-border">
              {profile.name.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-lg font-bold text-white">{profile.name}, {profile.age}</p>
            <p className="text-sm text-neutral-400 mt-1">{profile.location}</p>
          </div>
        )}

        {/* Ambient Top Shadow for Contrast */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

        {/* Dynamic LIKE Stamp (Top-Right) */}
        <motion.div
          className="absolute top-6 right-6 z-30 pointer-events-none"
          style={{ opacity: likeOpacity, scale: likeScale, rotate: -14 }}
        >
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border-[3px] border-emerald-400 bg-emerald-950/80 text-emerald-400 backdrop-blur-md shadow-lg shadow-emerald-950/50">
            <Heart size={20} className="fill-emerald-400 stroke-emerald-400" />
            <span className="text-lg font-black tracking-wider uppercase">LIKE</span>
          </div>
        </motion.div>

        {/* Dynamic PASS Stamp (Top-Left) */}
        <motion.div
          className="absolute top-6 left-6 z-30 pointer-events-none"
          style={{ opacity: passOpacity, scale: passScale, rotate: 14 }}
        >
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border-[3px] border-rose-500 bg-rose-950/80 text-rose-400 backdrop-blur-md shadow-lg shadow-rose-950/50">
            <X size={20} className="stroke-[3]" />
            <span className="text-lg font-black tracking-wider uppercase">PASS</span>
          </div>
        </motion.div>

        {/* Bottom Editorial Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 pt-28 pb-6 px-6 bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-auto">
          {/* Header Info: Name, Age, Verified badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[26px] font-black tracking-tight text-white flex items-center gap-1.5">
                {profile.name}
                <CheckCircle2 size={18} className="text-coy-primary fill-coy-primary/20 inline-block" />
              </h2>
              <span className="text-2xl font-semibold text-neutral-300">{profile.age}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullBio(prev => !prev);
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white/80"
              aria-label="Toggle profile bio details"
            >
              <Info size={16} />
            </button>
          </div>

          {/* Location / Campus */}
          <div className="flex items-center gap-1.5 text-neutral-300 text-sm mt-1 font-medium">
            <MapPin size={14} className="text-coy-primary flex-shrink-0" />
            <span>{profile.location}</span>
          </div>

          {/* Bio text */}
          <p className={`text-neutral-200 text-sm mt-2.5 leading-relaxed transition-all ${showFullBio ? '' : 'line-clamp-2'}`}>
            {profile.bio}
          </p>

          {/* Interest tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {profile.interests.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-neutral-200 border border-white/10 backdrop-blur-sm"
              >
                <Sparkles size={11} className="text-coy-primary opacity-80" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
