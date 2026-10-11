import { GoogleGenerativeAI } from "@google/generative-ai";

const CLIENT_GEMINI_KEYS = [
  "AIzaSyD3luB2oxmGWuAFmhEvsgJbUGQm99KFsCo",
  "AIzaSyCERwdCYhVN0dFYDnn0EOLTva2oPluA100",
  "AIzaSyAMYh6BEJ_fhFw3rtWPKIBtWqbIm5D1Fg8",
  "AIzaSyBSvxZqH15OBbknmRVmf6qJBHO5eeMUqOQ",
  "AIzaSyCCoU3O9yeTspKofo2AzPYUqaQmUm0xxs8",
  "AIzaSyB9WxrGzfBV9aa8p2P7-54JSg6oBeRZicA",
  "AIzaSyAD3Ndjgt3gm8E7PbxZ0mJ4nmvTOnAdKQo"
];

let keyIndex = 0;

function getNextKey(): string {
  const key = CLIENT_GEMINI_KEYS[keyIndex % CLIENT_GEMINI_KEYS.length];
  keyIndex = (keyIndex + 1) % CLIENT_GEMINI_KEYS.length;
  return key;
}

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Live conversational friend AI powered by TinyFish & Gemini 2.5 Flash
 * Chats naturally, warmly, like a real college buddy / campus senior
 * NO external website links sent. Real dynamic conversation.
 */
export async function talkToNemoFriend(
  userMessage: string,
  collegeName: string,
  collegeCode: string,
  conversationHistory: ChatHistoryMessage[] = []
): Promise<string> {
  const systemPrompt = `You are Nemo (Nemo AI) — a friendly campus senior and student buddy on FyndoraX for students at "${collegeName}" (${collegeCode}).

ABOUT FYNDORAX (CAMPUS LOST & FOUND OS):
FyndoraX is the official campus lost-and-found system for ${collegeCode}.
- "Catalog" tab: Search masked items found on campus (blurred photos to stop theft).
- "Dynamic Quiz" (Claim): To claim an item in Catalog, the student takes an AI quiz on 3 private marks (case color, stickers, scratches, wallpaper) to verify ownership.
- "Security Desk" tab: Passing the quiz generates a digital collection OTP. The student shows OTP + College ID at Central Security or Library Desk for collection.
- "Lost Notices" tab: If an item is not in the Catalog yet, student can post an SOS notice.
- "Report Found" tab: Students who find an item can log it with a photo, drop it at security/reception, and earn +50 Karma Points.

CRITICAL RULES FOR REPLIES:
1. SUPER SHORT & FAST (MANDATORY):
   - Keep replies to maximum 2 to 3 short sentences!
   - Never write essays, walls of text, or multiple numbered paragraphs.
   - Reply like a real friend on WhatsApp.
2. NO ASTERISKS OR SYMBOL JUNK:
   - DO NOT use markdown asterisks like "**" or "*" or hashtags "#" or markdown bullets.
   - Write clean, plain conversational sentences only.
3. CASUAL TONE:
   - If the student writes in Hinglish or Hindi, reply in friendly, warm Hinglish (e.g., "Arre tension mat le bhai! Ek baar FyndoraX ke Catalog tab me check kar. Agar mila toh quiz dekar pickup OTP mil jayega, warna Lost Notices pe SOS post daal de!").
   - If they write in English, reply in friendly, concise English.
4. PRACTICAL GUIDANCE:
   - Lost phone/wallet: remind to log out of UPI / block cards, check canteen/library/guard, then check FyndoraX Catalog or post SOS.
   - Zero external links or URLs.`;

  // Build conversational context
  const historyText = conversationHistory
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Student" : "Nemo"}: ${m.content}`)
    .join("\n\n");

  const fullPrompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n${historyText}\n\nStudent: ${userMessage}\nNemo:`;

  // Try across keys with rotation
  for (let attempt = 0; attempt < 3; attempt++) {
    const currentKey = getNextKey();
    try {
      const genAI = new GoogleGenerativeAI(currentKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
      const result = await model.generateContent(fullPrompt);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        // Strip out any accidental markdown asterisks or hash symbols
        return text.trim().replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s*/gm, "");
      }
    } catch (err: any) {
      console.warn(`[NemoFriend] Key attempt ${attempt + 1} failed:`, err?.message || err);
    }
  }

  // Fallback friendly reply if all keys exhausted
  return `Arre dost, tension mat le! Ek baar FyndoraX ke Catalog tab me check kar lo. Agar wahan item hai toh quiz dekar collection OTP mil jayega, warna Lost Notices pe SOS post daal do!`;
}
