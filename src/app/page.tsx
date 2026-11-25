"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Radio, RotateCcw, Server, SlidersHorizontal } from "lucide-react";
import HostCommandCenter from "@/components/HostCommandCenter";
import VendorVoiceConsole from "@/components/VendorVoiceConsole";
import GuestStatusPortal from "@/components/GuestStatusPortal";
import HomeOverview from "@/components/HomeOverview";
import { SolverOutput } from "@/lib/dag-solver";
import { MandapFlags } from "@/lib/flagsmith";
import { ConflictItem, DispatchMessage, MandapStore } from "@/lib/store";

interface StatePayload {
  solver: SolverOutput;
  flags: MandapFlags;
  conflicts: ConflictItem[];
  dispatches: DispatchMessage[];
  workerHealth: MandapStore["workerHealth"];
}

export default function KalyaniPage() {
  const [tab, setTab] = useState<"home" | "host" | "vendor" | "guest">("home");
  const [data, setData] = useState<StatePayload | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshState = useCallback(async () => {
    const res = await fetch("/api/state", { cache: "no-store" });
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  async function handleChaos(
    scenario: "baraat_75_conflict" | "curfew_945_warning" | "guest_400_storm"
  ) {
    setBusy(true);
    try {
      await fetch("/api/chaos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      await refreshState();
    } finally {
      setBusy(false);
    }
  }

  async function handleResolveConflict(id: string, decision: "approve" | "dismiss") {
    setBusy(true);
    try {
      await fetch("/api/conflicts/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      await refreshState();
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleFlag(
    key: string,
    value: boolean | number | string,
    healedByNudgeBee = false
  ) {
    setBusy(true);
    try {
      await fetch("/api/flags/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, healedByNudgeBee }),
      });
      await refreshState();
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    try {
      await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      await refreshState();
    } finally {
      setBusy(false);
    }
  }

  const workerStatus = data?.workerHealth.status || "HEALTHY";

  return (
    <main className="min-h-screen bg-[#09090B] text-[#F4F3EF] relative overflow-x-hidden">
      {/* Top Precision Nav Bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#09090B]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Kalyani Text-Only Brand Logo */}
          <button
            onClick={() => setTab("home")}
            className="text-xl font-semibold tracking-[-0.04em] text-[#F4F3EF] hover:opacity-85 transition"
          >
            Kalyani
          </button>

          {/* Segmented Switcher */}
          <nav className="inline-flex items-center rounded-full border border-white/[0.09] bg-white/[0.03] p-1">
            {(
              [
                ["home", "Home"],
                ["host", "War Room"],
                ["vendor", "Vendor Voice"],
                ["guest", "Guest A/B"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-200 ${
                  tab === key
                    ? "bg-[#F4F3EF] text-[#09090B] shadow-sm"
                    : "text-zinc-400 hover:text-[#F4F3EF]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-[11px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              IST LIVE
            </span>
            <button
              disabled={busy}
              onClick={handleReset}
              title="Reset Demo State"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Architectural Hero Header Band */}
      <section className="relative border-b border-white/[0.08] aptos-dot-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-teal-500/[0.04] via-transparent to-[#09090B]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-zinc-400">
              <span className="text-teal-300">[ BLR VENUE OPS ]</span>
              <span>•</span>
              <span>MUHURAT ANCHOR 19:30</span>
              <span>•</span>
              <span>CURFEW 22:00</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#F4F3EF]">
              Zero-slippage wedding orchestration.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
              Constrained DAG scheduling, multilingual Sarvam voice triage, Flagsmith remote policy flags, and NudgeBee self-healing in one architectural control plane.
            </p>
          </div>

          {/* Live Sponsor Integration Telemetry */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-[#0E0E12]/90 px-3.5 py-1.5 text-xs">
              <Radio className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-zinc-200 font-medium">Sarvam AI</span>
              <span className="text-[10px] font-mono text-zinc-500">Saaras • Prism • 105B • Bulbul</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-[#0E0E12]/90 px-3.5 py-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-zinc-200 font-medium">Flagsmith</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {data?.flags.source || "connecting"}
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-[#0E0E12]/90 px-3.5 py-1.5 text-xs">
              <Server
                className={`w-3.5 h-3.5 ${
                  workerStatus === "DEGRADED_OOM_SIMULATED"
                    ? "text-rose-400"
                    : "text-teal-400"
                }`}
              />
              <span className="text-zinc-200 font-medium">NudgeBee</span>
              <span
                className={`text-[10px] font-mono ${
                  workerStatus === "DEGRADED_OOM_SIMULATED"
                    ? "text-rose-300"
                    : workerStatus === "HEALED_BY_NUDGEE"
                    ? "text-teal-300"
                    : "text-zinc-400"
                }`}
              >
                {workerStatus}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {!data ? (
          <div className="bento-surface rounded-2xl p-10 text-center text-sm font-mono text-zinc-400 animate-pulse">
            INITIALIZING KALYANI CONTROL PLANE...
          </div>
        ) : tab === "home" ? (
          <HomeOverview
            onNavigate={setTab}
            flagSource={data.flags.source}
            workerStatus={data.workerHealth.status}
          />
        ) : tab === "host" ? (
          <HostCommandCenter
            solver={data.solver}
            flags={data.flags}
            conflicts={data.conflicts}
            dispatches={data.dispatches}
            workerHealth={data.workerHealth}
            busy={busy}
            onChaos={handleChaos}
            onResolveConflict={handleResolveConflict}
            onToggleFlag={handleToggleFlag}
          />
        ) : tab === "vendor" ? (
          <VendorVoiceConsole onSubmitted={refreshState} />
        ) : (
          <GuestStatusPortal solver={data.solver} flags={data.flags} />
        )}
      </div>
    </main>
  );
}
