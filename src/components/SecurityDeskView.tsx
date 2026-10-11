"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  UserCheck, 
  Building2, 
  Clock, 
  AlertCircle,
  FileText,
  QrCode,
  ScanLine,
  CheckSquare
} from "lucide-react";
import { campusStore } from "@/lib/store";
import { 
  subscribeToItems, 
  resolveItemHandoverWithOtp, 
  normalizeCollegeCode 
} from "@/lib/firebaseService";

interface SecurityDeskViewProps {
  selectedCollege: string;
}

export default function SecurityDeskView({ selectedCollege }: SecurityDeskViewProps) {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [otp, setOtp] = useState("");
  const [attendantId, setAttendantId] = useState("CAMPUS-OFFICER-04 (CENTRAL DESK)");
  const [notes, setNotes] = useState("Physical student ID verified at Central Library circulation desk.");
  const [submitting, setSubmitting] = useState(false);
  const [scanningQr, setScanningQr] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const collegeCode = normalizeCollegeCode(selectedCollege);

    const unsubscribe = subscribeToItems(collegeCode, (liveList) => {
      setItems(liveList);
    });

    return () => unsubscribe();
  }, [selectedCollege]);

  const pendingItems = items.filter((i) => i.status === "VERIFIED_PENDING_HANDOVER");
  const handedOverItems = items.filter((i) => i.status === "HANDED_OVER");

  // Simulated Optical QR Scanner
  const simulateQrScan = () => {
    if (pendingItems.length === 0) {
      setError("No verified items are currently waiting at the desk. Claim an item via the dynamic quiz first.");
      return;
    }
    setScanningQr(true);
    setError(null);
    setTimeout(() => {
      // Pick first pending item
      const itemToScan = pendingItems[0];
      setSelectedItemId(itemToScan.id);
      // Fetch item pass otp from simulated registry
      setScanningQr(false);
      setNotes(`Optical QR Pass scanned at Desk. Verified student card presented.`);
    }, 1200);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !otp) {
      setError("Please select an item and enter the 6-digit OTP code");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setResponse(null);

      const result = await resolveItemHandoverWithOtp(selectedItemId, otp, attendantId, notes);
      if (result.success) {
        setResponse({
          success: true,
          item: items.find(i => i.id === selectedItemId) || { id: selectedItemId },
          handoverAudit: {
            attendantId,
            handedOverAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            notes
          }
        });
        setOtp("");
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process handover");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 mb-6 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded-xs font-bold border border-[#FECDD6]">
              Campus Security Operations
            </span>
            <span className="text-xs text-[#881337] font-semibold">Physical Verification & Chain of Custody</span>
          </div>
          <h1 className="text-xl font-extrabold text-[#1E1215] tracking-tight">
            Campus Desk Handover Terminal
          </h1>
          <p className="text-xs text-[#881337] mt-1">
            Authorized campus guards and circulation librarians validate the student's digital pass before physical handover.
          </p>
        </div>

        <button
          onClick={simulateQrScan}
          disabled={scanningQr}
          className="bg-[#FFF0F4] border border-[#F0BFCB] hover:bg-[#FFE8ED] text-[#9F1239] px-4 py-2.5 text-xs font-bold rounded-xs transition-colors flex items-center gap-2 shrink-0 shadow-sm"
        >
          {scanningQr ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#9F1239]" />
              <span>Scanning Digital Pass...</span>
            </>
          ) : (
            <>
              <ScanLine className="w-4 h-4 text-[#9F1239]" />
              <span>Simulate Optical QR Scanner</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Handover Execution Panel */}
        <div className="lg:col-span-2 bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 shadow-subtle space-y-5">
          <h2 className="text-sm font-bold text-[#1E1215] uppercase tracking-wider flex items-center gap-2 border-b border-[#F2C4CE] pb-3">
            <KeyRound className="w-4 h-4 text-[#9F1239]" />
            <span>Validate Digital Claim Pass & OTP</span>
          </h2>

          {error && (
            <div className="bg-[#FFF0F3] border border-[#FECDD6] p-3 text-xs text-[#9F1239] rounded-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {response && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-emerald-950 text-xs">Handover Certified & Closed Successfully</span>
                <p className="text-xs text-emerald-900 mt-0.5 font-medium">{response.message}</p>
                <span className="font-mono text-[10px] text-emerald-700 mt-1 block">
                  Chain of Custody sealed under {attendantId}
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleResolve} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1215] mb-1">
                Select Verified Item Pending Physical Return
              </label>
              {pendingItems.length === 0 ? (
                <div className="bg-[#FFFDFE] border border-[#F0BFCB] p-3 text-xs text-[#881337] rounded-xs">
                  No verified items currently pending return. When a student passes the AI quiz on the Blind Catalog, their item will unlock here.
                </div>
              ) : (
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                >
                  <option value="">-- Choose item presented by student --</option>
                  {pendingItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.publicTitle} ({item.campusZone})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1E1215] mb-1">
                  Student's 6-Digit Handover OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 330925"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full text-center font-mono text-lg font-extrabold tracking-widest border border-[#F0BFCB] bg-white px-3 py-1.5 rounded-xs focus:outline-none focus:border-[#9F1239]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1215] mb-1">
                  Attendant Officer Badge ID
                </label>
                <input
                  type="text"
                  value={attendantId}
                  onChange={(e) => setAttendantId(e.target.value)}
                  className="w-full text-xs font-mono border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1215] mb-1">
                Handover Verification Notes & Physical ID Confirmation
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs border border-[#F0BFCB] bg-white px-3 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
              />
            </div>

            {/* Checklist */}
            <div className="bg-[#FFFDFE] border border-[#F0BFCB] p-3 rounded-xs text-[11px] space-y-1.5 text-[#1E1215]">
              <span className="font-mono uppercase font-bold text-[#881337] text-[10px] block">Mandatory Protocol Checklist:</span>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>Verify student college ID card matches registered domain account</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>Validate 6-digit OTP code against server hash</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>Zero phone numbers or private social handles exchanged</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedItemId || !otp}
              className="w-full bg-[#9F1239] hover:bg-[#881337] text-white py-2.5 text-xs font-bold rounded-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating OTP Against Institutional Registry...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Handover & Seal Audit Trail</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Operational Status & Audit Feed */}
        <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 shadow-subtle space-y-4">
          <h2 className="text-sm font-bold text-[#1E1215] uppercase tracking-wider flex items-center gap-2 border-b border-[#F2C4CE] pb-3">
            <FileText className="w-4 h-4 text-[#9F1239]" />
            <span>Terminal Custody Log</span>
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs p-2.5 bg-[#FFF0F4] rounded-xs border border-[#FECDD6]">
              <span className="text-[#881337] font-medium">Pending Physical Returns:</span>
              <span className="font-mono font-bold text-[#9F1239]">{pendingItems.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs p-2.5 bg-emerald-50 rounded-xs border border-emerald-200">
              <span className="text-emerald-950 font-medium">Completed Reunited Items:</span>
              <span className="font-mono font-bold text-emerald-800">{handedOverItems.length}</span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-bold text-[#881337] uppercase tracking-wider block mb-2">
              Recent Handover Ledger:
            </span>
            {handedOverItems.length === 0 ? (
              <p className="text-xs text-[#881337] italic">No completed handovers logged yet today.</p>
            ) : (
              <div className="space-y-2">
                {handedOverItems.map((item) => (
                  <div key={item.id} className="text-xs border border-[#F0BFCB] p-2.5 rounded-xs bg-[#FFFDFE]">
                    <div className="font-semibold text-[#1E1215] line-clamp-1">{item.publicTitle}</div>
                    <div className="text-[10px] text-emerald-800 font-mono mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Returned & Signed by {item.handoverAudit?.attendantId || "Officer"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
