import { GoogleGenerativeAI } from "@google/generative-ai";

// Rate limiting & Round Robin configuration
const MAX_RPM_PER_KEY = 15;
const MAX_RPD_PER_KEY = 500;
const PRIMARY_MODEL = "gemini-3.5-flash-lite";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

export interface KeyStatus {
  index: number;
  label: string;
  maskedKey: string;
  requestsThisMinute: number;
  requestsToday: number;
  lastUsedTimestamp: number;
  cooldownUntil: number;
  isAvailable: boolean;
  totalCalls: number;
  errorsCount: number;
}

// 9 configured API keys with comments preserved
const CONFIGURED_KEYS: { key: string; label: string }[] = [
  { key: "AIzaSyD3luB2oxmGWuAFmhEvsgJbUGQm99KFsCo", label: "tanmay main id" },
  { key: "AIzaSyCERwdCYhVN0dFYDnn0EOLTva2oPluA100", label: "sizan id" },
  { key: "AIzaSyAMYh6BEJ_fhFw3rtWPKIBtWqbIm5D1Fg8", label: "vivek id" },
  { key: "AIzaSyBSvxZqH15OBbknmRVmf6qJBHO5eeMUqOQ", label: "abhir id" },
  { key: "AIzaSyCCoU3O9yeTspKofo2AzPYUqaQmUm0xxs8", label: "dadu id" },
  { key: "AIzaSyB9WxrGzfBV9aa8p2P7-54JSg6oBeRZicA", label: "tanmay 911 id" },
  { key: "AIzaSyAD3Ndjgt3gm8E7PbxZ0mJ4nmvTOnAdKQo", label: "sanatan id" },
  { key: "AQ.Ab8RN6IpjOvn0-_YHM_mvhq-7b2KrG81U1JJk5XcB1sZ8exXKQ", label: "tanmay 4 id" },
  { key: "AQ.Ab8RN6Knvy5ycKywzzULMmB7sGyKWdTTsl1t-Pf5Ywt00d22SQ", label: "tv id" },
];

class GeminiRoundRobinManager {
  private keys: { key: string; label: string }[] = [];
  private requestHistory: Map<string, number[]> = new Map();
  private dailyCounts: Map<string, { date: string; count: number }> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private lifetimeCalls: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private currentPointer = 0;

  constructor() {
    this.keys = [...CONFIGURED_KEYS];
    if (typeof window === "undefined") {
      console.log(`[GeminiRoundRobin] Initialized pool with ${this.keys.length} API keys for ${PRIMARY_MODEL}`);
    }
  }

  private getTodayString(): string {
    return new Date().toISOString().split("T")[0];
  }

  private cleanOldMinuteRequests(key: string) {
    const now = Date.now();
    const history = this.requestHistory.get(key) || [];
    const valid = history.filter(ts => now - ts < 60000);
    this.requestHistory.set(key, valid);
  }

  private isKeyEligible(keyObj: { key: string; label: string }): boolean {
    const key = keyObj.key;
    const now = Date.now();

    const cooldown = this.cooldowns.get(key) || 0;
    if (now < cooldown) {
      return false;
    }

    this.cleanOldMinuteRequests(key);
    const minuteCount = (this.requestHistory.get(key) || []).length;
    if (minuteCount >= MAX_RPM_PER_KEY) {
      return false;
    }

    const today = this.getTodayString();
    const daily = this.dailyCounts.get(key);
    if (daily && daily.date === today && daily.count >= MAX_RPD_PER_KEY) {
      return false;
    }

    return true;
  }

  public getNextAvailableKey(): { key: string; label: string; index: number } {
    if (this.keys.length === 0) {
      throw new Error("No Google Gemini API keys configured");
    }

    const total = this.keys.length;
    const startIndex = this.currentPointer;

    for (let offset = 0; offset < total; offset++) {
      const idx = (startIndex + offset) % total;
      const keyObj = this.keys[idx];

      if (this.isKeyEligible(keyObj)) {
        this.currentPointer = (idx + 1) % total;
        this.recordKeyUsage(keyObj.key);
        return { key: keyObj.key, label: keyObj.label, index: idx };
      }
    }

    // If all keys at 15 RPM, pick next in round robin
    const fallbackIdx = this.currentPointer % total;
    this.currentPointer = (this.currentPointer + 1) % total;
    const fallbackKey = this.keys[fallbackIdx];
    this.recordKeyUsage(fallbackKey.key);
    return { key: fallbackKey.key, label: fallbackKey.label, index: fallbackIdx };
  }

  private recordKeyUsage(key: string) {
    const now = Date.now();
    const history = this.requestHistory.get(key) || [];
    history.push(now);
    this.requestHistory.set(key, history);

    const today = this.getTodayString();
    const daily = this.dailyCounts.get(key);
    if (!daily || daily.date !== today) {
      this.dailyCounts.set(key, { date: today, count: 1 });
    } else {
      daily.count += 1;
    }

    const total = (this.lifetimeCalls.get(key) || 0) + 1;
    this.lifetimeCalls.set(key, total);
  }

  public reportKeyError(key: string, error: any) {
    const now = Date.now();
    const currentErrors = (this.errorCounts.get(key) || 0) + 1;
    this.errorCounts.set(key, currentErrors);

    const errMsg = String(error?.message || error || "");
    if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota")) {
      console.warn(`[GeminiRoundRobin] Key entered 30s cooldown due to quota limit:`, errMsg);
      this.cooldowns.set(key, now + 30000);
    }
  }

  public getPoolStatus(): KeyStatus[] {
    const now = Date.now();
    const today = this.getTodayString();

    return this.keys.map((k, idx) => {
      this.cleanOldMinuteRequests(k.key);
      const minuteReqs = (this.requestHistory.get(k.key) || []).length;
      const daily = this.dailyCounts.get(k.key);
      const dailyCount = (daily && daily.date === today) ? daily.count : 0;
      const cooldown = this.cooldowns.get(k.key) || 0;
      const history = this.requestHistory.get(k.key) || [];
      const lastUsed = history.length > 0 ? history[history.length - 1] : 0;

      const masked = k.key.length > 8 
        ? `${k.key.substring(0, 4)}...${k.key.substring(k.key.length - 4)}` 
        : "****";

      return {
        index: idx + 1,
        label: k.label,
        maskedKey: masked,
        requestsThisMinute: minuteReqs,
        requestsToday: dailyCount,
        lastUsedTimestamp: lastUsed,
        cooldownUntil: cooldown,
        isAvailable: now >= cooldown && minuteReqs < MAX_RPM_PER_KEY && dailyCount < MAX_RPD_PER_KEY,
        totalCalls: this.lifetimeCalls.get(k.key) || 0,
        errorsCount: this.errorCounts.get(k.key) || 0,
      };
    });
  }
}

export const keyManager = new GeminiRoundRobinManager();

/**
 * Execute a call to Gemini with automatic round-robin key rotation and fallback models
 */
export async function executeGeminiWithRotation<T>(
  apiCall: (model: any) => Promise<T>,
  maxRetries = 4
): Promise<T> {
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const keyInfo = keyManager.getNextAvailableKey();
    const modelName = attempt < 2 ? PRIMARY_MODEL : FALLBACK_MODEL;
    try {
      const genAI = new GoogleGenerativeAI(keyInfo.key);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await apiCall(model);
      return result;
    } catch (err: any) {
      lastError = err;
      keyManager.reportKeyError(keyInfo.key, err);
      console.warn(`[GeminiAttempt ${attempt + 1}] Key #${keyInfo.index + 1} (${keyInfo.label}) on ${modelName} failed:`, err?.message || err);
    }
  }

  throw new Error(`AI Forensic engine inspection error: ${lastError?.message || "All keys busy"}`);
}

/**
 * Helper to resolve remote URLs or Data URIs into clean Base64 data
 */
async function resolveImageToBase64(imgInput: string): Promise<{ data: string; mimeType: string }> {
  if (imgInput.startsWith("data:")) {
    const match = imgInput.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      return {
        mimeType: match[1],
        data: match[2],
      };
    }
  }

  if (imgInput.startsWith("http://") || imgInput.startsWith("https://")) {
    try {
      const res = await fetch(imgInput);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        let b64 = "";
        if (typeof Buffer !== "undefined") {
          b64 = Buffer.from(buffer).toString("base64");
        } else {
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          b64 = btoa(binary);
        }
        const contentType = res.headers.get("content-type") || "image/jpeg";
        return {
          data: b64,
          mimeType: contentType.split(";")[0] || "image/jpeg",
        };
      }
    } catch (e: any) {
      console.warn("Could not download remote image for vision analysis:", e?.message || e);
    }
  }

  return {
    mimeType: "image/jpeg",
    data: imgInput.replace(/^data:image\/\w+;base64,/, ""),
  };
}

/**
 * Inspect 1-5 multi-angle photos of a lost item
 * Extracts public masked metadata, forensic ground truth, and dynamic verification questions
 */
export async function inspectLostItemWithGemini(
  images: Array<{ data: string; mimeType?: string } | string>,
  campusZone: string,
  categoryHint?: string
) {
  // Normalize and resolve all images to Base64 buffers
  const normalizedInputs = images.map((img) => (typeof img === "string" ? img : img.data));
  const resolvedImages = await Promise.all(
    normalizedInputs.map((imgStr) => resolveImageToBase64(imgStr))
  );

  const prompt = `You are the forensic vision engine for "FyndoraX", a smart campus lost & found platform.
You are inspecting multi-angle photos of an item found on campus at location: "${campusZone}".
Category hint if applicable: "${categoryHint || "Unspecified"}".

Analyze the item thoroughly across all provided photo angles.
You MUST output strictly valid JSON with no markdown wrapping and no explanation.

Schema requirements:
{
  "publicMetadata": {
    "broadCategory": "Electronics | Stationery | Bottles & Mugs | Keys | Cards & IDs | Miscellaneous",
    "itemType": "e.g., Wireless Earbuds, Scientific Calculator, Water Bottle, Ignition Key, Laptop Sleeve, Umbrella",
    "generalColor": "e.g., Matte Black, Navy Blue, Brushed Silver",
    "roughCondition": "e.g., Gently Used, Mint Condition, Shows Wear",
    "estimatedBrand": "e.g., boAt, Casio, Apple, Milton, Destinio, Fastrack"
  },
  "secretGroundTruth": {
    "brandAndExactModel": "e.g., boAt Airdopes 141 or Casio fx-991EX ClassWiz",
    "uniqueStickersOrMarkings": "Specific descriptions of stickers, decals, engravings, hand-drawn marks, or tags",
    "physicalDefectsOrDamage": "Specific scratches, dents, cracks, wear spots, missing caps, hairline fractures",
    "accessoriesOrContents": "Lanyards, keychains, protective sleeves, specific cable colors, case details"
  },
  "suggestedVerificationQuestions": [
    "Question 1: Focus on any specific branding mark, logo placement, or exact model name",
    "Question 2: Focus on unique stickers, decals, color combinations, or attached accessories",
    "Question 3: Focus on specific physical scratch, wear pattern, or distinctive defect and its location"
  ]
}

Note:
1. Ensure the verification questions are tailored SPECIFICALLY to the details visible in this item's photos.
2. Never reveal the answers in the questions themselves (e.g. ask 'What brand logo is on the lid?', not 'Is it a Milton bottle?').
3. Audio gear and all electronics belong under 'Electronics'.`;

  return executeGeminiWithRotation(async (model) => {
    const parts: any[] = [{ text: prompt }];

    for (const img of resolvedImages) {
      parts.push({
        inlineData: {
          data: img.data,
          mimeType: img.mimeType || "image/jpeg",
        },
      });
    }

    const response = await model.generateContent(parts);
    const text = response.response.text();

    let cleanJson = text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    return JSON.parse(cleanJson);
  });
}

/**
 * Semantically evaluate a claimant's quiz answers against the ground truth using Gemini
 */
export async function evaluateClaimantAnswersWithGemini(
  groundTruth: any,
  questions: string[],
  claimantAnswers: string[]
) {
  const prompt = `You are the Campus Security AI Gatekeeper for "FyndoraX".
Your job is to strictly verify if a student claimant is the genuine owner of a lost item based on their answers to verification questions.

Item Secret Ground Truth:
${JSON.stringify(groundTruth, null, 2)}

Verification Questions & Claimant Answers:
${questions.map((q, i) => `Q${i + 1}: ${q}\nClaimant Answer: "${claimantAnswers[i] || "Not answered"}"`).join("\n\n")}

Evaluation Guidelines:
1. Compare claimant answers with the ground truth characteristics (brand, model, color, stickers, markings, condition, accessories).
2. If the claimant provides plausible, genuine recollections that align with the item, award high confidence (75-98%) and set passed: true.
3. Pass threshold is 60%. If confidence >= 60, set passed: true. Only fail if answers clearly contradict the item ground truth or are malicious spam.

Output strictly valid JSON with no markdown wrapping:
{
  "confidenceScore": number,
  "passed": boolean,
  "verdictReasoning": "Concise 2-sentence rationale for the campus security audit log",
  "matchedTraits": ["Trait 1 that was correctly recalled", "Trait 2..."],
  "unmatchedOrSuspicious": ["Any detail that was incorrect or guessed"]
}`;

  return executeGeminiWithRotation(async (model) => {
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    let cleanJson = text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    return JSON.parse(cleanJson);
  });
}

/**
 * Dynamically generate realistic, authentic owner answers for quiz verification questions
 * using Gemini 3.5 Flash Lite with rolling round-robin keys.
 * Ensures every answer accurately matches the specific question and the item's ground truth.
 */
export async function generateGenuineQuizAnswersWithGemini(
  item: {
    publicTitle?: string;
    category?: string;
    campusZone?: string;
    secretGroundTruth?: any;
    publicMetadata?: any;
    photos?: string[];
  },
  questions: string[]
): Promise<string[]> {
  const gt = item?.secretGroundTruth || {};
  const meta = item?.publicMetadata || {};

  const prompt = `You are the authentic student owner of a lost item on the "FyndoraX" campus lost & found platform.
You are completing a forensic verification quiz to prove you own the item.
You know your item intimately and are recalling accurate, specific details from memory.

ITEM DETAILS:
- Title: ${item?.publicTitle || "Lost Item"}
- Category: ${item?.category || meta?.broadCategory || "General"}
- Campus Location: ${item?.campusZone || "Campus Grounds"}

OFFICIAL GROUND TRUTH RECORDED IN SECURITY CUSTODY:
- Brand & Exact Model: ${gt.brandAndExactModel || meta.estimatedBrand || item?.publicTitle || "Standard model"}
- Color, Case & Exterior Finish: ${meta.generalColor || "Original finish"}
- Unique Stickers, Markings, Engravings, Decals: ${gt.uniqueStickersOrMarkings || "Clean, no extra stickers"}
- Defects, Scratches, Cracks, Wear Patterns: ${gt.physicalDefectsOrDamage || meta.roughCondition || "Minor surface handling marks"}
- Accessories, Keychains, Lanyards, Ports, Attachments, Contents: ${gt.accessoriesOrContents || "Standard attachments"}

VERIFICATION QUESTIONS:
${questions.map((q, idx) => `Question ${idx + 1}: "${q}"`).join("\n")}

INSTRUCTIONS:
For each question, provide a natural, direct first-person answer (1-2 sentences) that an authentic owner would give.
CRITICAL RULES:
1. Directly answer what the question asks. If Question asks about a brand, state the brand and model. If Question asks about color, state the exact color and finish. If Question asks about stickers/markings, state the specific stickers/markings. If Question asks about scratches/defects, state the exact defect.
2. The answers must strictly align with the ground truth details above so they will pass AI forensic evaluation with >90% confidence.
3. Return exactly ${questions.length} answers matching each question in order.

Strictly output valid JSON with no markdown wrapping:
{
  "answers": [
    "First-person answer to Question 1",
    "First-person answer to Question 2",
    "First-person answer to Question 3"
  ]
}`;

  return executeGeminiWithRotation(async (model) => {
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    let cleanJson = text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed.answers) && parsed.answers.length > 0) {
      return parsed.answers;
    }
    throw new Error("Invalid answers array format from Gemini");
  });
}

/**
 * Dynamically generate realistic impostor / fraudulent guesses that fail verification
 */
export async function generateImpostorQuizAnswersWithGemini(
  questions: string[]
): Promise<string[]> {
  const prompt = `You are simulating a fraudulent claimant or impostor guessing answers to campus lost & found verification questions on FyndoraX.
Generate vague, generic, and inaccurate guesses that should fail security checks for these questions:
${questions.map((q, idx) => `Question ${idx + 1}: "${q}"`).join("\n")}

Strictly output valid JSON with no markdown wrapping:
{
  "answers": [
    "Vague guess for Question 1",
    "Vague guess for Question 2",
    "Vague guess for Question 3"
  ]
}`;

  return executeGeminiWithRotation(async (model) => {
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    let cleanJson = text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed.answers) && parsed.answers.length > 0) {
      return parsed.answers;
    }
    throw new Error("Invalid impostor answers format");
  });
}
