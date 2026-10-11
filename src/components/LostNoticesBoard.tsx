"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Clock, 
  User, 
  Mail, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Phone,
  Plus,
  Send,
  Sparkles,
  Edit3,
  Trash2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import HandoverChat from "./HandoverChat";
import NoticeEditModal from "./NoticeEditModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { 
  subscribeToLostNotices, 
  deleteLostNoticeFromFirestore,
  updateLostNoticeInFirestore 
} from "@/lib/firebaseService";

interface LostNoticesBoardProps {
  collegeCode: string;
  collegeName: string;
  onPostNoticeClick: () => void;
}

export default function LostNoticesBoard({ collegeCode, collegeName, onPostNoticeClick }: LostNoticesBoardProps) {
  const { user, isAdmin, triggerAuthGuard } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "SOLVED">("ACTIVE");
  const [search, setSearch] = useState("");
  const [activeChatNotice, setActiveChatNotice] = useState<any | null>(null);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [deletingNotice, setDeletingNotice] = useState<any | null>(null);

  useEffect(() => {
    // Real-time Firestore onSnapshot listener for student notices
    const unsubscribe = subscribeToLostNotices(collegeCode, (liveNotices) => {
      setNotices(liveNotices);
    });

    return () => unsubscribe();
  }, [collegeCode]);

  // Lock body scroll when any modal (chat, edit, delete) is open
  useEffect(() => {
    if (activeChatNotice || editingNotice || deletingNotice) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [activeChatNotice, editingNotice, deletingNotice]);

  const activeCount = notices.filter(n => n.status !== "FOUND" && n.status !== "CLOSED").length;
  const solvedCount = notices.filter(n => n.status === "FOUND" || n.status === "CLOSED").length;

  const filtered = notices.filter((n) => {
    const isSolved = n.status === "FOUND" || n.status === "CLOSED";
    if (statusFilter === "ACTIVE" && isSolved) return false;
    if (statusFilter === "SOLVED" && !isSolved) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (n.title || "").toLowerCase().includes(q) ||
      (n.campusZone || "").toLowerCase().includes(q) ||
      (n.description || "").toLowerCase().includes(q)
    );
  });

  const handleMarkNoticeSolved = async (notice: any) => {
    triggerAuthGuard("mark this lost notice as solved and item recovered", async () => {
      await updateLostNoticeInFirestore(notice.id, { status: "FOUND" }, collegeCode);
    });
  };

  const handleContactOwner = (notice: any) => {
    triggerAuthGuard("contact the lost item owner", () => {
      setActiveChatNotice(notice);
    });
  };

  const canModifyNotice = (notice: any) => {
    if (!user?.email) return false;
    if (isAdmin) return true;
    const userEmailNorm = user.email.trim().toLowerCase();
    const ownerEmailNorm = (notice.ownerEmail || notice.creatorEmail || "").trim().toLowerCase();
    return !!ownerEmailNorm && userEmailNorm === ownerEmailNorm;
  };

  const handleEditNotice = (notice: any) => {
    triggerAuthGuard("edit lost notice in Firebase", () => {
      if (!canModifyNotice(notice)) {
        alert("Unauthorized: Only administrators or the student who posted this notice can edit it.");
        return;
      }
      setEditingNotice(notice);
    });
  };

  const handleDeleteNotice = (notice: any) => {
    triggerAuthGuard("delete lost notice permanently from Firebase", () => {
      if (!canModifyNotice(notice)) {
        alert("Unauthorized: Only administrators or the student who posted this notice can delete it.");
        return;
      }
      setDeletingNotice(notice);
    });
  };

  const confirmDeleteNotice = async () => {
    if (!deletingNotice) return;
    if (!canModifyNotice(deletingNotice)) {
      alert("Unauthorized: Only administrators or the student who posted this notice can delete it.");
      setDeletingNotice(null);
      return;
    }
    await deleteLostNoticeFromFirestore(deletingNotice.id, collegeCode);
    setDeletingNotice(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-[#F0BFCB] rounded-lg p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded border border-[#FECDD6]">
              Student Seeker Board
            </span>
            <span className="text-xs text-[#881337] font-semibold">{collegeName}</span>
          </div>
          <h3 className="text-lg font-extrabold text-[#1E1215]">
            Lost Belonging Notices
          </h3>
          <p className="text-xs text-[#881337] mt-0.5">
            Students actively searching for their misplaced belongings. If you found any of these, connect with the student to coordinate a front desk drop-off.
          </p>
        </div>

        <button
          onClick={onPostNoticeClick}
          className="bg-[#9F1239] hover:bg-[#881337] text-white px-4 py-2.5 text-xs font-bold rounded-md transition-colors shadow-xs flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>I Lost Something (Post Notice)</span>
        </button>
      </div>

      {/* Sub-tabs: Active Seeking Notices vs Completed & Solved Notices */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-lg border border-[#F0BFCB] shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              statusFilter === "ACTIVE"
                ? "bg-[#9F1239] text-white shadow-xs"
                : "bg-[#FFF0F4] text-[#881337] border border-[#FECDD6] hover:bg-[#FFE8ED]"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Active Seeking Notices ({activeCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter("SOLVED")}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              statusFilter === "SOLVED"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-[#F0FDF4] text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed & Solved Notices ({solvedCount})</span>
          </button>
        </div>

        {statusFilter === "SOLVED" && (
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            Archived after student confirmation of recovered belonging
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#881337] absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student notices by title, building, floor, or keyword..."
          className="w-full pl-10 pr-4 py-2.5 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215] shadow-2xs"
        />
      </div>

      {/* Notices Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#F0BFCB] rounded-lg p-12 text-center">
          {statusFilter === "SOLVED" ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1E1215]">No resolved notices in this view yet</p>
              <p className="text-xs text-[#881337] mt-1 max-w-md mx-auto">
                When a lost item seeker confirms they have recovered their item through finder coordination, it will appear here as a permanently solved notice.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-[#1E1215]">No active lost notices matching query</p>
              <p className="text-xs text-[#881337] mt-1">If you recently misplaced something, be the first to post a notice!</p>
              <button
                onClick={onPostNoticeClick}
                className="mt-4 inline-flex items-center gap-2 bg-[#9F1239] text-white px-4 py-2 rounded-md text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post a Lost Notice</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#F0BFCB] hover:border-[#BE123C] rounded-lg p-5 shadow-subtle hover:shadow-elevated transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9F1239] bg-[#FFF0F4] px-2 py-0.5 rounded border border-[#FECDD6]">
                      {item.category}
                    </span>
                    <h4 className="text-base font-bold text-[#1E1215] mt-1.5 leading-snug">
                      {item.title}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                    item.status === "FOUND" || item.status === "CLOSED"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                  }`}>
                    {item.status === "FOUND" || item.status === "CLOSED" ? "SOLVED & REUNITED ✓" : "SEARCHING"}
                  </span>
                </div>

                <div className="flex gap-3 items-start">
                  {item.photoUrl && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border border-[#F0BFCB] bg-[#FFF5F8] shrink-0">
                      <img
                        src={item.photoUrl}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}
                  <p className="text-xs text-[#701A31] leading-relaxed line-clamp-3 flex-1">
                    {item.description}
                  </p>
                </div>

                <div className="pt-1 space-y-1 text-[11px] text-[#881337] font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#9F1239] shrink-0" />
                    <span>Last Seen: {item.campusZone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#9F1239] shrink-0" />
                    <span>Lost: {item.lostDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#9F1239] shrink-0" />
                    <span>Posted by: {item.ownerEmail}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F2C4CE] flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#881337] font-mono">
                    #{item.id.slice(-6)}
                  </span>
                  {canModifyNotice(item) && (
                    <>
                      <button
                        onClick={() => handleEditNotice(item)}
                        className="p-1 rounded text-[#9F1239] hover:bg-[#FFE8ED] border border-[#F0BFCB] transition-colors flex items-center gap-1 text-[10px] font-bold px-1.5"
                        title="Edit notice permanently in Firebase"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteNotice(item)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 text-[10px] font-bold px-1.5"
                        title="Delete notice permanently from Firebase"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {item.status === "FOUND" || item.status === "CLOSED" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Recovered</span>
                      </span>
                      <button
                        onClick={() => handleContactOwner(item)}
                        className="bg-white border border-[#F0BFCB] hover:bg-[#FFE8ED] text-[#881337] px-2.5 py-1 text-xs font-bold rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Mark Solved button for owner or admin */}
                      {(isAdmin || (user?.email && item.ownerEmail && user.email.toLowerCase() === item.ownerEmail.toLowerCase())) && (
                        <button
                          onClick={() => handleMarkNoticeSolved(item)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                          title="Mark this notice as solved (item returned)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Solved</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleContactOwner(item)}
                        className="bg-[#9F1239] hover:bg-[#881337] text-white px-3.5 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>I Found This! Connect</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Handover Chat Modal if active */}
      {activeChatNotice && (
        <div className="fixed inset-0 z-50 bg-[#1E1215]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="w-full max-w-lg h-[88vh] max-h-[580px] min-h-[380px] my-auto flex flex-col overflow-hidden">
            <HandoverChat
              itemId={activeChatNotice.id}
              itemTitle={activeChatNotice.title}
              campusZone={activeChatNotice.campusZone}
              finderEmail={user?.email || "student.finder@campus.edu"}
              claimantEmail={activeChatNotice.ownerEmail}
              chatType="NOTICE"
              onClose={() => setActiveChatNotice(null)}
              isOpen={true}
            />
          </div>
        </div>
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

      {/* Notice Delete Confirmation Modal */}
      {deletingNotice && (
        <DeleteConfirmModal
          isOpen={!!deletingNotice}
          title="Delete Lost Belonging Notice"
          itemLabel={deletingNotice.title || "Selected Notice"}
          onClose={() => setDeletingNotice(null)}
          onConfirm={confirmDeleteNotice}
        />
      )}
    </div>
  );
}
