import { DefaultFlag, Flagsmith } from "flagsmith-nodejs";

export interface MandapFlags {
  open_buffet_early: boolean;
  indoor_hall_fallback: boolean;
  stage_photo_cap_mins: number;
  dispatch_degradation_mode: "full_tts" | "vip_audio_plus_guest_text";
  guest_variant_override?: "transparent_eta" | "chaat_diversion";
  source: "flagsmith-live" | "local-fallback";
}

const DEFAULT_FLAGS: MandapFlags = {
  open_buffet_early: false,
  indoor_hall_fallback: false,
  stage_photo_cap_mins: 45,
  dispatch_degradation_mode: "full_tts",
  source: "local-fallback",
};

let cachedClient: Flagsmith | null = null;

function getClient(): Flagsmith | null {
  const envKey = process.env.FLAGSMITH_ENVIRONMENT_KEY;
  if (!envKey) return null;
  if (!cachedClient) {
    cachedClient = new Flagsmith({
      environmentKey: envKey,
      apiUrl: "https://edge.api.flagsmith.com/api/v1/",
      defaultFlagHandler: () => new DefaultFlag(undefined, false),
    });
  }
  return cachedClient;
}

export async function evaluateMandapFlags(
  identityId = "host-war-room",
  traits: Record<string, string | number | boolean> = { role: "host" },
  localOverrides?: Partial<MandapFlags>
): Promise<MandapFlags> {
  const base: MandapFlags = { ...DEFAULT_FLAGS, ...localOverrides };
  const client = getClient();
  if (!client) return base;

  try {
    const flags = await client.getIdentityFlags(identityId, traits);
    const openBuffetEarly = flags.isFeatureEnabled("open_buffet_early");
    const indoorFallback = flags.isFeatureEnabled("indoor_hall_fallback");
    const photoCapRaw = flags.getFeatureValue("stage_photo_cap_mins");
    const modeRaw = flags.getFeatureValue("dispatch_degradation_mode");

    return {
      open_buffet_early:
        localOverrides?.open_buffet_early !== undefined
          ? localOverrides.open_buffet_early
          : Boolean(openBuffetEarly),
      indoor_hall_fallback:
        localOverrides?.indoor_hall_fallback !== undefined
          ? localOverrides.indoor_hall_fallback
          : Boolean(indoorFallback),
      stage_photo_cap_mins:
        localOverrides?.stage_photo_cap_mins !== undefined
          ? localOverrides.stage_photo_cap_mins
          : Number(photoCapRaw) || 45,
      dispatch_degradation_mode:
        localOverrides?.dispatch_degradation_mode !== undefined
          ? localOverrides.dispatch_degradation_mode
          : modeRaw === "vip_audio_plus_guest_text"
          ? "vip_audio_plus_guest_text"
          : "full_tts",
      source: "flagsmith-live",
    };
  } catch {
    return base;
  }
}

export async function evaluateGuestExperiment(
  guestId: string,
  role: "guest" | "vip_family" = "guest"
): Promise<{
  variant: "transparent_eta" | "chaat_diversion";
  source: "flagsmith-live" | "deterministic-fallback";
}> {
  const client = getClient();
  if (client) {
    try {
      const flags = await client.getIdentityFlags(guestId, { role });
      const val = String(flags.getFeatureValue("guest_delay_messaging_experiment") || "");
      if (val === "chaat_diversion" || val === "transparent_eta") {
        return { variant: val, source: "flagsmith-live" };
      }
    } catch {
      // fall through
    }
  }
  let hash = 0;
  for (let i = 0; i < guestId.length; i++) {
    hash = (hash * 31 + guestId.charCodeAt(i)) >>> 0;
  }
  return {
    variant: hash % 2 === 0 ? "chaat_diversion" : "transparent_eta",
    source: "deterministic-fallback",
  };
}

export async function patchFlagsmithFeatureState(
  featureName: string,
  enabled: boolean,
  value?: string | number | boolean
): Promise<{ ok: boolean; detail: string }> {
  const apiKey = process.env.FLAGSMITH_API_KEY;
  const envId = process.env.FLAGSMITH_ENVIRONMENT_ID;
  if (!apiKey || !envId) {
    return { ok: false, detail: "FLAGSMITH_API_KEY or FLAGSMITH_ENVIRONMENT_ID not set; local override applied" };
  }

  try {
    const listRes = await fetch(
      `https://api.flagsmith.com/api/v1/environments/${envId}/featurestates/`,
      {
        headers: { Authorization: `Api-Key ${apiKey}` },
      }
    );
    if (!listRes.ok) throw new Error(`List states HTTP ${listRes.status}`);
    const statesData = await listRes.json();
    const results = Array.isArray(statesData) ? statesData : statesData.results || [];
    const target = results.find(
      (item: { feature?: { name?: string }; id?: number }) => item?.feature?.name === featureName
    );
    if (!target?.id) throw new Error(`Feature ${featureName} not found in environment`);

    const body: Record<string, unknown> = { enabled };
    if (value !== undefined) body.feature_state_value = String(value);

    const patchRes = await fetch(
      `https://api.flagsmith.com/api/v1/environments/${envId}/featurestates/${target.id}/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    if (!patchRes.ok) throw new Error(`Patch HTTP ${patchRes.status}`);
    return { ok: true, detail: `Updated ${featureName} in Flagsmith` };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "Flagsmith Management API error",
    };
  }
}
