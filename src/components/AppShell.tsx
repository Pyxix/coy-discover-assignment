'use client';

import React, { useState } from 'react';
import { Compass, Home, Wifi, Battery, Signal } from 'lucide-react';
import { DiscoverView } from './DiscoverView';

type Tab = 'home' | 'discover';

export const AppShell: React.FC = () => {
  // Discover is the default active tab on launch
  const [activeTab, setActiveTab] = useState<Tab>('discover');

  return (
    <div className="w-full h-[100dvh] flex items-center justify-center p-0 sm:p-4 bg-[#08090C]">
      {/* Mobile-first centered viewport device frame */}
      <div className="w-full sm:max-w-[430px] h-full sm:h-[92vh] sm:max-h-[900px] flex flex-col bg-coy-dark sm:rounded-[44px] overflow-hidden border-0 sm:border-[8px] sm:border-[#1E222B] shadow-2xl relative">
        {/* Subtle Mobile Device Status Bar (Desktop Only) */}
        <div className="hidden sm:flex items-center justify-between px-7 pt-3 pb-1 text-white/70 text-xs font-semibold z-40 bg-coy-dark select-none">
          <span>9:41</span>
          {/* Dynamic Island / Speaker Notch mimic */}
          <div className="w-24 h-4 rounded-full bg-black/90 border border-white/5" />
          <div className="flex items-center gap-1.5">
            <Signal size={12} />
            <Wifi size={12} />
            <Battery size={13} className="text-white" />
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'home' ? (
            /* Home Tab: Intentionally blank placeholder canvas as a stand-in for Coy's existing experience */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-coy-dark select-none">
              <div className="w-16 h-16 rounded-3xl bg-coy-surface border border-coy-border flex items-center justify-center mb-4 text-neutral-500 shadow-inner">
                <Home size={28} />
              </div>
              <h2 className="text-xl font-bold text-neutral-300">Home</h2>
              <p className="text-xs text-neutral-500 mt-2 max-w-[260px] leading-relaxed">
                Intentionally blank placeholder reserved for Coy&apos;s existing core product experience.
              </p>
            </div>
          ) : (
            /* Discover Tab: The active discovery and matches experience */
            <DiscoverView />
          )}
        </div>

        {/* Persistent Bottom Tab Bar */}
        <nav
          className="h-16 border-t border-coy-border/80 bg-coy-dark/95 backdrop-blur-md px-6 flex items-center justify-around z-30 safe-bottom"
          aria-label="Bottom Navigation"
        >
          {/* Home Tab Button */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            aria-label="Home tab"
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'home' ? 'text-coy-primary' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Home size={22} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[10px] font-bold tracking-wide">Home</span>
          </button>

          {/* Discover Tab Button (Default) */}
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            aria-label="Discover tab"
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              activeTab === 'discover' ? 'text-coy-primary' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Compass size={22} className={activeTab === 'discover' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span className="text-[10px] font-bold tracking-wide">Discover</span>
            {activeTab === 'discover' && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-coy-primary" />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
};
