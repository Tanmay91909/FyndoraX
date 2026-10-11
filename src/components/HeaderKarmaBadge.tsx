"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Sparkles, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUserKarma, UserKarmaProfile, KarmaRankInfo } from "@/lib/karmaService";

interface HeaderKarmaBadgeProps {
  onOpenLeaderboard: () => void;
}

export default function HeaderKarmaBadge({ onOpenLeaderboard }: HeaderKarmaBadgeProps) {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState<UserKarmaProfile | null>(null);

  useEffect(() => {
    if (!user?.email || isAdmin) {
      setProfile(null);
      return;
    }

    const unsub = subscribeToUserKarma(user.email, (liveProfile) => {
      setProfile(liveProfile);
    });

    return () => unsub();
  }, [user?.email, isAdmin]);

  // If user is a student (regular mail ID, not admin), show live karma points & rank
  if (user && !isAdmin && profile) {
    const rank = profile.rankInfo;

    return (
      <button
        onClick={onOpenLeaderboard}
        className={`px-1.5 sm:px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 border shadow-2xs hover:scale-102 active:scale-98 group cursor-pointer shrink-0 ${rank.badgeBg} ${rank.textColor} ${rank.borderColor}`}
        title={`Good Karma Points: ${profile.karmaPoints} • Rank: ${rank.fullName} (Click to open Leaderboard)`}
      >
        <span className="text-xs sm:text-sm leading-none group-hover:rotate-12 transition-transform">
          {rank.icon}
        </span>
        <div className="flex items-center gap-1">
          <span className="font-extrabold tracking-tight text-[10px] sm:text-[11px] whitespace-nowrap">
            {rank.fullName}
          </span>
          <span className="opacity-40 font-mono text-[9px] sm:text-[10px]">•</span>
          <span className="font-mono font-black text-[10px] sm:text-[11px] whitespace-nowrap text-[#9F1239]">
            {profile.karmaPoints} <span className="text-[8px] sm:text-[9px] font-bold">pts</span>
          </span>
        </div>
      </button>
    );
  }

  // Admin or guest: show quick access button to the full Campus Leaderboard
  return (
    <button
      onClick={onOpenLeaderboard}
      className="px-1.5 sm:px-2 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 sm:gap-1.5 bg-[#FFF0F4] hover:bg-[#FFE4E8] text-[#881337] hover:text-[#9F1239] border border-[#FECDD6] shadow-2xs hover:scale-102 group shrink-0"
      title="View Campus Good Karma Leaderboard & Ranks"
    >
      <Trophy className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
      <span className="font-bold text-[10px] sm:text-[11px] whitespace-nowrap">Leaderboard</span>
    </button>
  );
}
