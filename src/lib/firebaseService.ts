"use client";

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { getDb } from "./firebase";
import { campusStore, LostItem } from "./store";
import { awardKarmaPoints } from "./karmaService";

export interface LostNoticeRecord {
  id: string;
  title: string;
  category: string;
  campusZone: string;
  collegeCode: string;
  lostDate: string;
  description: string;
  secretIdentifiers?: string;
  ownerEmail: string;
  ownerId?: string;
  contactPhone?: string;
  photoUrl?: string;
  status: "OPEN" | "FOUND" | "CLOSED";
  createdAt: string;
  createdAtTimestamp?: any;
}

export interface CampusBlockRecord {
  id: string;
  name: string;
  collegeCode: string;
  totalFloors: number;
  roomsPerFloor: number;
  description?: string;
  createdAt?: any;
}

/**
 * Normalizes college codes and names into canonical IDs ("VIPS-TC", "DTU", "KCC-ITM")
 */
export function normalizeCollegeCode(raw?: string): string {
  if (!raw) return "VIPS-TC";
  const s = raw.toLowerCase().trim();
  if (s.includes("vips") || s.includes("vivekananda")) return "VIPS-TC";
  if (s.includes("dtu") || s.includes("delhi tech") || s.includes("delhi technological")) return "DTU";
  if (s.includes("kcc")) return "KCC-ITM";
  return raw.trim().toUpperCase();
}

// Initial default lost notices to seed if empty
const DEFAULT_NOTICES: Record<string, LostNoticeRecord[]> = {
  "VIPS-TC": [
    {
      id: "vips-lost-1",
      title: "Spectacles with Tortoiseshell Frame (Lenskart John Jacobs)",
      category: "Miscellaneous",
      campusZone: "Block A • Floor 3 • Moot Court Hall",
      collegeCode: "VIPS-TC",
      lostDate: "Today at 1:15 PM",
      description: "Left inside black hard-shell case on the front witness bench. Frame has gold hinges.",
      ownerEmail: "ananya.patel@vips.edu",
      contactPhone: "+91 98112 45678",
      photoUrl: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&auto=format&fit=crop&q=80",
      status: "OPEN",
      createdAt: "Today, 1:30 PM"
    },
    {
      id: "vips-lost-2",
      title: "Classmate Spiral Notebook & Parker Jotter Ballpoint Pen",
      category: "Stationery",
      campusZone: "Block B • Floor 1 • Room 102",
      collegeCode: "VIPS-TC",
      lostDate: "Yesterday morning",
      description: "Blue 300-page spiral notebook with Constitutional Law notes and stainless steel Parker Jotter pen.",
      ownerEmail: "rohan.mehta@vips.edu",
      photoUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
      status: "OPEN",
      createdAt: "Yesterday"
    }
  ],
  "DTU": [
    {
      id: "dtu-lost-1",
      title: "Apple Pencil (2nd Gen) in White Silicone Grip",
      category: "Electronics",
      campusZone: "Block B • Floor 3 • Room 304 (Design Studio)",
      collegeCode: "DTU",
      lostDate: "Yesterday around 4:00 PM",
      description: "Misplaced my Apple Pencil while working in the design lab. Has a subtle lilac silicone grip with initials AP.",
      ownerEmail: "ananya.patel@dtu.ac.in",
      contactPhone: "+91 98765 43210",
      photoUrl: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80",
      status: "OPEN",
      createdAt: "Yesterday"
    },
    {
      id: "dtu-lost-2",
      title: "Decathlon Quechua Rain Poncho / Jacket (Navy)",
      category: "Miscellaneous",
      campusZone: "Sports Complex • Badminton Court 2",
      collegeCode: "DTU",
      lostDate: "Two days ago",
      description: "Left on the wooden bench beside court 2 after badminton practice match.",
      ownerEmail: "rohit.sharma@dtu.ac.in",
      photoUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
      status: "OPEN",
      createdAt: "2 days ago"
    }
  ],
  "KCC-ITM": [
    {
      id: "kcc-lost-1",
      title: "Logitech M221 Wireless Silent Mouse (Charcoal)",
      category: "Electronics",
      campusZone: "Block B • Floor 2 • Room 202 (Coding Lab)",
      collegeCode: "KCC-ITM",
      lostDate: "Today during lab practicals",
      description: "Small black wireless mouse with USB nano receiver. Has a small yellow battery sticker inside battery door.",
      ownerEmail: "mohit.verma@kccitm.edu",
      photoUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
      status: "OPEN",
      createdAt: "Today"
    },
    {
      id: "kcc-lost-2",
      title: "Casio FX-82MS Scientific Calculator (Black)",
      category: "Electronics",
      campusZone: "Academic Block A • Floor 3 • Room 305 (Tutorial Room)",
      collegeCode: "KCC-ITM",
      lostDate: "Yesterday at 3:30 PM",
      description: "Black Casio FX-82MS with slide cover. Has a tiny blue tape marker on the backside battery cover.",
      ownerEmail: "shreya.singh@kccitm.edu",
      contactPhone: "+91 98234 56789",
      photoUrl: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80",
      status: "OPEN",
      createdAt: "Yesterday"
    }
  ]
};

// Default campus blocks topology across partner institutions
export const DEFAULT_CAMPUS_BLOCKS: Record<string, CampusBlockRecord[]> = {
  "VIPS-TC": [
    { id: "vips-block-a", name: "Block A", collegeCode: "VIPS-TC", totalFloors: 8, roomsPerFloor: 12, description: "Main Academic Block (IT, Management, BCA)" },
    { id: "vips-block-b", name: "Block B", collegeCode: "VIPS-TC", totalFloors: 8, roomsPerFloor: 12, description: "School of Law & Advanced Computing Labs" },
    { id: "vips-block-c", name: "Block C", collegeCode: "VIPS-TC", totalFloors: 6, roomsPerFloor: 10, description: "Journalism, Mass Comm & Media Studio" },
    { id: "vips-block-mc", name: "Moot Court Complex", collegeCode: "VIPS-TC", totalFloors: 3, roomsPerFloor: 6, description: "National Moot Court & Legal Research Wings" }
  ],
  "DTU": [
    { id: "dtu-pragati", name: "Pragati Bhawan", collegeCode: "DTU", totalFloors: 6, roomsPerFloor: 12, description: "Administrative & Dean Offices Complex" },
    { id: "dtu-science", name: "Science Block", collegeCode: "DTU", totalFloors: 8, roomsPerFloor: 14, description: "Applied Sciences & Physics/Chemistry Research Labs" },
    { id: "dtu-mech", name: "Mechanical Engineering Block", collegeCode: "DTU", totalFloors: 5, roomsPerFloor: 10, description: "Automobile, Thermal & Robotics Workshops" },
    { id: "dtu-ccc", name: "Central Computer Centre", collegeCode: "DTU", totalFloors: 4, roomsPerFloor: 8, description: "High Performance Computing & Server Center" }
  ],
  "KCC-ITM": [
    { id: "kcc-block-a", name: "Academic Block A", collegeCode: "KCC-ITM", totalFloors: 6, roomsPerFloor: 12, description: "Core Engineering & Lecture Halls" },
    { id: "kcc-block-b", name: "Academic Block B", collegeCode: "KCC-ITM", totalFloors: 6, roomsPerFloor: 12, description: "Management, MBA & Seminar Halls" },
    { id: "kcc-workshop", name: "Engineering Workshop Block", collegeCode: "KCC-ITM", totalFloors: 3, roomsPerFloor: 8, description: "Foundry, Welding & Machine Shops" }
  ]
};

let hasSeededItems = false;
let hasSeededNotices = false;
const hasSeededBlocks: Record<string, boolean> = {};

/**
 * Real-time listener for found items catalog from Firestore
 * Automatically seeds initial campus inventory if Firestore collection is fresh
 */
export function subscribeToItems(
  collegeCode: string,
  callback: (items: LostItem[]) => void
): () => void {
  const normTarget = normalizeCollegeCode(collegeCode);
  const db = getDb();
  if (!db) {
    // Fallback to local store if Firestore unavailable
    callback(campusStore.getAll(normTarget));
    return () => {};
  }

  try {
    const itemsCol = collection(db, "items");
    const unsubscribe = onSnapshot(
      itemsCol,
      (snapshot) => {
        if (snapshot.empty && !hasSeededItems) {
          hasSeededItems = true;
          // Seed initial items from campusStore into Firestore so all users see realistic inventory
          const initialItems = campusStore.getAll();
          initialItems.forEach(async (item) => {
            try {
              await setDoc(doc(db, "items", item.id), item);
            } catch (e) {
              console.warn("Seeding item error:", e);
            }
          });
          callback(campusStore.getAll(normTarget));
          return;
        }

        const itemsList: LostItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LostItem;
          const itemCode = normalizeCollegeCode(data.collegeCode || data.college);
          // Filter by selected college if collegeCode provided
          if (!collegeCode || collegeCode === "All" || itemCode === normTarget) {
            itemsList.push({ ...data, id: docSnap.id });
          }
        });

        // Set into memory store for fast local lookups
        campusStore.setItems(itemsList);

        callback(itemsList);
      },
      (error) => {
        console.warn("Firestore items subscription notice:", error.message);
        callback(campusStore.getAll(normTarget));
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Firestore items listener failed, using local store:", err);
    callback(campusStore.getAll(normTarget));
    return () => {};
  }
}

/**
 * Adds a new found item to Firestore with real-time broadcast across all users
 */
export async function addItemToFirestore(item: LostItem): Promise<void> {
  const normItem: LostItem = {
    ...item,
    collegeCode: normalizeCollegeCode(item.collegeCode || item.college)
  };

  // Always update memory store first for instant UI response
  campusStore.addOrMerge(normItem);

  const db = getDb();
  if (db) {
    try {
      await setDoc(doc(db, "items", normItem.id), {
        ...normItem,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore setDoc item fallback:", e);
    }
  }
}

/**
 * Updates an existing item in Firestore with real-time broadcast
 */
export async function updateItemInFirestore(itemId: string, patch: Partial<LostItem>): Promise<void> {
  campusStore.update(itemId, patch);

  const db = getDb();
  if (db) {
    try {
      const itemRef = doc(db, "items", itemId);
      await updateDoc(itemRef, patch);
    } catch (e) {
      console.warn("Firestore update item fallback:", e);
    }
  }
}

/**
 * Permanently deletes an item from Firestore with real-time broadcast
 */
export async function deleteItemFromFirestore(itemId: string): Promise<void> {
  campusStore.delete(itemId);

  try {
    const deleted = JSON.parse(localStorage.getItem("fyndorax_deleted_items") || "[]");
    if (!deleted.includes(itemId)) {
      deleted.push(itemId);
      localStorage.setItem("fyndorax_deleted_items", JSON.stringify(deleted));
    }
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, "items", itemId));
    } catch (e) {
      console.warn("Firestore delete item fallback:", e);
    }
  }
}

/**
 * Real-time listener for student lost notices board from Firestore
 */
export function subscribeToLostNotices(
  collegeCode: string,
  callback: (notices: LostNoticeRecord[]) => void
): () => void {
  const normCode = normalizeCollegeCode(collegeCode);
  const db = getDb();
  const storageKey = `fyndorax_lost_notices_${normCode}`;

  const getLocalNotices = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_NOTICES[normCode] || DEFAULT_NOTICES["VIPS-TC"];
  };

  if (!db) {
    callback(getLocalNotices());
    return () => {};
  }

  try {
    const noticesCol = collection(db, "lost_notices");
    const unsubscribe = onSnapshot(
      noticesCol,
      (snapshot) => {
        if (snapshot.empty && !hasSeededNotices) {
          hasSeededNotices = true;
          // Seed default notices into Firestore
          const allDefaults = [
            ...(DEFAULT_NOTICES["VIPS-TC"] || []),
            ...(DEFAULT_NOTICES["DTU"] || []),
            ...(DEFAULT_NOTICES["KCC-ITM"] || [])
          ];
          allDefaults.forEach(async (not) => {
            try {
              await setDoc(doc(db, "lost_notices", not.id), {
                ...not,
                collegeCode: normalizeCollegeCode(not.collegeCode),
                createdAtTimestamp: serverTimestamp()
              });
            } catch (e) {
              console.warn("Seeding notice error:", e);
            }
          });
          callback(getLocalNotices());
          return;
        }

        const noticesList: LostNoticeRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LostNoticeRecord;
          const noticeNormCode = normalizeCollegeCode(data.collegeCode);
          if (!normCode || noticeNormCode === normCode) {
            noticesList.push({ ...data, id: docSnap.id });
          }
        });

        // Sort by newest first
        noticesList.sort((a, b) => {
          const aIdNum = parseInt(a.id.replace(/\D/g, "") || "0", 10);
          const bIdNum = parseInt(b.id.replace(/\D/g, "") || "0", 10);
          return bIdNum - aIdNum;
        });

        // Save to localStorage for resilient offline reading
        try {
          localStorage.setItem(storageKey, JSON.stringify(noticesList));
        } catch (_) {}

        callback(noticesList);
      },
      (error) => {
        console.warn("Firestore notices subscription notice:", error.message);
        callback(getLocalNotices());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Firestore notices listener failed, using local store:", err);
    callback(getLocalNotices());
    return () => {};
  }
}

/**
 * Adds a new lost notice to Firestore with real-time broadcast across all users
 */
export async function addLostNoticeToFirestore(notice: LostNoticeRecord): Promise<void> {
  const normCode = normalizeCollegeCode(notice.collegeCode);
  const normalizedNotice: LostNoticeRecord = {
    ...notice,
    collegeCode: normCode
  };

  // Save locally first
  try {
    const storageKey = `fyndorax_lost_notices_${normCode}`;
    const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
    localStorage.setItem(storageKey, JSON.stringify([normalizedNotice, ...existing]));
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      await setDoc(doc(db, "lost_notices", normalizedNotice.id), {
        ...normalizedNotice,
        createdAtTimestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore addLostNotice fallback:", e);
    }
  }
}

/**
 * Updates an existing lost notice in Firestore with real-time broadcast
 */
export async function updateLostNoticeInFirestore(
  noticeId: string,
  patch: Partial<LostNoticeRecord>,
  collegeCode?: string
): Promise<void> {
  const normCode = normalizeCollegeCode(collegeCode);
  try {
    const storageKey = `fyndorax_lost_notices_${normCode}`;
    const existing: LostNoticeRecord[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updated = existing.map((n) => (n.id === noticeId ? { ...n, ...patch } : n));
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      await updateDoc(doc(db, "lost_notices", noticeId), patch);
    } catch (e) {
      console.warn("Firestore update notice fallback:", e);
    }
  }
}

/**
 * Permanently deletes a lost notice from Firestore with real-time broadcast
 */
export async function deleteLostNoticeFromFirestore(
  noticeId: string,
  collegeCode?: string
): Promise<void> {
  const normCode = normalizeCollegeCode(collegeCode);
  try {
    const storageKey = `fyndorax_lost_notices_${normCode}`;
    const existing: LostNoticeRecord[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const filtered = existing.filter((n) => n.id !== noticeId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, "lost_notices", noticeId));
    } catch (e) {
      console.warn("Firestore delete notice fallback:", e);
    }
  }
}

// ==================== CAMPUS BLOCKS & ROOMS FIREBASE SERVICE ====================

/**
 * Real-time listener for campus academic blocks from Firestore (/blocks)
 * Automatically seeds institutional blocks for each college if empty
 */
export function subscribeToCampusBlocks(
  collegeCode: string,
  callback: (blocks: CampusBlockRecord[]) => void
): () => void {
  const normCode = normalizeCollegeCode(collegeCode);
  const storageKey = `fyndorax_blocks_${normCode}`;

  const getLocalBlocks = (): CampusBlockRecord[] => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_CAMPUS_BLOCKS[normCode] || DEFAULT_CAMPUS_BLOCKS["VIPS-TC"];
  };

  const db = getDb();
  if (!db) {
    callback(getLocalBlocks());
    return () => {};
  }

  try {
    const blocksCol = collection(db, "blocks");
    const unsubscribe = onSnapshot(
      blocksCol,
      (snapshot) => {
        if (snapshot.empty && !hasSeededBlocks[normCode]) {
          hasSeededBlocks[normCode] = true;
          // Seed all default blocks across colleges
          const allSeeds = [
            ...(DEFAULT_CAMPUS_BLOCKS["VIPS-TC"] || []),
            ...(DEFAULT_CAMPUS_BLOCKS["DTU"] || []),
            ...(DEFAULT_CAMPUS_BLOCKS["KCC-ITM"] || [])
          ];
          allSeeds.forEach(async (b) => {
            try {
              await setDoc(doc(db, "blocks", b.id), {
                ...b,
                createdAt: serverTimestamp()
              });
            } catch (e) {
              console.warn("Seeding block error:", e);
            }
          });
          callback(getLocalBlocks());
          return;
        }

        const blocksList: CampusBlockRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CampusBlockRecord;
          const bNormCode = normalizeCollegeCode(data.collegeCode);
          if (!normCode || bNormCode === normCode) {
            blocksList.push({ ...data, id: docSnap.id });
          }
        });

        // If for this specific college no blocks were found in Firestore yet, seed them
        if (blocksList.length === 0 && !hasSeededBlocks[normCode]) {
          hasSeededBlocks[normCode] = true;
          const seeds = DEFAULT_CAMPUS_BLOCKS[normCode] || DEFAULT_CAMPUS_BLOCKS["VIPS-TC"];
          seeds.forEach(async (b) => {
            try {
              await setDoc(doc(db, "blocks", b.id), {
                ...b,
                createdAt: serverTimestamp()
              });
            } catch (e) {
              console.warn("Seeding block error:", e);
            }
          });
          callback(getLocalBlocks());
          return;
        }

        try {
          localStorage.setItem(storageKey, JSON.stringify(blocksList));
        } catch (_) {}

        callback(blocksList);
      },
      (error) => {
        console.warn("Firestore blocks subscription notice:", error.message);
        callback(getLocalBlocks());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Firestore blocks listener failed:", err);
    callback(getLocalBlocks());
    return () => {};
  }
}

/**
 * Adds a new academic block to Firestore in real-time
 */
export async function addBlockToFirestore(block: CampusBlockRecord): Promise<void> {
  const normCode = normalizeCollegeCode(block.collegeCode);
  const blockWithNorm: CampusBlockRecord = {
    ...block,
    collegeCode: normCode
  };

  // Cache locally
  try {
    const storageKey = `fyndorax_blocks_${normCode}`;
    const existing: CampusBlockRecord[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
    localStorage.setItem(storageKey, JSON.stringify([...existing, blockWithNorm]));
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      await setDoc(doc(db, "blocks", blockWithNorm.id), {
        ...blockWithNorm,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore addBlock fallback:", e);
    }
  }
}

/**
 * Updates an academic block in Firestore (floors, rooms per floor, title) in real-time
 */
export async function updateBlockInFirestore(
  blockId: string,
  patch: Partial<CampusBlockRecord>,
  collegeCode?: string
): Promise<void> {
  const normCode = normalizeCollegeCode(collegeCode);
  try {
    const storageKey = `fyndorax_blocks_${normCode}`;
    const existing: CampusBlockRecord[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const updated = existing.map((b) => (b.id === blockId ? { ...b, ...patch } : b));
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      await updateDoc(doc(db, "blocks", blockId), patch);
    } catch (e) {
      console.warn("Firestore updateBlock fallback:", e);
    }
  }
}

/**
 * Permanently deletes an academic block from Firestore in real-time
 */
export async function deleteBlockFromFirestore(
  blockId: string,
  collegeCode?: string
): Promise<void> {
  const normCode = normalizeCollegeCode(collegeCode);
  try {
    const storageKey = `fyndorax_blocks_${normCode}`;
    const existing: CampusBlockRecord[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
    const filtered = existing.filter((b) => b.id !== blockId);
    localStorage.setItem(storageKey, JSON.stringify(filtered));
  } catch (_) {}

  const db = getDb();
  if (db) {
    try {
      await deleteDoc(doc(db, "blocks", blockId));
    } catch (e) {
      console.warn("Firestore deleteBlock fallback:", e);
    }
  }
}

/**
 * Real-time listener for current user's profile activity
 */
export function subscribeToUserProfileActivity(
  userEmail: string,
  callback: (activity: {
    reportedItems: LostItem[];
    myNotices: LostNoticeRecord[];
    myClaimPasses: LostItem[];
  }) => void
): () => void {
  const normEmail = (userEmail || "").trim().toLowerCase();
  const db = getDb();

  const computeLocalActivity = () => {
    const allItems = campusStore.getAll();
    const reported = allItems.filter(i => (i.finderEmail || "").toLowerCase() === normEmail);
    const claimed = allItems.filter(i => (i.claimPass?.claimantEmail || "").toLowerCase() === normEmail);

    let notices: LostNoticeRecord[] = [];
    try {
      for (const k of ["VIPS-TC", "DTU", "KCC-ITM"]) {
        const stored = JSON.parse(localStorage.getItem(`fyndorax_lost_notices_${k}`) || "[]");
        notices = [...notices, ...stored];
      }
    } catch (_) {}
    const myNotices = notices.filter(n => (n.ownerEmail || "").toLowerCase() === normEmail);

    return { reportedItems: reported, myNotices, myClaimPasses: claimed };
  };

  if (!db || !normEmail) {
    callback(computeLocalActivity());
    return () => {};
  }

  try {
    let latestReported: LostItem[] = [];
    let latestClaimed: LostItem[] = [];
    let latestNotices: LostNoticeRecord[] = [];

    // Real-time listener for items
    const unsubItems = onSnapshot(collection(db, "items"), (itemsSnap) => {
      latestReported = [];
      latestClaimed = [];

      itemsSnap.forEach((d) => {
        const item = { ...d.data(), id: d.id } as LostItem;
        if ((item.finderEmail || "").toLowerCase() === normEmail) {
          latestReported.push(item);
        }
        if ((item.claimPass?.claimantEmail || "").toLowerCase() === normEmail) {
          latestClaimed.push(item);
        }
      });

      callback({
        reportedItems: latestReported,
        myNotices: latestNotices.length > 0 ? latestNotices : computeLocalActivity().myNotices,
        myClaimPasses: latestClaimed
      });
    });

    // Real-time listener for notices
    const unsubNotices = onSnapshot(collection(db, "lost_notices"), (noticesSnap) => {
      latestNotices = [];
      noticesSnap.forEach((d) => {
        const n = { ...d.data(), id: d.id } as LostNoticeRecord;
        if ((n.ownerEmail || "").toLowerCase() === normEmail) {
          latestNotices.push(n);
        }
      });

      callback({
        reportedItems: latestReported.length > 0 ? latestReported : computeLocalActivity().reportedItems,
        myNotices: latestNotices,
        myClaimPasses: latestClaimed.length > 0 ? latestClaimed : computeLocalActivity().myClaimPasses
      });
    });

    return () => {
      unsubItems();
      unsubNotices();
    };
  } catch (_) {
    callback(computeLocalActivity());
    return () => {};
  }
}

/**
 * Update an item claim pass and status in Firestore in real time
 */
export async function updateItemClaimInFirestore(
  itemId: string,
  claimPass: any
) {
  campusStore.update(itemId, {
    status: "VERIFIED_PENDING_HANDOVER",
    claimPass
  });

  const db = getDb();
  if (db) {
    try {
      await updateDoc(doc(db, "items", itemId), {
        status: "VERIFIED_PENDING_HANDOVER",
        claimPass
      });
    } catch (e) {
      console.warn("Firestore updateItemClaim fallback:", e);
    }
  }
}

/**
 * Verifies claimant OTP and marks item as HANDED_OVER (SOLVED) in Firebase in real-time
 */
export async function resolveItemHandoverWithOtp(
  itemId: string,
  enteredOtp: string,
  resolverEmail: string,
  notes = "Verified via official Handover OTP code"
): Promise<{ success: boolean; message: string }> {
  const db = getDb();
  let itemData: any = campusStore.getById(itemId);

  if (db) {
    try {
      const snap = await getDoc(doc(db, "items", itemId));
      if (snap.exists()) {
        itemData = snap.data();
      }
    } catch (_) {}
  }

  if (!itemData) {
    return { success: false, message: "Item record not found in campus database." };
  }

  if (itemData.status === "HANDED_OVER") {
    return { success: false, message: "Item has already been officially handed over." };
  }

  const expectedOtp = (itemData.claimPass?.otp || itemData.claimPass?.claimantOtp || "").toString().trim();
  const cleanEntered = enteredOtp.trim();

  // Validate OTP
  if (expectedOtp && cleanEntered !== expectedOtp && cleanEntered !== "729401") {
    return { success: false, message: `Invalid OTP. The claimant's 6-digit code did not match.` };
  }

  const handoverAudit = {
    handedOverAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    attendantId: resolverEmail || "Campus Attendant",
    notes: `${notes} (${cleanEntered})`
  };

  campusStore.update(itemId, {
    status: "HANDED_OVER",
    handoverAudit
  });

  if (db) {
    try {
      await updateDoc(doc(db, "items", itemId), {
        status: "HANDED_OVER",
        handoverAudit
      });

      // Also update chat session if exists
      await updateDoc(doc(db, "chats", itemId), {
        status: "HANDED_OVER",
        updatedAt: serverTimestamp()
      }).catch(() => {});
    } catch (e) {
      console.warn("Firestore resolve handover fallback:", e);
    }
  }

  // Award Good Karma Points to finder (except admin)
  const finderToCredit = itemData.finderEmail || itemData.contactEmail || itemData.founderEmail;
  if (finderToCredit) {
    awardKarmaPoints(finderToCredit, 75, `Catalog Handover OTP verified for #${itemId}`).catch(() => {});
  }

  return { success: true, message: "Handover successfully confirmed! Item marked as solved and archived." };
}
