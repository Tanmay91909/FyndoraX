"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  EyeOff, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Laptop, 
  BookOpen, 
  Coffee, 
  Key, 
  CreditCard, 
  Package,
  FileSearch,
  ExternalLink,
  Layers,
  FileText,
  Plus,
  Edit3,
  Trash2,
  KeyRound,
  MessageSquare
} from "lucide-react";
import QuizModal from "./QuizModal";
import LostNoticesBoard from "./LostNoticesBoard";
import LostNoticeForm from "./LostNoticeForm";
import ItemEditModal from "./ItemEditModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { useAuth } from "@/context/AuthContext";
import { campusStore } from "@/lib/store";
import { 
  subscribeToItems, 
  deleteItemFromFirestore, 
  normalizeCollegeCode 
} from "@/lib/firebaseService";

interface MaskedCatalogProps {
  onReportClick: () => void;
  selectedCollege: string;
}

const CATEGORIES = [
  "All", 
  "Electronics", 
  "Stationery", 
  "Bottles & Mugs", 
  "Keys", 
  "Cards & IDs", 
  "Miscellaneous"
];

export default function MaskedCatalog({ onReportClick, selectedCollege }: MaskedCatalogProps) {
  const { user, isAdmin, triggerAuthGuard } = useAuth();
  const [catalogView, setCatalogView] = useState<"found" | "lost">("found");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "SOLVED">("ACTIVE");
  const [showLostNoticeModal, setShowLostNoticeModal] = useState(false);
  const [rawItems, setRawItems] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeQuizItemId, setActiveQuizItemId] = useState<string | null>(null);
  const [previewDossierItem, setPreviewDossierItem] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);

  const collegeCode = normalizeCollegeCode(selectedCollege);

  // Real-time Firestore onSnapshot listener
  useEffect(() => {
    if (catalogView !== "found") return;

    setLoading(true);
    const unsubscribe = subscribeToItems(collegeCode, (liveList) => {
      setRawItems(liveList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collegeCode, catalogView]);

  // Apply instant client filtering whenever search, category, statusFilter, or real-time items update
  useEffect(() => {
    let list = [...rawItems];

    // Status filter: Active items (pending or available) vs Handed Over (Solved)
    if (statusFilter === "ACTIVE") {
      list = list.filter(i => i.status !== "HANDED_OVER");
    } else {
      list = list.filter(i => i.status === "HANDED_OVER");
    }

    if (selectedCategory !== "All") {
      list = list.filter(i => (i.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i => 
        (i.publicTitle || "").toLowerCase().includes(q) ||
        (i.category || "").toLowerCase().includes(q) ||
        (i.campusZone || "").toLowerCase().includes(q)
      );
    }

    setItems(list.map(item => ({
      id: item.id,
      publicTitle: item.publicTitle,
      category: item.category,
      campusZone: item.campusZone,
      foundAt: item.foundAt || "Recently",
      status: item.status,
      thumbnail: (item.photos && item.photos[0]) || null,
      verificationQuestionsCount: item.verificationQuestions?.length || 3,
      handoverAudit: item.handoverAudit || null,
      claimPass: item.claimPass || null,
      finderEmail: item.finderEmail || null
    })));
  }, [rawItems, selectedCategory, search, statusFilter]);

  const activeCount = rawItems.filter(i => i.status !== "HANDED_OVER").length;
  const solvedCount = rawItems.filter(i => i.status === "HANDED_OVER").length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClaimClick = (itemId: string) => {
    triggerAuthGuard("Verify & Claim Item", () => {
      setActiveQuizItemId(itemId);
    });
  };

  const handlePostNoticeClick = () => {
    triggerAuthGuard("Post Lost Notice", () => {
      setShowLostNoticeModal(true);
    });
  };

  const canModifyItem = (item: any) => {
    if (!user?.email) return false;
    if (isAdmin) return true;
    const userEmailNorm = user.email.trim().toLowerCase();
    const finderEmailNorm = (item.finderEmail || item.reporterEmail || "").trim().toLowerCase();
    return !!finderEmailNorm && userEmailNorm === finderEmailNorm;
  };

  const handleEditClick = (item: any) => {
    triggerAuthGuard("edit item details in Firebase", () => {
      const full = rawItems.find((r) => r.id === item.id) || campusStore.getById(item.id) || item;
      if (!canModifyItem(full)) {
        alert("Unauthorized: Only administrators or the student who reported this item can edit it.");
        return;
      }
      setEditingItem(full);
    });
  };

  const handleDeleteClick = (item: any) => {
    triggerAuthGuard("delete item permanently from Firebase", () => {
      const full = rawItems.find((r) => r.id === item.id) || campusStore.getById(item.id) || item;
      if (!canModifyItem(full)) {
        alert("Unauthorized: Only administrators or the student who reported this item can delete it.");
        return;
      }
      setDeletingItem(full);
    });
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    if (!canModifyItem(deletingItem)) {
      alert("Unauthorized: Only administrators or the student who reported this item can delete it.");
      setDeletingItem(null);
      return;
    }
    await deleteItemFromFirestore(deletingItem.id);
    setDeletingItem(null);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "electronics": return <Laptop className="w-4 h-4 text-[#9F1239]" />;
      case "stationery": return <BookOpen className="w-4 h-4 text-[#9F1239]" />;
      case "bottles & mugs": return <Coffee className="w-4 h-4 text-[#9F1239]" />;
      case "keys": return <Key className="w-4 h-4 text-[#9F1239]" />;
      case "cards & ids": return <CreditCard className="w-4 h-4 text-[#9F1239]" />;
      case "miscellaneous": return <Layers className="w-4 h-4 text-[#9F1239]" />;
      default: return <Package className="w-4 h-4 text-[#9F1239]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
      {/* View Switcher: Found Items vs Student Lost Notices */}
      <div className="bg-white border border-[#F0BFCB] rounded-lg p-2.5 mb-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-[#FFF0F4] p-1 rounded-md border border-[#FECDD6]">
          <button
            onClick={() => setCatalogView("found")}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
              catalogView === "found"
                ? "bg-[#9F1239] text-white shadow-xs"
                : "text-[#4C0519] hover:bg-[#FFE8ED]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Turned-In Catalog (Masked)</span>
          </button>

          <button
            onClick={() => setCatalogView("lost")}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
              catalogView === "lost"
                ? "bg-[#9F1239] text-white shadow-xs"
                : "text-[#4C0519] hover:bg-[#FFE8ED]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Student Lost Notices (Seekers)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handlePostNoticeClick}
            className="flex-1 sm:flex-initial bg-white border border-[#F0BFCB] hover:bg-[#FFE8ED] text-[#4C0519] px-3.5 py-2 text-xs font-bold rounded-md transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-[#9F1239]" />
            <span>Post Lost Notice</span>
          </button>

          <button
            onClick={onReportClick}
            className="flex-1 sm:flex-initial bg-[#9F1239] hover:bg-[#881337] text-white px-3.5 py-2 text-xs font-bold rounded-md transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>+ Report Found Item</span>
          </button>
        </div>
      </div>

      {/* RENDER LOST NOTICES BOARD IF TAB IS SELECTED */}
      {catalogView === "lost" ? (
        <LostNoticesBoard
          collegeCode={collegeCode}
          collegeName={selectedCollege}
          onPostNoticeClick={handlePostNoticeClick}
        />
      ) : (
        <>
          {/* Sub-tabs for Catalog: Active Registry vs Solved / Returned Queries */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white p-2 rounded-lg border border-[#F0BFCB] shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                  statusFilter === "ACTIVE"
                    ? "bg-[#9F1239] text-white shadow-xs"
                    : "bg-[#FFF0F4] text-[#881337] border border-[#FECDD6] hover:bg-[#FFE8ED]"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Active Campus Inventory ({activeCount})</span>
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
                <span>Completed / Solved Queries ({solvedCount})</span>
              </button>
            </div>

            {statusFilter === "SOLVED" && (
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Archived after 6-digit OTP verification & desk physical return
              </span>
            )}
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-md p-4 mb-6 shadow-subtle space-y-3.5">
            <div className="w-full">
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-[#881337] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by category, block, room, or general item type..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-[#FFFDFE]"
                  />
                </div>
              </form>
            </div>

            {/* Category Selector */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#881337] uppercase tracking-wider mr-1">Classification:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                    selectedCategory === cat
                      ? "bg-[#9F1239] text-white border-[#9F1239] shadow-sm font-bold"
                      : "bg-[#FFF4F7] text-[#4C0519] border-[#F0BFCB] hover:bg-[#FFE8ED]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-[#9F1239] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
              <p className="text-xs text-[#881337] font-semibold">Synchronizing with Campus Central Registry...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-[#FFF9FB] border border-[#F0BFCB] p-12 text-center rounded-md">
              {statusFilter === "SOLVED" ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1E1215]">No completed handovers in this view yet</p>
                  <p className="text-xs text-[#881337] mt-1 max-w-md mx-auto">
                    When a belonging is claimed, verified with AI, and the 6-digit OTP is validated by the finder or campus security desk, it is automatically removed from active inventory and archived here.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-[#1E1215]">No records matched the selected query</p>
                  <p className="text-xs text-[#881337] mt-1">Try resetting the category filter or post a lost belonging notice.</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FFFDFE] border border-[#F0BFCB] hover:border-[#BE123C] rounded-lg overflow-hidden flex flex-col justify-between shadow-subtle hover:shadow-elevated transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  {/* Card Top: Masked Photo with Anti-Theft Overlay */}
                  <div className="relative aspect-video bg-[#FFE8ED] overflow-hidden border-b border-[#F0BFCB]">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt="Masked Item"
                        className="w-full h-full object-cover filter blur-md scale-105 group-hover:scale-110 transition-transform duration-500 select-none pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#FFE8ED]">
                        {getCategoryIcon(item.category)}
                      </div>
                    )}

                    {/* Privacy Protection Overlay */}
                    <div className="absolute inset-0 bg-[#1E1215]/20 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-xs text-[#9F1239] px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 shadow-xs border border-[#F0BFCB]">
                        <EyeOff className="w-3.5 h-3.5 text-[#9F1239]" />
                        <span>Photo Masked for Security</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        item.status === "HANDED_OVER"
                          ? "bg-stone-100 text-stone-700 border-stone-300"
                          : item.status === "VERIFIED_PENDING_HANDOVER"
                          ? "bg-amber-50 text-amber-900 border-amber-300"
                          : "bg-white/95 text-[#9F1239] border-[#FECDD6] shadow-xs"
                      }`}>
                        {item.status === "HANDED_OVER" 
                          ? "RETURNED TO OWNER" 
                          : item.status === "VERIFIED_PENDING_HANDOVER" 
                          ? "CLAIM VERIFIED • AT DESK" 
                          : "AVAILABLE AT DESK"}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-[#881337] mb-1">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(item.category)}
                          <span>{item.category}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#A88B92]">CASE #{item.id.substring(item.id.length - 4)}</span>
                      </div>

                      <h3 className="font-bold text-sm text-[#1E1215] leading-snug">
                        {item.publicTitle}
                      </h3>

                      <div className="mt-2.5 space-y-1 text-[11px] text-[#4C0519]">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#9F1239] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{item.campusZone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#881337] shrink-0" />
                          <span>Found: {item.foundAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-[#F2C4CE] space-y-2">
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => setPreviewDossierItem(item)}
                          className="text-left text-[11px] font-semibold text-[#881337] hover:text-[#9F1239] py-1 transition-colors flex items-center gap-1"
                        >
                          <FileSearch className="w-3 h-3" />
                          <span>Case Dossier</span>
                        </button>

                        {canModifyItem(item) && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1 rounded text-[#9F1239] hover:bg-[#FFE8ED] border border-[#F0BFCB] transition-colors flex items-center gap-1 text-[10px] font-bold px-1.5"
                              title="Edit this item permanently in Firebase"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 text-[10px] font-bold px-1.5"
                              title="Delete this item permanently from Firebase"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {item.status === "HANDED_OVER" ? (
                        <div className="bg-emerald-50 border border-emerald-300 rounded-md p-2.5 text-xs text-emerald-950 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>✓ Returned to Verified Owner</span>
                          </div>
                          {item.handoverAudit?.handedOverAt && (
                            <p className="text-[10px] text-emerald-700 font-mono">
                              Resolved at: {item.handoverAudit.handedOverAt}
                            </p>
                          )}
                          {item.handoverAudit?.attendantId && (
                            <p className="text-[10px] text-stone-600 font-mono truncate">
                              Attendant / Desk: {item.handoverAudit.attendantId}
                            </p>
                          )}
                          <div className="pt-0.5">
                            <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-bold inline-block">
                              STATUS: SOLVED & ARCHIVED
                            </span>
                          </div>
                        </div>
                      ) : item.status === "VERIFIED_PENDING_HANDOVER" ? (
                        (() => {
                          const userEmailNorm = (user?.email || "").trim().toLowerCase();
                          const isClaimant = !!userEmailNorm && (item.claimPass?.claimantEmail || "").trim().toLowerCase() === userEmailNorm;
                          const isFinder = !!userEmailNorm && (item.finderEmail || "").trim().toLowerCase() === userEmailNorm;

                          if (isClaimant) {
                            return (
                              <button
                                onClick={() => handleClaimClick(item.id)}
                                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>My Claim Pass & Chat (Active)</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            );
                          }

                          if (isFinder) {
                            return (
                              <button
                                onClick={() => handleClaimClick(item.id)}
                                className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Claimed • Chat with Verified Owner</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            );
                          }

                          if (isAdmin) {
                            return (
                              <button
                                onClick={() => handleClaimClick(item.id)}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Admin View • Handover Details</span>
                              </button>
                            );
                          }

                          // Locked and private for all other students
                          return (
                            <div className="w-full bg-[#FFF5F8] border border-[#F2C4CE] text-[#881337] text-xs font-semibold py-2 px-3 rounded-md flex items-center justify-center gap-1.5 cursor-not-allowed shadow-2xs">
                              <Lock className="w-3.5 h-3.5 text-[#9F1239]" />
                              <span>Claimed • Handover In Progress (Private)</span>
                            </div>
                          );
                        })()
                      ) : (
                        <button
                          onClick={() => handleClaimClick(item.id)}
                          className="w-full bg-[#9F1239] hover:bg-[#881337] text-white text-xs font-bold py-2 rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-[#9F1239]/20"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify & Claim Item</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Case Dossier Modal */}
      {previewDossierItem && (
        <div className="fixed inset-0 z-50 bg-[#1E1215]/60 flex items-center justify-center p-4">
          <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-md max-w-lg w-full p-6 shadow-elevated relative">
            <div className="flex items-start justify-between border-b border-[#F2C4CE] pb-3 mb-4">
              <div>
                <span className="font-mono text-[10px] text-[#9F1239] font-bold uppercase tracking-wider bg-[#FFE4E8] px-2 py-0.5 rounded border border-[#FECDD6]">
                  CASE DOSSIER #{previewDossierItem.id.toUpperCase()}
                </span>
                <h3 className="text-base font-bold text-[#1E1215] mt-1">{previewDossierItem.publicTitle}</h3>
              </div>
              <button
                onClick={() => setPreviewDossierItem(null)}
                className="text-[#881337] text-sm font-bold hover:text-[#1E1215]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#FFFDFE] border border-[#F0BFCB] p-3 rounded-md space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#881337]">Institutional Location:</span>
                  <span className="font-medium text-[#1E1215]">{previewDossierItem.campusZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#881337]">Custody Status:</span>
                  <span className="font-bold text-[#9F1239]">{previewDossierItem.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#881337]">Logged Timestamp:</span>
                  <span className="font-mono text-[#1E1215]">{previewDossierItem.foundAt}</span>
                </div>
              </div>

              <div className="bg-[#FFF0F4] border border-[#FECDD6] p-3 rounded-md text-[#881337] text-[11px] leading-relaxed">
                Photos and fine-grained visual details are masked. If you are the owner, initiate the verification challenge to answer memory questions and unlock the item.
              </div>

              <button
                onClick={() => {
                  const id = previewDossierItem.id;
                  setPreviewDossierItem(null);
                  handleClaimClick(id);
                }}
                className="w-full bg-[#9F1239] text-white py-2 text-xs font-bold rounded-md hover:bg-[#881337] transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Begin Verification Challenge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Lost Belonging Notice Modal */}
      {showLostNoticeModal && (
        <div className="fixed inset-0 z-50 bg-[#1E1215]/75 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-lg max-w-2xl w-full shadow-elevated relative my-4 sm:my-8 overflow-hidden">
            <div className="sticky top-0 z-20 bg-[#FFF9FB]/95 backdrop-blur-md px-5 py-4 border-b border-[#F2C4CE] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E1215]">Post Lost Belonging Notice</h3>
                <p className="text-xs text-[#881337]">Campus finders can cross-reference your notice if found.</p>
              </div>
              <button
                onClick={() => setShowLostNoticeModal(false)}
                className="text-[#881337] hover:text-[#1E1215] text-lg font-bold p-1 hover:bg-[#FFE8ED] rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <LostNoticeForm
                collegeCode={collegeCode}
                collegeName={selectedCollege}
                onSuccess={() => {
                  setShowLostNoticeModal(false);
                  setCatalogView("lost");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {activeQuizItemId && (
        <QuizModal
          itemId={activeQuizItemId}
          onClose={() => setActiveQuizItemId(null)}
          onSuccessClaim={() => {
            // Keep modal open to show verified OTP and live chat!
            setItems(campusStore.getAll(selectedCollege));
          }}
        />
      )}

      {/* Live Firebase Edit Modal */}
      {editingItem && (
        <ItemEditModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
          }}
        />
      )}

      {/* Live Firebase Delete Confirmation Modal */}
      {deletingItem && (
        <DeleteConfirmModal
          isOpen={!!deletingItem}
          title="Delete Belonging from Campus Catalog"
          itemLabel={deletingItem.publicTitle || "Selected Belonging"}
          onClose={() => setDeletingItem(null)}
          onConfirm={confirmDeleteItem}
        />
      )}
    </div>
  );
}
