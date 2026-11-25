import { NextResponse } from "next/server";
import { synthesizeBulbulAudio, triageWithSarvamPrism } from "@/lib/sarvam";
import { getStore } from "@/lib/store";

export async function POST(req: Request) {
  const { scenario } = await req.json();
  const store = getStore();
  const workerUrl = process.env.WORKER_URL || "http://localhost:4000";

  if (scenario === "baraat_75_conflict") {
    store.delaysByNode.baraat = 75;
    const prism = await triageWithSarvamPrism(
      "Cousin says Baraat is 10 mins away, but band driver in Kannada says Hebbal flyover jam for 75 mins.",
      "Active Baraat delay: 75m"
    );
    store.conflicts.unshift({
      id: `conf-${Date.now()}`,
      vendorRole: "Baraat Coordinator",
      transcript:
        "Conflicting update: Cousin claims 10m arrival vs Kannada band note reporting 75m Hebbal gridlock.",
      languageCode: "kn-IN",
      incidentType: prism.incidentType,
      confidence: prism.confidence,
      conflictProbability: prism.conflictProbability,
      suggestedDelayMin: 75,
      affectedNodeId: "baraat",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, scenario, prism });
  }

  if (scenario === "curfew_945_warning") {
    store.curfewWarningActive = true;
    store.delaysByNode.sangeet = Math.max(store.delaysByNode.sangeet || 0, 50);
    const tts = await synthesizeBulbulAudio(
      "गौर करें: बेंगलुरु 10 बजे ध्वनि नियम के कारण मंच सेटअप और संगेट योजना अपडेट की जा रही है।",
      "hi-IN"
    );
    store.dispatches.unshift({
      id: `disp-${Date.now()}`,
      recipient: "Caterer & Stage Lead (hi-IN)",
      languageCode: "hi-IN",
      modeUsed: tts.audioBase64 ? "tts_audio" : "text_fallback",
      text: "गौर करें: बेंगलुरु 10 बजे ध्वनि नियम के कारण मंच सेटअप और संगेट योजना अपडेट की जा रही है।",
      audioBase64: tts.audioBase64,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, scenario });
  }

  if (scenario === "guest_400_storm") {
    store.workerHealth = {
      status: "DEGRADED_OOM_SIMULATED",
      lastIncident: "400-guest broadcast storm exceeded 128Mi memory limit on voice-dispatch-worker",
      updatedAt: new Date().toISOString(),
    };
    try {
      await fetch(`${workerUrl}/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: store.localFlagOverrides.dispatch_degradation_mode || "full_tts",
          recipientsCount: 400,
          message: "Muhurat & refreshment update",
        }),
        signal: AbortSignal.timeout(2500),
      });
    } catch {
      // Pod OOMKill drops connection mid-flight—expected during demo
    }
    return NextResponse.json({ ok: true, scenario, workerHealth: store.workerHealth });
  }

  return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
}
