"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Save, 
  Loader2, 
  AlertCircle, 
  Tag, 
  MapPin, 
  HelpCircle, 
  ShieldCheck, 
  Layers,
  Sparkles,
  Lock
} from "lucide-react";
import { LostItem, ItemCategory } from "@/lib/store";
import { updateItemInFirestore } from "@/lib/firebaseService";
import { useAuth } from "@/context/AuthContext";

interface ItemEditModalProps {
  item: LostItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedItem: LostItem) => void;
}

const CATEGORIES: ItemCategory[] = [
  "Electronics",
  "Stationery",
  "Bottles & Mugs",
  "Keys",
  "Cards & IDs",
  "Miscellaneous"
];

export default function ItemEditModal({
  item,
  isOpen,
  onClose,
  onSaved
}: ItemEditModalProps) {
  const { user, isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("Miscellaneous");
  const [campusZone, setCampusZone] = useState("");
  const [status, setStatus] = useState<LostItem["status"]>("MASKED_AVAILABLE");
  const [questions, setQuestions] = useState<string[]>(["", "", ""]);
  const [brandModel, setBrandModel] = useState("");
  const [stickersMarkings, setStickersMarkings] = useState("");
  const [defectsDamage, setDefectsDamage] = useState("");

  useEffect(() => {
    if (item) {
      setTitle(item.publicTitle || "");
      setCategory(item.category || "Miscellaneous");
      setCampusZone(item.campusZone || "");
      setStatus(item.status || "MASKED_AVAILABLE");
      
      const q = item.verificationQuestions || [];
      setQuestions([
        q[0] || "What specific brand name or logo is on this item?",
        q[1] || "Describe any unique markings, stickers, or attachments.",
        q[2] || "What color is the exterior finish or cover?"
      ]);

      const gt = item.secretGroundTruth || ({} as any);
      setBrandModel(gt.brandAndExactModel || "");
      setStickersMarkings(gt.uniqueStickersOrMarkings || "");
      setDefectsDamage(gt.physicalDefectsOrDamage || "");
      setError(null);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Item title is required");
      return;
    }

    const userEmailNorm = (user?.email || "").trim().toLowerCase();
    const finderEmailNorm = (item.finderEmail || (item as any).reporterEmail || "").trim().toLowerCase();
    if (!isAdmin && (!userEmailNorm || userEmailNorm !== finderEmailNorm)) {
      setError("Unauthorized: Only administrators or the student who reported this item can save changes.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updatedPatch: Partial<LostItem> = {
        publicTitle: title.trim(),
        category,
        campusZone: campusZone.trim(),
        status,
        verificationQuestions: questions.map((q) => q.trim()).filter(Boolean),
        secretGroundTruth: {
          ...item.secretGroundTruth,
          brandAndExactModel: brandModel.trim(),
          uniqueStickersOrMarkings: stickersMarkings.trim(),
          physicalDefectsOrDamage: defectsDamage.trim()
        },
        publicMetadata: {
          ...item.publicMetadata,
          broadCategory: category,
          itemType: title.trim()
        }
      };

      await updateItemInFirestore(item.id, updatedPatch);
      const updatedFull = { ...item, ...updatedPatch } as LostItem;
      if (onSaved) onSaved(updatedFull);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update item in Firebase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1215]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-lg max-w-2xl w-full shadow-2xl relative my-6 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#FFF0F4] border-b border-[#F0BFCB] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded border border-[#FECDD6] uppercase">
                Live Firebase Sync
              </span>
              <span className="text-xs text-[#881337] font-mono">Case #{item.id.slice(-6)}</span>
            </div>
            <h3 className="text-base font-extrabold text-[#1E1215] mt-1">
              Edit Catalog Belonging
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#881337] hover:text-[#1E1215] p-1.5 rounded-md hover:bg-[#FFE4E8] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-md text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#1E1215] block mb-1">
                Item Public Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs border border-[#F0BFCB] rounded-md px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
                placeholder="e.g. Matte Black Wireless Earbuds"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1E1215] block mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full text-xs border border-[#F0BFCB] rounded-md px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#1E1215] flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#9F1239]" />
                <span>Campus Location / Zone</span>
              </label>
              <input
                type="text"
                value={campusZone}
                onChange={(e) => setCampusZone(e.target.value)}
                className="w-full text-xs border border-[#F0BFCB] rounded-md px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
                placeholder="e.g. Block A • Floor 2 • Room 204"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1E1215] block mb-1">
                Custody Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs border border-[#F0BFCB] rounded-md px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
              >
                <option value="MASKED_AVAILABLE">AVAILABLE AT DESK (Masked)</option>
                <option value="IN_VERIFICATION">IN VERIFICATION</option>
                <option value="VERIFIED_PENDING_HANDOVER">CLAIM VERIFIED • AT DESK</option>
                <option value="HANDED_OVER">RETURNED TO OWNER (Closed)</option>
              </select>
            </div>
          </div>

          {/* AI Forensic Questions */}
          <div className="bg-[#FFF8FA] border border-[#F0BFCB] rounded-md p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#9F1239]" />
              <span className="text-xs font-bold text-[#1E1215]">
                Verification Quiz Questions (Answered by Claimants)
              </span>
            </div>
            <p className="text-[11px] text-[#881337]">
              Only the true owner who misplaced the item should be able to answer these questions from memory.
            </p>

            <div className="space-y-2 pt-1">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#FFE4E8] text-[#9F1239] text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[idx] = e.target.value;
                      setQuestions(updated);
                    }}
                    className="flex-1 text-xs border border-[#F0BFCB] rounded px-2.5 py-1.5 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
                    placeholder={`Verification Question ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Secret Ground Truth (Used by AI evaluation) */}
          <div className="bg-[#FFF4F7] border border-[#FECDD6] rounded-md p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#9F1239]" />
              <span className="text-xs font-bold text-[#1E1215]">
                Secret Forensic Ground Truth (Never Publicly Displayed)
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-[#881337] block mb-0.5">
                  Exact Brand, Model & Sub-variant:
                </label>
                <input
                  type="text"
                  value={brandModel}
                  onChange={(e) => setBrandModel(e.target.value)}
                  className="w-full text-xs border border-[#F0BFCB] rounded px-2.5 py-1.5 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
                  placeholder="e.g. boAt Airdopes 141 or Casio fx-991EX"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#881337] block mb-0.5">
                  Unique Markings, Stickers or Decals:
                </label>
                <input
                  type="text"
                  value={stickersMarkings}
                  onChange={(e) => setStickersMarkings(e.target.value)}
                  className="w-full text-xs border border-[#F0BFCB] rounded px-2.5 py-1.5 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
                  placeholder="e.g. Small yellow smiley sticker on bottom case"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#881337] block mb-0.5">
                  Physical Defects, Scratches or Wear:
                </label>
                <input
                  type="text"
                  value={defectsDamage}
                  onChange={(e) => setDefectsDamage(e.target.value)}
                  className="w-full text-xs border border-[#F0BFCB] rounded px-2.5 py-1.5 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
                  placeholder="e.g. Hairline scratch across the left hinge"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="bg-[#FFF0F4] border-t border-[#F0BFCB] px-5 py-3 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-[#F0BFCB] bg-white text-[#4C0519] hover:bg-[#FFE8ED] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-bold rounded-md bg-[#9F1239] hover:bg-[#881337] text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firebase...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
