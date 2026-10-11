"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Save, Loader2, AlertCircle, MapPin, Calendar, FileText, Camera, Upload, Trash2 } from "lucide-react";
import { LostNoticeRecord, updateLostNoticeInFirestore } from "@/lib/firebaseService";
import { compressImageFile } from "@/lib/imageUtils";
import { useAuth } from "@/context/AuthContext";

interface NoticeEditModalProps {
  notice: LostNoticeRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedNotice: LostNoticeRecord) => void;
}

export default function NoticeEditModal({
  notice,
  isOpen,
  onClose,
  onSaved
}: NoticeEditModalProps) {
  const { user, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Miscellaneous");
  const [campusZone, setCampusZone] = useState("");
  const [lostDate, setLostDate] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [status, setStatus] = useState<"OPEN" | "FOUND" | "CLOSED">("OPEN");
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (notice) {
      setTitle(notice.title || "");
      setCategory(notice.category || "Miscellaneous");
      setCampusZone(notice.campusZone || "");
      setLostDate(notice.lostDate || "");
      setDescription(notice.description || "");
      setContactPhone(notice.contactPhone || "");
      setPhotoUrl(notice.photoUrl || "");
      setStatus(notice.status || "OPEN");
      setError(null);
    }
  }, [notice, isOpen]);

  if (!isOpen || !notice) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    try {
      setIsCompressing(true);
      setError(null);
      const compressed = await compressImageFile(file, 960, 960, 0.82);
      setPhotoUrl(compressed);
    } catch (err: any) {
      setError(err?.message || "Failed to process photo");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const userEmailNorm = (user?.email || "").trim().toLowerCase();
    const ownerEmailNorm = (notice.ownerEmail || (notice as any).creatorEmail || "").trim().toLowerCase();
    if (!isAdmin && (!userEmailNorm || userEmailNorm !== ownerEmailNorm)) {
      setError("Unauthorized: Only administrators or the student who posted this notice can save changes.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const patch: Partial<LostNoticeRecord> = {
        title: title.trim(),
        category,
        campusZone: campusZone.trim(),
        lostDate: lostDate.trim(),
        description: description.trim(),
        contactPhone: contactPhone.trim(),
        photoUrl: photoUrl.trim(),
        status
      };

      await updateLostNoticeInFirestore(notice.id, patch, notice.collegeCode);
      if (onSaved) onSaved({ ...notice, ...patch });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to update notice in Firebase");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1215]/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-lg max-w-lg w-full shadow-2xl overflow-hidden flex flex-col my-4">
        <div className="bg-[#FFF0F4] border-b border-[#F0BFCB] px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded border border-[#FECDD6] uppercase">
              Notice Edit
            </span>
            <h3 className="text-base font-extrabold text-[#1E1215] mt-1">
              Edit Lost Belonging Notice
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#881337] hover:text-[#1E1215] p-1.5 rounded hover:bg-[#FFE8ED]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-3.5">
          {error && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-[#1E1215] block mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs border border-[#F0BFCB] rounded px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#1E1215] block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs border border-[#F0BFCB] rounded px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
              >
                <option value="Electronics">Electronics</option>
                <option value="Stationery">Stationery</option>
                <option value="Bottles & Mugs">Bottles & Mugs</option>
                <option value="Keys">Keys</option>
                <option value="Cards & IDs">Cards & IDs</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1E1215] block mb-1">
                Notice Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs border border-[#F0BFCB] rounded px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
              >
                <option value="OPEN">SEARCHING (OPEN)</option>
                <option value="FOUND">RECOVERED (FOUND)</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1E1215] block mb-1">
              Last Seen Location / Zone
            </label>
            <input
              type="text"
              value={campusZone}
              onChange={(e) => setCampusZone(e.target.value)}
              className="w-full text-xs border border-[#F0BFCB] rounded px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1E1215] block mb-1">
              Approximate Date / Time Lost
            </label>
            <input
              type="text"
              value={lostDate}
              onChange={(e) => setLostDate(e.target.value)}
              className="w-full text-xs border border-[#F0BFCB] rounded px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
            />
          </div>

          {/* Photo Upload / Change Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1E1215] block">
              Reference Photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {photoUrl ? (
              <div className="flex items-center gap-3 p-2.5 bg-[#FFF5F8] border border-[#F0BFCB] rounded-md">
                <img
                  src={photoUrl}
                  alt="Notice"
                  className="w-14 h-14 object-cover rounded border border-[#FECDD6]"
                />
                <div className="flex-1 text-xs">
                  <span className="font-semibold text-[#1E1215] block">Current Photo Attached</span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#9F1239] font-bold hover:underline"
                    >
                      Replace Photo
                    </button>
                    <span className="text-[#F0BFCB]">•</span>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl("")}
                      className="text-rose-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-[#F0BFCB] rounded p-3 text-center bg-[#FFF8FA] hover:bg-[#FFF0F4] text-xs font-bold text-[#9F1239] flex items-center justify-center gap-2"
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing photo...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Upload New Photo from Device</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-[#1E1215] block mb-1">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs border border-[#F0BFCB] rounded px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1E1215] block mb-1">
              Contact Phone (Optional)
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full text-xs border border-[#F0BFCB] rounded px-3 py-2 bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold rounded border border-[#F0BFCB] bg-white text-[#4C0519] hover:bg-[#FFE8ED]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold rounded bg-[#9F1239] hover:bg-[#881337] text-white flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
