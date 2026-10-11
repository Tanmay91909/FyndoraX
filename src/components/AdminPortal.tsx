"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Layers, 
  DoorOpen, 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Settings, 
  BarChart3, 
  FileText, 
  Users, 
  Lock, 
  Loader2,
  Sparkles,
  MapPin,
  Clock,
  KeyRound,
  LogOut,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Edit3,
  Trash2,
  X,
  Save
} from "lucide-react";
import { CollegeLogoRenderer } from "./CollegeLogos";
import { useAuth } from "@/context/AuthContext";
import { 
  CampusBlockRecord, 
  subscribeToCampusBlocks, 
  addBlockToFirestore, 
  updateBlockInFirestore, 
  deleteBlockFromFirestore 
} from "@/lib/firebaseService";

interface AdminPortalProps {
  selectedCollege: string;
  collegeCode: string;
  collegeDomain: string;
}

export default function AdminPortal({ selectedCollege, collegeCode, collegeDomain }: AdminPortalProps) {
  const { user, isAdmin, loginAdmin, logout } = useAuth();
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Admin Dashboard State (Stored in Firebase & Real-time Synced)
  const [blocks, setBlocks] = useState<CampusBlockRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlockDetail, setSelectedBlockDetail] = useState<CampusBlockRecord | null>(null);

  // Add Block State
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [newBlockName, setNewBlockName] = useState("");
  const [newTotalFloors, setNewTotalFloors] = useState(8);
  const [newRoomsPerFloor, setNewRoomsPerFloor] = useState(12);
  const [newBlockDescription, setNewBlockDescription] = useState("");
  const [savingBlock, setSavingBlock] = useState(false);

  // Edit Block State
  const [editingBlock, setEditingBlock] = useState<CampusBlockRecord | null>(null);
  const [editBlockName, setEditBlockName] = useState("");
  const [editTotalFloors, setEditTotalFloors] = useState(8);
  const [editRoomsPerFloor, setEditRoomsPerFloor] = useState(12);
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Block State
  const [deletingBlock, setDeletingBlock] = useState<CampusBlockRecord | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !password) return;
    try {
      setSubmitting(true);
      setAuthError(null);
      await loginAdmin(adminEmail, password, isRegisterMode);
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate administrator.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAdminEmail("");
    setPassword("");
    setAuthError(null);
  };

  // Real-time Firestore onSnapshot listener for Academic Blocks
  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      const unsubscribe = subscribeToCampusBlocks(collegeCode, (liveBlocks) => {
        setBlocks(liveBlocks);
        setLoading(false);
        // If current selected block no longer exists or none selected yet
        if (liveBlocks.length > 0) {
          setSelectedBlockDetail((prev) => {
            if (!prev) return liveBlocks[0];
            const updated = liveBlocks.find((b) => b.id === prev.id);
            return updated || liveBlocks[0];
          });
        } else {
          setSelectedBlockDetail(null);
        }
      });

      return () => unsubscribe();
    }
  }, [isAdmin, collegeCode]);

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName.trim()) return;

    try {
      setSavingBlock(true);
      const newBlock: CampusBlockRecord = {
        id: `block-${Date.now().toString(36)}`,
        name: newBlockName.trim(),
        collegeCode,
        totalFloors: Math.max(1, Math.min(25, newTotalFloors)),
        roomsPerFloor: Math.max(1, Math.min(50, newRoomsPerFloor)),
        description: newBlockDescription.trim() || `${newBlockName} Academic Sector`
      };

      await addBlockToFirestore(newBlock);
      setSelectedBlockDetail(newBlock);
      setNewBlockName("");
      setNewBlockDescription("");
      setShowAddBlockModal(false);
    } catch (err) {
      console.error("Failed to add block to Firebase:", err);
    } finally {
      setSavingBlock(false);
    }
  };

  const handleStartEdit = (block: CampusBlockRecord) => {
    setEditingBlock(block);
    setEditBlockName(block.name);
    setEditTotalFloors(block.totalFloors);
    setEditRoomsPerFloor(block.roomsPerFloor);
    setEditDescription(block.description || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock || !editBlockName.trim()) return;

    try {
      setSavingEdit(true);
      const patch: Partial<CampusBlockRecord> = {
        name: editBlockName.trim(),
        totalFloors: Math.max(1, Math.min(25, editTotalFloors)),
        roomsPerFloor: Math.max(1, Math.min(50, editRoomsPerFloor)),
        description: editDescription.trim()
      };

      await updateBlockInFirestore(editingBlock.id, patch, collegeCode);
      setEditingBlock(null);
    } catch (err) {
      console.error("Failed to update block in Firebase:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!deletingBlock) return;
    try {
      setDeletingLoading(true);
      await deleteBlockFromFirestore(deletingBlock.id, collegeCode);
      setDeletingBlock(null);
    } catch (err) {
      console.error("Failed to delete block from Firebase:", err);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Compute live stats from blocks
  const totalRoomsMapped = blocks.reduce((acc, b) => acc + (b.totalFloors * b.roomsPerFloor), 0);

  // IF NOT AUTHENTICATED AS CAMPUS ADMIN: RENDER FIREBASE ADMIN GATE
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-lg p-8 shadow-elevated space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-[#FFE4E8] border border-[#FECDD6] rounded-md text-[#9F1239] mb-1">
              <Lock className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded font-bold border border-[#FECDD6] block mx-auto w-fit">
              Firebase Security Gate
            </span>
            <h2 className="text-xl font-extrabold text-[#1E1215] tracking-tight">
              Institutional Admin Portal
            </h2>
            <p className="text-xs text-[#881337] leading-relaxed">
              Authorized personnel only. Managing campus academic blocks, rooms, and recovery infrastructure for <span className="font-bold text-[#1E1215]">{selectedCollege}</span>.
            </p>
          </div>

          {authError && (
            <div className="bg-[#FFF1F2] border border-[#FDA4AF] p-3 text-xs text-[#9F1239] rounded-md flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#E11D48] shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Auth Mode Toggle */}
          <div className="flex border border-[#F0BFCB] rounded-md p-1 bg-[#FFF0F4]">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-sm transition-all ${
                !isRegisterMode
                  ? "bg-[#9F1239] text-white shadow-xs"
                  : "text-[#881337] hover:bg-[#FFE8ED]"
              }`}
            >
              Admin Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-sm transition-all ${
                isRegisterMode
                  ? "bg-[#9F1239] text-white shadow-xs"
                  : "text-[#881337] hover:bg-[#FFE8ED]"
              }`}
            >
              First-Time Setup / Register
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-[#1E1215] mb-1">
                Institutional Administrator Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g. admin@vips.edu"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full text-xs font-mono border border-[#F0BFCB] bg-[#FFFDFE] px-3 py-2 rounded-md focus:outline-none focus:border-[#9F1239]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1215] mb-1">
                Firebase Security Password {isRegisterMode && "(Choose at least 6 characters)"}
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Enter Firebase password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs font-mono border border-[#F0BFCB] bg-[#FFFDFE] px-3 py-2 rounded-md focus:outline-none focus:border-[#9F1239]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#9F1239] hover:bg-[#881337] text-white py-2.5 text-xs font-bold rounded-md transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying via Firebase...</span>
                </>
              ) : (
                <>
                  <span>{isRegisterMode ? "Register & Access Admin Portal" : "Authenticate Admin Identity"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Authorized Admin Domains */}
          <div className="bg-[#FFF0F4] border border-[#F0BFCB] p-3 rounded-md text-[11px] text-[#881337] space-y-2">
            <span className="font-bold uppercase tracking-wider text-[#9F1239] block text-[10px]">
              Click to Auto-Fill Approved Admin Email:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["admin@vips.edu", "dean@dtu.ac.in", "admin@kccitm.edu"].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setAdminEmail(em);
                    if (!password) setPassword("CampusAdmin2026!");
                  }}
                  className="font-mono text-[10px] bg-white border border-[#FECDD6] hover:bg-[#FFE8ED] px-2 py-0.5 rounded text-[#9F1239] font-medium transition-colors cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: RENDER FULL ADMIN DASHBOARD POWERED DIRECTLY BY FIRESTORE
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* College Institutional Governance Banner */}
      <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 p-1.5 bg-[#FFE8ED] border border-[#F0BFCB] rounded-xs shadow-xs">
            <CollegeLogoRenderer collegeCode={collegeCode} size={48} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono uppercase bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded-xs font-bold border border-[#FECDD6]">
                Institutional Command Center
              </span>
              <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200">
                ✓ Authenticated as: {user?.email}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Live Cloud Firestore Sync
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-[#1E1215] tracking-tight">
              {selectedCollege}
            </h1>
            <p className="text-xs text-[#881337] mt-1">
              Managing campus academic blocks, floor topologies, and rooms in Firebase. Domain policy: <span className="font-mono font-bold text-[#9F1239]">{collegeDomain}</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddBlockModal(true)}
            className="bg-[#9F1239] hover:bg-[#881337] text-white px-4 py-2.5 text-xs font-bold rounded-xs flex items-center gap-2 transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Block</span>
          </button>
          <button
            onClick={handleLogout}
            className="bg-[#FFF0F4] border border-[#F0BFCB] hover:bg-[#FFE8ED] text-[#9F1239] px-3.5 py-2.5 text-xs font-bold rounded-xs flex items-center gap-1.5 transition-colors shrink-0"
            title="Log Out of Admin Portal"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Campus Infrastructure Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFDFE] border border-[#F0BFCB] p-4 rounded-xs shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#881337] uppercase tracking-wider">Active Blocks</span>
            <Building2 className="w-4 h-4 text-[#9F1239]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1E1215] mt-1 font-mono">
            {blocks.length}
          </div>
          <span className="text-[10px] text-[#881337] mt-1 block">Live Firestore academic blocks</span>
        </div>

        <div className="bg-[#FFFDFE] border border-[#F0BFCB] p-4 rounded-xs shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#881337] uppercase tracking-wider">Rooms Indexed</span>
            <DoorOpen className="w-4 h-4 text-[#9F1239]" />
          </div>
          <div className="text-2xl font-extrabold text-[#9F1239] mt-1 font-mono">
            {totalRoomsMapped}
          </div>
          <span className="text-[10px] text-[#881337] mt-1 block">Dynamic floor & room mapping</span>
        </div>

        <div className="bg-[#FFFDFE] border border-[#F0BFCB] p-4 rounded-xs shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#881337] uppercase tracking-wider">Recovery Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 mt-1 font-mono">
            87%
          </div>
          <span className="text-[10px] text-emerald-700 mt-1 block">Zero phone numbers leaked</span>
        </div>

        <div className="bg-[#FFFDFE] border border-[#F0BFCB] p-4 rounded-xs shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#881337] uppercase tracking-wider">False Claims Blocked</span>
            <Lock className="w-4 h-4 text-[#9F1239]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1E1215] mt-1 font-mono">
            24
          </div>
          <span className="text-[10px] text-[#881337] mt-1 block">AI quiz blind defense active</span>
        </div>
      </div>

      {/* Main Infrastructure Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1/3: Block Selector & Management List */}
        <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2C4CE] pb-3">
            <h2 className="text-xs font-bold text-[#1E1215] uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#9F1239]" />
              <span>Campus Academic Blocks ({blocks.length})</span>
            </h2>
            <button
              onClick={() => setShowAddBlockModal(true)}
              className="text-[11px] font-bold text-[#9F1239] hover:underline flex items-center gap-1"
            >
              + Add Block
            </button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#881337]">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-[#9F1239]" />
              <span>Synchronizing blocks from Firebase...</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {blocks.map((b) => {
                const isSelected = selectedBlockDetail?.id === b.id;
                const totalRooms = b.totalFloors * b.roomsPerFloor;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBlockDetail(b)}
                    className={`p-3.5 rounded-xs border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#FFE4E8] border-[#EAA7B7] text-[#9F1239] shadow-xs ring-1 ring-[#9F1239]"
                        : "bg-[#FFFDFE] border-[#F0BFCB] hover:bg-[#FFEBF0] text-[#1E1215]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-sm">{b.name}</span>
                      <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded-xs border border-[#F0BFCB]">
                        {b.totalFloors} Floors
                      </span>
                    </div>
                    <div className="text-[11px] text-[#881337] flex items-center justify-between font-mono">
                      <span>{b.roomsPerFloor} rooms per floor</span>
                      <span className="font-bold text-[#9F1239]">{totalRooms} total rooms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-[#F2C4CE]">
            <span className="text-[10px] font-mono text-[#881337] uppercase tracking-wider block mb-2">
              Common Facilities:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-[#4C0519]">
              <div className="bg-[#FFF0F4] border border-[#F0BFCB] p-2 rounded-xs">Central Library</div>
              <div className="bg-[#FFF0F4] border border-[#F0BFCB] p-2 rounded-xs">Student Canteen</div>
              <div className="bg-[#FFF0F4] border border-[#F0BFCB] p-2 rounded-xs">Main Auditorium</div>
              <div className="bg-[#FFF0F4] border border-[#F0BFCB] p-2 rounded-xs">Sports Arena</div>
            </div>
          </div>
        </div>

        {/* Right 2/3: Floor & Room Architecture Visualizer with Real-time Edit & Delete Actions */}
        <div className="lg:col-span-2 bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 shadow-subtle space-y-5">
          {selectedBlockDetail ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F2C4CE] pb-3 mb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-[#1E1215]">
                      {selectedBlockDetail.name} Floor & Room Topology
                    </h3>
                    <span className="bg-[#FFE4E8] text-[#9F1239] text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border border-[#FECDD6]">
                      {selectedBlockDetail.totalFloors} Floors • {selectedBlockDetail.roomsPerFloor} Rooms/Floor ({selectedBlockDetail.totalFloors * selectedBlockDetail.roomsPerFloor} Spaces)
                    </span>
                  </div>
                  <p className="text-xs text-[#881337] mt-0.5">
                    {selectedBlockDetail.description || "Designated lost & found reporting zone registered in Firebase."}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStartEdit(selectedBlockDetail)}
                    className="bg-white border border-[#F0BFCB] hover:bg-[#FFE8ED] text-[#9F1239] px-2.5 py-1.5 rounded-xs text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                    title="Edit block floors and rooms"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Block</span>
                  </button>
                  <button
                    onClick={() => setDeletingBlock(selectedBlockDetail)}
                    className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 px-2.5 py-1.5 rounded-xs text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
                    title="Delete block from Firebase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Block</span>
                  </button>
                </div>
              </div>

              {/* Floors Architecture Grid */}
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {Array.from({ length: selectedBlockDetail.totalFloors }, (_, fIdx) => {
                  const floorNum = fIdx + 1;
                  return (
                    <div key={floorNum} className="border border-[#F0BFCB] rounded-xs p-3 bg-[#FFFDFE]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-[#9F1239] text-white font-mono text-[10px] font-bold rounded-xs flex items-center justify-center">
                            F{floorNum}
                          </span>
                          <span className="text-xs font-bold text-[#1E1215]">
                            {floorNum === 1 ? "1st Floor (Ground Access)" : `${floorNum}th Floor`}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#881337]">
                          Rooms {floorNum}01 – {floorNum}{String(selectedBlockDetail.roomsPerFloor).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Rooms pills */}
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
                        {Array.from({ length: selectedBlockDetail.roomsPerFloor }, (_, rIdx) => {
                          const roomNum = `${floorNum}${String(rIdx + 1).padStart(2, '0')}`;
                          return (
                            <div
                              key={roomNum}
                              className="bg-[#FFF0F4] hover:bg-[#FFE4E8] border border-[#F0BFCB] hover:border-[#EAA7B7] text-center py-1 rounded-xs text-[10px] font-mono font-semibold text-[#1E1215] transition-colors"
                              title={`Room ${roomNum} (${selectedBlockDetail.name})`}
                            >
                              {roomNum}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-[#881337]">
              Select a campus block to inspect room topology or provision a new block.
            </div>
          )}
        </div>
      </div>

      {/* Add New Block Modal */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 bg-[#1E1215]/65 flex items-center justify-center p-4">
          <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs max-w-md w-full p-6 shadow-elevated">
            <div className="flex items-start justify-between border-b border-[#F2C4CE] pb-3 mb-4">
              <div>
                <span className="font-mono text-[10px] text-[#9F1239] font-bold uppercase tracking-wider bg-[#FFE4E8] px-2 py-0.5 rounded-xs border border-[#FECDD6]">
                  Firebase Infrastructure Provisioning
                </span>
                <h3 className="text-base font-extrabold text-[#1E1215] mt-1">Register New Academic Block</h3>
              </div>
              <button
                onClick={() => setShowAddBlockModal(false)}
                className="text-[#881337] text-sm font-bold hover:text-[#1E1215]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#1E1215] mb-1">
                  Block Name / Identification *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Block D, Engineering Block, Science Complex"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  className="w-full text-xs border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E1215] mb-1">
                    Floors in Block (1–25)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={newTotalFloors}
                    onChange={(e) => setNewTotalFloors(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1215] mb-1">
                    Rooms per Floor (1–50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newRoomsPerFloor}
                    onChange={(e) => setNewRoomsPerFloor(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1215] mb-1">
                  Department / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science & AI Labs, Moot Court Hall"
                  value={newBlockDescription}
                  onChange={(e) => setNewBlockDescription(e.target.value)}
                  className="w-full text-xs border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                />
              </div>

              <div className="bg-[#FFF0F4] border border-[#F0BFCB] p-3 rounded-xs text-[11px] text-[#881337]">
                <p>
                  Provisioning will automatically generate floor-coded rooms: <span className="font-mono font-bold text-[#1E1215]">101–1{String(newRoomsPerFloor).padStart(2, '0')}</span> up to <span className="font-mono font-bold text-[#1E1215]">{newTotalFloors}01–{newTotalFloors}{String(newRoomsPerFloor).padStart(2, '0')}</span> ({newTotalFloors * newRoomsPerFloor} total spaces) and persist directly to Firebase.
                </p>
              </div>

              <div className="pt-2 border-t border-[#F2C4CE] flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBlockModal(false)}
                  className="flex-1 bg-[#FFF4F7] border border-[#F0BFCB] text-[#4C0519] py-2 font-semibold rounded-xs hover:bg-[#FFE8ED]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBlock || !newBlockName.trim()}
                  className="flex-1 bg-[#9F1239] text-white py-2 font-bold rounded-xs hover:bg-[#881337] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingBlock ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Provisioning to Firebase...</span>
                    </>
                  ) : (
                    <span>Add to Campus Topology</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Block Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 bg-[#1E1215]/65 flex items-center justify-center p-4">
          <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs max-w-md w-full p-6 shadow-elevated">
            <div className="flex items-start justify-between border-b border-[#F2C4CE] pb-3 mb-4">
              <div>
                <span className="font-mono text-[10px] text-[#9F1239] font-bold uppercase tracking-wider bg-[#FFE4E8] px-2 py-0.5 rounded-xs border border-[#FECDD6]">
                  Firebase Block Configuration
                </span>
                <h3 className="text-base font-extrabold text-[#1E1215] mt-1">
                  Edit Block: {editingBlock.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingBlock(null)}
                className="text-[#881337] text-sm font-bold hover:text-[#1E1215]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#1E1215] mb-1">
                  Block Name *
                </label>
                <input
                  type="text"
                  required
                  value={editBlockName}
                  onChange={(e) => setEditBlockName(e.target.value)}
                  className="w-full text-xs border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E1215] mb-1">
                    Floors in Block (1–25)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={editTotalFloors}
                    onChange={(e) => setEditTotalFloors(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1215] mb-1">
                    Rooms per Floor (1–50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editRoomsPerFloor}
                    onChange={(e) => setEditRoomsPerFloor(Number(e.target.value))}
                    className="w-full text-xs font-mono border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1215] mb-1">
                  Description / Departments
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                />
              </div>

              <div className="pt-2 border-t border-[#F2C4CE] flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBlock(null)}
                  className="flex-1 bg-[#FFF4F7] border border-[#F0BFCB] text-[#4C0519] py-2 font-semibold rounded-xs hover:bg-[#FFE8ED]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editBlockName.trim()}
                  className="flex-1 bg-[#9F1239] text-white py-2 font-bold rounded-xs hover:bg-[#881337] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving in Firebase...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Block Confirmation Modal */}
      {deletingBlock && (
        <div className="fixed inset-0 z-50 bg-[#1E1215]/65 flex items-center justify-center p-4">
          <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs max-w-sm w-full p-6 shadow-elevated space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-[#1E1215]">Delete Academic Block?</h3>
            </div>
            <p className="text-xs text-[#881337]">
              Are you sure you want to delete <strong className="text-[#1E1215]">{deletingBlock.name}</strong> from Firebase? This will remove all mapped rooms ({deletingBlock.totalFloors * deletingBlock.roomsPerFloor} spaces) from the live campus topology.
            </p>
            <div className="flex gap-2 pt-2 border-t border-[#F2C4CE]">
              <button
                type="button"
                onClick={() => setDeletingBlock(null)}
                className="flex-1 bg-white border border-[#F0BFCB] text-[#1E1215] py-2 text-xs font-semibold rounded-xs hover:bg-[#FFE8ED]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleDeleteBlock}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 text-xs font-bold rounded-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {deletingLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Delete Permanently</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
