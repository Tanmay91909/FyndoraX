import { NextResponse } from "next/server";
import { keyManager } from "@/lib/gemini";
import { campusStore } from "@/lib/store";

export async function GET() {
  try {
    const keyPool = keyManager.getPoolStatus();
    const campusStats = campusStore.getStats();

    return NextResponse.json({
      success: true,
      engine: "Institutional AI Forensic Engine",
      keyPool,
      campusStats
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
