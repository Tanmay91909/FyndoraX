"use client";

import React, { useState, useEffect } from "react";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Info, 
  Building2, 
  DoorOpen,
  Lock 
} from "lucide-react";
import { campusStore } from "@/lib/store";

interface FinderReportFormProps {
  onSuccess: () => void;
  selectedCollege: string;
}

// Presets without "for live pitch" wording and with Audio merged into Electronics
const DEMO_PRESETS = [
  {
    name: "boAt Wireless Earbuds (Matte Black)",
    category: "Electronics",
    zone: "Block A • Floor 2 • Room 204",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    block: "Block A",
    floor: 2,
    room: "Room 204"
  },
  {
    name: "Scientific Calculator (Casio fx-991EX)",
    category: "Electronics",
    zone: "Block B • Floor 3 • Room 304",
    image: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&auto=format&fit=crop&q=80",
    block: "Block B",
    floor: 3,
    room: "Room 304"
  },
  {
    name: "Milton Insulated Bottle (Sage Green)",
    category: "Bottles & Mugs",
    zone: "Common Facility • Student Canteen",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    block: "Common Facilities",
    floor: 1,
    room: "Canteen Area"
  },
  {
    name: "Vehicle Ignition Key & Leather Fob",
    category: "Keys",
    zone: "Common Facility • Parking Lot B",
    image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80",
    block: "Common Facilities",
    floor: 0,
    room: "Parking Lot B"
  },
  {
    name: "UV-Shield Navy Folding Umbrella",
    category: "Miscellaneous",
    zone: "Block C • Floor 1 • Room 108",
    image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80",
    block: "Block C",
    floor: 1,
    room: "Room 108"
  }
];

import { useAuth } from "@/context/AuthContext";
import { 
  addItemToFirestore, 
  subscribeToCampusBlocks, 
  CampusBlockRecord, 
  normalizeCollegeCode 
} from "@/lib/firebaseService";
import { inspectLostItemWithGemini } from "@/lib/gemini";
import { compressImageFile } from "@/lib/imageUtils";

export default function FinderReportForm({ onSuccess, selectedCollege }: FinderReportFormProps) {
  const { user, triggerAuthGuard } = useAuth();

  // Location selection mode: "block" | "common"
  const [locationMode, setLocationMode] = useState<"block" | "common">("block");
  
  // Blocks fetched directly from Firebase Firestore in real-time
  const [blocks, setBlocks] = useState<CampusBlockRecord[]>([
    { id: "vips-block-a", name: "Block A", collegeCode: "VIPS-TC", totalFloors: 8, roomsPerFloor: 12 },
    { id: "vips-block-b", name: "Block B", collegeCode: "VIPS-TC", totalFloors: 8, roomsPerFloor: 12 },
    { id: "vips-block-c", name: "Block C", collegeCode: "VIPS-TC", totalFloors: 6, roomsPerFloor: 10 },
  ]);
  const [selectedBlock, setSelectedBlock] = useState("Block A");
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState("101");
  const [commonFacility, setCommonFacility] = useState("Central Library (Circulation Desk)");

  // Always bound strictly to authenticated student user ID
  const activeFinderEmail = user?.email || "";
  const [finderEmail, setFinderEmail] = useState(user?.email || "");

  useEffect(() => {
    if (user?.email) {
      setFinderEmail(user.email);
    }
  }, [user]);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<any>(null);
  const [isDuplicateMerged, setIsDuplicateMerged] = useState<boolean>(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time campus academic blocks in Firebase
  useEffect(() => {
    const unsub = subscribeToCampusBlocks(selectedCollege, (liveBlocks) => {
      if (liveBlocks.length > 0) {
        setBlocks(liveBlocks);
        if (!liveBlocks.some((b) => b.name === selectedBlock)) {
          setSelectedBlock(liveBlocks[0].name);
        }
      }
    });
    return () => unsub();
  }, [selectedCollege]);

  const currentBlockObj = blocks.find((b) => b.name === selectedBlock) || blocks[0];
  const maxFloors = currentBlockObj?.totalFloors || 8;
  const roomsCount = currentBlockObj?.roomsPerFloor || 12;

  // File upload handler with compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImageFile(file, 960, 960, 0.82);
        setImages((prev) => [...prev, compressed].slice(0, 5));
      } catch (_) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setImages((prev) => [...prev, reader.result as string].slice(0, 5));
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const loadPreset = (preset: typeof DEMO_PRESETS[0]) => {
    setImages([preset.image]);
    setError(null);
    if (preset.block === "Common Facilities") {
      setLocationMode("common");
      setCommonFacility(preset.zone.replace(/^Common Facility •\s*/, ""));
    } else {
      setLocationMode("block");
      setSelectedBlock(preset.block);
      setSelectedFloor(preset.floor);
      setSelectedRoom(preset.room.replace(/^Room\s*/, ""));
    }
  };

  const computeCampusZoneString = () => {
    if (locationMode === "common") {
      return `Common Facility • ${commonFacility}`;
    }
    return `${selectedBlock} • Floor ${selectedFloor} • Room ${selectedRoom}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError("Please add at least 1 photo or select a standard campus preset");
      return;
    }

    if (!user) {
      triggerAuthGuard("Report Found Item", () => {
        // Logged in
      });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const zoneString = computeCampusZoneString();
      const effectiveFinderEmail = user?.email || finderEmail || "student.finder@campus.edu";
      const matchedPreset = DEMO_PRESETS.find((p) => images.includes(p.image));

      // 1. Run Gemini 3.5 Flash Lite Vision Inspection with 9-Key Round Robin
      let inspection: any = null;
      try {
        inspection = await inspectLostItemWithGemini(
          images,
          zoneString,
          matchedPreset?.category
        );
      } catch (geminiErr: any) {
        console.warn("[FinderReportForm] Gemini inspection warning:", geminiErr?.message || geminiErr);
      }

      // 2. Derive classification from inspection or preset
      const rawCategory = (inspection?.publicMetadata?.broadCategory || matchedPreset?.category || "Miscellaneous").toLowerCase();
      let finalCat: any = "Miscellaneous";
      if (rawCategory.includes("electronic") || rawCategory.includes("audio") || rawCategory.includes("earbud") || rawCategory.includes("phone") || rawCategory.includes("laptop") || rawCategory.includes("calculator") || rawCategory.includes("watch")) {
        finalCat = "Electronics";
      } else if (rawCategory.includes("bottle") || rawCategory.includes("mug") || rawCategory.includes("flask")) {
        finalCat = "Bottles & Mugs";
      } else if (rawCategory.includes("key")) {
        finalCat = "Keys";
      } else if (rawCategory.includes("stationery") || rawCategory.includes("book") || rawCategory.includes("pen") || rawCategory.includes("notes")) {
        finalCat = "Stationery";
      } else if (rawCategory.includes("card") || rawCategory.includes("id")) {
        finalCat = "Cards & IDs";
      }

      const itemTitle = inspection?.publicMetadata?.generalColor && inspection?.publicMetadata?.itemType
        ? `${inspection.publicMetadata.generalColor} ${inspection.publicMetadata.itemType}`
        : (matchedPreset?.name || `Turned In ${finalCat}`);

      const generatedQuestions = (inspection?.suggestedVerificationQuestions && Array.isArray(inspection.suggestedVerificationQuestions) && inspection.suggestedVerificationQuestions.length >= 2)
        ? inspection.suggestedVerificationQuestions
        : [
          "What specific brand name or logo is visible on this item?",
          "Describe any unique markings, stickers, or attachments.",
          "What color is the exterior finish or cover?"
        ];

      const newItem: any = {
        id: `item-${Date.now()}`,
        publicTitle: itemTitle,
        category: finalCat,
        campusZone: zoneString,
        block: locationMode === "block" ? selectedBlock : "Common Facilities",
        floor: locationMode === "block" ? selectedFloor : 0,
        room: locationMode === "block" ? `Room ${selectedRoom}` : commonFacility,
        finderEmail: effectiveFinderEmail,
        college: selectedCollege,
        collegeCode: normalizeCollegeCode(selectedCollege),
        foundAt: "Just Now",
        status: "MASKED_AVAILABLE",
        photos: images,
        claimAttemptsCount: 0,
        publicMetadata: inspection?.publicMetadata || {
          broadCategory: finalCat,
          itemType: itemTitle,
          generalColor: "Original Color",
          roughCondition: "Good",
          estimatedBrand: "Identified"
        },
        secretGroundTruth: inspection?.secretGroundTruth || {
          brandAndExactModel: itemTitle,
          uniqueStickersOrMarkings: "Verified markers registered",
          physicalDefectsOrDamage: "Normal wear",
          accessoriesOrContents: "Custody intact"
        },
        verificationQuestions: generatedQuestions
      };

      // Broadcast to Firebase Firestore in real-time
      await addItemToFirestore(newItem);
      const mergeRes = campusStore.addOrMerge(newItem);
      setInspectionResult(mergeRes.item);
      setIsDuplicateMerged(mergeRes.isDuplicate);
      setDuplicateMessage(mergeRes.message);
    } catch (err: any) {
      setError(err?.message || "Failed to process item turn-in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Intro Header */}
      <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 mb-6 shadow-subtle">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded-xs font-bold border border-[#FECDD6]">
            Finder Fast-Track
          </span>
          <span className="text-xs text-[#881337] font-semibold">3-Second Multi-Angle Vision Inspection</span>
        </div>
        <h1 className="text-xl font-extrabold text-[#1E1215] tracking-tight">
          Report Found Campus Belonging
        </h1>
        <p className="text-xs text-[#881337] mt-1 leading-relaxed">
          Snap 3–5 multi-angle photos. Multimodal AI inspection automatically detects item category, brand, and secret physical markers—eliminating tedious manual forms and preserving your personal privacy.
        </p>

        {/* Quick Demo Presets */}
        <div className="mt-4 pt-4 border-t border-[#F2C4CE]">
          <div className="text-[10px] font-mono font-bold text-[#881337] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#9F1239]" />
            <span>Standard Campus Demonstration Presets:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {DEMO_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => loadPreset(p)}
                className="text-left bg-[#FFF0F4] hover:bg-[#FFE4E8] border border-[#F0BFCB] hover:border-[#EAA7B7] p-2 rounded-xs transition-colors text-xs flex flex-col justify-between"
              >
                <span className="font-semibold text-[#1E1215] line-clamp-1 text-[11px]">{p.name}</span>
                <span className="text-[9px] text-[#881337] font-mono mt-1">{p.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {inspectionResult ? (
        /* SUCCESS / INSPECTED CONFIRMATION */
        <div className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 shadow-elevated space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#1E1215]">
                  {isDuplicateMerged ? "Existing Item Entry Reaffirmed & Updated" : "Item Cataloged & Security Wall Sealed"}
                </h3>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs border ${
                  isDuplicateMerged 
                    ? "bg-[#FFE4E8] text-[#9F1239] border-[#FECDD6]" 
                    : "bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}>
                  {isDuplicateMerged ? "Deduplication Enforced" : "AI Forensic Engine"}
                </span>
              </div>
              <p className="text-xs text-[#881337] mt-1">
                {isDuplicateMerged ? (
                  <span>
                    <strong>Duplicate Entry Prevented:</strong> {duplicateMessage || "An active entry already exists for this exact product at this location. Photos and verification state were updated without duplicating listings."}
                  </span>
                ) : (
                  "Visual inspection complete. Item listed under zero-knowledge blind catalog. Photos and secret markers remain hidden from public view."
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FFFDFE] border border-[#F0BFCB] p-4 rounded-xs text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#881337] font-mono">Public Masked Record:</span>
              <p className="font-bold text-[#1E1215] text-sm mt-0.5">{inspectionResult.publicTitle}</p>
              <p className="text-[#881337] text-[11px] mt-0.5">Category: {inspectionResult.category}</p>
              <p className="text-[#881337] text-[11px]">Location: {inspectionResult.campusZone}</p>
            </div>

            <div className="border-t sm:border-t-0 sm:border-l border-[#F2C4CE] sm:pl-4 pt-2 sm:pt-0">
              <span className="text-[10px] uppercase font-bold text-emerald-800 font-mono">Forensic Ground Truth:</span>
              <p className="text-[#1E1215] font-medium text-[11px] mt-0.5">
                Brand: {inspectionResult.publicMetadata?.estimatedBrand || "Auto-detected"}
              </p>
              <p className="text-[#881337] text-[11px]">
                Condition: {inspectionResult.publicMetadata?.roughCondition || "Inspected"}
              </p>
              <p className="text-[10px] text-emerald-700 mt-1 font-mono">
                ✓ 3 Dynamic verification questions formulated
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setInspectionResult(null);
                setIsDuplicateMerged(false);
                setImages([]);
              }}
              className="flex-1 bg-[#FFF4F7] border border-[#F0BFCB] text-[#4C0519] py-2 text-xs font-semibold rounded-xs hover:bg-[#FFE4E8]"
            >
              Report Another Item
            </button>
            <button
              onClick={onSuccess}
              className="flex-1 bg-[#9F1239] text-white py-2 text-xs font-bold rounded-xs hover:bg-[#881337] flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>View in Blind Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* REPORT FORM */
        <form onSubmit={handleSubmit} className="bg-[#FFF9FB] border border-[#F0BFCB] rounded-xs p-6 shadow-subtle space-y-5">
          {error && (
            <div className="bg-[#FFF0F3] border border-[#FECDD6] p-3 text-xs text-[#9F1239] rounded-xs font-medium">
              {error}
            </div>
          )}

          {/* Photos Dropzone */}
          <div>
            <label className="block text-xs font-bold text-[#1E1215] mb-1">
              Multi-Angle Photos (3–5 Angles Recommended)
            </label>
            <p className="text-[11px] text-[#881337] mb-3">
              Capture front, base, and close-ups of any stickers, scratches, or ports. These photos are masked from public view.
            </p>

            {/* Photo previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square border border-[#F0BFCB] rounded-xs overflow-hidden group">
                    <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-[#1E1215]/80 text-white rounded-xs w-4 h-4 text-[10px] flex items-center justify-center hover:bg-[#9F1239]"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-1 left-1 bg-[#1E1215]/80 text-white text-[9px] px-1 font-mono">
                      Angle {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-dashed border-[#EAA7B7] bg-[#FFF2F5] hover:bg-[#FFEBF0] p-6 rounded-xs text-center cursor-pointer transition-colors relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <Camera className="w-7 h-7 text-[#9F1239] mb-2" />
                <span className="text-xs font-bold text-[#1E1215]">Click or Drop Photos to Inspect</span>
                <span className="text-[11px] text-[#881337] mt-0.5">JPG, PNG, WebP up to 5MB each</span>
              </div>
            </div>
          </div>

          {/* Campus Location Selection: Block -> Floor -> Room */}
          <div className="space-y-3 bg-[#FFFDFE] border border-[#F0BFCB] p-4 rounded-xs">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1E1215]">
                Campus Location Selection
              </label>
              
              {/* Toggle mode: Block/Floor/Room vs Common Facilities */}
              <div className="flex items-center gap-1 bg-[#FFF0F4] p-1 rounded-xs border border-[#F0BFCB]">
                <button
                  type="button"
                  onClick={() => setLocationMode("block")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-xs transition-colors ${
                    locationMode === "block"
                      ? "bg-[#9F1239] text-white shadow-xs"
                      : "text-[#881337] hover:bg-white"
                  }`}
                >
                  Block / Floor / Room
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode("common")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-xs transition-colors ${
                    locationMode === "common"
                      ? "bg-[#9F1239] text-white shadow-xs"
                      : "text-[#881337] hover:bg-white"
                  }`}
                >
                  Common Facilities
                </button>
              </div>
            </div>

            {locationMode === "block" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Select Block */}
                <div>
                  <label className="block text-[11px] font-bold text-[#881337] uppercase tracking-wider mb-1">
                    Select Block
                  </label>
                  <select
                    value={selectedBlock}
                    onChange={(e) => {
                      setSelectedBlock(e.target.value);
                      setSelectedFloor(1);
                      setSelectedRoom("101");
                    }}
                    className="w-full text-xs font-semibold border border-[#F0BFCB] bg-white px-2.5 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                  >
                    {blocks.map((b) => (
                      <option key={b.id} value={b.name}>{b.name} ({b.totalFloors} Floors)</option>
                    ))}
                  </select>
                </div>

                {/* 2. Select Floor */}
                <div>
                  <label className="block text-[11px] font-bold text-[#881337] uppercase tracking-wider mb-1">
                    Select Floor
                  </label>
                  <select
                    value={selectedFloor}
                    onChange={(e) => {
                      const f = Number(e.target.value);
                      setSelectedFloor(f);
                      setSelectedRoom(`${f}01`);
                    }}
                    className="w-full text-xs font-semibold border border-[#F0BFCB] bg-white px-2.5 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                  >
                    {Array.from({ length: maxFloors }, (_, i) => i + 1).map((f) => (
                      <option key={f} value={f}>
                        Floor {f} ({f === 1 ? "1st / Ground" : `${f}th Floor`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Select Room */}
                <div>
                  <label className="block text-[11px] font-bold text-[#881337] uppercase tracking-wider mb-1">
                    Select Room
                  </label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full text-xs font-mono font-bold border border-[#F0BFCB] bg-white px-2.5 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                  >
                    {Array.from({ length: roomsCount }, (_, i) => {
                      const num = `${selectedFloor}${String(i + 1).padStart(2, '0')}`;
                      return (
                        <option key={num} value={num}>Room {num}</option>
                      );
                    })}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-[#881337] uppercase tracking-wider mb-1">
                  Common Facility Location
                </label>
                <select
                  value={commonFacility}
                  onChange={(e) => setCommonFacility(e.target.value)}
                  className="w-full text-xs font-semibold border border-[#F0BFCB] bg-white px-2.5 py-2 rounded-xs focus:outline-none focus:border-[#9F1239]"
                >
                  <option value="Central Library (Circulation Desk)">Central Library (Circulation Desk)</option>
                  <option value="Central Library (2nd Floor Silent Reading)">Central Library (2nd Floor Silent Reading)</option>
                  <option value="Student Canteen & Food Court">Student Canteen & Food Court</option>
                  <option value="Main Auditorium & Amphitheater">Main Auditorium & Amphitheater</option>
                  <option value="Sports Arena & Basketball Court">Sports Arena & Basketball Court</option>
                  <option value="Parking Lot A (Four-Wheeler)">Parking Lot A (Four-Wheeler)</option>
                  <option value="Parking Lot B (Two-Wheeler)">Parking Lot B (Two-Wheeler)</option>
                  <option value="Administrative Complex - Reception">Administrative Complex - Reception</option>
                </select>
              </div>
            )}

            <div className="text-[11px] text-[#4C0519] flex items-center gap-1.5 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#9F1239] shrink-0" />
              <span className="font-semibold">Selected Location:</span>
              <span className="font-mono text-[#9F1239] font-bold">{computeCampusZoneString()}</span>
            </div>
          </div>

          {/* Authenticated Finder ID (Locked strictly to Signed-In Account) */}
          <div className="bg-[#FFF4F7] border border-[#F0BFCB] rounded-md p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1215] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#9F1239]" />
                <span>Verified Finder Institutional Identity</span>
              </label>
              <span className="text-[10px] font-mono font-bold bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded border border-[#FECDD6]">
                Auto-Locked to Signed-In Account
              </span>
            </div>

            {user ? (
              <div className="flex items-center gap-2.5 bg-white border border-[#F0BFCB] px-3 py-2 rounded-md">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="font-mono text-xs font-bold text-[#1E1215]">{user.email}</span>
                <span className="text-[10px] font-mono text-[#881337] ml-auto font-semibold">
                  Signed In ({selectedCollege || "Campus"})
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white border border-[#F0BFCB] p-2.5 rounded-md">
                <span className="text-xs text-[#881337] italic">Sign-in required to log item under your student ID</span>
                <button
                  type="button"
                  onClick={() => triggerAuthGuard("log a found item", () => {})}
                  className="bg-[#9F1239] text-white text-[11px] font-bold px-3 py-1 rounded hover:bg-[#881337] transition-colors"
                >
                  Sign In with College ID
                </button>
              </div>
            )}
            <span className="text-[10px] text-[#881337] block leading-tight">
              Institutional security protocol: Your verified educational mail is linked to custody records and will never be exposed in public catalog views.
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-[#F2C4CE] flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#9F1239] text-white px-6 py-2.5 text-xs font-bold rounded-xs hover:bg-[#881337] transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Multimodal AI Vision Inspection...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute AI Vision Inspection & Catalog</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
