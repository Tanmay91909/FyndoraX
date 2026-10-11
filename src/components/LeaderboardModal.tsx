"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Award, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  Filter,
  Flame,
  Star,
  Zap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  subscribeToLeaderboard, 
  subscribeToUserKarma, 
  UserKarmaProfile, 
  KARMA_TIER_CONFIG 
} from "@/lib/karmaService";
import { CollegeLogoRenderer } from "./CollegeLogos";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCollege?: string;
}

export default function LeaderboardModal({ isOpen, onClose, selectedCollege = "All" }: LeaderboardModalProps) {
  const { user, isAdmin } = useAuth();
  const [filterCollege, setFilterCollege] = useState<string>("All");
  const [leaderboard, setLeaderboard] = useState<UserKarmaProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserKarmaProfile | null>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;

    if (selectedCollege && selectedCollege !== "All") {
      setFilterCollege(selectedCollege);
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Real-time Leaderboard subscription
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToLeaderboard(filterCollege, (list) => {
      setLeaderboard(list);
    });
    return () => unsub();
  }, [isOpen, filterCollege]);

  // Real-time User Karma Profile subscription
  useEffect(() => {
    if (!isOpen || !user?.email || isAdmin) return;
    const unsub = subscribeToUserKarma(user.email, (prof) => {
      setUserProfile(prof);
    });
    return () => unsub();
  }, [isOpen, user?.email, isAdmin]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#1E1215]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-xl max-w-2xl w-full h-[88vh] max-h-[640px] shadow-2xl overflow-hidden flex flex-col my-auto relative animate-in fade-in zoom-in-95 duration-200"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#9F1239] via-[#BE123C] to-[#E11D48] text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 backdrop-blur-xs flex items-center justify-center text-white shadow-xs">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Campus Good Karma Leaderboard</h3>
                <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/25 uppercase">
                  Verified Ranks
                </span>
              </div>
              <p className="text-xs text-pink-100 mt-0.5">
                Honoring students who turn in found items via verified OTP handovers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tier Hierarchy Reference Ribbon */}
        <div className="bg-[#FFF0F4] border-b border-[#F2C4CE] px-4 py-2 flex items-center justify-between text-[11px] overflow-x-auto shrink-0 gap-3">
          <span className="font-extrabold text-[#9F1239] whitespace-nowrap flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Tier Ranks:</span>
          </span>
          <div className="flex items-center gap-2 whitespace-nowrap text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">🥉 Bronze 1–5</span>
            <span className="text-pink-300">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">🥈 Silver 1–5</span>
            <span className="text-pink-300">→</span>
            <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">🥇 Gold 1–5</span>
            <span className="text-pink-300">→</span>
            <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300">💠 Platinum 1–5</span>
            <span className="text-pink-300">→</span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">💎 Diamond 1–5</span>
          </div>
        </div>

        {/* Campus Filter Bar & Privacy Note */}
        <div className="p-3 border-b border-[#F2C4CE] bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            {["All", "VIPS-TC", "DTU", "KCC-ITM"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterCollege(tab)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  filterCollege === tab
                    ? "bg-[#9F1239] text-white shadow-2xs"
                    : "bg-[#FFF0F4] text-[#881337] hover:bg-[#FFE4E8]"
                }`}
              >
                {tab === "All" ? "All Campuses" : tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-medium text-[#881337] bg-[#FFF5F8] px-2 py-1 rounded border border-[#F2C4CE]">
            <Lock className="w-3 h-3 text-[#9F1239]" />
            <span>Names displayed • Email IDs strictly private</span>
          </div>
        </div>

        {/* Leaderboard Table List */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#FCE4EC] overscroll-contain p-2 sm:p-3 bg-[#FFFDFE]">
          {leaderboard.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#881337] space-y-2">
              <Award className="w-8 h-8 text-[#F0BFCB] mx-auto animate-pulse" />
              <p className="font-bold">No Karma records found for this campus yet.</p>
              <p className="text-[11px]">Be the first to return a lost item and claim the top rank!</p>
            </div>
          ) : (
            leaderboard.map((item, index) => {
              const rankPos = index + 1;
              const isTop3 = rankPos <= 3;
              const isCurrentUser = user?.email && item.email.toLowerCase() === user.email.toLowerCase();

              return (
                <div
                  key={item.email}
                  className={`p-2.5 sm:p-3 rounded-lg transition-all flex items-center justify-between gap-3 mb-1 ${
                    isCurrentUser 
                      ? "bg-[#FFE4E8]/80 border-2 border-[#BE123C] shadow-xs" 
                      : "hover:bg-[#FFF5F8] border border-transparent"
                  }`}
                >
                  {/* Left: Position & Student Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      rankPos === 1 
                        ? "bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 shadow-xs ring-2 ring-amber-300"
                        : rankPos === 2
                        ? "bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-800 shadow-xs ring-2 ring-slate-300"
                        : rankPos === 3
                        ? "bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-xs ring-2 ring-amber-500"
                        : "bg-[#FFF0F4] text-[#881337] border border-[#F0BFCB]"
                    }`}>
                      {rankPos === 1 ? "1" : rankPos === 2 ? "2" : rankPos === 3 ? "3" : `#${rankPos}`}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-[#1E1215] truncate">
                          {item.displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-[#9F1239] text-white px-1.5 py-0.2 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#881337]">
                        <span className="font-mono font-bold text-[10px] bg-white px-1.5 py-0.2 rounded border border-[#F0BFCB]">
                          {item.collegeCode}
                        </span>
                        <span>•</span>
                        <span>{item.totalReturns} verified {item.totalReturns === 1 ? "return" : "returns"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rank Tier & Karma Points */}
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full border shadow-2xs ${item.rankInfo.badgeBg} ${item.rankInfo.textColor} ${item.rankInfo.borderColor}`}>
                        <span>{item.rankInfo.icon}</span>
                        <span>{item.rankInfo.fullName}</span>
                      </span>
                      <span className="text-xs font-black text-[#9F1239] font-mono mt-1">
                        {item.karmaPoints.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer: User Current Karma Position Bar */}
        <div className="p-3.5 bg-gradient-to-r from-[#FFF5F8] via-[#FFF0F4] to-[#FFF5F8] border-t border-[#F2C4CE] shrink-0">
          {isAdmin ? (
            <div className="flex items-center justify-between text-xs text-[#881337]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9F1239]" />
                <span className="font-bold">Campus Administrator View</span>
              </div>
              <span className="text-[11px] text-[#701A31]">Institutional overseer accounts do not accumulate student karma points.</span>
            </div>
          ) : user && userProfile ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#1E1215]">Your Standing:</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${userProfile.rankInfo.badgeBg} ${userProfile.rankInfo.textColor} ${userProfile.rankInfo.borderColor}`}>
                    <span>{userProfile.rankInfo.icon}</span>
                    <span>{userProfile.rankInfo.fullName}</span>
                  </span>
                  <span className="font-mono font-black text-[#9F1239]">{userProfile.karmaPoints} pts</span>
                </div>

                {userProfile.rankInfo.nextRankName && (
                  <span className="text-[11px] text-[#881337] font-semibold">
                    Next: <strong>{userProfile.rankInfo.nextRankName}</strong> ({userProfile.rankInfo.pointsToNext} pts left)
                  </span>
                )}
              </div>

              {/* Progress bar to next sub-rank */}
              {userProfile.rankInfo.nextRankName && (
                <div className="w-full bg-[#FFE4E8] h-2 rounded-full overflow-hidden border border-[#FECDD6]">
                  <div 
                    className="h-full bg-gradient-to-r from-[#BE123C] to-[#E11D48] transition-all duration-500 rounded-full"
                    style={{ width: `${userProfile.rankInfo.progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[#881337]">
              <span>Sign in with your campus email to earn Good Karma points on every item return!</span>
              <span className="font-bold text-[#9F1239]">+75 pts per verified return</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
