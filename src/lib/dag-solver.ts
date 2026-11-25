export type ResourceLock = "Main_Lawn" | "Indoor_Banquet" | "Sound_Rig" | "Couple";
export type NodeKind = "IMMUTABLE_ANCHOR" | "FLEX_BUFFER" | "CEREMONY" | "FAILOVER";

export interface WeddingNode {
  id: string;
  title: string;
  kind: NodeKind;
  resource: ResourceLock;
  baseStartMin: number; // minutes from 00:00 IST (e.g. 19:30 = 1170)
  baseDurationMin: number;
  minDurationMin: number;
  maxOutdoorAmplifiedMin?: number; // e.g. 1320 = 22:00 IST Bengaluru sound cutoff
  computedStartMin: number;
  computedDurationMin: number;
  status: "ON_TRACK" | "COMPRESSED" | "DELAYED" | "CURFEW_FAILOVER" | "DEADLOCKED";
  note?: string;
}

export interface DeadlockAlert {
  id: string;
  resource: ResourceLock;
  blockingNode: string;
  blockedNode: string;
  detail: string;
}

export interface SolverOutput {
  nodes: WeddingNode[];
  deadlocks: DeadlockAlert[];
  slaStatus: "ON_TRACK" | "AT_RISK" | "CURFEW_BREACH";
  muhuratBreached: boolean;
  curfewBreached: boolean;
  curfewOverflowMin: number;
  estimatedOvertimeINR: number;
  burnRateINRPerMin: number;
  buffetRemainingMin: number;
  buffetAtRisk: boolean;
  recommendedActions: string[];
}

export function fmtTimeIST(minsFromMidnight: number): string {
  const wrapped = ((minsFromMidnight % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function createInitialNodes(): WeddingNode[] {
  return [
    {
      id: "haldi",
      title: "Haldi & Courtyard Festivities",
      kind: "FLEX_BUFFER",
      resource: "Main_Lawn",
      baseStartMin: 15 * 60, // 3:00 PM
      baseDurationMin: 90,
      minDurationMin: 45,
      computedStartMin: 15 * 60,
      computedDurationMin: 90,
      status: "ON_TRACK",
    },
    {
      id: "lawn_flip",
      title: "Decorator Lawn & Mandap Flip",
      kind: "CEREMONY",
      resource: "Main_Lawn",
      baseStartMin: 16 * 60 + 30, // 4:30 PM
      baseDurationMin: 90,
      minDurationMin: 45,
      computedStartMin: 16 * 60 + 30,
      computedDurationMin: 90,
      status: "ON_TRACK",
    },
    {
      id: "baraat",
      title: "Baraat Procession & Entry",
      kind: "FLEX_BUFFER",
      resource: "Couple",
      baseStartMin: 18 * 60, // 6:00 PM
      baseDurationMin: 60,
      minDurationMin: 20,
      computedStartMin: 18 * 60,
      computedDurationMin: 60,
      status: "ON_TRACK",
    },
    {
      id: "varmala",
      title: "Varmala & Welcome Ritual",
      kind: "CEREMONY",
      resource: "Couple",
      baseStartMin: 19 * 60, // 7:00 PM
      baseDurationMin: 30,
      minDurationMin: 15,
      computedStartMin: 19 * 60,
      computedDurationMin: 30,
      status: "ON_TRACK",
    },
    {
      id: "muhurat",
      title: "Muhurat Sacred Rituals [LOCKED]",
      kind: "IMMUTABLE_ANCHOR",
      resource: "Couple",
      baseStartMin: 19 * 60 + 30, // 7:30 PM
      baseDurationMin: 60,
      minDurationMin: 60,
      computedStartMin: 19 * 60 + 30,
      computedDurationMin: 60,
      status: "ON_TRACK",
      note: "Immutable astrological window",
    },
    {
      id: "stage_photos",
      title: "Couple & Family Stage Portraits",
      kind: "FLEX_BUFFER",
      resource: "Indoor_Banquet",
      baseStartMin: 20 * 60 + 30, // 8:30 PM
      baseDurationMin: 45,
      minDurationMin: 15,
      computedStartMin: 20 * 60 + 30,
      computedDurationMin: 45,
      status: "ON_TRACK",
    },
    {
      id: "sangeet",
      title: "Sangeet & DJ Floor",
      kind: "CEREMONY",
      resource: "Sound_Rig",
      baseStartMin: 21 * 60 + 15, // 9:15 PM
      baseDurationMin: 75,
      minDurationMin: 30,
      maxOutdoorAmplifiedMin: 22 * 60, // 10:00 PM BLR outdoor sound cutoff
      computedStartMin: 21 * 60 + 15,
      computedDurationMin: 75,
      status: "ON_TRACK",
      note: "BLR outdoor sound cutoff at 10:00 PM",
    },
  ];
}

export function solveWeddingDAG(
  baseNodes: WeddingNode[],
  delaysByNode: Record<string, number>,
  flags: {
    open_buffet_early: boolean;
    indoor_hall_fallback: boolean;
    stage_photo_cap_mins: number;
  },
  curfewWarningActive: boolean,
  elapsedChaosMins = 18
): SolverOutput {
  const MUHURAT_MIN = 19 * 60 + 30;
  const SOUND_CUTOFF_MIN = 22 * 60;
  const nodes = baseNodes.map((n) => ({ ...n }));
  const deadlocks: DeadlockAlert[] = [];
  const recommendedActions: string[] = [];

  // Apply flex caps from Flagsmith remote config
  const photoNode = nodes.find((n) => n.id === "stage_photos");
  if (photoNode) {
    const cap = Math.max(photoNode.minDurationMin, flags.stage_photo_cap_mins || 45);
    if (cap < photoNode.baseDurationMin) {
      photoNode.computedDurationMin = cap;
      photoNode.status = "COMPRESSED";
      photoNode.note = `Capped to ${cap}m via Flagsmith`;
    }
  }

  // Propagate delays & detect same-resource deadlocks
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const injected = delaysByNode[node.id] || 0;
    if (injected > 0) {
      if (node.kind === "FLEX_BUFFER") {
        const saved = Math.min(injected, node.baseDurationMin - node.minDurationMin);
        node.computedDurationMin = Math.max(node.minDurationMin, node.baseDurationMin - saved);
        const netSlip = injected - saved;
        node.computedStartMin = node.baseStartMin + netSlip;
        if (saved > 0) {
          node.status = "COMPRESSED";
          node.note = `Absorbed ${saved}m buffer; ${netSlip}m net slip`;
        }
      } else if (node.kind !== "IMMUTABLE_ANCHOR") {
        node.computedStartMin = node.baseStartMin + injected;
        node.status = "DELAYED";
        node.note = `+${injected}m delay reported`;
      }
    }

    // Check previous node sharing same physical resource
    if (i > 0) {
      const prev = nodes[i - 1];
      const prevEnd = prev.computedStartMin + prev.computedDurationMin;
      if (prev.resource === node.resource && prevEnd > node.computedStartMin) {
        const overlap = prevEnd - node.computedStartMin;
        deadlocks.push({
          id: `${prev.id}->${node.id}`,
          resource: node.resource,
          blockingNode: prev.title,
          blockedNode: node.title,
          detail: `${prev.title} overruns ${node.title} on ${node.resource} by ${overlap}m`,
        });
        if (node.kind !== "IMMUTABLE_ANCHOR") {
          node.computedStartMin = prevEnd;
          node.status = "DEADLOCKED";
        }
      }
    }

    // Enforce immutable Muhurat anchor
    if (node.id === "muhurat" && node.computedStartMin < MUHURAT_MIN) {
      node.computedStartMin = MUHURAT_MIN;
    }

    // Check 10:00 PM Bengaluru sound rule on Sangeet
    if (node.id === "sangeet") {
      const endMin = node.computedStartMin + node.computedDurationMin;
      if (curfewWarningActive || endMin > SOUND_CUTOFF_MIN) {
        if (flags.indoor_hall_fallback) {
          node.status = "CURFEW_FAILOVER";
          node.note = "Routed to Indoor_Banquet / Acoustic mode before 10:00 PM";
          recommendedActions.push("Indoor sound failover active");
        } else {
          node.status = "CURFEW_FAILOVER";
          node.note = `Breaches 10:00 PM BLR outdoor cutoff (ends ${fmtTimeIST(endMin)})`;
          recommendedActions.push("Enable indoor_hall_fallback in Flagsmith");
        }
      }
    }
  }

  const sangeetNode = nodes.find((n) => n.id === "sangeet")!;
  const sangeetEnd = sangeetNode.computedStartMin + sangeetNode.computedDurationMin;
  const curfewOverflowMin = Math.max(0, sangeetEnd - SOUND_CUTOFF_MIN);
  const muhuratBreached = Object.values(delaysByNode).some((d) => d >= 90);
  const curfewBreached = curfewOverflowMin > 0 && !flags.indoor_hall_fallback;

  const totalDelay = Object.values(delaysByNode).reduce((a, b) => a + b, 0);
  const rawBurnPerMin = totalDelay > 0 ? 1100 + Math.round(totalDelay * 18) : 0;
  const mitigationDiscount =
    (flags.indoor_hall_fallback ? 0.35 : 0) + (flags.open_buffet_early ? 0.2 : 0);
  const burnRateINRPerMin = Math.max(0, Math.round(rawBurnPerMin * (1 - mitigationDiscount)));
  const estimatedOvertimeINR = burnRateINRPerMin * elapsedChaosMins;

  const baseHold = flags.open_buffet_early ? 115 : 90;
  const buffetRemainingMin = Math.max(5, baseHold - Math.round(totalDelay * 0.6));
  const buffetAtRisk = buffetRemainingMin <= 25 && !flags.open_buffet_early;

  if (buffetAtRisk) {
    recommendedActions.push("Flip open_buffet_early to protect chafing-dish quality");
  }
  if ((photoNode?.computedDurationMin ?? 45) > 20 && totalDelay >= 45) {
    recommendedActions.push("Cap stage_photo_cap_mins at 15m");
  }

  let slaStatus: SolverOutput["slaStatus"] = "ON_TRACK";
  if (curfewBreached || muhuratBreached || deadlocks.length >= 2) {
    slaStatus = "CURFEW_BREACH";
  } else if (totalDelay > 0 || deadlocks.length > 0 || curfewWarningActive) {
    slaStatus = "AT_RISK";
  }

  return {
    nodes,
    deadlocks,
    slaStatus,
    muhuratBreached,
    curfewBreached,
    curfewOverflowMin,
    estimatedOvertimeINR,
    burnRateINRPerMin,
    buffetRemainingMin,
    buffetAtRisk,
    recommendedActions: Array.from(new Set(recommendedActions)),
  };
}
