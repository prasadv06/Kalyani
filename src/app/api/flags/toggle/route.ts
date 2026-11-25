import { NextResponse } from "next/server";
import { patchFlagsmithFeatureState } from "@/lib/flagsmith";
import { getStore } from "@/lib/store";

export async function POST(req: Request) {
  const { key, value, healedByNudgeBee } = await req.json();
  const store = getStore();

  if (key === "open_buffet_early") {
    store.localFlagOverrides.open_buffet_early = Boolean(value);
  } else if (key === "indoor_hall_fallback") {
    store.localFlagOverrides.indoor_hall_fallback = Boolean(value);
  } else if (key === "stage_photo_cap_mins") {
    store.localFlagOverrides.stage_photo_cap_mins = Number(value) || 15;
  } else if (key === "dispatch_degradation_mode") {
    store.localFlagOverrides.dispatch_degradation_mode =
      value === "vip_audio_plus_guest_text" ? "vip_audio_plus_guest_text" : "full_tts";
  }

  if (healedByNudgeBee) {
    store.workerHealth = {
      status: "HEALED_BY_NUDGEE",
      lastIncident: "voice-dispatch-worker OOMKill during 400-guest broadcast storm",
      lastRunbookAction: `Flushed Flagsmith dispatch_degradation_mode=${value} & restarted K8s worker`,
      updatedAt: new Date().toISOString(),
    };
  }

  const sync = await patchFlagsmithFeatureState(key, Boolean(value), value);
  return NextResponse.json({ ok: true, flagsmithSync: sync, workerHealth: store.workerHealth });
}
