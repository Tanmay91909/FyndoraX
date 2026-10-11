"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence 
} from "firebase/auth";
import { auth, validateCampusEmail, isCampusAdmin } from "@/lib/firebase";
import { syncUserKarmaProfile } from "@/lib/karmaService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string, collegeCode: string) => Promise<void>;
  signup: (email: string, pass: string, collegeCode: string) => Promise<void>;
  loginAdmin: (email: string, pass: string, isRegister?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authRequiredAction: string | null;
  triggerAuthGuard: (actionName: string, callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  login: async () => {},
  signup: async () => {},
  loginAdmin: async () => {},
  logout: async () => {},
  authModalOpen: false,
  setAuthModalOpen: () => {},
  authRequiredAction: null,
  triggerAuthGuard: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRequiredAction, setAuthRequiredAction] = useState<string | null>(null);
  const [postAuthCallback, setPostAuthCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Lock in permanent browser local persistence so users are NEVER logged out automatically
    if (typeof window !== "undefined" && auth) {
      try {
        setPersistence(auth, browserLocalPersistence).catch((err) => {
          console.warn("Auth persistence configuration notice:", err);
        });
      } catch (_) {}
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser?.email && !isCampusAdmin(currentUser.email)) {
        syncUserKarmaProfile(currentUser.email, undefined, currentUser.displayName || undefined).catch(() => {});
      }
      if (currentUser && postAuthCallback) {
        postAuthCallback();
        setPostAuthCallback(null);
      }
    });
    return () => unsubscribe();
  }, [postAuthCallback]);

  const login = async (email: string, pass: string, collegeCode: string) => {
    const valid = validateCampusEmail(email, collegeCode);
    if (!valid) {
      throw new Error(`Email must end with your institution domain for ${collegeCode}.`);
    }
    await signInWithEmailAndPassword(auth, email.trim(), pass);
    if (!isCampusAdmin(email)) {
      syncUserKarmaProfile(email.trim(), collegeCode).catch(() => {});
    }
  };

  const signup = async (email: string, pass: string, collegeCode: string) => {
    const valid = validateCampusEmail(email, collegeCode);
    if (!valid) {
      throw new Error(`Registration restricted: only approved education emails for ${collegeCode} are allowed.`);
    }
    await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (!isCampusAdmin(email)) {
      syncUserKarmaProfile(email.trim(), collegeCode).catch(() => {});
    }
  };

  const loginAdmin = async (email: string, pass: string, isRegister = false) => {
    if (!isCampusAdmin(email)) {
      throw new Error("Access Denied: Provided email is not authorized for administrative control.");
    }
    
    if (isRegister) {
      try {
        await createUserWithEmailAndPassword(auth, email.trim(), pass);
        return;
      } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
          await signInWithEmailAndPassword(auth, email.trim(), pass);
          return;
        }
        throw err;
      }
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err: any) {
      // Auto-provision if account doesn't exist yet in Firebase Auth
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-login-credentials"
      ) {
        try {
          await createUserWithEmailAndPassword(auth, email.trim(), pass);
          return;
        } catch (createErr: any) {
          if (createErr.code === "auth/email-already-in-use") {
            throw new Error("Incorrect password for this administrator account. Please check your password.");
          } else if (createErr.code === "auth/weak-password") {
            throw new Error("Admin password must be at least 6 characters.");
          }
          throw err;
        }
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const triggerAuthGuard = (actionName: string, callback: () => void) => {
    if (user) {
      callback();
    } else {
      setAuthRequiredAction(actionName);
      setPostAuthCallback(() => callback);
      setAuthModalOpen(true);
    }
  };

  const isAdmin = isCampusAdmin(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        login,
        signup,
        loginAdmin,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authRequiredAction,
        triggerAuthGuard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
