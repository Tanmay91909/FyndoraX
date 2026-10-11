import { NextRequest, NextResponse } from "next/server";
import { campusStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ success: false, error: "Missing itemId" }, { status: 400 });
    }

    const item = campusStore.getById(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      itemId: item.id,
      publicTitle: item.publicTitle,
      campusZone: item.campusZone,
      category: item.category,
      questions: item.verificationQuestions
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed" }, { status: 500 });
  }
}
