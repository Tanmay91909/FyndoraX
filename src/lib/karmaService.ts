"use client";

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { getDb, isCampusAdmin } from "./firebase";
import { normalizeCollegeCode } from "./firebaseService";

export type KarmaTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond";

export interface KarmaRankInfo {
  tier: KarmaTier;
  subRank: number; // 1 to 5
  fullName: string; // e.g. "Bronze 2", "Silver 1", "Diamond 5"
  icon: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
  minPoints: number;
  maxPoints: number;
  progressPercent: number;
  nextRankName: string | null;
  pointsToNext: number;
}

export interface UserKarmaProfile {
  email: string;
  displayName: string;
  collegeCode: string;
  karmaPoints: number;
  totalReturns: number;
  lastAwardedAt?: string;
  rankInfo: KarmaRankInfo;
  updatedAt?: any;
}

// 25 Ranks: Bronze 1-5, Silver 1-5, Gold 1-5, Platinum 1-5, Diamond 1-5
// Tuned curve: starts fast on initial returns, then grows progressively steeper for higher ranks
export const KARMA_TIER_CONFIG = [
  // BRONZE (1 - 5)
  { tier: "Bronze" as KarmaTier, subRank: 1, min: 0, max: 74, icon: "🥉", badgeBg: "bg-amber-100", textColor: "text-amber-800", borderColor: "border-amber-300", glow: "rgba(217,119,6,0.2)" },
  { tier: "Bronze" as KarmaTier, subRank: 2, min: 75, max: 174, icon: "🥉", badgeBg: "bg-amber-100", textColor: "text-amber-800", borderColor: "border-amber-400", glow: "rgba(217,119,6,0.3)" },
  { tier: "Bronze" as KarmaTier, subRank: 3, min: 175, max: 299, icon: "🥉", badgeBg: "bg-amber-100", textColor: "text-amber-900", borderColor: "border-amber-500", glow: "rgba(217,119,6,0.4)" },
  { tier: "Bronze" as KarmaTier, subRank: 4, min: 300, max: 449, icon: "🥉", badgeBg: "bg-amber-200", textColor: "text-amber-900", borderColor: "border-amber-600", glow: "rgba(217,119,6,0.5)" },
  { tier: "Bronze" as KarmaTier, subRank: 5, min: 450, max: 649, icon: "🥉", badgeBg: "bg-amber-200", textColor: "text-amber-950", borderColor: "border-amber-700", glow: "rgba(217,119,6,0.6)" },

  // SILVER (1 - 5)
  { tier: "Silver" as KarmaTier, subRank: 1, min: 650, max: 899, icon: "🥈", badgeBg: "bg-slate-100", textColor: "text-slate-700", borderColor: "border-slate-300", glow: "rgba(100,116,139,0.25)" },
  { tier: "Silver" as KarmaTier, subRank: 2, min: 900, max: 1199, icon: "🥈", badgeBg: "bg-slate-100", textColor: "text-slate-800", borderColor: "border-slate-400", glow: "rgba(100,116,139,0.35)" },
  { tier: "Silver" as KarmaTier, subRank: 3, min: 1200, max: 1549, icon: "🥈", badgeBg: "bg-slate-200", textColor: "text-slate-800", borderColor: "border-slate-400", glow: "rgba(100,116,139,0.45)" },
  { tier: "Silver" as KarmaTier, subRank: 4, min: 1550, max: 1949, icon: "🥈", badgeBg: "bg-slate-200", textColor: "text-slate-900", borderColor: "border-slate-500", glow: "rgba(100,116,139,0.55)" },
  { tier: "Silver" as KarmaTier, subRank: 5, min: 1950, max: 2449, icon: "🥈", badgeBg: "bg-slate-300", textColor: "text-slate-950", borderColor: "border-slate-600", glow: "rgba(100,116,139,0.65)" },

  // GOLD (1 - 5)
  { tier: "Gold" as KarmaTier, subRank: 1, min: 2450, max: 3049, icon: "🥇", badgeBg: "bg-yellow-100", textColor: "text-yellow-800", borderColor: "border-yellow-400", glow: "rgba(234,179,8,0.3)" },
  { tier: "Gold" as KarmaTier, subRank: 2, min: 3050, max: 3749, icon: "🥇", badgeBg: "bg-yellow-100", textColor: "text-yellow-900", borderColor: "border-yellow-500", glow: "rgba(234,179,8,0.4)" },
  { tier: "Gold" as KarmaTier, subRank: 3, min: 3750, max: 4549, icon: "🥇", badgeBg: "bg-yellow-200", textColor: "text-yellow-900", borderColor: "border-yellow-600", glow: "rgba(234,179,8,0.5)" },
  { tier: "Gold" as KarmaTier, subRank: 4, min: 4550, max: 5499, icon: "🥇", badgeBg: "bg-yellow-200", textColor: "text-amber-950", borderColor: "border-yellow-700", glow: "rgba(234,179,8,0.6)" },
  { tier: "Gold" as KarmaTier, subRank: 5, min: 5500, max: 6599, icon: "🥇", badgeBg: "bg-amber-200", textColor: "text-amber-950", borderColor: "border-amber-800", glow: "rgba(234,179,8,0.7)" },

  // PLATINUM (1 - 5)
  { tier: "Platinum" as KarmaTier, subRank: 1, min: 6600, max: 7899, icon: "💠", badgeBg: "bg-cyan-100", textColor: "text-cyan-800", borderColor: "border-cyan-400", glow: "rgba(6,182,212,0.35)" },
  { tier: "Platinum" as KarmaTier, subRank: 2, min: 7900, max: 9399, icon: "💠", badgeBg: "bg-cyan-100", textColor: "text-cyan-900", borderColor: "border-cyan-500", glow: "rgba(6,182,212,0.45)" },
  { tier: "Platinum" as KarmaTier, subRank: 3, min: 9400, max: 11099, icon: "💠", badgeBg: "bg-teal-100", textColor: "text-teal-900", borderColor: "border-teal-500", glow: "rgba(20,184,166,0.55)" },
  { tier: "Platinum" as KarmaTier, subRank: 4, min: 11100, max: 13049, icon: "💠", badgeBg: "bg-teal-200", textColor: "text-teal-950", borderColor: "border-teal-600", glow: "rgba(20,184,166,0.65)" },
  { tier: "Platinum" as KarmaTier, subRank: 5, min: 13050, max: 15299, icon: "💠", badgeBg: "bg-emerald-100", textColor: "text-emerald-950", borderColor: "border-emerald-600", glow: "rgba(16,185,129,0.75)" },

  // DIAMOND (1 - 5)
  { tier: "Diamond" as KarmaTier, subRank: 1, min: 15300, max: 17999, icon: "💎", badgeBg: "bg-indigo-100", textColor: "text-indigo-900", borderColor: "border-indigo-400", glow: "rgba(99,102,241,0.4)" },
  { tier: "Diamond" as KarmaTier, subRank: 2, min: 18000, max: 21199, icon: "💎", badgeBg: "bg-indigo-100", textColor: "text-indigo-950", borderColor: "border-indigo-500", glow: "rgba(99,102,241,0.5)" },
  { tier: "Diamond" as KarmaTier, subRank: 3, min: 21200, max: 24899, icon: "💎", badgeBg: "bg-purple-100", textColor: "text-purple-950", borderColor: "border-purple-500", glow: "rgba(168,85,247,0.6)" },
  { tier: "Diamond" as KarmaTier, subRank: 4, min: 24900, max: 29199, icon: "💎", badgeBg: "bg-purple-200", textColor: "text-purple-950", borderColor: "border-purple-600", glow: "rgba(168,85,247,0.7)" },
  { tier: "Diamond" as KarmaTier, subRank: 5, min: 29200, max: 999999, icon: "👑", badgeBg: "bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200", textColor: "text-purple-950", borderColor: "border-purple-700", glow: "rgba(168,85,247,0.85)" },
];

/**
 * Calculates current tier, subrank, and percentage progression
 */
export function getKarmaRank(points: number): KarmaRankInfo {
  const safePts = Math.max(0, points || 0);

  for (let i = 0; i < KARMA_TIER_CONFIG.length; i++) {
    const cfg = KARMA_TIER_CONFIG[i];
    if (safePts >= cfg.min && safePts <= cfg.max) {
      const nextCfg = KARMA_TIER_CONFIG[i + 1] || null;
      const range = cfg.max - cfg.min + 1;
      const progress = nextCfg ? Math.min(100, Math.round(((safePts - cfg.min) / range) * 100)) : 100;
      const pointsToNext = nextCfg ? Math.max(0, nextCfg.min - safePts) : 0;

      return {
        tier: cfg.tier,
        subRank: cfg.subRank,
        fullName: `${cfg.tier} ${cfg.subRank}`,
        icon: cfg.icon,
        badgeBg: cfg.badgeBg,
        textColor: cfg.textColor,
        borderColor: cfg.borderColor,
        glowColor: cfg.glow,
        minPoints: cfg.min,
        maxPoints: cfg.max,
        progressPercent: progress,
        nextRankName: nextCfg ? `${nextCfg.tier} ${nextCfg.subRank}` : null,
        pointsToNext
      };
    }
  }

  // Fallback to highest diamond rank
  const top = KARMA_TIER_CONFIG[KARMA_TIER_CONFIG.length - 1];
  return {
    tier: top.tier,
    subRank: top.subRank,
    fullName: `${top.tier} ${top.subRank}`,
    icon: top.icon,
    badgeBg: top.badgeBg,
    textColor: top.textColor,
    borderColor: top.borderColor,
    glowColor: top.glow,
    minPoints: top.min,
    maxPoints: top.max,
    progressPercent: 100,
    nextRankName: null,
    pointsToNext: 0
  };
}

/**
 * Derives natural student display names from email to strictly preserve privacy on public leaderboards
 */
export function getDisplayNameFromEmail(email?: string | null): string {
  if (!email) return "Campus Member";
  const norm = email.trim().toLowerCase();

  const KNOWN_MAP: Record<string, string> = {
    "rohan.mehta@vips.edu": "Rohan Mehta",
    "ananya.patel@vips.edu": "Ananya Patel",
    "student.demo@vips.edu": "Aarav Sharma",
    "student.finder@vips.edu": "Kabir Mathur",
    "ananya.patel@dtu.ac.in": "Ananya Patel",
    "rohit.sharma@dtu.ac.in": "Rohit Sharma",
    "mohit.verma@kccitm.edu": "Mohit Verma",
    "shreya.singh@kccitm.edu": "Shreya Singh",
    "tejas@vips.edu": "Tejas Malhotra",
    "canteen.staff@vips.edu": "Campus Canteen Staff",
    "library.staff@vips.edu": "Central Library Desk",
    "cadlab.technician@dtu.ac.in": "CAD Lab Coordinator",
    "drawing.instructor@kccitm.edu": "Engineering Drawing Desk"
  };

  if (KNOWN_MAP[norm]) return KNOWN_MAP[norm];

  const prefix = norm.split("@")[0] || "";
  const parts = prefix.split(/[._\-\d]+/).filter(Boolean);
  if (parts.length > 0) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }

  return "Verified Student";
}

export function getCollegeFromEmail(email?: string | null): string {
  if (!email) return "VIPS-TC";
  const norm = email.toLowerCase();
  if (norm.includes("@dtu.ac.in") || norm.includes("dtu")) return "DTU";
  if (norm.includes("@kccitm.edu") || norm.includes("kcc")) return "KCC-ITM";
  return "VIPS-TC";
}

function sanitizeEmailForDocId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
}

/**
 * Ensures a valid real-time user profile exists in Firestore /karma collection.
 * Called automatically on login, signup, or user session sync.
 */
export async function syncUserKarmaProfile(
  email: string,
  collegeCode?: string,
  displayName?: string
): Promise<UserKarmaProfile | null> {
  const normEmail = (email || "").trim().toLowerCase();
  if (!normEmail || isCampusAdmin(normEmail)) return null;

  const docId = sanitizeEmailForDocId(normEmail);
  const college = normalizeCollegeCode(collegeCode || getCollegeFromEmail(normEmail));
  const finalDisplayName = displayName || getDisplayNameFromEmail(normEmail);

  const db = getDb();
  if (!db) return null;

  try {
    const docRef = doc(db, "karma", docId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const d = snap.data();
      const pts = typeof d.karmaPoints === "number" ? d.karmaPoints : 0;
      const rankInfo = getKarmaRank(pts);
      const updated: UserKarmaProfile = {
        email: normEmail,
        displayName: d.displayName || finalDisplayName,
        collegeCode: normalizeCollegeCode(d.collegeCode || college),
        karmaPoints: pts,
        totalReturns: typeof d.totalReturns === "number" ? d.totalReturns : 0,
        lastAwardedAt: d.lastAwardedAt,
        rankInfo
      };

      // Keep lastActiveAt fresh
      await setDoc(docRef, {
        displayName: updated.displayName,
        collegeCode: updated.collegeCode,
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      return updated;
    } else {
      // First-time valid user registration
      const rankInfo = getKarmaRank(0);
      const newProfile: UserKarmaProfile = {
        email: normEmail,
        displayName: finalDisplayName,
        collegeCode: college,
        karmaPoints: 0,
        totalReturns: 0,
        rankInfo
      };

      await setDoc(docRef, {
        email: normEmail,
        displayName: finalDisplayName,
        collegeCode: college,
        karmaPoints: 0,
        totalReturns: 0,
        rankTier: rankInfo.tier,
        rankSub: rankInfo.subRank,
        rankName: rankInfo.fullName,
        lastAwardedAt: null,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      return newProfile;
    }
  } catch (err) {
    console.warn("syncUserKarmaProfile notice:", err);
    return null;
  }
}

/**
 * Awards Good Karma points to a finder upon verified handover OTP completion
 * Excludes administrators (only regular students/mail IDs receive karma points)
 */
export async function awardKarmaPoints(
  finderEmail: string,
  pointsAwarded = 75,
  contextNote = "Item handover OTP verified"
): Promise<UserKarmaProfile | null> {
  const normEmail = (finderEmail || "").trim().toLowerCase();
  if (!normEmail || isCampusAdmin(normEmail)) {
    return null; // Admins do not receive student karma points
  }

  const docId = sanitizeEmailForDocId(normEmail);
  const collegeCode = normalizeCollegeCode(
    normEmail.includes("vips") ? "VIPS-TC" : normEmail.includes("dtu") ? "DTU" : "KCC-ITM"
  );
  const displayName = getDisplayNameFromEmail(normEmail);

  // Read local cache first
  const cacheKey = `fyndorax_karma_${docId}`;
  let currentPoints = 0;
  let currentReturns = 0;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      currentPoints = parsed.karmaPoints || 0;
      currentReturns = parsed.totalReturns || 0;
    }
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      const snap = await getDoc(doc(db, "karma", docId));
      if (snap.exists()) {
        const d = snap.data();
        currentPoints = d.karmaPoints || currentPoints;
        currentReturns = d.totalReturns || currentReturns;
      }
    } catch (_) {}
  }

  const newPoints = currentPoints + pointsAwarded;
  const newReturns = currentReturns + 1;
  const rankInfo = getKarmaRank(newPoints);

  const updatedProfile: UserKarmaProfile = {
    email: normEmail,
    displayName,
    collegeCode,
    karmaPoints: newPoints,
    totalReturns: newReturns,
    lastAwardedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    rankInfo
  };

  // Cache locally
  try {
    localStorage.setItem(cacheKey, JSON.stringify(updatedProfile));
    window.dispatchEvent(new CustomEvent("fyndorax_karma_updated", { detail: updatedProfile }));
  } catch (_) {}

  // Write to Firebase
  if (db) {
    try {
      await setDoc(doc(db, "karma", docId), {
        email: normEmail,
        displayName,
        collegeCode,
        karmaPoints: newPoints,
        totalReturns: newReturns,
        rankTier: rankInfo.tier,
        rankSub: rankInfo.subRank,
        rankName: rankInfo.fullName,
        lastAwardedAt: updatedProfile.lastAwardedAt,
        lastNote: contextNote,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn("Firestore awardKarmaPoints fallback:", e);
    }
  }

  return updatedProfile;
}

/**
 * Subscribes to real-time karma score & rank updates for the logged in user
 */
export function subscribeToUserKarma(
  email: string | null | undefined,
  callback: (profile: UserKarmaProfile | null) => void
): () => void {
  const normEmail = (email || "").trim().toLowerCase();
  if (!normEmail || isCampusAdmin(normEmail)) {
    callback(null);
    return () => {};
  }

  const docId = sanitizeEmailForDocId(normEmail);
  const cacheKey = `fyndorax_karma_${docId}`;
  const collegeCode = normalizeCollegeCode(
    normEmail.includes("vips") ? "VIPS-TC" : normEmail.includes("dtu") ? "DTU" : "KCC-ITM"
  );
  const displayName = getDisplayNameFromEmail(normEmail);

  const getCachedProfile = (): UserKarmaProfile => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          rankInfo: getKarmaRank(parsed.karmaPoints || 0)
        };
      }
    } catch (_) {}

    return {
      email: normEmail,
      displayName,
      collegeCode,
      karmaPoints: 0,
      totalReturns: 0,
      rankInfo: getKarmaRank(0)
    };
  };

  callback(getCachedProfile());

  // Listen to custom local updates
  const handleLocalEvent = (e: any) => {
    if (e.detail && e.detail.email === normEmail) {
      callback(e.detail);
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("fyndorax_karma_updated", handleLocalEvent);
  }

  const db = getDb();
  if (!db) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("fyndorax_karma_updated", handleLocalEvent);
      }
    };
  }

  try {
    const unsub = onSnapshot(doc(db, "karma", docId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const pts = data.karmaPoints || 0;
        const profile: UserKarmaProfile = {
          email: normEmail,
          displayName: data.displayName || displayName,
          collegeCode: data.collegeCode || collegeCode,
          karmaPoints: pts,
          totalReturns: data.totalReturns || 0,
          lastAwardedAt: data.lastAwardedAt,
          rankInfo: getKarmaRank(pts)
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(profile));
        } catch (_) {}
        callback(profile);
      }
    });

    return () => {
      unsub();
      if (typeof window !== "undefined") {
        window.removeEventListener("fyndorax_karma_updated", handleLocalEvent);
      }
    };
  } catch (_) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("fyndorax_karma_updated", handleLocalEvent);
      }
    };
  }
}

/**
 * Subscribes to the Campus Karma Leaderboard in real-time
 * Reads valid profiles directly from Firestore /karma collection
 * Displays natural names (strictly zero raw email exposure) to guarantee student privacy
 */
export function subscribeToLeaderboard(
  collegeFilter = "All",
  callback: (leaderboard: UserKarmaProfile[]) => void
): () => void {
  const normFilter = collegeFilter === "All" ? "All" : normalizeCollegeCode(collegeFilter);

  const assembleLeaderboard = (liveRecords: UserKarmaProfile[] = []) => {
    let list = liveRecords.filter((r) => r.email && !isCampusAdmin(r.email));

    if (normFilter !== "All") {
      list = list.filter((item) => normalizeCollegeCode(item.collegeCode) === normFilter);
    }

    // Sort by highest points first, then total returns
    list.sort((a, b) => (b.karmaPoints - a.karmaPoints) || (b.totalReturns - a.totalReturns));

    return list;
  };

  // Immediate cached render to avoid blank modal while Firestore connects
  let cachedList: UserKarmaProfile[] = [];
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("fyndorax_leaderboard_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedList = parsed.map((item: any) => ({
            ...item,
            rankInfo: getKarmaRank(item.karmaPoints || 0)
          }));
        }
      }
    } catch (_) {}
  }
  callback(assembleLeaderboard(cachedList));

  const db = getDb();
  if (!db) return () => {};

  try {
    const karmaCol = collection(db, "karma");
    const unsub = onSnapshot(karmaCol, (snap) => {
      const liveList: UserKarmaProfile[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        if (!d.email || isCampusAdmin(d.email)) return;
        const pts = typeof d.karmaPoints === "number" ? d.karmaPoints : 0;
        liveList.push({
          email: d.email,
          displayName: d.displayName || getDisplayNameFromEmail(d.email),
          collegeCode: normalizeCollegeCode(d.collegeCode || getCollegeFromEmail(d.email)),
          karmaPoints: pts,
          totalReturns: typeof d.totalReturns === "number" ? d.totalReturns : 0,
          lastAwardedAt: d.lastAwardedAt || "",
          rankInfo: getKarmaRank(pts)
        });
      });

      if (typeof window !== "undefined" && liveList.length > 0) {
        try {
          localStorage.setItem("fyndorax_leaderboard_cache", JSON.stringify(liveList));
        } catch (_) {}
      }

      callback(assembleLeaderboard(liveList));
    }, (error) => {
      console.warn("Leaderboard onSnapshot realtime error:", error);
    });

    return () => unsub();
  } catch (err) {
    console.warn("subscribeToLeaderboard error:", err);
    return () => {};
  }
}
