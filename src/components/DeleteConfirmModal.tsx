"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  itemLabel,
  onClose,
  onConfirm
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1215]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFDFE] border border-rose-300 rounded-lg max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1E1215]">
              {title}
            </h3>
            <p className="text-xs text-[#881337] mt-0.5">
              Permanent Firebase Deletion
            </p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs text-rose-900 leading-relaxed">
          Are you sure you want to delete <strong className="font-bold underline text-[#1E1215]">{itemLabel}</strong>? 
          This will permanently remove this record from Firebase Firestore in real-time across all users.
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-[#F0BFCB] bg-white text-[#4C0519] hover:bg-[#FFE8ED] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting from Firebase...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
