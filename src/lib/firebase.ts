import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";

// User's provided Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBvNC79HDQNR5TAg9MrXQ44MpC5KMZeKZU",
  authDomain: "fyndorax.firebaseapp.com",
  projectId: "fyndorax",
  storageBucket: "fyndorax.firebasestorage.app",
  messagingSenderId: "963344216225",
  appId: "1:963344216225:web:7bd8cbf2c78fc0ef0b80e0",
  measurementId: "G-LW3EXYE41B"
};

// Initialize Firebase (singleton pattern)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Safe lazy Firestore accessor to ensure SSR prerendering and module import never crash
let _db: any = null;
try {
  if (typeof window !== "undefined") {
    _db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firestore initialization notice:", e);
}

export function getDb() {
  if (!_db && typeof window !== "undefined") {
    try {
      _db = getFirestore(app);
    } catch (_) {}
  }
  return _db;
}

export const db = _db;

// Domain whitelist helper
export const COLLEGE_DOMAINS: Record<string, string> = {
  "VIPS-TC": "@vips.edu",
  "DTU": "@dtu.ac.in",
  "KCC-ITM": "@kccitm.edu"
};

// Authorized Admin emails (isolated from regular student accounts)
export const AUTHORIZED_ADMIN_EMAILS = [
  "admin@vips.edu",
  "admin@dtu.ac.in",
  "admin@kccitm.edu",
  "admin@fyndorax.edu",
  "hackx@fyndorax.edu"
];

/**
 * Validates whether an email belongs to the selected campus domain
 */
export function validateCampusEmail(email: string, collegeCode: string): boolean {
  const normalized = email.trim().toLowerCase();
  const domain = COLLEGE_DOMAINS[collegeCode]?.toLowerCase();
  if (!domain) return false;
  
  // Allow authorized admin or exact college domain or test domain
  if (AUTHORIZED_ADMIN_EMAILS.includes(normalized)) return true;
  if (normalized.endsWith("@fyndorax.edu")) return true;
  return normalized.endsWith(domain);
}

export function isCampusAdmin(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.includes(normalized) || normalized.startsWith("admin@");
}

export interface ChatMessage {
  id?: string;
  itemId: string;
  sender: string;
  senderRole: "finder" | "acceptor" | "desk";
  text: string;
  timestamp: any;
}

export interface LostNotice {
  id?: string;
  title: string;
  category: string;
  campusZone: string;
  collegeCode: string;
  lostDate: string;
  description: string;
  secretIdentifiers?: string;
  ownerEmail: string;
  contactNumber?: string;
  photoUrl?: string;
  status: "OPEN" | "FOUND" | "CLOSED";
  createdAt?: any;
}
