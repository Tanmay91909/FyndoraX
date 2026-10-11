"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Send, 
  MessageSquare, 
  UserCheck, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Sparkles, 
  Lock,
  ChevronDown,
  Minimize2,
  X,
  User,
  Info,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDb } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  getDoc 
} from "firebase/firestore";
import { sendChatMessage, ensureChatSession, ChatMessage } from "@/lib/chatService";
import { 
  resolveItemHandoverWithOtp, 
  updateLostNoticeInFirestore 
} from "@/lib/firebaseService";
import { awardKarmaPoints } from "@/lib/karmaService";

interface HandoverChatProps {
  itemId: string;
  itemTitle: string;
  campusZone: string;
  finderEmail?: string;
  claimantEmail?: string;
  chatType?: "NOTICE" | "CATALOG";
  onClose?: () => void;
  isOpen?: boolean;
}

export default function HandoverChat({
  itemId,
  itemTitle,
  campusZone,
  finderEmail = "student.finder@campus.edu",
  claimantEmail = "student.claimant@campus.edu",
  chatType = "NOTICE",
  onClose,
  isOpen = true
}: HandoverChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handover Resolution State
  const [otpInput, setOtpInput] = useState("");
  const [resolvingOtp, setResolvingOtp] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  const myEmail = (user?.email || "").trim().toLowerCase();
  const normFinder = (finderEmail || "").trim().toLowerCase();
  const normClaimant = (claimantEmail || "").trim().toLowerCase();

  // Determine current user's role in this chat
  const isFinder = myEmail === normFinder;
  const isOwnerOrClaimant = myEmail === normClaimant;

  let myRole: "finder" | "owner" | "claimant" = "finder";
  if (chatType === "NOTICE") {
    myRole = isOwnerOrClaimant ? "owner" : "finder";
  } else {
    myRole = isOwnerOrClaimant ? "claimant" : "finder";
  }

  // Ensure chat session is registered in Firestore
  useEffect(() => {
    ensureChatSession({
      id: itemId,
      type: chatType,
      itemId,
      itemTitle,
      campusZone,
      finderEmail: normFinder,
      claimantEmail: normClaimant
    });
  }, [itemId, chatType, itemTitle, campusZone, normFinder, normClaimant]);

  // Check if item or notice is already marked as solved
  useEffect(() => {
    const db = getDb();
    if (!db) return;

    if (chatType === "CATALOG") {
      getDoc(doc(db, "items", itemId)).then((snap) => {
        if (snap.exists() && snap.data().status === "HANDED_OVER") {
          setIsResolved(true);
        }
      }).catch(() => {});
    } else {
      getDoc(doc(db, "lost_notices", itemId)).then((snap) => {
        if (snap.exists() && (snap.data().status === "FOUND" || snap.data().status === "CLOSED")) {
          setIsResolved(true);
        }
      }).catch(() => {});
    }
  }, [itemId, chatType]);

  // Synchronize chat messages in real time via Firestore
  useEffect(() => {
    const storageKey = `fyndorax_chat_${itemId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (_) {}
    }

    const db = getDb();
    if (!db) return;

    try {
      const messagesRef = collection(db, "chats", itemId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const cloudMsgs: ChatMessage[] = [];
          snapshot.forEach((snapDoc) => {
            const d = snapDoc.data();
            cloudMsgs.push({
              id: snapDoc.id,
              sender: d.sender || "Campus User",
              senderRole: d.senderRole || "finder",
              text: d.text || "",
              timestamp: d.timestamp || "Just Now"
            });
          });
          setMessages(cloudMsgs);
          localStorage.setItem(storageKey, JSON.stringify(cloudMsgs));
        }
      }, (err) => {
        console.warn("Firestore chat subscription notice:", err.message);
      });

      return () => unsubscribe();
    } catch (_) {}
  }, [itemId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText("");

    const effectiveSender = myEmail || (isFinder ? normFinder : normClaimant);

    await sendChatMessage(
      itemId,
      {
        sender: effectiveSender,
        senderRole: myRole,
        text: textToSend
      },
      {
        type: chatType,
        itemId,
        itemTitle,
        campusZone,
        finderEmail: normFinder,
        claimantEmail: normClaimant
      }
    );
  };

  // Resolve Handover with OTP (Catalog Way)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) return;

    try {
      setResolvingOtp(true);
      setOtpError(null);
      setOtpSuccess(null);

      const res = await resolveItemHandoverWithOtp(itemId, otpInput.trim(), myEmail);
      if (res.success) {
        setIsResolved(true);
        setOtpSuccess(res.message);
        setOtpInput("");
        // Broadcast system message in chat
        await sendChatMessage(
          itemId,
          {
            sender: "FyndoraX Handover Security",
            senderRole: "desk",
            text: `✓ Handover verified with 6-digit OTP (${otpInput.trim()}). Item officially handed over and marked as solved.`
          },
          {
            type: chatType,
            itemId,
            itemTitle,
            campusZone,
            finderEmail: normFinder,
            claimantEmail: normClaimant
          }
        );
      } else {
        setOtpError(res.message);
      }
    } catch (err: any) {
      setOtpError(err?.message || "Failed to verify OTP.");
    } finally {
      setResolvingOtp(false);
    }
  };

  // Resolve Notice (Notice Way)
  const handleResolveNotice = async () => {
    try {
      setResolvingOtp(true);
      setOtpError(null);
      await updateLostNoticeInFirestore(itemId, { status: "FOUND" });
      setIsResolved(true);
      setOtpSuccess("Notice marked as resolved! Item successfully recovered.");
      // Broadcast system message in chat
      await sendChatMessage(
        itemId,
        {
          sender: "FyndoraX Notice Board",
          senderRole: "desk",
          text: `✓ Handover confirmed! Notice marked as solved and item safely returned.`
        },
        {
          type: chatType,
          itemId,
          itemTitle,
          campusZone,
          finderEmail: normFinder,
          claimantEmail: normClaimant
        }
      );

      // Award Good Karma Points to finder (except admin)
      if (normFinder) {
        awardKarmaPoints(normFinder, 75, `Lost Notice resolved and item safely returned for #${itemId}`).catch(() => {});
      }
    } catch (err: any) {
      setOtpError(err?.message || "Failed to update notice.");
    } finally {
      setResolvingOtp(false);
    }
  };

  const sendQuickReply = (text: string) => {
    setInputText(text);
  };

  if (!isOpen) return null;

  // Determine other participant's email and role label
  const otherEmail = isFinder ? normClaimant : normFinder;
  const otherRoleLabel = chatType === "NOTICE" 
    ? (isFinder ? "Lost Item Owner" : "Finder")
    : (isFinder ? "Verified Claimant" : "Finder");

  return (
    <div className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-lg shadow-xl overflow-hidden flex flex-col h-full w-full mx-auto">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-[#FFF0F4] via-[#FFE4E8] to-[#FFF0F4] px-4 py-2.5 border-b border-[#F2C4CE] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#9F1239] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-extrabold text-[#1E1215] truncate">
                Direct Handover Channel
              </h4>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                isResolved
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-[#FFE4E8] text-[#9F1239] border-[#FECDD6]"
              }`}>
                {isResolved ? "SOLVED ✓" : (chatType === "NOTICE" ? "Seeker Notice" : "Catalog Handover")}
              </span>
            </div>
            <p className="text-[11px] text-[#881337] truncate font-medium">
              {itemTitle} • {campusZone}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-[#881337] hover:text-[#1E1215] p-1.5 rounded-md hover:bg-[#FFE0E6] text-sm font-bold transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Handover OTP Verification & Status Resolution Bar */}
      {isResolved ? (
        <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-1.5 flex items-center justify-between text-xs text-emerald-800 font-bold shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Handover Complete • Officially Marked as Solved & Archived</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
            COMPLETED
          </span>
        </div>
      ) : chatType === "CATALOG" ? (
        isFinder ? (
          /* Finder OTP Input to finalize handover */
          <form onSubmit={handleVerifyOtp} className="bg-[#FFF0F4] border-b border-[#F0BFCB] px-3.5 py-2 flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-1 text-xs text-[#9F1239] font-bold">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Verify Claimant's OTP:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-1 max-w-xs">
              <input
                type="text"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="6-digit OTP (e.g. 729401)"
                maxLength={6}
                className="w-full text-xs font-mono px-2.5 py-1 border border-[#F0BFCB] rounded bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
              />
              <button
                type="submit"
                disabled={resolvingOtp || !otpInput.trim()}
                className="bg-[#9F1239] hover:bg-[#881337] text-white px-3 py-1 rounded text-xs font-bold whitespace-nowrap disabled:opacity-50 flex items-center gap-1"
              >
                {resolvingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                <span>Solve</span>
              </button>
            </div>
          </form>
        ) : (
          /* Claimant OTP Reminder */
          <div className="bg-[#FFF0F4] border-b border-[#F0BFCB] px-3.5 py-1.5 flex items-center justify-between text-[11px] text-[#881337] shrink-0 font-medium">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#9F1239]" />
              <span>Share your 6-digit OTP pass with the finder when collecting your item.</span>
            </div>
          </div>
        )
      ) : (
        /* Notice Resolution Button */
        <div className="bg-[#FFF0F4] border-b border-[#F0BFCB] px-3.5 py-1.5 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-[#881337] font-medium">Handover finalized?</span>
          <button
            onClick={handleResolveNotice}
            disabled={resolvingOtp}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs"
          >
            {resolvingOtp ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            <span>Confirm Handover & Mark Solved</span>
          </button>
        </div>
      )}

      {/* Feedback Alerts */}
      {otpError && (
        <div className="bg-rose-50 border-b border-rose-200 px-3.5 py-1.5 text-xs text-rose-800 flex items-center gap-1.5 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>{otpError}</span>
        </div>
      )}
      {otpSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-1.5 text-xs text-emerald-800 flex items-center gap-1.5 shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{otpSuccess}</span>
        </div>
      )}

      {/* Participant Mapping Bar */}
      <div className="bg-[#FFF5F8] px-3.5 py-1.5 border-b border-[#F5CCD6] text-[10px] text-[#881337] flex items-center justify-between font-mono shrink-0">
        <div className="flex items-center gap-1.5 truncate">
          <Lock className="w-3 h-3 text-[#9F1239] shrink-0" />
          <span className="truncate">
            Connecting: <strong>{myEmail || "You"}</strong> ({myRole.toUpperCase()}) ↔ <strong>{otherEmail}</strong> ({otherRoleLabel})
          </span>
        </div>
        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
          Zero Leak
        </span>
      </div>

      {/* Message List */}
      <div 
        className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto space-y-3 bg-[#FFFDFE] overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
      >
        {messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#881337] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#FFE4E8] text-[#9F1239] flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="font-bold text-[#1E1215]">Direct Handover Channel Active</p>
            <p className="text-[11px] max-w-xs mx-auto text-[#881337]">
              Coordinate pickup time, campus security desk deposit, or classroom location with <strong>{otherEmail}</strong>.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const msgSender = (m.sender || "").trim().toLowerCase();
            const isMe = myEmail && msgSender === myEmail;
            const isSystem = m.senderRole === "desk";

            if (isSystem) {
              return (
                <div key={m.id} className="text-center my-2">
                  <span className="bg-[#FFE4E8] text-[#9F1239] text-[10px] font-medium px-3 py-1 rounded-full border border-[#FECDD6] inline-block shadow-2xs">
                    🛡️ {m.text}
                  </span>
                </div>
              );
            }

            // ACCURATE SENDER LABEL (NEVER "BOTH FINDERS"!)
            let senderBadge = "";
            if (isMe) {
              const myRoleDisplay = chatType === "NOTICE" 
                ? (myRole === "owner" ? "Owner / Seeker" : "Finder")
                : (myRole === "claimant" ? "Verified Claimant" : "Finder");
              senderBadge = `You (${myRoleDisplay})`;
            } else {
              if (msgSender === normClaimant || m.senderRole === "owner" || m.senderRole === "claimant") {
                senderBadge = chatType === "NOTICE" ? `Owner (${normClaimant})` : `Claimant (${normClaimant})`;
              } else {
                senderBadge = `Finder (${normFinder})`;
              }
            }

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1 text-[10px] text-[#881337] mb-0.5 px-1 font-mono">
                  <span className="font-bold text-[#9F1239]">{senderBadge}</span>
                  <span>•</span>
                  <span>{m.timestamp}</span>
                </div>
                <div
                  className={`max-w-[82%] px-3.5 py-2 rounded-lg text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? "bg-[#9F1239] text-white rounded-br-2xs"
                      : "bg-[#FFF0F4] text-[#1E1215] border border-[#F0BFCB] rounded-bl-2xs"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-3 py-1.5 bg-[#FFF9FB] border-t border-[#F2C4CE] flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0">
        <span className="text-[#881337] font-bold shrink-0">Quick:</span>
        <button
          type="button"
          onClick={() => sendQuickReply("Heading to campus security desk now")}
          className="bg-white border border-[#F0BFCB] hover:bg-[#FFE8ED] px-2 py-0.5 rounded text-[#9F1239] whitespace-nowrap transition-colors"
        >
          Heading to desk now
        </button>
        <button
          type="button"
          onClick={() => sendQuickReply("Deposited with reception desk. You can collect with OTP.")}
          className="bg-white border border-[#F0BFCB] hover:bg-[#FFE8ED] px-2 py-0.5 rounded text-[#9F1239] whitespace-nowrap transition-colors"
        >
          Deposited with reception
        </button>
        <button
          type="button"
          onClick={() => sendQuickReply("What time are you free to meet?")}
          className="bg-white border border-[#F0BFCB] hover:bg-[#FFE8ED] px-2 py-0.5 rounded text-[#9F1239] whitespace-nowrap transition-colors"
        >
          When to meet?
        </button>
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="p-2.5 sm:p-3 bg-white border-t border-[#F0BFCB] flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${otherRoleLabel.toLowerCase()} to coordinate handover...`}
          className="flex-1 px-3 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215]"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-[#9F1239] hover:bg-[#881337] text-white p-2 rounded-md transition-colors disabled:opacity-40 shrink-0 shadow-xs"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
