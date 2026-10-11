export interface PublicMetadata {
  broadCategory: string;
  itemType: string;
  generalColor: string;
  roughCondition: string;
  estimatedBrand: string;
}

export interface SecretGroundTruth {
  brandAndExactModel: string;
  uniqueStickersOrMarkings: string;
  physicalDefectsOrDamage: string;
  accessoriesOrContents: string;
}

export interface ClaimPass {
  claimantEmail: string;
  confidenceScore: number;
  matchedTraits: string[];
  otp: string;
  qrPayload: string;
  verifiedAt: string;
}

export interface HandoverAudit {
  handedOverAt: string;
  attendantId: string;
  notes: string;
}

export type ItemCategory = 
  | "Electronics" 
  | "Stationery" 
  | "Bottles & Mugs" 
  | "Keys" 
  | "Cards & IDs" 
  | "Miscellaneous";

export interface LostItem {
  id: string;
  publicTitle: string;
  category: ItemCategory;
  campusZone: string;
  block?: string;
  floor?: number;
  room?: string;
  college?: string;
  collegeCode?: string;
  foundAt: string;
  finderEmail: string;
  status: "MASKED_AVAILABLE" | "IN_VERIFICATION" | "VERIFIED_PENDING_HANDOVER" | "HANDED_OVER";
  photos: string[]; // High-res images, blurred in public view
  publicMetadata: PublicMetadata;
  secretGroundTruth: SecretGroundTruth;
  verificationQuestions: string[];
  claimPass?: ClaimPass;
  handoverAudit?: HandoverAudit;
  claimAttemptsCount: number;
}

export interface CampusBlock {
  id: string;
  name: string; // e.g. "Block A", "Block B", "Block C"
  totalFloors: number; // default 8
  roomsPerFloor: number; // default 12
}

// Realistic campus inventory with distinct items for each partner institution
const INITIAL_ITEMS: LostItem[] = [
  // ==================== 1. VIPS-TC ITEMS ====================
  {
    id: "vips-boat-141",
    publicTitle: "boAt Wireless Earbuds (Matte Black)",
    category: "Electronics",
    campusZone: "Block A • Floor 2 • Room 204 (Seminar Hall)",
    block: "Block A",
    floor: 2,
    room: "Room 204",
    college: "Vivekananda Institute of Professional Studies – TC",
    collegeCode: "VIPS-TC",
    foundAt: "Today, 10:15 AM",
    finderEmail: "student.finder@vips.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Electronics",
      itemType: "Wireless Earbuds",
      generalColor: "Matte Black",
      roughCondition: "Good",
      estimatedBrand: "boAt"
    },
    secretGroundTruth: {
      brandAndExactModel: "boAt Airdopes 141 (Matte Black)",
      uniqueStickersOrMarkings: "Standard factory boAt logo on lid, no exterior stickers",
      physicalDefectsOrDamage: "Minor pocket scuff near USB-C charging port on bottom",
      accessoriesOrContents: "Medium black silicone tips installed on both earbuds"
    },
    verificationQuestions: [
      "What brand and model are these earbuds?",
      "What color is the charging case and earbuds?",
      "What type of charging port is on the bottom of the case (USB-C or Micro-USB)?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "vips-casio-991",
    publicTitle: "Casio Scientific Calculator",
    category: "Electronics",
    campusZone: "Block B • Floor 3 • Room 302 (Computer Lab)",
    block: "Block B",
    floor: 3,
    room: "Room 302",
    college: "Vivekananda Institute of Professional Studies – TC",
    collegeCode: "VIPS-TC",
    foundAt: "Yesterday, 3:45 PM",
    finderEmail: "lab.assistant@vips.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Electronics",
      itemType: "Scientific Calculator",
      generalColor: "Black and Silver Faceplate",
      roughCondition: "Good",
      estimatedBrand: "Casio"
    },
    secretGroundTruth: {
      brandAndExactModel: "Casio fx-991EX ClassWiz",
      uniqueStickersOrMarkings: "Student roll number written neatly in black marker inside the slide cover",
      physicalDefectsOrDamage: "Normal light desk rubs on the plastic slide cover",
      accessoriesOrContents: "Original matching black hard slide-on protective case"
    },
    verificationQuestions: [
      "What is the exact Casio model number printed at the top of the calculator?",
      "Is there a roll number or name written on or inside the slide cover?",
      "What color is the faceplate and keyboard bezel?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "vips-milton-750",
    publicTitle: "Milton Stainless Steel Flask (750ml)",
    category: "Bottles & Mugs",
    campusZone: "Block C • Floor 1 • Room 105 (Library Reading Room)",
    block: "Block C",
    floor: 1,
    room: "Room 105",
    college: "Vivekananda Institute of Professional Studies – TC",
    collegeCode: "VIPS-TC",
    foundAt: "Today, 11:30 AM",
    finderEmail: "canteen.staff@vips.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Bottles & Mugs",
      itemType: "Thermal Insulated Bottle",
      generalColor: "Brushed Silver",
      roughCondition: "Good",
      estimatedBrand: "Milton"
    },
    secretGroundTruth: {
      brandAndExactModel: "Milton Thermosteel 750ml",
      uniqueStickersOrMarkings: "Original Milton Thermosteel engraved logo on lower body",
      physicalDefectsOrDamage: "Small shallow dent on the outer bottom rim from desk bump",
      accessoriesOrContents: "Black screw lid with built-in silicone carry loop"
    },
    verificationQuestions: [
      "What brand and capacity (volume in ml) is the bottle?",
      "What color is the bottle body and lid?",
      "Does the cap have a carry handle, straw, or screw top?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "vips-activa-key",
    publicTitle: "Honda Scooter Ignition Key",
    category: "Keys",
    campusZone: "Common Facilities • Parking Lot A (Gate 1)",
    block: "Common Facilities",
    floor: 0,
    room: "Parking Lot A",
    college: "Vivekananda Institute of Professional Studies – TC",
    collegeCode: "VIPS-TC",
    foundAt: "Today, 9:00 AM",
    finderEmail: "security.gate1@vips.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Keys",
      itemType: "Vehicle Key",
      generalColor: "Black Head, Steel Blade",
      roughCondition: "Used",
      estimatedBrand: "Honda"
    },
    secretGroundTruth: {
      brandAndExactModel: "Honda Activa 6G Ignition Key",
      uniqueStickersOrMarkings: "Brown braided faux-leather loop keychain",
      physicalDefectsOrDamage: "Normal key ring wear on the hole",
      accessoriesOrContents: "Single ignition key and one small brass padlock key on a steel split ring"
    },
    verificationQuestions: [
      "What vehicle brand logo is on the key head (e.g. Honda, Suzuki, TVS)?",
      "How many total keys are attached to the ring?",
      "What material or color is the attached keychain strap?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "vips-notes-register",
    publicTitle: "Classmate Spiral Lecture Register",
    category: "Stationery",
    campusZone: "Block A • Floor 4 • Room 408 (Law Department)",
    block: "Block A",
    floor: 4,
    room: "Room 408",
    college: "Vivekananda Institute of Professional Studies – TC",
    collegeCode: "VIPS-TC",
    foundAt: "Yesterday, 5:10 PM",
    finderEmail: "library.staff@vips.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Stationery",
      itemType: "Spiral Notebook",
      generalColor: "Dark Blue",
      roughCondition: "Good",
      estimatedBrand: "Classmate"
    },
    secretGroundTruth: {
      brandAndExactModel: "Classmate Pulse Spiral Bound 300 Pages",
      uniqueStickersOrMarkings: "Handwritten 'Constitutional Law - Semester 4' on first title page",
      physicalDefectsOrDamage: "Top corner of front card cover slightly creased",
      accessoriesOrContents: "Blue ballpoint pen clipped onto the metal wire binding"
    },
    verificationQuestions: [
      "What academic subject or title is written on the front page?",
      "What brand and cover color is the register?",
      "Was there a pen or bookmark attached to the notebook?"
    ],
    claimAttemptsCount: 0
  },

  // ==================== 2. DTU ITEMS ====================
  {
    id: "dtu-lenovo-charger",
    publicTitle: "Lenovo 65W USB-C Laptop Charger",
    category: "Electronics",
    campusZone: "Block B • Floor 2 • Room 208 (Mechanical CAD Lab)",
    block: "Block B",
    floor: 2,
    room: "Room 208",
    college: "Delhi Technological University",
    collegeCode: "DTU",
    foundAt: "Today, 11:45 AM",
    finderEmail: "cadlab.technician@dtu.ac.in",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Electronics",
      itemType: "Laptop Power Adapter",
      generalColor: "Black",
      roughCondition: "Clean",
      estimatedBrand: "Lenovo"
    },
    secretGroundTruth: {
      brandAndExactModel: "Lenovo 65W Standard Type-C Charger",
      uniqueStickersOrMarkings: "White Lenovo logo embossed on power brick, original black velcro strap",
      physicalDefectsOrDamage: "Standard minor cable curve near brick outlet",
      accessoriesOrContents: "3-pin Indian standard wall power cord attached to brick"
    },
    verificationQuestions: [
      "What laptop manufacturer brand is printed on the power brick?",
      "What type of device connector is on the output cable (USB-C or round pin)?",
      "Is there a velcro cable management strap attached to the wire?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "dtu-casio-calc",
    publicTitle: "Casio fx-991CW Calculator (White)",
    category: "Electronics",
    campusZone: "Block A • Floor 3 • Room 310 (Applied Mathematics Lab)",
    block: "Block A",
    floor: 3,
    room: "Room 310",
    college: "Delhi Technological University",
    collegeCode: "DTU",
    foundAt: "Yesterday, 2:15 PM",
    finderEmail: "mathlab.staff@dtu.ac.in",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Electronics",
      itemType: "Scientific Calculator",
      generalColor: "White & Charcoal",
      roughCondition: "Like New",
      estimatedBrand: "Casio"
    },
    secretGroundTruth: {
      brandAndExactModel: "Casio fx-991CW ClassWiz (White Edition)",
      uniqueStickersOrMarkings: "Subtle pencil note 'MTH-102 DTU' written inside rear battery door",
      physicalDefectsOrDamage: "No physical damage, pristine display",
      accessoriesOrContents: "Light grey sliding protective hard case"
    },
    verificationQuestions: [
      "What is the exact model number of this Casio calculator?",
      "What color is the front body and keyboard (black, white, or silver)?",
      "Is there any pencil or pen note inside the cover or battery compartment?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "dtu-borosil-flask",
    publicTitle: "Borosil Hydra Trek Steel Flask (700ml)",
    category: "Bottles & Mugs",
    campusZone: "Block C • Floor 2 • Room 204 (Robotics Workshop)",
    block: "Block C",
    floor: 2,
    room: "Room 204",
    college: "Delhi Technological University",
    collegeCode: "DTU",
    foundAt: "Today, 1:20 PM",
    finderEmail: "robotics.lead@dtu.ac.in",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Bottles & Mugs",
      itemType: "Insulated Flask",
      generalColor: "Matte Black",
      roughCondition: "Clean",
      estimatedBrand: "Borosil"
    },
    secretGroundTruth: {
      brandAndExactModel: "Borosil Hydra Trek 700ml",
      uniqueStickersOrMarkings: "Silver Borosil laser-etched logo near base",
      physicalDefectsOrDamage: "No dents, faint friction mark on base bottom",
      accessoriesOrContents: "Stainless steel screw lid with black silicone seal band"
    },
    verificationQuestions: [
      "What brand is the flask?",
      "What color is the bottle body and lid?",
      "What is the approximate liquid capacity (e.g. 500ml, 700ml, 1000ml)?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "dtu-student-id",
    publicTitle: "DTU Student RFID Smart Card & Lanyard",
    category: "Cards & IDs",
    campusZone: "Common Facilities • Central Library Circulation Desk",
    block: "Common Facilities",
    floor: 1,
    room: "Circulation Desk",
    college: "Delhi Technological University",
    collegeCode: "DTU",
    foundAt: "Today, 10:00 AM",
    finderEmail: "library.desk@dtu.ac.in",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Cards & IDs",
      itemType: "Student ID Card",
      generalColor: "White with Blue Lanyard",
      roughCondition: "Good",
      estimatedBrand: "DTU Official"
    },
    secretGroundTruth: {
      brandAndExactModel: "DTU Official RFID Smart Student Identity Card",
      uniqueStickersOrMarkings: "Department of Computer Engineering, 3rd Year B.Tech",
      physicalDefectsOrDamage: "Faint scratch on magnetic stripe area",
      accessoriesOrContents: "Transparent acrylic card sleeve with royal blue 'DELHI TECHNOLOGICAL UNIVERSITY' lanyard"
    },
    verificationQuestions: [
      "What academic department or branch is printed on the card?",
      "What color is the lanyard ribbon attached to the badge?",
      "What is the student's graduation year or semester indicated on the card?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "dtu-hostel-keys",
    publicTitle: "DTU Hostel Room Key Set (3 Keys)",
    category: "Keys",
    campusZone: "Common Facilities • Sports Complex (Badminton Hall)",
    block: "Common Facilities",
    floor: 0,
    room: "Badminton Hall",
    college: "Delhi Technological University",
    collegeCode: "DTU",
    foundAt: "Yesterday, 6:30 PM",
    finderEmail: "sports.coach@dtu.ac.in",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Keys",
      itemType: "Room Key Set",
      generalColor: "Brass & Silver",
      roughCondition: "Used",
      estimatedBrand: "Godrej"
    },
    secretGroundTruth: {
      brandAndExactModel: "Godrej Cylinder Keys & Brass Padlock Key",
      uniqueStickersOrMarkings: "Oval blue plastic key tag with white room number '214'",
      physicalDefectsOrDamage: "Normal brass key tarnish",
      accessoriesOrContents: "Total of 3 keys (2 silver Godrej keys, 1 small brass key) on a round split ring"
    },
    verificationQuestions: [
      "How many keys are on the ring in total?",
      "What number or label is marked on the attached plastic key tag?",
      "What brand is stamped on the primary keys (e.g. Godrej, Link)?"
    ],
    claimAttemptsCount: 0
  },

  // ==================== 3. KCC-ITM ITEMS ====================
  {
    id: "kcc-fastrack-watch",
    publicTitle: "Fastrack Analog Wristwatch (Brown Strap)",
    category: "Electronics",
    campusZone: "Block A • Floor 1 • Room 106 (Auditorium)",
    block: "Block A",
    floor: 1,
    room: "Room 106",
    college: "KCC Institute of Technology & Management",
    collegeCode: "KCC-ITM",
    foundAt: "Today, 12:10 PM",
    finderEmail: "events.coordinator@kccitm.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Electronics",
      itemType: "Wristwatch",
      generalColor: "Silver Bezel, Brown Strap",
      roughCondition: "Good",
      estimatedBrand: "Fastrack"
    },
    secretGroundTruth: {
      brandAndExactModel: "Fastrack Casual Analog Watch",
      uniqueStickersOrMarkings: "Navy blue dial with silver hour hands and Fastrack logo",
      physicalDefectsOrDamage: "Faint hairline scratch on mineral glass at 2 o'clock position",
      accessoriesOrContents: "Tan brown faux-leather strap with stainless steel buckle"
    },
    verificationQuestions: [
      "What color is the watch dial face?",
      "What color and material is the watch strap (e.g. brown leather, black metal, silicone)?",
      "What brand is displayed on the watch face?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "kcc-dell-adapter",
    publicTitle: "Dell 45W Laptop Charger (Barrel Pin)",
    category: "Electronics",
    campusZone: "Block B • Floor 4 • Room 402 (CSE Lab 2)",
    block: "Block B",
    floor: 4,
    room: "Room 402",
    college: "KCC Institute of Technology & Management",
    collegeCode: "KCC-ITM",
    foundAt: "Yesterday, 4:20 PM",
    finderEmail: "lab4.incharge@kccitm.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Electronics",
      itemType: "Laptop Adapter",
      generalColor: "Black",
      roughCondition: "Used",
      estimatedBrand: "Dell"
    },
    secretGroundTruth: {
      brandAndExactModel: "Dell 45W Original AC Adapter",
      uniqueStickersOrMarkings: "Embossed circular Dell logo on top housing",
      physicalDefectsOrDamage: "Light desk rubs on bottom specifications sticker",
      accessoriesOrContents: "4.5mm round barrel connector with integrated blue LED ring"
    },
    verificationQuestions: [
      "What laptop brand is the charger for?",
      "What style of tip is on the charging cable (small round barrel pin or Type-C)?",
      "Does the connector tip have an LED light indicator?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "kcc-drafter-set",
    publicTitle: "Omega Engineering Mini-Drafter with Case",
    category: "Stationery",
    campusZone: "Block C • Floor 3 • Room 308 (Engineering Drawing Hall)",
    block: "Block C",
    floor: 3,
    room: "Room 308",
    college: "KCC Institute of Technology & Management",
    collegeCode: "KCC-ITM",
    foundAt: "Today, 11:00 AM",
    finderEmail: "drawing.instructor@kccitm.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Stationery",
      itemType: "Mini Drafter Set",
      generalColor: "Black Canvas Bag, Transparent Scales",
      roughCondition: "Good",
      estimatedBrand: "Omega"
    },
    secretGroundTruth: {
      brandAndExactModel: "Omega Deluxe Engineering Mini Drafter",
      uniqueStickersOrMarkings: "Omega logo on the central protractor clamp head",
      physicalDefectsOrDamage: "Both acrylic scales intact with no chips",
      accessoriesOrContents: "Black zippered canvas sling pouch with table mounting clamp included"
    },
    verificationQuestions: [
      "What brand of mini-drafter is it (e.g. Omega, Isomars)?",
      "What color is the canvas carry bag?",
      "Are the scales clear acrylic or opaque plastic?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "kcc-student-id",
    publicTitle: "KCC-ITM Student ID & Maroon Lanyard",
    category: "Cards & IDs",
    campusZone: "Block A • Floor 2 • Room 201 (Dean Academic Corridor)",
    block: "Block A",
    floor: 2,
    room: "Room 201",
    college: "KCC Institute of Technology & Management",
    collegeCode: "KCC-ITM",
    foundAt: "Today, 9:30 AM",
    finderEmail: "admin.corridor@kccitm.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Cards & IDs",
      itemType: "Student Identity Card",
      generalColor: "White & Maroon",
      roughCondition: "Good",
      estimatedBrand: "KCC Official"
    },
    secretGroundTruth: {
      brandAndExactModel: "KCC Institute of Technology & Management Student ID",
      uniqueStickersOrMarkings: "Course: B.Tech Computer Science & Engineering",
      physicalDefectsOrDamage: "Protective plastic holder shows light friction",
      accessoriesOrContents: "Deep maroon woven satin lanyard with 'KCC ITM' repeated in white lettering"
    },
    verificationQuestions: [
      "What program or branch is printed on the ID card?",
      "What color is the neck lanyard?",
      "What is the cardholder type (hard acrylic or soft pouch)?"
    ],
    claimAttemptsCount: 0
  },
  {
    id: "kcc-tupperware-bottle",
    publicTitle: "Tupperware Aquasafe 1L Bottle (Teal Blue)",
    category: "Bottles & Mugs",
    campusZone: "Common Facilities • Floor 1 • Cafeteria Counter",
    block: "Common Facilities",
    floor: 1,
    room: "Cafeteria Counter",
    college: "KCC Institute of Technology & Management",
    collegeCode: "KCC-ITM",
    foundAt: "Yesterday, 3:30 PM",
    finderEmail: "cafeteria.supervisor@kccitm.edu",
    status: "MASKED_AVAILABLE",
    photos: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
    ],
    publicMetadata: {
      broadCategory: "Bottles & Mugs",
      itemType: "Plastic Water Bottle",
      generalColor: "Teal Blue",
      roughCondition: "Good",
      estimatedBrand: "Tupperware"
    },
    secretGroundTruth: {
      brandAndExactModel: "Tupperware Aquasafe 1L (Teal Blue)",
      uniqueStickersOrMarkings: "Embossed Tupperware logo running vertically along the bottle side",
      physicalDefectsOrDamage: "Normal light usage scuffs on bottom base, no cracks",
      accessoriesOrContents: "Navy blue flip-top leakproof drinking cap"
    },
    verificationQuestions: [
      "What color is the bottle body and flip-top cap?",
      "What is the capacity of the bottle in ml or liters?",
      "What brand name is embossed along the bottle side?"
    ],
    claimAttemptsCount: 0
  }
];

// Default campus blocks: A, B, C with 8 floors per block and 12 rooms per floor
const DEFAULT_BLOCKS: CampusBlock[] = [
  { id: "block-a", name: "Block A", totalFloors: 8, roomsPerFloor: 12 },
  { id: "block-b", name: "Block B", totalFloors: 8, roomsPerFloor: 12 },
  { id: "block-c", name: "Block C", totalFloors: 8, roomsPerFloor: 12 },
];

// Helper functions for strict campus deduplication (same location + same product)
export function normalizeString(str?: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function extractLocationKey(item: Partial<LostItem>): string {
  // Try explicit block, floor, room
  let b = item.block || "";
  let f = item.floor !== undefined ? String(item.floor) : "";
  let r = item.room || "";

  if (!b || !r) {
    const zone = item.campusZone || "";
    const blockMatch = zone.match(/Block\s*([A-Za-z0-9]+)/i);
    const floorMatch = zone.match(/Floor\s*(\d+)/i);
    const roomMatch = zone.match(/Room\s*([A-Za-z0-9]+)/i);
    if (blockMatch) b = blockMatch[0];
    if (floorMatch) f = floorMatch[1];
    if (roomMatch) r = roomMatch[0];
    if (!b && !r) {
      return normalizeString(zone);
    }
  }

  return `${normalizeString(b)}|${f}|${normalizeString(r)}`;
}

export function extractProductTokens(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const stopWords = new Set([
    "the", "and", "with", "for", "case", "new", "black", "white", "used", 
    "color", "gently", "shows", "wear", "faceplate", "matte", "silver", "blue"
  ]);
  return new Set(words.filter((w) => !stopWords.has(w)));
}

export function isSameProduct(a: Partial<LostItem>, b: Partial<LostItem>): boolean {
  // If categories are set and distinct, not same product
  if (a.category && b.category && a.category.toLowerCase() !== b.category.toLowerCase()) {
    return false;
  }

  // Exact photo overlap check
  if (a.photos && b.photos) {
    for (const pa of a.photos) {
      if (b.photos.includes(pa)) return true;
    }
  }

  // Title equality check
  const titleA = normalizeString(a.publicTitle || "");
  const titleB = normalizeString(b.publicTitle || "");
  if (titleA && titleB && (titleA.includes(titleB) || titleB.includes(titleA))) {
    return true;
  }

  // Item type check
  const typeA = normalizeString(a.publicMetadata?.itemType || "");
  const typeB = normalizeString(b.publicMetadata?.itemType || "");
  if (typeA && typeB && (typeA.includes(typeB) || typeB.includes(typeA))) {
    return true;
  }

  // Brand check
  const brandA = normalizeString(a.publicMetadata?.estimatedBrand || "");
  const brandB = normalizeString(b.publicMetadata?.estimatedBrand || "");
  if (brandA && brandB && brandA === brandB) {
    return true;
  }

  // Significant token overlap
  const textA = `${a.publicTitle || ""} ${a.publicMetadata?.itemType || ""} ${a.publicMetadata?.estimatedBrand || ""} ${a.secretGroundTruth?.brandAndExactModel || ""}`;
  const textB = `${b.publicTitle || ""} ${b.publicMetadata?.itemType || ""} ${b.publicMetadata?.estimatedBrand || ""} ${b.secretGroundTruth?.brandAndExactModel || ""}`;
  const tokensA = extractProductTokens(textA);
  const tokensB = extractProductTokens(textB);

  let overlap = 0;
  tokensA.forEach((t) => {
    if (tokensB.has(t)) overlap++;
  });

  return overlap >= 1;
}

export function areDuplicateEntries(a: Partial<LostItem>, b: Partial<LostItem>): boolean {
  // If college codes are distinct, they belong to different campuses and are not duplicates
  if (a.collegeCode && b.collegeCode && a.collegeCode.toLowerCase() !== b.collegeCode.toLowerCase()) {
    return false;
  }

  const locA = extractLocationKey(a);
  const locB = extractLocationKey(b);
  if (!locA || !locB || locA !== locB) {
    return false;
  }

  // Matching location: same block, floor, room. Now verify matching product
  return isSameProduct(a, b);
}

class CampusStore {
  private items: LostItem[] = [];
  private blocks: CampusBlock[] = [...DEFAULT_BLOCKS];

  constructor() {
    this.initItems([...INITIAL_ITEMS]);
  }

  private initItems(rawItems: LostItem[]) {
    this.items = [];
    for (const it of rawItems) {
      this.addOrMerge(it);
    }
  }

  public getAll(collegeCode?: string): LostItem[] {
    // Actively guarantee no duplicate entries exist in catalog query results
    const unique: LostItem[] = [];
    for (const it of this.items) {
      if (collegeCode && collegeCode !== "All") {
        const itemCode = (it.collegeCode || "").toLowerCase();
        const itemCol = (it.college || "").toLowerCase();
        const target = collegeCode.toLowerCase();
        if (itemCode !== target && itemCol !== target && !itemCol.includes(target) && !target.includes(itemCode)) {
          continue;
        }
      }

      const existingIdx = unique.findIndex((u) => areDuplicateEntries(u, it));
      if (existingIdx === -1) {
        unique.push(it);
      } else {
        // Consolidate photos and update information into the single entry
        for (const p of it.photos || []) {
          if (!unique[existingIdx].photos.includes(p)) {
            unique[existingIdx].photos.push(p);
          }
        }
      }
    }
    return unique;
  }

  public getById(id: string): LostItem | undefined {
    return this.items.find(i => i.id === id);
  }

  public add(item: LostItem): LostItem {
    return this.addOrMerge(item).item;
  }

  /**
   * Deduplicates entries: If same location (block + floor + room) and same product,
   * merges the record instead of creating duplicate cards.
   */
  public addOrMerge(item: LostItem): { item: LostItem; isDuplicate: boolean; message: string } {
    const existingIdx = this.items.findIndex((existing) => areDuplicateEntries(existing, item));

    if (existingIdx !== -1) {
      const existing = this.items[existingIdx];
      // Merge unique photos
      const mergedPhotos = [...existing.photos];
      for (const p of item.photos || []) {
        if (!mergedPhotos.includes(p)) {
          mergedPhotos.push(p);
        }
      }
      existing.photos = mergedPhotos;
      existing.foundAt = "Re-verified Just Now";

      // Keep single record, avoid duplicate
      return {
        item: existing,
        isDuplicate: true,
        message: `Existing record matched at ${existing.campusZone}. Record updated and verified without creating duplicates.`
      };
    }

    // New unique item
    this.items.unshift(item);
    return {
      item,
      isDuplicate: false,
      message: "Item cataloged and visual security gate created successfully."
    };
  }

  public update(id: string, updates: Partial<LostItem>): LostItem | null {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...updates };
    return this.items[idx];
  }

  public delete(id: string): boolean {
    const idx = this.items.findIndex(i => i.id === id);
    if (idx !== -1) {
      this.items.splice(idx, 1);
      return true;
    }
    return false;
  }

  public setItems(items: LostItem[]) {
    this.items = [...items];
  }

  public resolveHandover(id: string, otp: string, attendantId: string, notes = ""): { success: boolean; message: string; item?: LostItem } {
    const item = this.getById(id);
    if (!item) {
      return { success: false, message: "Item not found in campus database" };
    }

    if (item.status === "HANDED_OVER") {
      return { success: false, message: "Item has already been handed over and closed" };
    }

    if (!item.claimPass || item.claimPass.otp !== otp.trim()) {
      return { success: false, message: "Invalid Handover OTP code. Verification failed." };
    }

    item.status = "HANDED_OVER";
    item.handoverAudit = {
      handedOverAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attendantId: attendantId || "CAMPUS-DESK-OFFICER-01",
      notes: notes || "Identity verified via college institutional card. Item returned successfully."
    };

    return { success: true, message: "Handover verified successfully. Item marked as returned.", item };
  }

  // Campus Infrastructure Management (Blocks, Floors, Rooms)
  public getBlocks(): CampusBlock[] {
    return this.blocks;
  }

  public addBlock(name: string, totalFloors = 8, roomsPerFloor = 12): CampusBlock {
    const newBlock: CampusBlock = {
      id: `block-${Date.now().toString(36)}`,
      name: name.trim(),
      totalFloors: Math.max(1, Math.min(25, totalFloors)),
      roomsPerFloor: Math.max(1, Math.min(50, roomsPerFloor)),
    };
    this.blocks.push(newBlock);
    return newBlock;
  }

  public getStats() {
    const all = this.getAll();
    const total = all.length;
    const resolved = all.filter(i => i.status === "HANDED_OVER").length;
    const verifiedPending = all.filter(i => i.status === "VERIFIED_PENDING_HANDOVER").length;
    const activeMasked = all.filter(i => i.status === "MASKED_AVAILABLE").length;
    const totalClaimsAttempted = all.reduce((acc, curr) => acc + curr.claimAttemptsCount, 0);

    const totalRooms = this.blocks.reduce((acc, b) => acc + (b.totalFloors * b.roomsPerFloor), 0);

    return {
      totalCataloged: total,
      activeMasked,
      verifiedPending,
      resolvedReturned: resolved,
      recoveryRatePercent: total > 0 ? Math.round((resolved / total) * 100) : 0,
      totalClaimsAttempted,
      falseClaimsPrevented: Math.max(0, totalClaimsAttempted - (resolved + verifiedPending)),
      totalBlocks: this.blocks.length,
      totalRoomsMapped: totalRooms
    };
  }
}

// Global singleton
const globalForStore = global as unknown as { campusStore?: CampusStore };
export const campusStore = globalForStore.campusStore || new CampusStore();
if (process.env.NODE_ENV !== "production") globalForStore.campusStore = campusStore;

