"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Camera, 
  FileText, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  LogOut, 
  Lock, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Building2,
  Trash2,
  Edit3
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  subscribeToUserProfileActivity, 
  LostNoticeRecord,
  deleteItemFromFirestore,
  deleteLostNoticeFromFirestore
} from "@/lib/firebaseService";
import { LostItem } from "@/lib/store";
import HandoverChat from "./HandoverChat";
import ItemEditModal from "./ItemEditModal";
import NoticeEditModal from "./NoticeEditModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { NavTab } from "./Navbar";
import { subscribeToUserKarma, UserKarmaProfile } from "@/lib/karmaService";

interface UserProfileProps {
  collegeCode: string;
  collegeName: string;
  onNavigate: (tab: NavTab) => void;
}

export default function UserProfile({ collegeCode, collegeName, onNavigate }: UserProfileProps) {
  const { user, isAdmin, logout, setAuthModalOpen } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"reported" | "notices" | "claims">("reported");
  
  const [reportedItems, setReportedItems] = useState<LostItem[]>([]);
  const [myNotices, setMyNotices] = useState<LostNoticeRecord[]>([]);
  const [myClaimPasses, setMyClaimPasses] = useState<LostItem[]>([]);
  const [karmaProfile, setKarmaProfile] = useState<UserKarmaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChatPass, setActiveChatPass] = useState<LostItem | null>(null);
  const [editingItem, setEditingItem] = useState<LostItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<LostItem | null>(null);
  const [editingNotice, setEditingNotice] = useState<LostNoticeRecord | null>(null);
  const [deletingNotice, setDeletingNotice] = useState<LostNoticeRecord | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserProfileActivity(user.email, (activity) => {
      setReportedItems(activity.reportedItems);
      setMyNotices(activity.myNotices);
      setMyClaimPasses(activity.myClaimPasses);
      setLoading(false);
    });

    const unsubKarma = subscribeToUserKarma(user.email, (kp) => {
      setKarmaProfile(kp);
    });

    return () => {
      unsubscribe();
      unsubKarma();
    };
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-lg p-8 shadow-card space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FFE4E8] text-[#9F1239] flex items-center justify-center mx-auto ring-4 ring-[#FECDD6]">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-[#1E1215]">Institutional Account Sign-In Required</h2>
          <p className="text-xs text-[#881337] max-w-md mx-auto">
            Please log in with your verified campus email address (@vips.edu, @dtu.ac.in, @kccitm.edu) to view your reported items, active claims, and lost notices.
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="bg-[#9F1239] hover:bg-[#881337] text-white px-6 py-2.5 text-xs font-bold rounded-md transition-colors shadow-xs"
          >
            Sign In with College Email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* 1. Official Institutional Identity Card */}
      <div className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-lg p-6 sm:p-7 shadow-card relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFE4E8]/50 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#F2C4CE] pb-5 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#9F1239] via-[#BE123C] to-[#E11D48] text-white flex items-center justify-center text-xl font-black shadow-md ring-4 ring-[#FECDD6] uppercase">
              {user.email?.[0] || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-[#1E1215] tracking-tight">
                  {user.email}
                </h1>
                <span className="text-[10px] font-mono font-bold bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded border border-[#FECDD6]">
                  {isAdmin ? "SYSTEM ADMINISTRATOR" : "VERIFIED CAMPUS STUDENT"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#881337]">
                <Building2 className="w-3.5 h-3.5 text-[#9F1239]" />
                <span className="font-semibold">{collegeName}</span>
                <span>•</span>
                <span className="font-mono text-[11px] font-bold text-[#9F1239]">{collegeCode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => logout()}
              className="text-xs text-[#881337] hover:text-[#9F1239] border border-[#F0BFCB] hover:border-[#EAA7B7] bg-[#FFF5F8] px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Security & Karma Standing Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Karma Points Card */}
          <div className="bg-[#FFF5F8] border border-[#F2C4CE] p-3 rounded-md">
            <div className="text-[10px] font-mono font-bold text-[#881337] uppercase flex items-center justify-between">
              <span>Good Karma Rank</span>
              {karmaProfile && <span>{karmaProfile.rankInfo.icon}</span>}
            </div>
            <div className="text-xs font-bold text-[#1E1215] mt-1 flex items-center gap-1.5">
              {isAdmin ? (
                <span className="text-[#881337]">Institutional Admin</span>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-1.5 py-0.2 rounded font-extrabold text-[10px] border ${karmaProfile?.rankInfo.badgeBg} ${karmaProfile?.rankInfo.textColor} ${karmaProfile?.rankInfo.borderColor}`}>
                    {karmaProfile?.rankInfo.fullName || "Bronze 1"}
                  </span>
                  <span className="text-[#9F1239] font-mono font-black text-xs">
                    {karmaProfile?.karmaPoints || 0} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#FFF5F8] border border-[#F2C4CE] p-3 rounded-md">
            <div className="text-[10px] font-mono font-bold text-[#881337] uppercase">Verified Returns</div>
            <div className="text-xs font-bold text-[#1E1215] mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{karmaProfile?.totalReturns || 0} Completed Handover(s)</span>
            </div>
          </div>

          <div className="bg-[#FFF5F8] border border-[#F2C4CE] p-3 rounded-md">
            <div className="text-[10px] font-mono font-bold text-[#881337] uppercase">Session Persistence</div>
            <div className="text-xs font-bold text-[#1E1215] mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Persistent (Locked)</span>
            </div>
          </div>

          <div className="bg-[#FFF5F8] border border-[#F2C4CE] p-3 rounded-md">
            <div className="text-[10px] font-mono font-bold text-[#881337] uppercase">Zero-Leak Privacy</div>
            <div className="text-xs font-bold text-[#1E1215] mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Encrypted Custody</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Activity Tabs */}
      <div className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-lg p-6 shadow-card space-y-5">
        <div className="flex border-b border-[#F0BFCB] gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSubTab("reported")}
            className={`px-4 py-2 text-xs font-bold rounded-t-md transition-all flex items-center gap-2 border-b-2 -mb-[1px] ${
              activeSubTab === "reported"
                ? "border-[#9F1239] text-[#9F1239] bg-[#FFF0F4]"
                : "border-transparent text-[#881337] hover:bg-[#FFF5F8]"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Items I've Reported Found</span>
            <span className="text-[10px] bg-[#FFE4E8] text-[#9F1239] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {reportedItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("notices")}
            className={`px-4 py-2 text-xs font-bold rounded-t-md transition-all flex items-center gap-2 border-b-2 -mb-[1px] ${
              activeSubTab === "notices"
                ? "border-[#9F1239] text-[#9F1239] bg-[#FFF0F4]"
                : "border-transparent text-[#881337] hover:bg-[#FFF5F8]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Lost Belonging Notices</span>
            <span className="text-[10px] bg-[#FFE4E8] text-[#9F1239] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {myNotices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("claims")}
            className={`px-4 py-2 text-xs font-bold rounded-t-md transition-all flex items-center gap-2 border-b-2 -mb-[1px] ${
              activeSubTab === "claims"
                ? "border-[#9F1239] text-[#9F1239] bg-[#FFF0F4]"
                : "border-transparent text-[#881337] hover:bg-[#FFF5F8]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>My Verified Claim Passes</span>
            <span className="text-[10px] bg-[#FFE4E8] text-[#9F1239] font-mono px-1.5 py-0.2 rounded-full font-bold">
              {myClaimPasses.length}
            </span>
          </button>
        </div>

        {/* Tab Content Panes */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#881337]">
            <div className="w-6 h-6 border-2 border-[#9F1239] border-t-transparent animate-spin rounded-full mx-auto mb-2" />
            Synchronizing your live profile data from Firebase...
          </div>
        ) : (
          <div>
            {/* SUBTAB 1: Items I've Reported Found */}
            {activeSubTab === "reported" && (
              <div className="space-y-3">
                {reportedItems.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#881337] bg-[#FFF9FB] rounded-md border border-[#F2C4CE] p-6">
                    <Camera className="w-8 h-8 text-[#BE123C] mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">You haven't logged any found campus items yet.</p>
                    <p className="text-[11px] text-[#881337] mt-1">If you pick up someone's misplaced belongings, catalog them here to help them recover them securely.</p>
                    <button
                      onClick={() => onNavigate("report")}
                      className="mt-4 bg-[#9F1239] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#881337] transition-colors"
                    >
                      + Log a Found Item
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reportedItems.map((item) => (
                      <div key={item.id} className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-md p-4 space-y-2 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold bg-[#FFE4E8] text-[#9F1239] px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                            <h4 className="text-sm font-bold text-[#1E1215] mt-1 line-clamp-1">
                              {item.publicTitle}
                            </h4>
                          </div>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            item.status === "VERIFIED_PENDING_HANDOVER"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : item.status === "HANDED_OVER"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-[#FFF0F4] text-[#881337] border border-[#F0BFCB]"
                          }`}>
                            {item.status === "VERIFIED_PENDING_HANDOVER" ? "CLAIM VERIFIED" : item.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-[#881337] flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#9F1239] shrink-0" />
                          <span className="truncate">{item.campusZone}</span>
                        </div>

                        <div className="pt-2 border-t border-[#F2C4CE] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 rounded text-[#9F1239] hover:bg-[#FFE8ED] border border-[#F0BFCB] transition-colors flex items-center gap-1 text-[10px] font-bold px-2"
                              title="Edit item in Firebase"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeletingItem(item)}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 text-[10px] font-bold px-2"
                              title="Delete item permanently from Firebase"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>

                          {item.status === "VERIFIED_PENDING_HANDOVER" && (
                            <button
                              onClick={() => setActiveChatPass(item)}
                              className="text-xs bg-[#9F1239] text-white px-2.5 py-1 rounded font-bold hover:bg-[#881337] transition-colors flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Open Chat</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 2: My Lost Belonging Notices */}
            {activeSubTab === "notices" && (
              <div className="space-y-3">
                {myNotices.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#881337] bg-[#FFF9FB] rounded-md border border-[#F2C4CE] p-6">
                    <FileText className="w-8 h-8 text-[#BE123C] mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">You have not posted any lost item notices.</p>
                    <p className="text-[11px] text-[#881337] mt-1">If you lost your phone, keys, bottle, or notes, register a notice so the campus community can reach out.</p>
                    <button
                      onClick={() => onNavigate("lost")}
                      className="mt-4 bg-[#9F1239] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#881337] transition-colors"
                    >
                      + Post a Lost Belonging Notice
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myNotices.map((notice) => (
                      <div key={notice.id} className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-md p-4 space-y-2.5 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold bg-[#FFE4E8] text-[#9F1239] px-1.5 py-0.5 rounded">
                                {notice.category}
                              </span>
                              <span className="text-[11px] text-[#881337]">
                                Posted {notice.createdAt}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-[#1E1215] mt-1">
                              {notice.title}
                            </h4>
                          </div>

                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            notice.status === "OPEN" 
                              ? "bg-rose-50 text-rose-700 border-rose-200" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {notice.status === "OPEN" ? "SEARCHING (OPEN)" : "RECOVERED"}
                          </span>
                        </div>

                        <div className="flex gap-3 items-start">
                          {notice.photoUrl && (
                            <div className="w-16 h-16 rounded-md overflow-hidden border border-[#F0BFCB] bg-[#FFF5F8] shrink-0">
                              <img
                                src={notice.photoUrl}
                                alt={notice.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <p className="text-xs text-[#881337] leading-relaxed flex-1">
                            {notice.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-[#881337] pt-2 border-t border-[#F2C4CE] gap-2">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-[#9F1239]" />
                            {notice.campusZone}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingNotice(notice)}
                              className="p-1 rounded text-[#9F1239] hover:bg-[#FFE8ED] border border-[#F0BFCB] transition-colors flex items-center gap-1 text-[10px] font-bold px-2"
                              title="Edit notice in Firebase"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setDeletingNotice(notice)}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 text-[10px] font-bold px-2"
                              title="Delete notice permanently from Firebase"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 3: My Verified Claim Passes */}
            {activeSubTab === "claims" && (
              <div className="space-y-3">
                {myClaimPasses.length === 0 ? (
                  <div className="py-10 text-center text-xs text-[#881337] bg-[#FFF9FB] rounded-md border border-[#F2C4CE] p-6">
                    <KeyRound className="w-8 h-8 text-[#BE123C] mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No active claim passes found.</p>
                    <p className="text-[11px] text-[#881337] mt-1">Once you prove ownership by passing the forensic visual quiz for a found item, your digital handover OTP will appear here.</p>
                    <button
                      onClick={() => onNavigate("feed")}
                      className="mt-4 bg-[#9F1239] text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-[#881337] transition-colors"
                    >
                      Browse Campus Catalog
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myClaimPasses.map((item) => (
                      <div key={item.id} className="bg-[#FFFDFE] border-2 border-[#BE123C] rounded-lg p-5 space-y-3 shadow-md bg-gradient-to-r from-white via-white to-[#FFF0F4]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                              FORENSIC OWNERSHIP VERIFIED
                            </span>
                            <h4 className="text-base font-extrabold text-[#1E1215] mt-1.5">
                              {item.publicTitle}
                            </h4>
                            <div className="text-xs text-[#881337] mt-0.5">
                              Model: <span className="font-bold text-[#1E1215]">{item.secretGroundTruth?.brandAndExactModel || item.publicTitle}</span>
                            </div>
                          </div>

                          <div className="bg-white border-2 border-[#9F1239] px-3.5 py-1.5 rounded-md text-center shadow-xs">
                            <span className="text-[9px] font-mono font-bold text-[#881337] block uppercase">Handover OTP</span>
                            <span className="text-lg font-mono font-black text-[#9F1239] tracking-wider">
                              {item.claimPass?.otp || "729401"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#FFF5F8] border border-[#F2C4CE] p-3 rounded-md text-xs text-[#881337] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#9F1239]" />
                            <span>Pickup Location: <strong className="text-[#1E1215]">{item.campusZone}</strong></span>
                          </span>
                          <button
                            onClick={() => setActiveChatPass(item)}
                            className="bg-[#9F1239] hover:bg-[#881337] text-white px-3 py-1 text-xs font-bold rounded transition-colors flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Chat with Finder</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Coordination Chat Modal if opened */}
      {activeChatPass && (
        <div className="fixed inset-0 z-50 bg-[#1E1215]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="max-w-xl w-full h-[88vh] max-h-[580px] min-h-[380px] my-auto bg-white rounded-lg shadow-2xl border border-[#F0BFCB] overflow-hidden flex flex-col">
            <div className="bg-[#9F1239] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold">Direct Handover Coordination Channel</span>
              <button
                onClick={() => setActiveChatPass(null)}
                className="text-white hover:text-pink-200 text-sm font-bold px-2 py-0.5"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <HandoverChat
                itemId={activeChatPass.id}
                itemTitle={activeChatPass.publicTitle}
                campusZone={activeChatPass.campusZone}
                finderEmail={activeChatPass.finderEmail || "student.finder@campus.edu"}
                claimantEmail={activeChatPass.claimPass?.claimantEmail || (user?.email !== activeChatPass.finderEmail ? user?.email : "") || "student.claimant@campus.edu"}
                chatType="CATALOG"
                onClose={() => setActiveChatPass(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Item Edit Modal */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => setEditingItem(null)}
        />
      )}

      {/* Notice Edit Modal */}
      {editingNotice && (
        <NoticeEditModal
          notice={editingNotice}
          isOpen={!!editingNotice}
          onClose={() => setEditingNotice(null)}
          onSaved={() => setEditingNotice(null)}
        />
      )}

      {/* Item Delete Modal */}
      {deletingItem && (
        <DeleteConfirmModal
          isOpen={!!deletingItem}
          title="Delete Catalog Item"
          itemLabel={deletingItem.publicTitle || "Selected Item"}
          onClose={() => setDeletingItem(null)}
          onConfirm={async () => {
            if (deletingItem) {
              const userEmailNorm = (user?.email || "").trim().toLowerCase();
              const finderEmailNorm = (deletingItem.finderEmail || (deletingItem as any).reporterEmail || "").trim().toLowerCase();
              if (!isAdmin && (!userEmailNorm || userEmailNorm !== finderEmailNorm)) {
                alert("Unauthorized: Only administrators or the student who reported this item can delete it.");
                setDeletingItem(null);
                return;
              }
              await deleteItemFromFirestore(deletingItem.id);
              setDeletingItem(null);
            }
          }}
        />
      )}

      {/* Notice Delete Modal */}
      {deletingNotice && (
        <DeleteConfirmModal
          isOpen={!!deletingNotice}
          title="Delete Lost Belonging Notice"
          itemLabel={deletingNotice.title || "Selected Notice"}
          onClose={() => setDeletingNotice(null)}
          onConfirm={async () => {
            if (deletingNotice) {
              const userEmailNorm = (user?.email || "").trim().toLowerCase();
              const ownerEmailNorm = (deletingNotice.ownerEmail || (deletingNotice as any).creatorEmail || "").trim().toLowerCase();
              if (!isAdmin && (!userEmailNorm || userEmailNorm !== ownerEmailNorm)) {
                alert("Unauthorized: Only administrators or the student who posted this notice can delete it.");
                setDeletingNotice(null);
                return;
              }
              await deleteLostNoticeFromFirestore(deletingNotice.id, deletingNotice.collegeCode);
              setDeletingNotice(null);
            }
          }}
        />
      )}
    </div>
  );
}
