import { NextRequest, NextResponse } from "next/server";
import { campusStore } from "@/lib/store";
import { inspectLostItemWithGemini } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const zone = searchParams.get("zone");
    const search = searchParams.get("search");
    const college = searchParams.get("college") || searchParams.get("collegeCode");

    let items = campusStore.getAll(college || undefined);

    if (category && category !== "All") {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }

    if (zone && zone !== "All") {
      items = items.filter(i => i.campusZone.toLowerCase().includes(zone.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        i =>
          i.publicTitle.toLowerCase().includes(q) ||
          i.campusZone.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }

    // Mask secret data in public listing
    const sanitized = items.map(i => ({
      id: i.id,
      publicTitle: i.publicTitle,
      category: i.category,
      campusZone: i.campusZone,
      college: i.college,
      collegeCode: i.collegeCode,
      foundAt: i.foundAt,
      status: i.status,
      // Provide blurred thumbnail or single representation
      thumbnail: i.photos[0] || "",
      publicMetadata: i.publicMetadata,
      verificationQuestionsCount: i.verificationQuestions.length,
      claimAttemptsCount: i.claimAttemptsCount
    }));

    return NextResponse.json({ success: true, items: sanitized });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { images, campusZone, finderEmail, categoryHint } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide at least 1-3 photos from multiple angles" },
        { status: 400 }
      );
    }

    // Convert images to Gemini expected payload
    const imagePayload = images.map((img: string) => ({
      data: img,
      mimeType: "image/jpeg"
    }));

    // Inspect using Gemini 3.5 Flash Lite with Round Robin
    const inspection = await inspectLostItemWithGemini(
      imagePayload,
      campusZone || "Campus Grounds",
      categoryHint
    );

    const rawCat = (inspection.publicMetadata.broadCategory || "").toLowerCase();
    let finalCat: any = "Miscellaneous";
    if (rawCat.includes("electronic") || rawCat.includes("audio") || rawCat.includes("earbud") || rawCat.includes("phone") || rawCat.includes("laptop") || rawCat.includes("calculator")) {
      finalCat = "Electronics";
    } else if (rawCat.includes("bottle") || rawCat.includes("mug") || rawCat.includes("flask")) {
      finalCat = "Bottles & Mugs";
    } else if (rawCat.includes("key")) {
      finalCat = "Keys";
    } else if (rawCat.includes("stationery") || rawCat.includes("book") || rawCat.includes("pen")) {
      finalCat = "Stationery";
    } else if (rawCat.includes("card") || rawCat.includes("id")) {
      finalCat = "Cards & IDs";
    }

    // Extract structured block, floor, room if not explicitly sent
    let { block, floor, room } = body;
    if (!block || !room) {
      const match = (campusZone || "").match(/Block\s*([A-Za-z0-9]+)\s*•\s*Floor\s*(\d+)\s*•\s*Room\s*([0-9A-Za-z]+)/i);
      if (match) {
        block = `Block ${match[1]}`;
        floor = parseInt(match[2], 10);
        room = `Room ${match[3]}`;
      }
    }

    const newItemId = `item-${Date.now().toString(36)}`;
    const newItem = {
      id: newItemId,
      publicTitle: `${inspection.publicMetadata.generalColor} ${inspection.publicMetadata.itemType}`,
      category: finalCat,
      campusZone: campusZone || "Central Campus",
      block: block || undefined,
      floor: floor !== undefined ? Number(floor) : undefined,
      room: room || undefined,
      college: body.college || "Vivekananda Institute of Professional Studies – TC",
      collegeCode: body.collegeCode || "VIPS-TC",
      foundAt: "Just Now",
      finderEmail: finderEmail || "student.finder@vips.edu",
      status: "MASKED_AVAILABLE" as const,
      photos: images,
      publicMetadata: {
        ...inspection.publicMetadata,
        broadCategory: finalCat
      },
      secretGroundTruth: inspection.secretGroundTruth,
      verificationQuestions: inspection.suggestedVerificationQuestions || [
        "What brand and model is this item?",
        "What color or distinguishing features does it have?",
        "Describe any accessory or unique details associated with it."
      ],
      claimAttemptsCount: 0
    };

    // Use intelligent campus deduplication (same location + same product = 1 entry)
    const { item: savedItem, isDuplicate, message } = campusStore.addOrMerge(newItem);

    return NextResponse.json({
      success: true,
      isDuplicate,
      message,
      item: {
        id: savedItem.id,
        publicTitle: savedItem.publicTitle,
        category: savedItem.category,
        campusZone: savedItem.campusZone,
        status: savedItem.status,
        publicMetadata: savedItem.publicMetadata
      }
    });
  } catch (error: any) {
    console.error("AI Forensic Inspection error:", error?.message || error);
    return NextResponse.json(
      { 
        success: false, 
        error: "AI Forensic Vision Inspection encountered an issue analyzing image traits. Please ensure images are clear and try again." 
      },
      { status: 500 }
    );
  }
}
