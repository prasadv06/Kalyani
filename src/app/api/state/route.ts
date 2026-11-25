import { NextResponse } from "next/server";
import { solveWeddingDAG } from "@/lib/dag-solver";
import { evaluateMandapFlags } from "@/lib/flagsmith";
import { getStore, resetStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  const flags = await evaluateMandapFlags("host-war-room", { role: "host" }, store.localFlagOverrides);
  const solver = solveWeddingDAG(
    store.baseNodes,
    store.delaysByNode,
    flags,
    store.curfewWarningActive
  );

  let liveWorkerStatus = store.workerHealth.status;
  try {
    const workerUrl = process.env.WORKER_URL || "http://localhost:4000";
    const h = await fetch(`${workerUrl}/healthz`, { signal: AbortSignal.timeout(1200) });
    if (!h.ok && liveWorkerStatus === "HEALTHY") {
      liveWorkerStatus = "DEGRADED_OOM_SIMULATED";
    }
  } catch {
    if (liveWorkerStatus === "HEALTHY") {
      liveWorkerStatus = "HEALTHY";
    }
  }

  return NextResponse.json({
    solver,
    flags,
    conflicts: store.conflicts,
    dispatches: store.dispatches.slice(0, 20),
    workerHealth: { ...store.workerHealth, status: liveWorkerStatus },
    experimentStats: store.experimentStats,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.action === "reset") {
    resetStore();
  }
  return GET();
}
