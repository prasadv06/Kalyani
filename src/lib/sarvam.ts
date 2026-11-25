const SARVAM_BASE = "https://api.sarvam.ai";

function getKey(): string {
  const k = process.env.SARVAM_API_KEY;
  if (!k) throw new Error("Missing SARVAM_API_KEY");
  return k;
}

export interface PrismTriageResult {
  incidentType: string;
  confidence: number;
  conflictProbability: number;
  severityScore: string;
  needsConflictReview: boolean;
  source: "sarvam-prism" | "heuristic-fallback";
}

export async function transcribeAudioWithSaaras(
  audioBuffer: Buffer,
  filename = "vendor-note.webm",
  mimeType = "audio/webm"
): Promise<{ transcript: string; languageCode: string; source: "saaras:v4" | "fallback" }> {
  try {
    const form = new FormData();
    const uint8 = new Uint8Array(audioBuffer);
    form.append("file", new Blob([uint8], { type: mimeType }), filename);
    form.append("model", "saaras:v4");
    form.append("mode", "codemix");
    form.append("language_code", "unknown");
    form.append(
      "keyterms",
      JSON.stringify(["Muhurat", "Mandap", "Baraat", "Sangeet", "Varmala", "Haldi", "Hebbal", "Chaat"])
    );

    const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
      method: "POST",
      headers: { "api-subscription-key": getKey() },
      body: form,
    });

    if (!res.ok) {
      throw new Error(`Saaras HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      transcript: data.transcript || "",
      languageCode: data.language_code || "hi-IN",
      source: "saaras:v4",
    };
  } catch {
    return {
      transcript: "Baraat Hebbal traffic alli stuck aagide, 75 minutes late barthivi.",
      languageCode: "kn-IN",
      source: "fallback",
    };
  }
}

export async function triageWithSarvamPrism(
  transcript: string,
  contextSummary: string
): Promise<PrismTriageResult> {
  try {
    const res = await fetch(`${SARVAM_BASE}/v2/systemone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": getKey(),
      },
      body: JSON.stringify({
        model: "sarvam-prism",
        state: `Context: ${contextSummary}\nIncoming Report: ${transcript}`,
        questions: {
          incident_type: {
            type: "choice",
            instructions: "Classify the primary wedding operational risk.",
            criteria: {
              P0_MUHURAT_THREAT: "Delay threatens fixed Muhurat window",
              P1_SOUND_CURFEW: "Threatens Bengaluru 10 PM outdoor sound cutoff",
              P2_FOOD_SPOILAGE: "Causes buffet hold-time or catering bottleneck",
              RESOURCE_DEADLOCK: "Venue lawn/hall turnaround or shared resource clash",
              CONFLICTING_UPDATE: "Contradicts an earlier vendor report",
              LOW_PRIORITY: "Routine update with minimal SLA impact",
            },
          },
          needs_human_conflict_review: {
            type: "noul",
            instructions: "Does this report conflict with existing reports or lack certainty?",
          },
          severity: {
            type: "score",
            instructions: "Rate operational urgency.",
            criteria: ["trivial", "minor", "moderate", "major", "critical"],
          },
        },
      }),
    });

    if (!res.ok) throw new Error(`Prism HTTP ${res.status}`);
    const data = await res.json();
    const choice = data?.answers?.incident_type?.choice || "P1_SOUND_CURFEW";
    const probs = data?.answers?.incident_type?.probabilities || {};
    const confidence = typeof probs[choice] === "number" ? probs[choice] : 0.84;
    const conflictProbability =
      typeof data?.answers?.needs_human_conflict_review?.noul === "number"
        ? data.answers.needs_human_conflict_review.noul
        : 0.2;
    const severityScore = data?.answers?.severity?.choice || "major";

    return {
      incidentType: choice,
      confidence,
      conflictProbability,
      severityScore,
      needsConflictReview:
        choice === "CONFLICTING_UPDATE" || conflictProbability >= 0.55 || confidence < 0.72,
      source: "sarvam-prism",
    };
  } catch {
    const lower = transcript.toLowerCase();
    const isConflict =
      lower.includes("10 min") || lower.includes("already here") || lower.includes("opposite");
    return {
      incidentType: isConflict ? "CONFLICTING_UPDATE" : "P1_SOUND_CURFEW",
      confidence: isConflict ? 0.61 : 0.88,
      conflictProbability: isConflict ? 0.78 : 0.18,
      severityScore: isConflict ? "moderate" : "critical",
      needsConflictReview: isConflict,
      source: "heuristic-fallback",
    };
  }
}

export async function extractDelayAndDispatchCopy(
  transcript: string,
  vendorRole: string
): Promise<{
  affectedNodeId: string;
  delayMinutes: number;
  targetLanguageCode: "hi-IN" | "kn-IN" | "ta-IN" | "en-IN";
  nativeDispatchText: string;
  guestSummary: string;
}> {
  const langMap: Record<string, "hi-IN" | "kn-IN" | "ta-IN" | "en-IN"> = {
    Caterer: "hi-IN",
    Decorator: "kn-IN",
    DJ: "ta-IN",
    Pandit: "hi-IN",
  };
  const fallbackLang = langMap[vendorRole] || "hi-IN";

  try {
    const res = await fetch(`${SARVAM_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": getKey(),
      },
      body: JSON.stringify({
        model: "sarvam-105b-conversations",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              'Return ONLY valid JSON with keys: affectedNodeId ("haldi"|"lawn_flip"|"baraat"|"varmala"|"stage_photos"|"sangeet"), delayMinutes (number 0-120), targetLanguageCode ("hi-IN"|"kn-IN"|"ta-IN"|"en-IN"), nativeDispatchText (short actionable instruction in targetLanguageCode), guestSummary (calm 1-sentence English guest update).',
          },
          {
            role: "user",
            content: `Vendor role: ${vendorRole}\nTranscript: ${transcript}`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`105B HTTP ${res.status}`);
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        affectedNodeId: parsed.affectedNodeId || "baraat",
        delayMinutes: Number(parsed.delayMinutes ?? 45),
        targetLanguageCode: parsed.targetLanguageCode || fallbackLang,
        nativeDispatchText:
          parsed.nativeDispatchText || "कृपया समय सारणी अपडेट के अनुसार तैयार रहें।",
        guestSummary:
          parsed.guestSummary ||
          "Schedule is being dynamically adjusted; refreshments are available.",
      };
    }
    throw new Error("Non-JSON response");
  } catch {
    const minsMatch = transcript.match(/(\d+)\s*(min|mins|minute|minutes)/i);
    const delayMinutes = minsMatch ? parseInt(minsMatch[1], 10) : 60;
    return {
      affectedNodeId: "baraat",
      delayMinutes,
      targetLanguageCode: fallbackLang,
      nativeDispatchText:
        fallbackLang === "kn-IN"
          ? `ದಯವಿಟ್ಟು ಗಮನಿಸಿ: ವೇಳಾಪಟ್ಟಿಯಲ್ಲಿ ${delayMinutes} ನಿಮಿಷ ಬದಲಾವಣೆ ಇದೆ, ಸಿದ್ಧರಾಗಿ.`
          : `कृपया ध्यान दें: कार्यक्रम में ${delayMinutes} मिनट का बदलाव है, कृपया तैयार रहें।`,
      guestSummary: `Baraat & evening flow adjusted by ~${delayMinutes} mins while keeping Muhurat & sound rules intact.`,
    };
  }
}

export async function synthesizeBulbulAudio(
  text: string,
  targetLanguageCode: "hi-IN" | "kn-IN" | "ta-IN" | "en-IN"
): Promise<{ audioBase64: string | null; source: "bulbul:v4-flash" | "skipped" }> {
  try {
    const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": getKey(),
      },
      body: JSON.stringify({
        text: text.slice(0, 400),
        target_language_code: targetLanguageCode,
        model: "bulbul:v4-flash",
        pace: 1.05,
      }),
    });

    if (!res.ok) throw new Error(`Bulbul HTTP ${res.status}`);
    const data = await res.json();
    const b64 = Array.isArray(data?.audios) ? data.audios[0] : null;
    return { audioBase64: b64 || null, source: b64 ? "bulbul:v4-flash" : "skipped" };
  } catch {
    return { audioBase64: null, source: "skipped" };
  }
}
