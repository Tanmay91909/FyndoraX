"use client";
// FyndoraX Production Build v2.1 - Live CDN
import React, { useState } from "react";
import Navbar, { COLLEGES, NavTab } from "@/components/Navbar";
import MaskedCatalog from "@/components/MaskedCatalog";
import FinderReportForm from "@/components/FinderReportForm";
import LostNoticesBoard from "@/components/LostNoticesBoard";
import LostNoticeForm from "@/components/LostNoticeForm";
import SecurityDeskView from "@/components/SecurityDeskView";
import AdminPortal from "@/components/AdminPortal";
import UserProfile from "@/components/UserProfile";
import AuthModal from "@/components/AuthModal";
import NemoAiModal from "@/components/NemoAiModal";
import ChatPanel from "@/components/ChatPanel";
import LeaderboardModal from "@/components/LeaderboardModal";
import { TinyFishLogo } from "@/components/TinyFishLogo";
import { AuthProvider } from "@/context/AuthContext";
import { 
  Search, 
  Camera, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  KeyRound, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  Building2, 
  FileText, 
  ChevronLeft, 
  HeartHandshake, 
  QrCode, 
  ShieldAlert 
} from "lucide-react";
import { CollegeLogoRenderer } from "@/components/CollegeLogos";
import { normalizeCollegeCode } from "@/lib/firebaseService";

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [landingAction, setLandingAction] = useState<"feed" | "report" | "lost">("feed");
  const [selectedCollege, setSelectedCollege] = useState("Vivekananda Institute of Professional Studies – TC");
  const [showLostFormModal, setShowLostFormModal] = useState(false);
  const [showNemoAi, setShowNemoAi] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);

  const collegeCode = normalizeCollegeCode(selectedCollege);
  const currentCol = COLLEGES.find((c) => c.name === selectedCollege || c.code === selectedCollege || c.code === collegeCode) || COLLEGES[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDF0F4]">
      {/* Top Institutional Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCollege={selectedCollege}
        setSelectedCollege={setSelectedCollege}
        onOpenNemo={() => setShowNemoAi(true)}
        onOpenChatPanel={(chatId) => {
          setActiveChatSessionId(chatId || null);
          setShowChatPanel(true);
        }}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* Auth Modal Mounted Globally */}
      <AuthModal collegeCode={collegeCode} collegeName={selectedCollege} />

      {/* VIEW 1: DEDICATED HERO LANDING PAGE */}
      {activeTab === "home" ? (
        <div className="flex-1">
          {/* Main Hero Header */}
          <section className="border-b border-[#F0BFCB] bg-gradient-to-b from-[#FFF2F5] via-[#FDF0F4] to-[#FCE8ED] py-10 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Hero Split: Left Content, Right Visual Showcase */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left 7 Cols: Institutional Header & Dynamic Action Toggle */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="inline-flex items-center gap-2 bg-white text-[#9F1239] px-3.5 py-1.5 rounded-md font-semibold text-xs border border-[#F0BFCB] shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-[#9F1239]" />
                    <span className="font-bold">{currentCol.code}</span>
                    <span className="text-[#FECDD6]">|</span>
                    <span className="text-[#881337]">Official Campus Lost & Found Network</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-[#1E1215] tracking-tight leading-tight">
                    Lost something on campus? <br />
                    <span className="bg-gradient-to-r from-[#9F1239] via-[#BE123C] to-[#E11D48] text-transparent bg-clip-text">
                      Instant, verified recovery.
                    </span>
                  </h1>

                  <p className="text-xs sm:text-sm text-[#701A31] max-w-xl font-normal leading-relaxed">
                    The centralized institutional lost-and-found directory for students, faculty, and administrative staff at {currentCol.name}. All photos are protected by forensic AI quizzes to stop false claims.
                  </p>

                  {/* Dynamic Action Buttons - Whichever is active turns Red */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setLandingAction("feed");
                        setActiveTab("feed");
                      }}
                      className={`px-5 py-2.5 text-xs font-bold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group ${
                        landingAction === "feed"
                          ? "bg-[#9F1239] hover:bg-[#881337] text-white shadow-md shadow-[#9F1239]/20 ring-2 ring-[#BE123C]"
                          : "bg-white hover:bg-[#FFE8ED] text-[#4C0519] border border-[#F0BFCB] hover:border-[#BE123C]"
                      }`}
                    >
                      <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Browse Lost Catalog</span>
                    </button>

                    <button
                      onClick={() => {
                        setLandingAction("report");
                        setActiveTab("report");
                      }}
                      className={`px-5 py-2.5 text-xs font-bold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group ${
                        landingAction === "report"
                          ? "bg-[#9F1239] hover:bg-[#881337] text-white shadow-md shadow-[#9F1239]/20 ring-2 ring-[#BE123C]"
                          : "bg-white hover:bg-[#FFE8ED] text-[#4C0519] border border-[#F0BFCB] hover:border-[#BE123C]"
                      }`}
                    >
                      <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Log Found Item</span>
                    </button>

                    <button
                      onClick={() => {
                        setLandingAction("lost");
                        setActiveTab("lost");
                      }}
                      className={`px-5 py-2.5 text-xs font-bold rounded-md transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group ${
                        landingAction === "lost"
                          ? "bg-[#9F1239] hover:bg-[#881337] text-white shadow-md shadow-[#9F1239]/20 ring-2 ring-[#BE123C]"
                          : "bg-white hover:bg-[#FFE8ED] text-[#4C0519] border border-[#F0BFCB] hover:border-[#BE123C]"
                      }`}
                    >
                      <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Post Lost Notice</span>
                    </button>
                  </div>

                  {/* Institutional Custody Protocol - Unique Bullet Checklist (No Non-Clickable Boxes) */}
                  <div className="pt-3.5 border-t border-[#F0BFCB]/70 max-w-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      {/* Feature Bullet 1 */}
                      <div className="flex items-start gap-2.5 group">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#FFE4E8] text-[#9F1239] flex items-center justify-center shrink-0 border border-[#F0BFCB] group-hover:bg-[#9F1239] group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-2xs">
                          <Lock className="w-2.5 h-2.5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#1E1215] flex items-center gap-1 group-hover:text-[#9F1239] transition-colors">
                            <span>Zero-Leak Photos</span>
                          </div>
                          <p className="text-[11px] text-[#881337] leading-snug">
                            Public views masked to prevent opportunistic theft
                          </p>
                        </div>
                      </div>

                      {/* Feature Bullet 2 */}
                      <div className="flex items-start gap-2.5 group">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#FFE4E8] text-[#9F1239] flex items-center justify-center shrink-0 border border-[#F0BFCB] group-hover:bg-[#9F1239] group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-2xs">
                          <Building2 className="w-2.5 h-2.5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#1E1215] flex items-center gap-1 group-hover:text-[#9F1239] transition-colors">
                            <span>Physical Custody</span>
                          </div>
                          <p className="text-[11px] text-[#881337] leading-snug">
                            Secured at central campus security & library desks
                          </p>
                        </div>
                      </div>

                      {/* Feature Bullet 3 */}
                      <div className="flex items-start gap-2.5 group">
                        <div className="mt-0.5 w-5 h-5 rounded-full bg-[#FFE4E8] text-[#9F1239] flex items-center justify-center shrink-0 border border-[#F0BFCB] group-hover:bg-[#9F1239] group-hover:text-white group-hover:scale-110 transition-all duration-300 shadow-2xs">
                          <KeyRound className="w-2.5 h-2.5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-[#1E1215] flex items-center gap-1 group-hover:text-[#9F1239] transition-colors">
                            <span>Secure OTP Pass</span>
                          </div>
                          <p className="text-[11px] text-[#881337] leading-snug">
                            Verified digital handover code for instant pickup
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: Visual Artwork Showcase */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <div className="relative rounded-lg border border-[#F0BFCB] overflow-hidden shadow-elevated bg-[#FFE8ED] group aspect-[1671/941] w-full transition-all duration-500 hover:shadow-2xl hover:border-[#BE123C]">
                    <img
                      src="/images/pic1.png"
                      alt="FyndoraX Campus Recovery"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    {/* Floating Institutional Badge on Image */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#1E1215]/85 backdrop-blur-md text-white px-3 py-1.5 rounded-md text-xs flex items-center justify-between border border-white/10 shadow-lg">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="font-semibold text-[11px]">Central Security Circulation Active</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#FECDD6] uppercase tracking-wider font-bold">
                        {currentCol.code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Three Institutional Action Portals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Card 1: "I Lost Something" */}
                <div 
                  onClick={() => setActiveTab("feed")}
                  className="p-4 sm:p-5 rounded-lg border border-[#F0BFCB] bg-white hover:border-[#BE123C] hover:bg-[#FFF9FB] shadow-subtle hover:shadow-elevated transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9F1239] via-[#BE123C] to-[#E11D48] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#9F1239] bg-[#FFF0F4] group-hover:bg-[#FFE4E8] group-hover:border-[#BE123C] px-2 py-0.5 rounded border border-[#FECDD6] transition-colors">
                        Step 1 • Seeker
                      </span>
                      <Search className="w-4 h-4 text-[#9F1239] group-hover:scale-125 group-hover:rotate-6 transition-all duration-300" />
                    </div>
                    <h3 className="text-base font-bold text-[#1E1215] group-hover:text-[#9F1239] transition-colors">
                      Search & Claim Belonging
                    </h3>
                    <p className="text-xs text-[#881337] leading-relaxed">
                      Search catalog by block, floor, or category. Answer identifying details from memory to receive your collection OTP.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#9F1239] border-t border-[#FCE4EC]">
                    <span>Open Found Items Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>

                {/* Card 2: "I Found Something" */}
                <div 
                  onClick={() => setActiveTab("report")}
                  className="p-4 sm:p-5 rounded-lg border border-[#F0BFCB] bg-white hover:border-[#BE123C] hover:bg-[#FFF9FB] shadow-subtle hover:shadow-elevated transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9F1239] via-[#BE123C] to-[#E11D48] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#9F1239] bg-[#FFF0F4] group-hover:bg-[#FFE4E8] group-hover:border-[#BE123C] px-2 py-0.5 rounded border border-[#FECDD6] transition-colors">
                        Step 2 • Finder
                      </span>
                      <Camera className="w-4 h-4 text-[#9F1239] group-hover:scale-125 group-hover:rotate-6 transition-all duration-300" />
                    </div>
                    <h3 className="text-base font-bold text-[#1E1215] group-hover:text-[#9F1239] transition-colors">
                      Deposit a Found Item
                    </h3>
                    <p className="text-xs text-[#881337] leading-relaxed">
                      Log photos and room in 60 seconds. Our AI inspects identifying flaws, then hand it over to campus security reception.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#9F1239] border-t border-[#FCE4EC]">
                    <span>Submit Found Belonging</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>

                {/* Card 3: "Lost Notices Board" */}
                <div 
                  onClick={() => setActiveTab("lost")}
                  className="p-4 sm:p-5 rounded-lg border border-[#F0BFCB] bg-white hover:border-[#BE123C] hover:bg-[#FFF9FB] shadow-subtle hover:shadow-elevated transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#9F1239] via-[#BE123C] to-[#E11D48] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#9F1239] bg-[#FFF0F4] group-hover:bg-[#FFE4E8] group-hover:border-[#BE123C] px-2 py-0.5 rounded border border-[#FECDD6] transition-colors">
                        Step 3 • Community
                      </span>
                      <FileText className="w-4 h-4 text-[#9F1239] group-hover:scale-125 group-hover:rotate-6 transition-all duration-300" />
                    </div>
                    <h3 className="text-base font-bold text-[#1E1215] group-hover:text-[#9F1239] transition-colors">
                      Student Lost Notices
                    </h3>
                    <p className="text-xs text-[#881337] leading-relaxed">
                      Lost an item that is not in the catalog yet? Post your notice with traits and photo so finders can match and contact you.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#9F1239] border-t border-[#FCE4EC]">
                    <span>View Seeker Notices Board</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Catalog Preview on Landing Page */}
          <section className="py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#1E1215]">Recent Campus Turn-Ins</h2>
                <p className="text-xs text-[#881337]">All photos masked until verified via dynamic quiz.</p>
              </div>
              <button
                onClick={() => setActiveTab("feed")}
                className="text-xs font-bold text-[#9F1239] hover:underline flex items-center gap-1"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <MaskedCatalog
              onReportClick={() => setActiveTab("report")}
              selectedCollege={selectedCollege}
            />
          </section>
        </div>
      ) : (
        /* VIEW 2: INNER WORKSPACE TABS WITH BREADCRUMB */
        <div className="flex-1 flex flex-col">
          {/* Breadcrumb Navigation Bar */}
          <div className="bg-[#FFF4F7] border-b border-[#F0BFCB] px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("home")}
                className="text-xs font-bold text-[#9F1239] hover:text-[#881337] flex items-center gap-1 hover:underline"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Return to Home</span>
              </button>
              <span className="text-[#F0BFCB]">/</span>
              <span className="text-xs font-bold text-[#1E1215] capitalize">
                {activeTab === "feed"
                  ? "Found Items Catalog"
                  : activeTab === "report"
                  ? "Report Found Item"
                  : activeTab === "lost"
                  ? "Student Lost Notices"
                  : activeTab === "desk"
                  ? "Security Desk Handover"
                  : activeTab === "profile"
                  ? "My Profile & Activity"
                  : "Admin Portal"}
              </span>
            </div>

            <span className="text-[11px] font-mono font-medium text-[#881337]">
              Campus: {collegeCode}
            </span>
          </div>

          <main className="flex-1">
            {activeTab === "feed" && (
              <MaskedCatalog
                onReportClick={() => setActiveTab("report")}
                selectedCollege={selectedCollege}
              />
            )}

            {activeTab === "report" && (
              <FinderReportForm
                onSuccess={() => setActiveTab("feed")}
                selectedCollege={selectedCollege}
              />
            )}

            {activeTab === "lost" && (
              <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-4">
                <LostNoticesBoard
                  collegeCode={collegeCode}
                  collegeName={selectedCollege}
                  onPostNoticeClick={() => setShowLostFormModal(true)}
                />
              </div>
            )}

            {activeTab === "desk" && (
              <SecurityDeskView selectedCollege={selectedCollege} />
            )}

            {activeTab === "admin" && (
              <AdminPortal
                selectedCollege={selectedCollege}
                collegeCode={collegeCode}
                collegeDomain={currentCol.domain}
              />
            )}

            {activeTab === "profile" && (
              <UserProfile
                collegeCode={collegeCode}
                collegeName={selectedCollege}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
          </main>
        </div>
      )}

      {/* Post Lost Belonging Modal from Inner Tab */}
      {showLostFormModal && (
        <div className="fixed inset-0 z-50 bg-[#1E1215]/75 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-lg max-w-2xl w-full shadow-elevated relative my-4 sm:my-8 overflow-hidden">
            <div className="sticky top-0 z-20 bg-[#FFF9FB]/95 backdrop-blur-md px-5 py-4 border-b border-[#F2C4CE] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E1215]">Post Lost Belonging Notice</h3>
                <p className="text-xs text-[#881337]">Finders can match and contact you directly.</p>
              </div>
              <button
                onClick={() => setShowLostFormModal(false)}
                className="text-[#881337] hover:text-[#1E1215] text-lg font-bold p-1 hover:bg-[#FFE8ED] rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <LostNoticeForm
                collegeCode={collegeCode}
                collegeName={selectedCollege}
                onSuccess={() => setShowLostFormModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Institutional Campus Footer */}
      <footer className="border-t border-[#F0BFCB] bg-[#FFF5F8] py-6 mt-12 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#881337]">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#1E1215] text-sm">
              FyndoraX <span className="text-[#9F1239] font-mono text-xs">Campus OS</span>
            </span>
            <span className="opacity-40">|</span>
            <span className="font-medium">Campus Lost & Found Services</span>
            <span className="opacity-40">|</span>
            <span className="font-mono text-[11px] text-[#9F1239] font-bold">{currentCol.code}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#9F1239]" />
              <span>Zero-Leak Anti-Theft Directory</span>
            </span>
            <span className="opacity-40">•</span>
            <span>Front Desk Custody</span>
            <span className="opacity-40">•</span>
            <span className="flex items-center gap-1.5">
              <TinyFishLogo size={14} />
              <span>Powered by TinyFish Web Intelligence</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Nemo AI Interactive Assistant Launcher */}
      {!showNemoAi && (
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40">
          <button
            onClick={() => setShowNemoAi(true)}
            className="bg-gradient-to-r from-[#9F1239] via-[#881337] to-[#701A31] hover:brightness-110 text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-[0_8px_25px_-5px_rgba(159,18,57,0.4)] hover:shadow-[0_12px_32px_-4px_rgba(159,18,57,0.6)] border-2 border-white/20 flex items-center gap-2.5 transition-all duration-300 transform hover:scale-105 group animate-float-gentle"
            title="Ask Nemo AI - Step-by-Step Campus Recovery Guide"
          >
            <div className="relative flex items-center justify-center">
              <TinyFishLogo size={24} className="group-hover:scale-110 transition-transform drop-shadow-sm" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#9F1239] animate-pulse" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-black tracking-tight flex items-center gap-1.5">
                <span>Nemo AI</span>
                <span className="text-[9px] font-mono font-bold bg-white/20 text-[#FFE4E8] px-1 py-0.2 rounded uppercase">
                  Guide
                </span>
              </div>
              <div className="text-[10px] text-[#FECDD6] font-medium flex items-center gap-1">
                <span>TinyFish Powered</span>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Nemo AI Interactive Modal */}
      <NemoAiModal
        isOpen={showNemoAi}
        onClose={() => setShowNemoAi(false)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        selectedCollege={selectedCollege}
        collegeCode={currentCol.code}
      />

      {/* Global Real-time Chat Panel for Both Finders & Receivers */}
      <ChatPanel
        isOpen={showChatPanel}
        onClose={() => {
          setShowChatPanel(false);
          setActiveChatSessionId(null);
        }}
        activeChatId={activeChatSessionId}
      />

      {/* Global Campus Good Karma Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        selectedCollege={currentCol.code}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
