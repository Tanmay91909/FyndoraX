"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Search, 
  X, 
  User, 
  MapPin, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  Inbox,
  Lock
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ChatSession, subscribeToUserChats } from "@/lib/chatService";
import HandoverChat from "./HandoverChat";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeChatId?: string | null;
}

export default function ChatPanel({ isOpen, onClose, activeChatId }: ChatPanelProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "NOTICE" | "CATALOG">("ALL");

  const myEmail = (user?.email || "").trim().toLowerCase();

  useEffect(() => {
    if (!user?.email) {
      setChats([]);
      return;
    }

    const unsub = subscribeToUserChats(user.email, (liveChats) => {
      setChats(liveChats);

      // If activeChatId passed, select that chat
      if (activeChatId) {
        const found = liveChats.find(c => c.id === activeChatId);
        if (found) {
          setSelectedChat(found);
          return;
        }
      }

      // Default to first chat if none selected yet
      if (!selectedChat && liveChats.length > 0) {
        setSelectedChat(liveChats[0]);
      } else if (selectedChat) {
        // Keep updated record
        const updated = liveChats.find(c => c.id === selectedChat.id);
        if (updated) setSelectedChat(updated);
      }
    });

    return () => unsub();
  }, [user, activeChatId]);

  // Lock body scroll so background page cannot scroll while chat modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredChats = chats.filter(c => {
    if (filterType !== "ALL" && c.type !== filterType) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.itemTitle || "").toLowerCase().includes(q) ||
      (c.finderEmail || "").toLowerCase().includes(q) ||
      (c.claimantEmail || "").toLowerCase().includes(q) ||
      (c.lastMessage || "").toLowerCase().includes(q)
    );
  });

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#1E1215]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden overscroll-contain"
      onWheel={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-lg max-w-4xl w-full h-[85vh] max-h-[580px] min-h-[380px] shadow-2xl overflow-hidden flex flex-col my-auto overscroll-contain"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Main Panel Header */}
        <div className="bg-gradient-to-r from-[#FFF0F4] via-[#FFE4E8] to-[#FFF0F4] px-5 py-3.5 border-b border-[#F2C4CE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9F1239] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#1E1215]">Campus Handover Messages</h3>
                <span className="text-[10px] font-mono font-bold bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded border border-[#FECDD6]">
                  {chats.length} active
                </span>
              </div>
              <p className="text-[11px] text-[#881337] mt-0.5 font-medium">
                Private 1-on-1 coordination between Finders and Owners/Claimants for Lost Notices & Catalog Turn-Ins.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#881337] hover:text-[#1E1215] p-1.5 rounded-md hover:bg-[#FFE0E6] text-sm font-bold transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two-Pane Layout: Left Sidebar (Chats List) + Right Pane (Active Chat) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Sidebar: Conversations List */}
          <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-[#F0BFCB] flex-col bg-[#FFF9FB] shrink-0 min-h-0 ${
            selectedChat ? "hidden md:flex" : "flex"
          }`}>
            {/* Filter Tabs */}
            <div className="p-2.5 border-b border-[#F2C4CE] flex items-center gap-1 text-[11px] shrink-0">
              <button
                onClick={() => setFilterType("ALL")}
                className={`flex-1 py-1 rounded font-bold text-center transition-colors ${
                  filterType === "ALL"
                    ? "bg-[#9F1239] text-white"
                    : "text-[#881337] hover:bg-[#FFE8ED]"
                }`}
              >
                All ({chats.length})
              </button>
              <button
                onClick={() => setFilterType("NOTICE")}
                className={`flex-1 py-1 rounded font-bold text-center transition-colors ${
                  filterType === "NOTICE"
                    ? "bg-[#9F1239] text-white"
                    : "text-[#881337] hover:bg-[#FFE8ED]"
                }`}
              >
                Notices
              </button>
              <button
                onClick={() => setFilterType("CATALOG")}
                className={`flex-1 py-1 rounded font-bold text-center transition-colors ${
                  filterType === "CATALOG"
                    ? "bg-[#9F1239] text-white"
                    : "text-[#881337] hover:bg-[#FFE8ED]"
                }`}
              >
                Catalog
              </button>
            </div>

            {/* Search Box */}
            <div className="p-2 border-b border-[#F2C4CE] shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#881337] absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats by item or email..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#F0BFCB] rounded bg-white text-[#1E1215] focus:outline-none focus:border-[#9F1239]"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#FCE4EC] overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
              {filteredChats.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#881337] px-4 space-y-2">
                  <Inbox className="w-8 h-8 text-[#F0BFCB] mx-auto" />
                  <p className="font-bold">No active conversations</p>
                  <p className="text-[11px] text-[#881337]">
                    When you respond to a lost notice or claim a found item, your private coordination chat will appear here.
                  </p>
                </div>
              ) : (
                filteredChats.map((c) => {
                  const isSelected = selectedChat?.id === c.id;
                  const isFinder = myEmail === (c.finderEmail || "").toLowerCase();
                  const otherPartyEmail = isFinder ? c.claimantEmail : c.finderEmail;
                  const otherPartyRole = c.type === "NOTICE"
                    ? (isFinder ? "Lost Item Owner" : "Finder")
                    : (isFinder ? "Claimant" : "Finder");

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedChat(c)}
                      className={`p-3 cursor-pointer transition-colors text-left flex flex-col gap-1 ${
                        isSelected
                          ? "bg-[#FFE4E8] border-l-4 border-l-[#9F1239]"
                          : "hover:bg-[#FFF0F4]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          c.type === "NOTICE" 
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}>
                          {c.type === "NOTICE" ? "LOST NOTICE" : "CATALOG CLAIM"}
                        </span>
                        <span className="text-[10px] text-[#881337] font-mono">
                          {c.lastMessageTimestamp || "Active"}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#1E1215] truncate mt-0.5">
                        {c.itemTitle}
                      </h4>

                      <div className="text-[11px] text-[#881337] truncate flex items-center gap-1 font-mono">
                        <span>With:</span>
                        <strong className="text-[#9F1239]">{otherPartyEmail}</strong>
                        <span>({otherPartyRole})</span>
                      </div>

                      {c.lastMessage && (
                        <p className="text-[11px] text-[#701A31] line-clamp-1 italic mt-0.5">
                          "{c.lastMessage}"
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Active Handover Chat */}
          <div className={`flex-1 flex-col bg-[#FFFDFE] overflow-hidden min-h-0 ${
            selectedChat ? "flex" : "hidden md:flex"
          }`}>
            {selectedChat ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden h-full">
                {/* Mobile Back Button */}
                <div className="md:hidden bg-[#FFF0F4] px-3 py-1.5 border-b border-[#F2C4CE] flex items-center justify-between shrink-0">
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="text-xs font-bold text-[#9F1239] hover:underline flex items-center gap-1"
                  >
                    ← Back to conversations
                  </button>
                  <span className="text-[10px] text-[#881337] font-mono truncate max-w-[160px]">
                    {selectedChat.itemTitle}
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <HandoverChat
                    key={selectedChat.id}
                    itemId={selectedChat.id}
                    itemTitle={selectedChat.itemTitle}
                    campusZone={selectedChat.campusZone}
                    finderEmail={selectedChat.finderEmail}
                    claimantEmail={selectedChat.claimantEmail}
                    chatType={selectedChat.type}
                    isOpen={true}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[#881337] space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FFE4E8] text-[#9F1239] flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#1E1215]">Select a Handover Channel</h4>
                <p className="max-w-xs text-[#881337] text-[11px]">
                  Choose any active coordination chat from the left panel to exchange messages, arrange handover times, and confirm drop-off locations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
