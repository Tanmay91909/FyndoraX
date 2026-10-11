import { NextRequest, NextResponse } from "next/server";
import { campusStore } from "@/lib/store";

export async function GET() {
  try {
    const blocks = campusStore.getBlocks();
    const stats = campusStore.getStats();
    return NextResponse.json({ success: true, blocks, stats });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch blocks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, totalFloors, roomsPerFloor } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a valid block name (e.g., 'Block D' or 'Science Block')" },
        { status: 400 }
      );
    }

    const created = campusStore.addBlock(
      name,
      Number(totalFloors) || 8,
      Number(roomsPerFloor) || 12
    );

    return NextResponse.json({
      success: true,
      message: `Successfully registered ${created.name} with ${created.totalFloors} floors and ${created.roomsPerFloor} rooms per floor`,
      block: created,
      blocks: campusStore.getBlocks(),
      stats: campusStore.getStats()
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create block" },
      { status: 500 }
    );
  }
}
