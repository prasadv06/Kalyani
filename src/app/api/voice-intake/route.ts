import { NextResponse } from "next/server";
import {
  extractDelayAndDispatchCopy,
  synthesizeBulbulAudio,
  transcribeAudioWithSaaras,
  triageWithSarvamPrism,
} from "@/lib/sarvam";
import { evaluateMandapFlags } from "@/lib/flagsmith";
import { getStore } from "@/lib/store";

export async function POST(req: Request) {
  const store = getStore();
  const contentType = req.headers.get("content-type") || "";

  let transcript = "";
  let languageCode = "kn-IN";
  let vendorRole = "Decorator";
  let sttSource = "preset";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    vendorRole = String(form.get("vendorRole") || "Decorator");
    const audioFile = form.get("audio") as File | null;
    if (audioFile) {
      const buf = Buffer.from(await audioFile.arrayBuffer());
      const stt = await transcribeAudioWithSaaras(buf, audioFile.name, audioFile.type);
      transcript = stt.transcript;
      languageCode = stt.languageCode;
      sttSource = stt.source;
    }
  } else {
    const body = await req.json();
    transcript = String(body.transcript || "");
    vendorRole = String(body.vendorRole || "Decorator");
    languageCode = String(body.languageCode || "hi-IN");
  }

  const contextSummary = `Current delays: ${JSON.stringify(store.delaysByNode)}. Curfew warning: ${store.curfewWarningActive}`;
  const prism = await triageWithSarvamPrism(transcript, contextSummary);
  const extracted = await extractDelayAndDispatchCopy(transcript, vendorRole);

  if (prism.needsConflictReview) {
    const conflict = {
      id: `conf-${Date.now()}`,
      vendorRole,
      transcript,
      languageCode,
      incidentType: prism.incidentType,
      confidence: prism.confidence,
      conflictProbability: prism.conflictProbability,
      suggestedDelayMin: extracted.delayMinutes,
      affectedNodeId: extracted.affectedNodeId,
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
    };
    store.conflicts.unshift(conflict);
    return NextResponse.json({
      queuedForConflictReview: true,
      conflict,
      prism,
      sttSource,
    });
  }

  store.delaysByNode[extracted.affectedNodeId] = Math.max(
    store.delaysByNode[extracted.affectedNodeId] || 0,
    extracted.delayMinutes
  );

  const flags = await evaluateMandapFlags("host-war-room", { role: "host" }, store.localFlagOverrides);
  const shouldUseAudio = flags.dispatch_degradation_mode === "full_tts" || vendorRole !== "Guest";
  const tts = shouldUseAudio
    ? await synthesizeBulbulAudio(extracted.nativeDispatchText, extracted.targetLanguageCode)
    : { audioBase64: null, source: "skipped" as const };

  store.dispatches.unshift({
    id: `disp-${Date.now()}`,
    recipient: `${vendorRole} (${extracted.targetLanguageCode})`,
    languageCode: extracted.targetLanguageCode,
    modeUsed: tts.audioBase64 ? "tts_audio" : "text_fallback",
    text: extracted.nativeDispatchText,
    audioBase64: tts.audioBase64,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    queuedForConflictReview: false,
    transcript,
    prism,
    extracted,
    ttsSource: tts.source,
    audioBase64: tts.audioBase64,
    sttSource,
  });
}
