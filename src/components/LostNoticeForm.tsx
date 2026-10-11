"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileQuestion, 
  MapPin, 
  Camera, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Clock, 
  ShieldCheck, 
  Upload, 
  Sparkles,
  X,
  Loader2,
  Lock,
  Layers,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { 
  addLostNoticeToFirestore, 
  subscribeToCampusBlocks, 
  CampusBlockRecord,
  LostNoticeRecord 
} from "@/lib/firebaseService";
import { compressImageFile } from "@/lib/imageUtils";

interface LostNoticeFormProps {
  collegeCode: string;
  collegeName: string;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Electronics",
  "Stationery",
  "Bottles & Mugs",
  "Keys",
  "Cards & IDs",
  "Miscellaneous"
];

// Quick demonstration presets for fast form fill
const COMMON_LOST_PRESETS = [
  {
    name: "boAt Wireless Earbuds (Matte Black)",
    category: "Electronics",
    block: "Block A",
    floor: 2,
    room: "204",
    locationMode: "block" as const,
    facility: "Central Library (Circulation Desk)",
    description: "Matte black charging case with slight scratch near USB-C port. Misplaced during 2nd lecture.",
    secret: "Right earbud has red replacement silicone tip",
    photo: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    time: "Today, morning lecture"
  },
  {
    name: "Scientific Calculator (Casio fx-991EX)",
    category: "Electronics",
    block: "Block B",
    floor: 3,
    room: "304",
    locationMode: "block" as const,
    facility: "Central Library (Circulation Desk)",
    description: "Black Casio fx-991EX ClassWiz calculator in plastic slide case. Left on lab corner desk.",
    secret: "Roll number written on inner slide cover with silver marker",
    photo: "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&auto=format&fit=crop&q=80",
    time: "Today around 11:30 AM"
  },
  {
    name: "Milton Insulated Bottle (Sage Green)",
    category: "Bottles & Mugs",
    block: "Common Facilities",
    floor: 1,
    room: "101",
    locationMode: "common" as const,
    facility: "Student Canteen & Food Court",
    description: "750ml sage green matte stainless steel Milton flask with black carabiner cap.",
    secret: "Small dent on bottom rim and faded sticker on lid",
    photo: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    time: "Today, lunch hour"
  },
  {
    name: "Vehicle Ignition Key & Leather Fob",
    category: "Keys",
    block: "Common Facilities",
    floor: 1,
    room: "101",
    locationMode: "common" as const,
    facility: "Parking Lot B (Two-Wheeler)",
    description: "Single bike ignition key with brown stitched leather keychain fob and small silver ring.",
    secret: "Small brass bell charm attached to keychain loop",
    photo: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80",
    time: "Yesterday evening"
  },
  {
    name: "Student ID Card & Metro Pass Lanyard",
    category: "Cards & IDs",
    block: "Common Facilities",
    floor: 1,
    room: "101",
    locationMode: "common" as const,
    facility: "Central Library (Circulation Desk)",
    description: "Student identity card in transparent plastic pouch with navy blue campus lanyard.",
    secret: "Delhi Metro card placed behind student ID card in same pouch",
    photo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80",
    time: "Yesterday afternoon"
  }
];

const TIME_CHIPS = [
  "Today (Morning Lecture)",
  "Today (Lunch / Afternoon)",
  "Yesterday Evening",
  "Earlier This Week"
];

export default function LostNoticeForm({ collegeCode, collegeName, onSuccess }: LostNoticeFormProps) {
  const { user, triggerAuthGuard } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics");
  
  // Location selection mode: "block" | "common" (matching FinderReportForm)
  const [locationMode, setLocationMode] = useState<"block" | "common">("block");

  // Dynamic Academic Blocks from Firebase
  const [blocks, setBlocks] = useState<CampusBlockRecord[]>([
    { id: "vips-block-a", name: "Block A", collegeCode: "VIPS-TC", totalFloors: 8, roomsPerFloor: 12 },
    { id: "vips-block-b", name: "Block B", collegeCode: "VIPS-TC", totalFloors: 8, roomsPerFloor: 12 },
    { id: "vips-block-c", name: "Block C", collegeCode: "VIPS-TC", totalFloors: 6, roomsPerFloor: 10 },
  ]);
  const [selectedBlock, setSelectedBlock] = useState("Block A");
  const [floor, setFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState("101");
  const [commonFacility, setCommonFacility] = useState("Central Library (Circulation Desk)");

  const [lostDate, setLostDate] = useState("Today, morning lecture");
  const [description, setDescription] = useState("");
  const [secretIdentifiers, setSecretIdentifiers] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Photo Upload State
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [photoName, setPhotoName] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Listen to blocks from Firebase Firestore in real-time
  useEffect(() => {
    const unsub = subscribeToCampusBlocks(collegeCode, (liveBlocks) => {
      if (liveBlocks.length > 0) {
        setBlocks(liveBlocks);
        if (!liveBlocks.some(b => b.name === selectedBlock)) {
          setSelectedBlock(liveBlocks[0].name);
        }
      }
    });
    return () => unsub();
  }, [collegeCode]);

  const currentBlockObj = blocks.find(b => b.name === selectedBlock) || blocks[0];
  const maxFloors = currentBlockObj?.totalFloors || 8;
  const roomsCount = currentBlockObj?.roomsPerFloor || 12;

  // Compute canonical campus zone string matching Report form format
  const computeCampusZoneString = () => {
    if (locationMode === "common") {
      return `Common Facility • ${commonFacility}`;
    }
    return `${selectedBlock} • Floor ${floor} • Room ${selectedRoom}`;
  };

  // Quick preset loader
  const loadPreset = (preset: typeof COMMON_LOST_PRESETS[0]) => {
    setTitle(preset.name);
    setCategory(preset.category);
    setDescription(preset.description);
    setSecretIdentifiers(preset.secret);
    setLostDate(preset.time);
    setPhotoDataUrl(preset.photo);
    setPhotoName(`${preset.name.split(" ")[0]}.jpg`);
    setError(null);

    if (preset.locationMode === "common") {
      setLocationMode("common");
      setCommonFacility(preset.facility);
    } else {
      setLocationMode("block");
      setSelectedBlock(preset.block);
      const fl = preset.floor;
      setFloor(fl);
      setSelectedRoom(preset.room);
    }
  };

  // Handle image file selection
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    try {
      setIsCompressing(true);
      setError(null);
      const compressed = await compressImageFile(file, 960, 960, 0.82);
      setPhotoDataUrl(compressed);
      setPhotoName(file.name);
    } catch (err: any) {
      setError(err?.message || "Failed to process photo.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl("");
    setPhotoName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    triggerAuthGuard("post a lost item notice", async () => {
      if (!title.trim() || !description.trim()) {
        setError("Please provide an item title and description of where you last had it.");
        return;
      }

      try {
        setSubmitting(true);
        setError(null);

        const zoneString = computeCampusZoneString();

        const newNotice: LostNoticeRecord = {
          id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: title.trim(),
          category,
          campusZone: zoneString,
          collegeCode,
          lostDate: lostDate.trim() || "Recently",
          description: description.trim(),
          secretIdentifiers: secretIdentifiers.trim(),
          ownerEmail: user?.email || "student.owner@campus.edu",
          contactPhone: contactPhone.trim(),
          photoUrl: photoDataUrl || "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80",
          status: "OPEN",
          createdAt: new Date().toLocaleDateString()
        };

        // Real-time broadcast to Firebase Firestore & local cache
        await addLostNoticeToFirestore(newNotice);

        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } catch (err: any) {
        setError(err?.message || "Failed to post lost notice.");
      } finally {
        setSubmitting(false);
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-2 sm:py-4 px-1 sm:px-2">
      <div className="bg-[#FFFDFE] border border-[#F0BFCB] rounded-lg p-5 sm:p-7 shadow-card space-y-6">
        
        {/* Header with Quick Presets (matching Report Section) */}
        <div className="border-b border-[#F2C4CE] pb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono uppercase bg-[#FFE4E8] text-[#9F1239] px-2 py-0.5 rounded font-bold border border-[#FECDD6]">
              Seeker Fast-Track
            </span>
            <span className="text-xs text-[#881337] font-semibold">Fast Campus Notice Registration</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#1E1215] tracking-tight">
            Lost Something on Campus?
          </h2>

          <p className="text-xs text-[#881337] mt-1 leading-relaxed">
            Register your misplaced item into the {collegeName} seeker directory. Campus finders and security personnel can match your report instantly.
          </p>

          {/* Quick-Fill Demonstration Presets (Just like Report Section) */}
          <div className="mt-4 pt-3.5 border-t border-[#F2C4CE]">
            <div className="text-[10px] font-mono font-bold text-[#881337] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9F1239]" />
              <span>Quick-Fill Standard Campus Presets (1-Click Fill):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {COMMON_LOST_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="text-left bg-[#FFF0F4] hover:bg-[#FFE8ED] border border-[#F0BFCB] hover:border-[#BE123C] p-2 rounded-md transition-all duration-150 text-xs flex flex-col justify-between group transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="font-bold text-[#1E1215] line-clamp-1 text-[11px] group-hover:text-[#9F1239]">
                    {p.name}
                  </span>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#FECDD6]/60">
                    <span className="text-[9px] text-[#881337] font-mono">{p.category}</span>
                    <span className="text-[9px] text-[#9F1239] font-bold">Fill ↗</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-md flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Lost Belonging Notice Registered Successfully!</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Your notice is now live on the {collegeCode} Seeker Board in real time. Redirecting...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Item Name / Model */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#1E1215]">
                Item Name / Model <span className="text-[#9F1239]">*</span>
              </label>
              <span className="text-[10px] text-[#881337] font-medium">Be specific with brand or color</span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Casio fx-991EX Scientific Calculator, Blue Dell Charger, Black Metal Bottle"
              className="w-full px-3.5 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215] shadow-2xs"
            />
          </div>

          {/* Category & Approximate Time Lost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1215] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215] font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1215] mb-1">
                Approximate Date / Time Lost
              </label>
              <input
                type="text"
                value={lostDate}
                onChange={(e) => setLostDate(e.target.value)}
                placeholder="e.g. Today around 11:30 AM"
                className="w-full px-3 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215]"
              />
            </div>
          </div>

          {/* Quick-select pills for Approximate Time */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-[#881337] uppercase tracking-wider mr-1">Quick Times:</span>
            {TIME_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setLostDate(chip)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
                  lostDate === chip
                    ? "bg-[#9F1239] text-white border-[#9F1239] font-bold shadow-2xs"
                    : "bg-[#FFF0F4] text-[#881337] border-[#FECDD6] hover:bg-[#FFE8ED]"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* CAMPUS LOCATION SELECTION (IDENTICAL TO FINDER REPORT FORM) */}
          <div className="space-y-3 bg-[#FFF9FB] border border-[#F0BFCB] p-4 rounded-md shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1215] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#9F1239]" />
                <span>Last Known Campus Location</span>
              </label>
              
              {/* Toggle mode: Block/Floor/Room vs Common Facilities */}
              <div className="flex items-center gap-1 bg-[#FFF0F4] p-1 rounded-md border border-[#F0BFCB]">
                <button
                  type="button"
                  onClick={() => setLocationMode("block")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
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
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${
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
                      setFloor(1);
                      setSelectedRoom("101");
                    }}
                    className="w-full text-xs font-semibold border border-[#F0BFCB] bg-white px-2.5 py-2 rounded-md focus:outline-none focus:border-[#9F1239]"
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
                    value={floor}
                    onChange={(e) => {
                      const f = Number(e.target.value);
                      setFloor(f);
                      setSelectedRoom(`${f}01`);
                    }}
                    className="w-full text-xs font-semibold border border-[#F0BFCB] bg-white px-2.5 py-2 rounded-md focus:outline-none focus:border-[#9F1239]"
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
                    className="w-full text-xs font-mono font-bold border border-[#F0BFCB] bg-white px-2.5 py-2 rounded-md focus:outline-none focus:border-[#9F1239]"
                  >
                    {Array.from({ length: roomsCount }, (_, i) => {
                      const num = `${floor}${String(i + 1).padStart(2, '0')}`;
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
                  className="w-full text-xs font-semibold border border-[#F0BFCB] bg-white px-2.5 py-2 rounded-md focus:outline-none focus:border-[#9F1239]"
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

            <div className="text-[11px] text-[#4C0519] flex items-center gap-1.5 pt-1 border-t border-[#F2C4CE]/60">
              <MapPin className="w-3.5 h-3.5 text-[#9F1239] shrink-0" />
              <span className="font-semibold">Selected Location:</span>
              <span className="font-mono text-[#9F1239] font-bold">{computeCampusZoneString()}</span>
            </div>
          </div>

          {/* Public Description */}
          <div>
            <label className="block text-xs font-bold text-[#1E1215] mb-1">
              Public Description <span className="text-[#9F1239]">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the item looks like (color, shape, brand, where you might have left it)..."
              className="w-full px-3.5 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215] shadow-2xs"
            />
          </div>

          {/* Private Identifying Details */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#1E1215]">
                Private Identifying Details (Secret Markers)
              </label>
              <span className="text-[10px] text-[#881337] font-semibold">Only shared with verified finder / desk</span>
            </div>
            <input
              type="text"
              value={secretIdentifiers}
              onChange={(e) => setSecretIdentifiers(e.target.value)}
              placeholder="e.g., Small scratch on battery door, my roll number inside cover, specific keychain"
              className="w-full px-3.5 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215]"
            />
          </div>

          {/* Item Reference Photo Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#1E1215]">
              Item Reference Photo (Upload from Device or Camera)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {photoDataUrl ? (
              /* Photo Preview with Remove Action */
              <div className="relative border-2 border-[#BE123C] rounded-md p-3 bg-[#FFF5F8] flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-md overflow-hidden border border-[#F0BFCB] bg-white shrink-0 shadow-xs">
                  <img
                    src={photoDataUrl}
                    alt="Notice reference"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E1215]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{photoName || "Attached Reference Photo"}</span>
                  </div>
                  <p className="text-[11px] text-[#881337] mt-0.5">
                    Ready to attach to notice. Auto-optimized for instant cloud sync.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-[#9F1239] hover:underline"
                    >
                      Change Photo
                    </button>
                    <span className="text-[#F0BFCB]">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Drag & Drop / Click Upload Box */
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-[#9F1239] bg-[#FFE4E8]"
                    : "border-[#F0BFCB] bg-[#FFF8FA] hover:bg-[#FFF0F4] hover:border-[#BE123C]"
                }`}
              >
                {isCompressing ? (
                  <div className="flex flex-col items-center py-2">
                    <Loader2 className="w-6 h-6 text-[#9F1239] animate-spin mb-2" />
                    <span className="text-xs font-bold text-[#1E1215]">Optimizing photo for cloud upload...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-[#FFE4E8] text-[#9F1239] flex items-center justify-center mb-2">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-[#1E1215]">
                      Click to Browse or Drag Photo Here
                    </span>
                    <span className="text-[11px] text-[#881337] mt-0.5">
                      Upload from phone gallery, camera, or laptop (PNG, JPG, WebP)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Authenticated Seeker ID (Matching Report Form's Institutional Card) */}
          <div className="bg-[#FFF4F7] border border-[#F0BFCB] rounded-md p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1E1215] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#9F1239]" />
                <span>Verified Seeker Institutional Identity</span>
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
                  Signed In ({collegeCode})
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white border border-[#F0BFCB] p-2.5 rounded-md">
                <span className="text-xs text-[#881337] italic">Sign-in required to post notice under your student ID</span>
                <button
                  type="button"
                  onClick={() => triggerAuthGuard("post a lost item notice", () => {})}
                  className="bg-[#9F1239] text-white text-[11px] font-bold px-3 py-1 rounded hover:bg-[#881337] transition-colors"
                >
                  Sign In with College ID
                </button>
              </div>
            )}
            <span className="text-[10px] text-[#881337] block leading-tight">
              Institutional security protocol: Your verified educational mail connects you to finders through the secure in-app handover chat.
            </span>
          </div>

          {/* Contact Phone / WhatsApp (Optional) */}
          <div>
            <label className="block text-xs font-bold text-[#1E1215] mb-1">
              Contact Phone / WhatsApp (Optional)
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2 text-xs border border-[#F0BFCB] rounded-md focus:outline-none focus:border-[#9F1239] bg-white text-[#1E1215]"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#9F1239] hover:bg-[#881337] text-white py-3 rounded-md font-bold text-xs transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow-md hover:shadow-[#9F1239]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing to Campus Board & Firebase...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Post Lost Item Notice to Campus Board</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
