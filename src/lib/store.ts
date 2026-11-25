import { createInitialNodes, WeddingNode } from "./dag-solver";
import { MandapFlags } from "./flagsmith";

export interface ConflictItem {
  id: string;
  vendorRole: string;
  transcript: string;
  languageCode: string;
  incidentType: string;
  confidence: number;
  conflictProbability: number;
  suggestedDelayMin: number;
  affectedNodeId: string;
  status: "PENDING" | "APPROVED" | "DISMISSED";
  createdAt: string;
}

export interface DispatchMessage {
  id: string;
  recipient: string;
  languageCode: string;
  modeUsed: "tts_audio" | "text_fallback";
  text: string;
  audioBase64?: string | null;
  createdAt: string;
}

export interface ExperimentStat {
  variant: "transparent_eta" | "chaat_diversion";
  impressions: number;
  conversions: number;
}

export interface MandapStore {
  baseNodes: WeddingNode[];
  delaysByNode: Record<string, number>;
  curfewWarningActive: boolean;
  localFlagOverrides: Partial<MandapFlags>;
  conflicts: ConflictItem[];
  dispatches: DispatchMessage[];
  workerHealth: {
    status: "HEALTHY" | "DEGRADED_OOM_SIMULATED" | "HEALED_BY_NUDGEE";
    lastIncident?: string;
    lastRunbookAction?: string;
    updatedAt: string;
  };
  experimentStats: Record<"transparent_eta" | "chaat_diversion", ExperimentStat>;
}

const g = globalThis as typeof globalThis & { __mandapStore?: MandapStore };

function makeInitialStore(): MandapStore {
  return {
    baseNodes: createInitialNodes(),
    delaysByNode: {},
    curfewWarningActive: false,
    localFlagOverrides: {},
    conflicts: [],
    dispatches: [
      {
        id: "seed-1",
        recipient: "Caterer (Hindi)",
        languageCode: "hi-IN",
        modeUsed: "text_fallback",
        text: "स्वागत है! शाम 7:30 बजे मुहूर्त और 8:30 बजे डिनर बफ़े तैयार रखें।",
        createdAt: new Date().toISOString(),
      },
    ],
    workerHealth: {
      status: "HEALTHY",
      updatedAt: new Date().toISOString(),
    },
    experimentStats: {
      transparent_eta: { variant: "transparent_eta", impressions: 12, conversions: 7 },
      chaat_diversion: { variant: "chaat_diversion", impressions: 12, conversions: 10 },
    },
  };
}

export function getStore(): MandapStore {
  if (!g.__mandapStore) {
    g.__mandapStore = makeInitialStore();
  }
  return g.__mandapStore;
}

export function resetStore(): MandapStore {
  g.__mandapStore = makeInitialStore();
  return g.__mandapStore;
}
