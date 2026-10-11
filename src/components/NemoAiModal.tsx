"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  ArrowRight, 
  Loader2,
  Heart,
  MessageCircle
} from "lucide-react";
import { talkToNemoFriend } from "@/lib/nemoChat";
import { TinyFishLogo } from "./TinyFishLogo";

interface NemoAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: "feed" | "report" | "lost" | "desk" | "admin") => void;
  selectedCollege: string;
  collegeCode: string;
}

interface MessageItem {
  id: string;
  sender: "user" | "nemo";
  text: string;
  suggestedAction?: {
    label: string;
    actionTab: "feed" | "report" | "lost" | "desk" | "admin";
  };
  timestamp: string;
}

const QUICK_PROMPTS = [
  { icon: "😰", text: "Phone / earphone kho gaya" },
  { icon: "🪪", text: "Lost my college ID card" },
  { icon: "📦", text: "Found someone's keys or bottle" },
  { icon: "🛡️", text: "Dynamic Quiz kaise kaam karta hai?" },
  { icon: "📍", text: "Security desk kahan hai?" },
];

function renderCleanText(text: string) {
  // Clean raw markdown stars, hashtags, and formatting clutter
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // remove bold **
    .replace(/\*/g, "")              // remove stray *
    .replace(/^#+\s*/gm, "");        // remove headings
}

export default function NemoAiModal({
  isOpen,
  onClose,
  onNavigateTab,
  selectedCollege,
  collegeCode,
}: NemoAiModalProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          sender: "nemo",
          text: `Hey! I'm Nemo, your FyndoraX campus buddy. 🐠 Misplaced something at ${collegeCode} or found an item? Tell me what happened, let's sort it quickly!`,
          suggestedAction: {
            label: "Search Found Catalog",
            actionTab: "feed"
          },
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    }
  }, [collegeCode]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Lock body scroll while Nemo AI modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Build conversation history for genuine chatbot flow
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text
      }));

      // Call live conversational AI (with client-side Gemini 2.5 Flash & TinyFish engine)
      const aiReply = await talkToNemoFriend(
        query,
        selectedCollege,
        collegeCode,
        history
      );

      // Detect if an action button is helpful
      const lowerQ = query.toLowerCase();
      let action: { label: string; actionTab: "feed" | "report" | "lost" | "desk" | "admin" } | undefined = undefined;
      if (lowerQ.includes("found") || lowerQ.includes("turn in") || lowerQ.includes("jama") || lowerQ.includes("mili")) {
        action = { label: "Report Found Item", actionTab: "report" };
      } else if (lowerQ.includes("catalog") || lowerQ.includes("search") || lowerQ.includes("check") || lowerQ.includes("kho")) {
        action = { label: "Browse Found Catalog", actionTab: "feed" };
      } else if (lowerQ.includes("notice") || lowerQ.includes("sos") || lowerQ.includes("post")) {
        action = { label: "View Lost Notices", actionTab: "lost" };
      } else if (lowerQ.includes("desk") || lowerQ.includes("otp") || lowerQ.includes("guard") || lowerQ.includes("quiz")) {
        action = { label: "Security Desk Portal", actionTab: "desk" };
      }

      const nemoMsg: MessageItem = {
        id: `nemo-${Date.now()}`,
        sender: "nemo",
        text: aiReply,
        suggestedAction: action,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, nemoMsg]);
    } catch (err) {
      const errorMsg: MessageItem = {
        id: `nemo-${Date.now()}`,
        sender: "nemo",
        text: "Arre dost, thoda network glitch ho gaya! Tension mat le, canteen ya guard desk pe poocha? Ek baar FyndoraX ke Catalog tab me dekh le, wahan quiz dekar pickup OTP mil jayega!",
        suggestedAction: {
          label: "Open Catalog",
          actionTab: "feed"
        },
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 pointer-events-none">
      <div 
        className={`pointer-events-auto bg-white border border-[#EAA7B7] rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden w-[calc(100vw-1.5rem)] sm:w-[380px] md:w-[410px] ${
          isExpanded 
            ? "sm:w-[560px] h-[min(620px,calc(100vh-2.5rem))]" 
            : "h-[min(510px,calc(100vh-2.5rem))]"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#9F1239] via-[#881337] to-[#701A31] text-white p-3 rounded-t-2xl flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center p-1 backdrop-blur-xs shadow-inner shrink-0">
              <TinyFishLogo size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight">Nemo AI</span>
                <span className="text-[10px] font-mono font-bold bg-[#FFE4E8]/20 text-[#FFE4E8] px-1.5 py-0.2 rounded-full border border-white/20">
                  {collegeCode}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#FECDD6] font-medium mt-0.2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Campus AI Buddy • TinyFish</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Expand / Minimize */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors hidden sm:block"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              title="Close Nemo AI"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-ribbon */}
        <div className="bg-[#FFF0F4] border-b border-[#F0BFCB] px-3 py-1 flex items-center justify-between text-[11px] text-[#881337] shrink-0">
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-[#9F1239] fill-[#9F1239]" />
            <span className="font-semibold text-[10px]">FyndoraX Assistant • Casual Chat</span>
          </div>
          <span className="text-[10px] font-mono text-[#9F1239]">
            Online & Ready
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 bg-[#FDF8FA]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              {m.sender === "user" ? (
                <div className="bg-[#9F1239] text-white px-3.5 py-2 rounded-2xl rounded-tr-xs max-w-[85%] text-xs shadow-xs leading-relaxed font-medium">
                  {m.text}
                </div>
              ) : (
                <div className="flex items-start gap-2 max-w-[92%]">
                  <div className="w-6 h-6 rounded-full bg-[#FFE4E8] border border-[#FECDD6] flex items-center justify-center shrink-0 mt-0.5 p-0.5 shadow-2xs">
                    <TinyFishLogo size={15} />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Nemo Bubble */}
                    <div className="bg-white border border-[#F0BFCB] text-[#1E1215] px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-xs shadow-xs leading-relaxed font-normal">
                      <p className="whitespace-pre-line leading-relaxed">
                        {renderCleanText(m.text)}
                      </p>

                      {/* Action Shortcut Trigger */}
                      {m.suggestedAction && (
                        <div className="mt-2.5 pt-2 border-t border-[#FCE4EC] flex items-center justify-end">
                          <button
                            onClick={() => {
                              onNavigateTab(m.suggestedAction!.actionTab);
                              onClose();
                            }}
                            className="bg-[#9F1239] hover:bg-[#881337] text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1.5 transition-all group"
                          >
                            <span>{m.suggestedAction.label}</span>
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-[#A38A91] px-1 font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2 max-w-[220px]">
              <div className="w-6 h-6 rounded-full bg-[#FFE4E8] border border-[#FECDD6] flex items-center justify-center shrink-0 mt-0.5 p-0.5 shadow-2xs">
                <TinyFishLogo size={15} />
              </div>
              <div className="flex items-center gap-2 text-xs text-[#881337] bg-white border border-[#F0BFCB] px-3 py-2 rounded-2xl rounded-tl-xs shadow-xs">
                <Loader2 className="w-3.5 h-3.5 text-[#9F1239] animate-spin" />
                <span className="font-medium animate-pulse text-[11px]">Nemo is replying...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 bg-white border-t border-[#F0BFCB] overflow-x-auto whitespace-nowrap flex items-center gap-1.5 scrollbar-none shrink-0">
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.text)}
              disabled={loading}
              className="shrink-0 bg-[#FFF0F4] hover:bg-[#FFE4E8] text-[#4C0519] border border-[#FECDD6] text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <span>{qp.icon}</span>
              <span>{qp.text}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-2.5 bg-white border-t border-[#F0BFCB] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Ask Nemo: 'phone kho gaya', 'keys mili', 'quiz info'..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            className="flex-1 bg-[#FFF9FB] border border-[#F0BFCB] focus:border-[#9F1239] focus:outline-none rounded-lg px-3 py-1.5 text-xs text-[#1E1215] placeholder:text-[#A38A91]"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="bg-[#9F1239] hover:bg-[#881337] disabled:opacity-40 text-white p-2 rounded-lg transition-colors shadow-xs"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
