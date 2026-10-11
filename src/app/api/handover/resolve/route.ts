import { NextRequest, NextResponse } from "next/server";
import { campusStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, otp, attendantId, notes } = body;

    if (!itemId || !otp) {
      return NextResponse.json(
        { success: false, error: "Please provide item ID and the 6-digit OTP code" },
        { status: 400 }
      );
    }

    const result = campusStore.resolveHandover(itemId, otp, attendantId, notes);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        item: result.item
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to resolve handover" },
      { status: 500 }
    );
  }
}
