import { NextRequest, NextResponse } from "next/server";
import { queryNemoAi, getTinyFishApiKey, searchWithTinyFish, runTinyFishWebAgent } from "@/lib/tinyfish";

export async function GET() {
  const apiKey = getTinyFishApiKey();
  const maskedKey = apiKey.length > 8 
    ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` 
    : (apiKey ? "****" : "NOT_CONFIGURED");

  return NextResponse.json({
    success: true,
    agent: "Nemo AI",
    status: apiKey ? "CONNECTED" : "OFFLINE",
    provider: "TinyFish Web Agent API",
    apiKeyMasked: maskedKey,
    features: [
      "Live Campus Web Search Intelligence",
      "Autonomous Web Notice Agent",
      "Interactive Step-by-Step Recovery Protocols",
      "Zero-Knowledge Privacy Protection"
    ]
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, college, collegeCode, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a question or inquiry for Nemo AI." },
        { status: 400 }
      );
    }

    const resolvedCollege = college || "Vivekananda Institute of Professional Studies – TC";
    const resolvedCode = collegeCode || "VIPS-TC";

    const result = await queryNemoAi(
      message.trim(),
      resolvedCollege,
      resolvedCode,
      history || []
    );

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error("[Nemo Route Error]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate Nemo AI guidance."
      },
      { status: 500 }
    );
  }
}
