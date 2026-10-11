"use client";

import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { getDb } from "./firebase";
import { createNotification } from "./notificationService";

export interface ChatSession {
  id: string; // Unique chat ID (e.g. notice-123 or item-123)
  type: "NOTICE" | "CATALOG";
  itemId: string;
  itemTitle: string;
  campusZone: string;
  finderEmail: string; // Person who found / is returning the item
  claimantEmail: string; // Person who lost / is receiving the item (Notice Owner or Catalog Claimant)
  lastMessage?: string;
  lastMessageSender?: string;
  lastMessageTimestamp?: string;
  updatedAt?: any;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderRole: "finder" | "owner" | "claimant" | "desk";
  text: string;
  timestamp: string;
  createdAt?: any;
}

/**
 * Real-time listener for all active chat sessions belonging to a user
 */
export function subscribeToUserChats(
  userEmail: string,
  callback: (chats: ChatSession[]) => void
): () => void {
  const normEmail = (userEmail || "").trim().toLowerCase();
  const db = getDb();
  const storageKey = `fyndorax_user_chats_${normEmail}`;

  const getLocal = (): ChatSession[] => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  };

  if (!db || !normEmail) {
    callback(getLocal());
    return () => {};
  }

  try {
    const chatsCol = collection(db, "chats");
    const unsubscribe = onSnapshot(
      chatsCol,
      (snapshot) => {
        const list: ChatSession[] = [];
        snapshot.forEach((snapDoc) => {
          const data = snapDoc.data() as ChatSession;
          const fEmail = (data.finderEmail || "").trim().toLowerCase();
          const cEmail = (data.claimantEmail || "").trim().toLowerCase();

          // User is either finder or claimant/owner in this chat, or is admin
          if (fEmail === normEmail || cEmail === normEmail || normEmail.includes("admin@")) {
            list.push({ ...data, id: snapDoc.id });
          }
        });

        // Sort by most recently updated
        list.sort((a, b) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : parseInt(a.id.replace(/\D/g, "") || "0", 10);
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : parseInt(b.id.replace(/\D/g, "") || "0", 10);
          return timeB - timeA;
        });

        try {
          localStorage.setItem(storageKey, JSON.stringify(list));
        } catch (_) {}

        callback(list);
      },
      (error) => {
        console.warn("Chats subscription fallback:", error.message);
        callback(getLocal());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Chats listener failed:", err);
    callback(getLocal());
    return () => {};
  }
}

/**
 * Ensures a chat session exists in Firestore with correct metadata
 */
export async function ensureChatSession(session: Omit<ChatSession, "updatedAt">): Promise<void> {
  const db = getDb();
  const normFinder = (session.finderEmail || "").trim().toLowerCase();
  const normClaimant = (session.claimantEmail || "").trim().toLowerCase();

  const sessionData: ChatSession = {
    ...session,
    finderEmail: normFinder,
    claimantEmail: normClaimant,
    updatedAt: serverTimestamp()
  };

  if (db) {
    try {
      await setDoc(doc(db, "chats", session.id), sessionData, { merge: true });
    } catch (e) {
      console.warn("Firestore ensureChatSession fallback:", e);
    }
  }
}

/**
 * Sends a message in a chat and notifies the recipient user
 */
export async function sendChatMessage(
  chatId: string,
  msg: {
    sender: string;
    senderRole: "finder" | "owner" | "claimant" | "desk";
    text: string;
  },
  sessionInfo: {
    type: "NOTICE" | "CATALOG";
    itemId: string;
    itemTitle: string;
    campusZone: string;
    finderEmail: string;
    claimantEmail: string;
  }
): Promise<void> {
  const db = getDb();
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const normSender = (msg.sender || "").trim().toLowerCase();
  const normFinder = (sessionInfo.finderEmail || "").trim().toLowerCase();
  const normClaimant = (sessionInfo.claimantEmail || "").trim().toLowerCase();

  // Determine recipient
  const recipientEmail = normSender === normFinder ? normClaimant : normFinder;

  const newMsgRecord = {
    sender: normSender,
    senderRole: msg.senderRole,
    text: msg.text.trim(),
    timestamp,
    createdAt: serverTimestamp()
  };

  // Local storage update for fast immediate response
  try {
    const storageKey = `fyndorax_chat_${chatId}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    localStorage.setItem(storageKey, JSON.stringify([...existing, { ...newMsgRecord, id: `msg-${Date.now()}` }]));
  } catch (_) {}

  if (db) {
    try {
      // 1. Add message to subcollection
      await addDoc(collection(db, "chats", chatId, "messages"), newMsgRecord);

      // 2. Update parent chat doc
      await setDoc(doc(db, "chats", chatId), {
        ...sessionInfo,
        id: chatId,
        finderEmail: normFinder,
        claimantEmail: normClaimant,
        lastMessage: msg.text.trim(),
        lastMessageSender: normSender,
        lastMessageTimestamp: timestamp,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 3. Send real-time notification to the other party
      if (recipientEmail && recipientEmail !== normSender) {
        const senderLabel = msg.senderRole === "finder" 
          ? "Finder" 
          : sessionInfo.type === "NOTICE" 
          ? "Lost Item Owner" 
          : "Verified Claimant";

        await createNotification({
          recipientEmail,
          senderEmail: normSender,
          type: "CHAT_MESSAGE",
          title: `New message on "${sessionInfo.itemTitle}"`,
          body: `${senderLabel} (${normSender}): "${msg.text.trim()}"`,
          chatId,
          itemId: sessionInfo.itemId,
          itemTitle: sessionInfo.itemTitle
        });
      }
    } catch (e) {
      console.warn("Firestore sendChatMessage fallback:", e);
    }
  }
}
