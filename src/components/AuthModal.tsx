"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { COLLEGE_DOMAINS } from "@/lib/firebase";
import { 
  Lock, 
  Mail, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  GraduationCap, 
  Building2 
} from "lucide-react";

interface AuthModalProps {
  collegeCode: string;
  collegeName: string;
}

export default function AuthModal({ collegeCode, collegeName }: AuthModalProps) {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authRequiredAction, 
    login, 
    signup, 
    loginAdmin 
  } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "admin">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const expectedDomain = COLLEGE_DOMAINS[collegeCode] || "@college.edu";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "admin") {
        await loginAdmin(email, password);
        setSuccessMsg("Administrator session authenticated.");
        setTimeout(() => setAuthModalOpen(false), 900);
      } else if (mode === "signup") {
        await signup(email, password, collegeCode);
        setSuccessMsg(`Account created for ${expectedDomain}. You are now verified.`);
        setTimeout(() => setAuthModalOpen(false), 1000);
      } else {
        await login(email, password, collegeCode);
        setSuccessMsg("Welcome back! Campus session established.");
        setTimeout(() => setAuthModalOpen(false), 800);
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const autofillDemoStudent = () => {
    const domain = expectedDomain.replace("@", "");
    setEmail(`student.demo@${domain}`);
    setPassword("campus2026");
  };

  const autofillDemoAdmin = () => {
    setEmail("admin@fyndorax.edu");
    setPassword("campus2026");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1215]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-lg max-w-md w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FFF0F4] via-[#FFE4E8] to-[#FFF0F4] p-5 border-b border-[#F2C4CE] relative">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-4 right-4 text-[#881337] hover:text-[#1E1215] font-bold text-sm w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#FFE0E6] transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#E11D48] bg-clip-text text-transparent">
              Fyndora
            </span>
            <span className="font-black text-lg text-[#E11D48] italic -ml-1.5">
              X
            </span>
            <span className="text-[10px] font-mono font-bold uppercase bg-white text-[#9F1239] px-2 py-0.5 rounded border border-[#FECDD6]">
              Verified Campus Access
            </span>
          </div>

          <h3 className="text-base font-extrabold text-[#1E1215]">
            {mode === "admin" 
              ? "Administrator Authentication" 
              : mode === "signup" 
              ? `Student Registration (${collegeCode})` 
              : `Campus Student Login (${collegeCode})`}
          </h3>

          <p className="text-xs text-[#881337] mt-0.5">
            {authRequiredAction 
              ? `Verification required to ${authRequiredAction}`
              : `Secured multi-tenant access for ${collegeName}`}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-[#F2C4CE] text-xs font-semibold bg-[#FFF4F7]">
          <button
            onClick={() => { setMode("login"); setError(null); }}
            className={`flex-1 py-2.5 text-center transition-colors ${
              mode === "login" 
                ? "bg-white text-[#9F1239] font-bold border-b-2 border-[#9F1239]" 
                : "text-[#881337] hover:bg-[#FFE8ED]"
            }`}
          >
            Student Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 py-2.5 text-center transition-colors ${
              mode === "signup" 
                ? "bg-white text-[#9F1239] font-bold border-b-2 border-[#9F1239]" 
                : "text-[#881337] hover:bg-[#FFE8ED]"
            }`}
          >
            New Student Register
          </button>
          <button
            onClick={() => { setMode("admin"); setError(null); }}
            className={`flex-1 py-2.5 text-center transition-colors ${
              mode === "admin" 
                ? "bg-white text-[#9F1239] font-bold border-b-2 border-[#9F1239]" 
                : "text-[#881337] hover:bg-[#FFE8ED]"
            }`}
          >
            Admin Gate
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-md flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode !== "admin" && (
            <div className="bg-[#FFF0F4] border border-[#FECDD6] p-2.5 rounded-md text-[11px] text-[#881337] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#9F1239]" />
                <span>Authorized Domain: <strong>{expectedDomain}</strong></span>
              </div>
              <button
                type="button"
                onClick={autofillDemoStudent}
                className="text-[10px] text-[#9F1239] font-bold underline hover:text-[#881337]"
              >
                Autofill Demo
              </button>
            </div>
          )}

          {mode === "admin" && (
            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded-md text-[11px] text-stone-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#9F1239]" />
                <span>Admin Portal: <strong>admin@fyndorax.edu</strong></span>
              </div>
              <button
                type="button"
                onClick={autofillDemoAdmin}
                className="text-[10px] text-[#9F1239] font-bold underline hover:text-[#881337]"
              >
                Autofill Admin
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#1E1215] mb-1">
              {mode === "admin" ? "Administrative Email Address" : "Institutional Student Email"}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#881337] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === "admin" ? "admin@fyndorax.edu" : `rollno${expectedDomain}`}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1E1215] mb-1">
              Account Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#881337] absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215]"
              />
            </div>
            {mode === "signup" && (
              <span className="text-[10px] text-[#881337] mt-0.5 block">Minimum 6 characters required</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#9F1239] hover:bg-[#881337] text-white py-2.5 rounded-md font-bold text-xs transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {mode === "admin" 
                    ? "Verify Admin Credentials" 
                    : mode === "signup" 
                    ? "Register & Verify Identity" 
                    : "Sign In With Campus Account"}
                </span>
              </>
            )}
          </button>
        </form>

        <div className="p-3 bg-[#FFF0F4] border-t border-[#F2C4CE] text-center text-[10px] text-[#881337]">
          Protected by Firebase Authentication & Campus Domain Isolation
        </div>
      </div>
    </div>
  );
}
