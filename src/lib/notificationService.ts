"use client";

import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { getDb } from "./firebase";

export interface AppNotification {
  id: string;
  recipientEmail: string;
  senderEmail: string;
  type: "CHAT_MESSAGE" | "CLAIM_VERIFIED" | "NOTICE_RESPONSE" | "HANDOVER_UPDATE";
  title: string;
  body: string;
  chatId?: string;
  itemId?: string;
  itemTitle?: string;
  read: boolean;
  createdAt?: any;
  timestampStr?: string;
}

/**
 * Subscribes to real-time notifications for the current user in Firestore
 */
export function subscribeToNotifications(
  userEmail: string,
  callback: (notifications: AppNotification[]) => void
): () => void {
  const normEmail = (userEmail || "").trim().toLowerCase();
  const db = getDb();
  const storageKey = `fyndorax_notifs_${normEmail}`;

  const getLocal = (): AppNotification[] => {
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
    const notifsCol = collection(db, "notifications");
    const unsubscribe = onSnapshot(
      notifsCol,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((snapDoc) => {
          const data = snapDoc.data() as AppNotification;
          if ((data.recipientEmail || "").trim().toLowerCase() === normEmail) {
            list.push({ ...data, id: snapDoc.id });
          }
        });

        // Sort newest first by timestamp or ID
        list.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : parseInt(a.id.replace(/\D/g, "") || "0", 10);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : parseInt(b.id.replace(/\D/g, "") || "0", 10);
          return timeB - timeA;
        });

        try {
          localStorage.setItem(storageKey, JSON.stringify(list));
        } catch (_) {}

        callback(list);
      },
      (error) => {
        console.warn("Notifications subscription fallback:", error.message);
        callback(getLocal());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Notifications listener failed:", err);
    callback(getLocal());
    return () => {};
  }
}

/**
 * Creates and broadcasts a notification to a recipient user
 */
export async function createNotification(notif: Omit<AppNotification, "id" | "read">): Promise<void> {
  const normRecipient = (notif.recipientEmail || "").trim().toLowerCase();
  const normSender = (notif.senderEmail || "").trim().toLowerCase();

  // Don't notify self
  if (normRecipient === normSender) return;

  const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const record: AppNotification = {
    ...notif,
    id: notifId,
    recipientEmail: normRecipient,
    senderEmail: normSender,
    read: false,
    timestampStr: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };

  // Local cache backup
  try {
    const storageKey = `fyndorax_notifs_${normRecipient}`;
    const existing: AppNotification[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
    localStorage.setItem(storageKey, JSON.stringify([record, ...existing]));
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      await setDoc(doc(db, "notifications", notifId), {
        ...record,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore createNotification fallback:", e);
    }
  }
}

/**
 * Marks a single notification as read
 */
export async function markNotificationAsRead(notifId: string, userEmail?: string): Promise<void> {
  if (userEmail) {
    try {
      const storageKey = `fyndorax_notifs_${userEmail.trim().toLowerCase()}`;
      const existing: AppNotification[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const updated = existing.map(n => n.id === notifId ? { ...n, read: true } : n);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (_) {}
  }

  const db = getDb();
  if (db) {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (e) {
      console.warn("Firestore markNotificationAsRead fallback:", e);
    }
  }
}

/**
 * Marks all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userEmail: string): Promise<void> {
  const normEmail = (userEmail || "").trim().toLowerCase();
  try {
    const storageKey = `fyndorax_notifs_${normEmail}`;
    const existing: AppNotification[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updated = existing.map(n => ({ ...n, read: true }));
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      const notifsCol = collection(db, "notifications");
      const snap = await getDocs(notifsCol);
      const batch = writeBatch(db);
      let count = 0;
      snap.forEach(d => {
        const data = d.data();
        if ((data.recipientEmail || "").trim().toLowerCase() === normEmail && !data.read) {
          batch.update(d.ref, { read: true });
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.warn("Firestore markAllNotificationsAsRead fallback:", e);
    }
  }
}
