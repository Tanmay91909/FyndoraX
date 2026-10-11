import { NextRequest, NextResponse } from "next/server";
import { campusStore } from "@/lib/store";
import { evaluateClaimantAnswersWithGemini } from "@/lib/gemini";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, claimantEmail, answers } = body;

    if (!itemId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide item ID and answers to verification questions" },
        { status: 400 }
      );
    }

    const item = campusStore.getById(itemId);
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found in campus database" }, { status: 404 });
    }

    // Increment attempts count
    item.claimAttemptsCount = (item.claimAttemptsCount || 0) + 1;

    // Evaluate answers with Gemini 3.5 Flash Lite
    const evaluation = await evaluateClaimantAnswersWithGemini(
      item.secretGroundTruth,
      item.verificationQuestions,
      answers
    );

    if (evaluation.passed) {
      // Generate 6-digit secure handover OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      const defaultEmail = item.collegeCode === "DTU" 
        ? "student.claimant@dtu.ac.in" 
        : item.collegeCode === "KCC-ITM" 
        ? "student.claimant@kccitm.edu" 
        : "student.claimant@vips.edu";
      const actualEmail = claimantEmail || defaultEmail;

      // Generate QR Code data URL
      const qrPayload = JSON.stringify({
        itemId: item.id,
        otp,
        claimant: actualEmail,
        verifiedAt: new Date().toISOString()
      });

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        margin: 1,
        color: {
          dark: '#9F1239', // campus-800
          light: '#FFFFFF'
        }
      });

      const claimPass = {
        claimantEmail: actualEmail,
        confidenceScore: evaluation.confidenceScore,
        matchedTraits: evaluation.matchedTraits || [],
        otp,
        qrPayload: qrDataUrl,
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      campusStore.update(itemId, {
        status: "VERIFIED_PENDING_HANDOVER",
        claimPass
      });

      return NextResponse.json({
        success: true,
        passed: true,
        confidenceScore: evaluation.confidenceScore,
        verdictReasoning: evaluation.verdictReasoning,
        matchedTraits: evaluation.matchedTraits,
        unmaskedPhotos: item.photos,
        claimPass: {
          ...claimPass,
          itemTitle: item.publicTitle,
          campusZone: item.campusZone,
          exactModel: item.secretGroundTruth.brandAndExactModel
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        passed: false,
        confidenceScore: evaluation.confidenceScore,
        verdictReasoning: evaluation.verdictReasoning || "Your answers did not match the forensic visual markers. Zero details revealed.",
        matchedTraits: evaluation.matchedTraits || [],
        unmatchedOrSuspicious: evaluation.unmatchedOrSuspicious || []
      });
    }
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Verification evaluation failed" },
      { status: 500 }
    );
  }
}
