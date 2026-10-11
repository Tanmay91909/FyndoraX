"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Building2, 
  ChevronDown, 
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  Camera,
  KeyRound,
  FileText,
  User,
  LogOut,
  Sparkles,
  Home as HomeIcon,
  Compass,
  MessageSquare
} from "lucide-react";
import { CollegeLogoRenderer } from "./CollegeLogos";
import { useAuth } from "@/context/AuthContext";
import { TinyFishLogo } from "./TinyFishLogo";
import NotificationDropdown from "./NotificationDropdown";
import HeaderKarmaBadge from "./HeaderKarmaBadge";

export type NavTab = "home" | "feed" | "report" | "lost" | "desk" | "admin" | "profile";

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedCollege: string;
  setSelectedCollege: (college: string) => void;
  onOpenNemo?: () => void;
  onOpenChatPanel?: (chatId?: string) => void;
  onOpenLeaderboard?: () => void;
}

export const COLLEGES = [
  { name: "Vivekananda Institute of Professional Studies – TC", domain: "@vips.edu", code: "VIPS-TC" },
  { name: "Delhi Technological University", domain: "@dtu.ac.in", code: "DTU" },
  { name: "KCC Institute of Technology & Management", domain: "@kccitm.edu", code: "KCC-ITM" },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  selectedCollege,
  setSelectedCollege,
  onOpenNemo,
  onOpenChatPanel,
  onOpenLeaderboard,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, logout, setAuthModalOpen } = useAuth();
  const currentCollegeObj = COLLEGES.find((c) => c.name === selectedCollege || c.code === selectedCollege) || COLLEGES[0];

  // Auto-close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  return (
    <header className="border-b border-[#F0BFCB]/80 bg-[#FFF8FA]/95 backdrop-blur-md sticky top-0 z-40 shadow-xs select-none">
      {/* Non-slidable, Compact & Professional Navigation Bar */}
      <div className="w-full max-w-[1536px] mx-auto px-2 sm:px-3 lg:px-4 h-14 flex items-center justify-between gap-1 sm:gap-2 flex-nowrap overflow-visible">
        
        {/* Left Section: Brand Logo, College Selector & Core Navigation */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Brand Logo - Guaranteed Never Cut */}
          <button 
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-1.5 group text-left focus:outline-none shrink-0"
            aria-label="FyndoraX Home"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#9F1239] via-[#BE123C] to-[#E11D48] flex items-center justify-center text-white shadow-xs ring-1 ring-[#FECDD6] group-hover:scale-105 transition-all shrink-0">
              <span className="font-black text-sm tracking-tighter">F</span>
              <span className="font-black text-xs text-pink-200 -ml-0.5 italic">X</span>
            </div>

            <div className="flex items-baseline gap-1 whitespace-nowrap shrink-0">
              <span className="text-base sm:text-lg font-black tracking-tight text-[#1E1215] whitespace-nowrap">
                Fyndora<span className="bg-gradient-to-tr from-[#9F1239] via-[#E11D48] to-[#F43F5E] text-transparent bg-clip-text font-black italic">X</span>
              </span>
              <span className="text-[8px] font-mono font-bold uppercase tracking-wider bg-[#FFE4E8] text-[#9F1239] px-1 py-0.2 rounded border border-[#FECDD6] hidden 2xl:inline-block">
                Campus OS
              </span>
            </div>
          </button>

          <span className="h-4 w-px bg-[#F0BFCB]/80 shrink-0" />

          {/* College Dropdown Switcher */}
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1 text-xs bg-white hover:bg-[#FFE8ED] border border-[#F0BFCB] px-1.5 sm:px-2 py-1 rounded-md transition-colors group shadow-2xs shrink-0"
              aria-label="Switch College"
            >
              <div className="shrink-0">
                <CollegeLogoRenderer collegeCode={currentCollegeObj.code} size={18} />
              </div>
              <span className="font-bold text-[#1E1215] text-[11px] whitespace-nowrap">
                {currentCollegeObj.code}
              </span>
              <ChevronDown className="w-3 h-3 text-[#BE123C] group-hover:translate-y-0.5 transition-transform shrink-0" />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-[320px] sm:w-[360px] bg-white border border-[#EAA7B7] rounded-md shadow-xl z-50 overflow-hidden divide-y divide-[#FCE4EC]">
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-[#881337] uppercase tracking-wider bg-[#FFF0F4]">
                  Select Campus Directory
                </div>
                {COLLEGES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedCollege(c.name);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left p-2.5 flex items-center gap-2.5 hover:bg-[#FFF0F4] transition-colors ${
                      selectedCollege === c.name ? "bg-[#FFE4E8]/60" : ""
                    }`}
                  >
                    <div className="shrink-0 p-1 bg-white border border-[#F0BFCB] rounded shadow-xs">
                      <CollegeLogoRenderer collegeCode={c.code} size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1E1215] truncate">{c.name}</span>
                        <span className="shrink-0 text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-[#FFF0F4] text-[#9F1239] border border-[#FECDD6]">
                          {c.code}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#881337] font-mono mt-0.5 truncate">
                        Domain: {c.domain}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="h-4 w-px bg-[#F0BFCB]/80 shrink-0" />

          {/* Core Page Navigation - Solid & Non-slidable */}
          <nav className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* 1. Home */}
            <button
              onClick={() => setActiveTab("home")}
              className={`px-1.5 lg:px-2 py-1 text-[11px] lg:text-xs font-semibold rounded-md transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "home"
                  ? "bg-[#9F1239] text-white shadow-xs font-bold"
                  : "text-[#4C0519] hover:bg-white/80 hover:text-[#9F1239]"
              }`}
              title="Home"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Home</span>
            </button>

            {/* 2. Found Catalog */}
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-1.5 lg:px-2 py-1 text-[11px] lg:text-xs font-semibold rounded-md transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "feed"
                  ? "bg-[#9F1239] text-white shadow-xs font-bold"
                  : "text-[#4C0519] hover:bg-white/80 hover:text-[#9F1239]"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Catalog</span>
            </button>

            {/* 3. Report Found */}
            <button
              onClick={() => setActiveTab("report")}
              className={`px-1.5 lg:px-2 py-1 text-[11px] lg:text-xs font-semibold rounded-md transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "report"
                  ? "bg-[#9F1239] text-white shadow-xs font-bold"
                  : "text-[#4C0519] hover:bg-white/80 hover:text-[#9F1239]"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Report</span>
            </button>

            {/* 4. Lost Notices */}
            <button
              onClick={() => setActiveTab("lost")}
              className={`px-1.5 lg:px-2 py-1 text-[11px] lg:text-xs font-semibold rounded-md transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "lost"
                  ? "bg-[#9F1239] text-white shadow-xs font-bold"
                  : "text-[#4C0519] hover:bg-white/80 hover:text-[#9F1239]"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notices</span>
            </button>

            {/* 5. Desk Handover */}
            <button
              onClick={() => setActiveTab("desk")}
              className={`px-1.5 lg:px-2 py-1 text-[11px] lg:text-xs font-semibold rounded-md transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "desk"
                  ? "bg-[#9F1239] text-white shadow-xs font-bold"
                  : "text-[#4C0519] hover:bg-white/80 hover:text-[#9F1239]"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desk</span>
            </button>

            {/* 6. Admin Portal */}
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-1.5 lg:px-2 py-1 text-[11px] lg:text-xs font-semibold rounded-md transition-all flex items-center gap-1 shrink-0 ${
                activeTab === "admin"
                  ? "bg-[#9F1239] text-white shadow-xs font-bold"
                  : "text-[#4C0519] hover:bg-white/80 hover:text-[#9F1239]"
              }`}
            >
              <Lock className="w-3 h-3" />
              <span className="hidden md:inline">Admin</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Nemo AI Assistant & User Profile */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {/* Good Karma Score & Rank Badge (fit into header space beside TinyFish / Nemo AI) */}
          <HeaderKarmaBadge onOpenLeaderboard={() => onOpenLeaderboard?.()} />

          {/* Streamlined Nemo AI with Real TinyFish Fish Logo */}
          {onOpenNemo && (
            <button
              onClick={onOpenNemo}
              className="px-2 py-1 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-white via-[#FFF0F4] to-[#FFE4E8] text-[#9F1239] border border-[#FECDD6] hover:border-[#9F1239] hover:shadow-xs group shrink-0 shadow-2xs"
              title="Open Nemo AI - Campus Guide"
            >
              <TinyFishLogo size={15} className="group-hover:scale-110 transition-transform" />
              <span className="font-extrabold tracking-tight hidden sm:inline">Nemo AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          {/* Real-time Notifications & Chat Panel Buttons */}
          {user && (
            <div className="flex items-center gap-0.5 shrink-0">
              <NotificationDropdown onOpenChat={(chatId) => onOpenChatPanel?.(chatId)} />
              
              <button
                onClick={() => onOpenChatPanel?.()}
                className="p-1 sm:p-1.5 rounded-md hover:bg-[#FFE8ED] text-[#881337] hover:text-[#9F1239] transition-colors relative shrink-0"
                title="Open Handover Chat Panel"
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}

          <span className="h-4 w-px bg-[#F0BFCB]/80 shrink-0" />

          {/* User Profile & Auth */}
          {user ? (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white border border-[#F0BFCB] px-1.5 sm:px-2 py-1 rounded-md text-xs shadow-2xs shrink-0">
              <button
                onClick={() => setActiveTab("profile")}
                title={`Logged in as ${user.email} (View Profile)`}
                className="flex items-center gap-1 text-left group shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-mono text-[10px] sm:text-[11px] text-[#1E1215] max-w-[70px] sm:max-w-[90px] md:max-w-[110px] xl:max-w-[140px] truncate font-semibold group-hover:text-[#9F1239]">
                  {user.email}
                </span>
              </button>

              {isAdmin && (
                <span className="text-[8.5px] font-bold bg-[#9F1239] text-white px-1 py-0.2 rounded font-mono shrink-0">
                  ADMIN
                </span>
              )}

              <button
                onClick={logout}
                title="Sign out"
                className="text-[#881337] hover:text-[#9F1239] p-0.5 rounded hover:bg-[#FFE8ED] transition-colors shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-gradient-to-r from-[#9F1239] to-[#BE185D] hover:brightness-110 text-white px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
