import fs from "fs";
import path from "path";
import { executeGeminiWithRotation } from "./gemini";

/**
 * Helper to safely retrieve the TinyFish API Key from env or .env file
 */
export function getTinyFishApiKey(): string {
  // 1. Process environment
  const envKey = process.env.TINY_FISH_API_KEY || process.env.TINYFISH_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }

  // 2. Direct .env file inspection fallback
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/TINY_?FISH_API_KEY\s*=\s*([^\s#]+)/i);
      if (match) {
        return match[1].trim();
      }
    }
  } catch (err) {
    console.warn("[TinyFish] Could not read .env file for key fallback:", err);
  }

  return "";
}

export interface TinyFishSearchResult {
  position: number;
  site_name: string;
  title: string;
  snippet: string;
  url: string;
  date?: string;
}

export interface TinyFishSearchResponse {
  query: string;
  results: TinyFishSearchResult[];
  total_results: number;
  page: number;
}

/**
 * Structured Web Search via TinyFish Search API (api.search.tinyfish.ai)
 */
export async function searchWithTinyFish(
  query: string,
  options: {
    purpose?: string;
    location?: string;
    language?: string;
    includeDomains?: string;
  } = {}
): Promise<TinyFishSearchResult[]> {
  const apiKey = getTinyFishApiKey();
  if (!apiKey) {
    console.warn("[TinyFish] No API key found. Skipping live search.");
    return [];
  }

  try {
    const params = new URLSearchParams();
    params.set("query", query);
    params.set("location", options.location || "IN");
    params.set("language", options.language || "en");
    if (options.purpose) params.set("purpose", options.purpose);
    if (options.includeDomains) params.set("include_domains", options.includeDomains);

    const url = `https://api.search.tinyfish.ai?${params.toString()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      console.warn(`[TinyFish Search] HTTP ${res.status}: ${await res.text()}`);
      return [];
    }

    const data: TinyFishSearchResponse = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("[TinyFish Search Error]", error);
    return [];
  }
}

/**
 * Fetch and extract clean markdown content via TinyFish Fetch API (api.fetch.tinyfish.ai)
 */
export async function fetchWithTinyFish(urls: string[]): Promise<any[]> {
  const apiKey = getTinyFishApiKey();
  if (!apiKey) return [];

  try {
    const res = await fetch("https://api.fetch.tinyfish.ai", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ urls })
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("[TinyFish Fetch Error]", error);
    return [];
  }
}

/**
 * Autonomous Cloud Browser Agent via TinyFish Agent API (agent.tinyfish.ai/v1/automation/run)
 */
export async function runTinyFishWebAgent(url: string, goal: string): Promise<any> {
  const apiKey = getTinyFishApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch("https://agent.tinyfish.ai/v1/automation/run", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        goal,
        browser_profile: "lite"
      })
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("[TinyFish Agent Error]", error);
    return null;
  }
}

export interface NemoMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface NemoResponse {
  reply: string;
  steps: string[];
  suggestedAction?: {
    label: string;
    actionTab: "feed" | "report" | "desk" | "admin";
  };
  sources: { title: string; url: string; site_name: string }[];
  tinyFishActive: boolean;
}

/**
 * Main Nemo AI Campus Intelligence Service
 * Guides students step-by-step through lost/found protocols without exposing internal secrets
 */
export async function queryNemoAi(
  userQuery: string,
  collegeName: string,
  collegeCode: string,
  conversationHistory: NemoMessage[] = []
): Promise<NemoResponse> {
  const apiKey = getTinyFishApiKey();
  let tinyFishSources: TinyFishSearchResult[] = [];

  // Determine if query benefits from real-time web intelligence (official ID lost, admit card, FIR, legal guidelines, campus rules)
  const isPolicyOrDocumentQuery = /id card|admit card|hall ticket|wallet|money|documents|fir|affidavit|police|exam|rules|policy|registrar|challan/i.test(userQuery);
  const isGenericLost = /lost|misplaced|forgot|chhod|kho gaya|kahan milega/i.test(userQuery);

  if (apiKey && (isPolicyOrDocumentQuery || isGenericLost)) {
    const searchQuery = `${collegeCode} college Delhi student lost and found guidelines ${userQuery.slice(0, 80)}`;
    const results = await searchWithTinyFish(searchQuery, {
      location: "IN",
      language: "en",
      purpose: `Help a college student at ${collegeName} recover their lost item or navigate official institutional recovery procedures.`
    });
    tinyFishSources = results.slice(0, 3);
  }

  // System Prompt for Nemo AI
  const prompt = `You are Nemo AI (powered by TinyFish Web Agent & FyndoraX Campus OS).
You are an empathetic, ultra-helpful campus recovery assistant for college students at "${collegeName}" (${collegeCode}).

USER'S INQUIRY:
"${userQuery}"

TINYFISH LIVE WEB INTELLIGENCE CONTEXT:
${tinyFishSources.length > 0 
  ? tinyFishSources.map((s, idx) => `[Source ${idx+1}: ${s.title} (${s.site_name})] ${s.snippet} (URL: ${s.url})`).join("\n") 
  : "No external web citations needed. Use internal campus protocol."}

CORE INSTRUCTIONS:
1. Tone: Friendly, calming, brotherly, sharp, practical. Students asking you are often stressed or in panic.
2. Focus strictly on STEP-BY-STEP ACTIONABLE GUIDANCE:
   - Do NOT query or reveal database items or private photos (photos are masked to prevent theft).
   - If they LOST something:
     * Step 1: Immediate risk containment (e.g. if ID card/wallet/phone: de-link UPI, notify floor coordinator).
     * Step 2: Search FyndoraX Masked Catalog (by Block / Floor / Room) or submit an SOS Lost Notice.
     * Step 3: Prepare for the AI Dynamic Quiz (remind them to recall unique scratches, stickers, or hidden marks from memory).
     * Step 4: Physical Custody Check (visit the Central Security Circulation Desk or Library Desk with their official College ID).
   - If they FOUND something:
     * Guide them to snap 3-5 multi-angle photos with FyndoraX's 30-second camera inspection.
     * Tell them where the secure deposit counters are (Central Library Reception or Block A Gate 1).
     * Remind them of the Campus Good Samaritan Karma Points they will earn!
   - If they lost an OFFICIAL ID / ADMIT CARD / DOCUMENT:
     * Give the exact 3-step college administrative process (Proctor application, temporary library slip, university duplicate ID challan) leveraging the TinyFish context.
3. Suggest a single best in-app action tab if relevant: "feed" (catalog), "report" (log found item), or "desk" (handover desk).

Strictly output valid JSON with no markdown backticks wrapping:
{
  "reply": "Your warm, concise conversational guidance for the student (2-4 sentences)",
  "steps": [
    "Step 1: Description",
    "Step 2: Description",
    "Step 3: Description",
    "Step 4: Description"
  ],
  "suggestedAction": {
    "label": "Button Label (e.g., Browse Masked Catalog, Report Found Item, Visit Security Desk)",
    "actionTab": "feed" | "report" | "desk"
  },
  "sources": [
    { "title": "...", "url": "...", "site_name": "..." }
  ]
}`;

  try {
    const rawAiOutput = await executeGeminiWithRotation(async (model) => {
      const res = await model.generateContent(prompt);
      return res.response.text();
    });

    const cleanJson = rawAiOutput
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleanJson);
    return {
      reply: parsed.reply || "I'm here to help you recover your belongings on campus step-by-step.",
      steps: parsed.steps || [
        "Check FyndoraX's Masked Catalog for items matching your category.",
        "Take the Dynamic Verification Quiz using your memory of physical markers.",
        "Obtain your digital OTP pass and present your student ID at the Central Desk."
      ],
      suggestedAction: parsed.suggestedAction || {
        label: "Browse Lost Catalog",
        actionTab: "feed"
      },
      sources: (parsed.sources && parsed.sources.length > 0)
        ? parsed.sources 
        : tinyFishSources.map(s => ({ title: s.title, url: s.url, site_name: s.site_name })),
      tinyFishActive: !!apiKey
    };
  } catch (err) {
    console.error("[Nemo AI Error]", err);
    // Graceful fallback
    return {
      reply: `Don't panic! Here are the immediate steps to take at ${collegeCode}:`,
      steps: [
        "1. Check the FyndoraX Masked Catalog to see if a finder recently handed it in.",
        "2. If listed, click 'Verify to Claim' and answer the 3 dynamic questions about your item's private marks.",
        "3. Once verified, take your 6-digit OTP pass to the Central Security or Library Desk.",
        "4. If not yet found, post an SOS Lost Notice on the campus notice board so finders can reach you."
      ],
      suggestedAction: {
        label: "Search Campus Catalog",
        actionTab: "feed"
      },
      sources: tinyFishSources.map(s => ({ title: s.title, url: s.url, site_name: s.site_name })),
      tinyFishActive: !!apiKey
    };
  }
}
