"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Flame,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Utensils,
  Volume2,
  Zap,
} from "lucide-react";
import { fmtTimeIST, SolverOutput, WeddingNode } from "@/lib/dag-solver";
import { MandapFlags } from "@/lib/flagsmith";
import { ConflictItem, DispatchMessage, MandapStore } from "@/lib/store";

interface Props {
  solver: SolverOutput;
  flags: MandapFlags;
  conflicts: ConflictItem[];
  dispatches: DispatchMessage[];
  workerHealth: MandapStore["workerHealth"];
  busy: boolean;
  onChaos: (scenario: "baraat_75_conflict" | "curfew_945_warning" | "guest_400_storm") => void;
  onResolveConflict: (id: string, decision: "approve" | "dismiss") => void;
  onToggleFlag: (key: string, value: boolean | number | string, healedByNudgeBee?: boolean) => void;
}

const TIMELINE_START_MIN = 15 * 60; // 3:00 PM
const TIMELINE_END_MIN = 23 * 60; // 11:00 PM
const TIMELINE_SPAN = TIMELINE_END_MIN - TIMELINE_START_MIN;

function pctOnTimeline(mins: number): number {
  const clamped = Math.max(TIMELINE_START_MIN, Math.min(TIMELINE_END_MIN, mins));
  return ((clamped - TIMELINE_START_MIN) / TIMELINE_SPAN) * 100;
}

function getStatusStyles(status: WeddingNode["status"]) {
  switch (status) {
    case "COMPRESSED":
      return {
        pill: "bg-sky-400/10 text-sky-300 border-sky-400/25",
        bar: "bg-sky-400",
      };
    case "DELAYED":
      return {
        pill: "bg-amber-400/10 text-amber-300 border-amber-400/25",
        bar: "bg-amber-400",
      };
    case "CURFEW_FAILOVER":
      return {
        pill: "bg-fuchsia-400/10 text-fuchsia-300 border-fuchsia-400/25",
        bar: "bg-fuchsia-400",
      };
    case "DEADLOCKED":
      return {
        pill: "bg-rose-500/15 text-rose-300 border-rose-500/35",
        bar: "bg-rose-500",
      };
    default:
      return {
        pill: "bg-teal-400/10 text-teal-300 border-teal-400/25",
        bar: "bg-teal-400",
      };
  }
}

export default function HostCommandCenter({
  solver,
  flags,
  conflicts,
  dispatches,
  workerHealth,
  busy,
  onChaos,
  onResolveConflict,
  onToggleFlag,
}: Props) {
  const pendingConflicts = conflicts.filter((c) => c.status === "PENDING");

  const slaBadge =
    solver.slaStatus === "CURFEW_BREACH"
      ? {
          pill: "bg-rose-500/15 text-rose-300 border-rose-500/35",
          dot: "bg-rose-400",
        }
      : solver.slaStatus === "AT_RISK"
      ? {
          pill: "bg-amber-400/15 text-amber-300 border-amber-400/35",
          dot: "bg-amber-400",
        }
      : {
          pill: "bg-teal-400/15 text-teal-300 border-teal-400/35",
          dot: "bg-teal-400",
        };

  const muhuratLeftPct = pctOnTimeline(19 * 60 + 30);
  const curfewLeftPct = pctOnTimeline(22 * 60);
  const buffetPct = Math.min(100, Math.max(5, Math.round((solver.buffetRemainingMin / 115) * 100)));

  return (
    <div className="space-y-6">
      {/* Unified 4-Cell Architectural Bento KPI Matrix */}
      <div className="bento-surface rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
        <div className="p-5 bento-cell-hover">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
            <span>01 // SLA STATE</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-4">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold tracking-tight ${slaBadge.pill}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${slaBadge.dot}`} />
              {solver.slaStatus}
            </span>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            {solver.curfewOverflowMin > 0
              ? `10 PM curfew overflow: +${solver.curfewOverflowMin}m`
              : "Muhurat & BLR sound window nominal"}
          </p>
        </div>

        <div className="p-5 bento-cell-hover">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
            <span>02 // BLAST RADIUS</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F4F3EF] tabular-nums">
            ₹{solver.estimatedOvertimeINR.toLocaleString("en-IN")}
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-zinc-400">
            <span>Burn rate</span>
            <span className="font-mono text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
              ₹{solver.burnRateINRPerMin}/min
            </span>
          </div>
        </div>

        <div className="p-5 bento-cell-hover">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
            <span>03 // BUFFET SLA</span>
            <Utensils className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-[-0.03em] text-[#F4F3EF] tabular-nums">
              {solver.buffetRemainingMin}m
            </span>
            <span className="text-xs text-zinc-400">hold left</span>
          </div>
          <div className="mt-3 h-1 w-full rounded-full bg-white/[0.07] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                solver.buffetAtRisk ? "bg-rose-400" : "bg-teal-400"
              }`}
              style={{ width: `${buffetPct}%` }}
            />
          </div>
        </div>

        <div className="p-5 bento-cell-hover">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
            <span>04 // LOCK CONFLICTS</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                solver.deadlocks.length > 0 ? "text-rose-400" : "text-zinc-500"
              }`}
            />
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[#F4F3EF] tabular-nums">
            {solver.deadlocks.length}
          </div>
          <p className="mt-2.5 text-xs text-zinc-400 line-clamp-1">
            {solver.deadlocks[0]?.detail || "Zero resource lock collisions"}
          </p>
        </div>
      </div>

      {/* Solver Recommendations & Deadlock Alerts */}
      {(solver.recommendedActions.length > 0 || solver.deadlocks.length > 0) && (
        <div className="bento-surface rounded-2xl p-4 border-amber-400/25 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kalyani Solver Recommendations</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {solver.deadlocks.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/35 bg-rose-500/10 px-3 py-1 text-xs text-rose-200"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                {d.detail}
              </span>
            ))}
            {solver.recommendedActions.map((act) => (
              <span
                key={act}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {act}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chaos Injection & Remediation Bento Deck */}
      <div className="bento-surface rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-semibold tracking-tight text-[#F4F3EF]">
              Chaos & Self-Healing Simulation Deck
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            WORKER // <strong className="text-zinc-200">{workerHealth.status}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
          <button
            disabled={busy}
            onClick={() => onChaos("baraat_75_conflict")}
            className="group p-5 text-left bento-cell-hover active:scale-[0.99] disabled:opacity-45"
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              <span>SCENARIO 01</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-teal-300 transition" />
            </div>
            <div className="mt-2.5 text-sm font-semibold text-[#F4F3EF] group-hover:text-teal-300 transition">
              Baraat 75m Late
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Hebbal jam vs cousin report via Sarvam Prism
            </p>
          </button>

          <button
            disabled={busy}
            onClick={() => onChaos("curfew_945_warning")}
            className="group p-5 text-left bento-cell-hover active:scale-[0.99] disabled:opacity-45"
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
              <span>SCENARIO 02</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-teal-300 transition" />
            </div>
            <div className="mt-2.5 text-sm font-semibold text-[#F4F3EF] group-hover:text-teal-300 transition">
              10 PM BLR Warning
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Triggers curfew check + Hindi Bulbul dispatch
            </p>
          </button>

          <button
            disabled={busy}
            onClick={() => onChaos("guest_400_storm")}
            className="group p-5 text-left bento-cell-hover active:scale-[0.99] disabled:opacity-45"
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-rose-400/80">
              <span>SCENARIO 03</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400/70 group-hover:text-rose-300 transition" />
            </div>
            <div className="mt-2.5 text-sm font-semibold text-rose-200">
              400-Guest Storm
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Simulates 128Mi TTS worker OOM spike
            </p>
          </button>

          <button
            disabled={busy}
            onClick={() =>
              onToggleFlag("dispatch_degradation_mode", "vip_audio_plus_guest_text", true)
            }
            className="group p-5 text-left bg-teal-400/[0.04] hover:bg-teal-400/[0.09] transition active:scale-[0.99] disabled:opacity-45"
          >
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-teal-400">
              <span>REMEDIATION 04</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="mt-2.5 text-sm font-semibold text-teal-200">
              Approve NudgeBee Runbook
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Flips Flagsmith to VIP-audio + guest text
            </p>
          </button>
        </div>

        {workerHealth.lastIncident && (
          <div className="px-5 py-3.5 border-t border-white/[0.08] bg-white/[0.02] text-xs space-y-1">
            <div className="text-zinc-300">
              <span className="font-mono text-amber-300 uppercase text-[10px] mr-2">INCIDENT</span>
              {workerHealth.lastIncident}
            </div>
            {workerHealth.lastRunbookAction && (
              <div className="text-teal-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{workerHealth.lastRunbookAction}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Split: Gantt Timeline + Control Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DAG Gantt Timeline */}
        <div className="lg:col-span-2 bento-surface rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-semibold tracking-tight text-[#F4F3EF]">
                Constrained Wedding DAG Timeline
              </h3>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Lock className="w-3 h-3" /> 19:30 MUHURAT
              </span>
              <span className="inline-flex items-center gap-1 text-rose-300">
                <Activity className="w-3 h-3" /> 22:00 CURFEW
              </span>
            </div>
          </div>

          <div className="relative h-6 mb-3 border-b border-white/[0.08] text-[10px] font-mono text-zinc-500 select-none">
            <span className="absolute left-0">15:00</span>
            <span className="absolute left-1/4 -translate-x-1/2">17:00</span>
            <span className="absolute left-1/2 -translate-x-1/2">19:00</span>
            <span
              className="absolute text-amber-300 font-semibold -translate-x-1/2"
              style={{ left: `${muhuratLeftPct}%` }}
            >
              19:30
            </span>
            <span
              className="absolute text-rose-400 font-semibold -translate-x-1/2"
              style={{ left: `${curfewLeftPct}%` }}
            >
              22:00
            </span>
            <span className="absolute right-0">23:00</span>
          </div>

          <div className="relative space-y-2.5">
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-amber-400/25 z-0"
              style={{ left: `${muhuratLeftPct}%` }}
            />
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px border-l border-dashed border-rose-500/40 z-0"
              style={{ left: `${curfewLeftPct}%` }}
            />

            {solver.nodes.map((node) => {
              const left = pctOnTimeline(node.computedStartMin);
              const right = pctOnTimeline(node.computedStartMin + node.computedDurationMin);
              const width = Math.max(4, right - left);
              const styles = getStatusStyles(node.status);

              return (
                <div
                  key={node.id}
                  className="relative z-10 rounded-xl border border-white/[0.07] bg-[#09090B]/70 p-3.5 hover:border-white/[0.15] transition-all duration-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      {node.kind === "IMMUTABLE_ANCHOR" && (
                        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-[#F4F3EF]">{node.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.07]">
                        {node.resource}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-300">
                        {fmtTimeIST(node.computedStartMin)} –{" "}
                        {fmtTimeIST(node.computedStartMin + node.computedDurationMin)}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${styles.pill}`}
                      >
                        {node.status}
                      </span>
                    </div>
                  </div>

                  <div className="relative h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ease-out ${styles.bar}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{node.note || `${node.computedDurationMin}m scheduled window`}</span>
                    <span className="font-mono text-zinc-500">
                      {node.computedDurationMin}m / min {node.minDurationMin}m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Control Column */}
        <div className="space-y-6">
          {/* Flagsmith Policy Switches */}
          <div className="bento-surface rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-semibold tracking-tight text-[#F4F3EF]">
                  Flagsmith Policies
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] text-zinc-300">
                {flags.source}
              </span>
            </div>

            <div className="divide-y divide-white/[0.07] text-xs">
              <div className="py-3 first:pt-0 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-zinc-200">open_buffet_early</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Extends buffet freshness SLA
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={flags.open_buffet_early}
                  disabled={busy}
                  onClick={() => onToggleFlag("open_buffet_early", !flags.open_buffet_early)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ${
                    flags.open_buffet_early ? "bg-teal-400" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition duration-200 ${
                      flags.open_buffet_early
                        ? "translate-x-5 bg-[#09090B]"
                        : "translate-x-0.5 bg-zinc-300"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-zinc-200">indoor_hall_fallback</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Routes Sangeet indoors at 10 PM
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={flags.indoor_hall_fallback}
                  disabled={busy}
                  onClick={() => onToggleFlag("indoor_hall_fallback", !flags.indoor_hall_fallback)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors duration-200 ${
                    flags.indoor_hall_fallback ? "bg-teal-400" : "bg-zinc-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow transition duration-200 ${
                      flags.indoor_hall_fallback
                        ? "translate-x-5 bg-[#09090B]"
                        : "translate-x-0.5 bg-zinc-300"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-mono text-zinc-200">stage_photo_cap_mins</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Compresses portrait window
                  </div>
                </div>
                <select
                  value={flags.stage_photo_cap_mins}
                  disabled={busy}
                  onChange={(e) => onToggleFlag("stage_photo_cap_mins", Number(e.target.value))}
                  className="rounded-lg bg-zinc-900 border border-white/[0.1] px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-teal-400"
                >
                  <option value={45}>45m</option>
                  <option value={25}>25m</option>
                  <option value={15}>15m</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <span className="text-zinc-400">Dispatch Mode</span>
                <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-teal-300">
                  {flags.dispatch_degradation_mode}
                </span>
              </div>
            </div>
          </div>

          {/* Sarvam Prism Conflict Queue */}
          <div className="bento-surface rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold tracking-tight text-[#F4F3EF]">
                Prism Conflict Queue
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                {pendingConflicts.length} PENDING
              </span>
            </div>

            {conflicts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.1] p-5 text-center text-xs text-zinc-500">
                No conflicting vendor updates queued.
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border border-white/[0.08] bg-[#09090B]/80 p-3.5 text-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#F4F3EF]">{c.vendorRole}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-amber-300 border border-white/[0.08]">
                        {c.incidentType} • {Math.round(c.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{c.transcript}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] text-zinc-400">
                        <span>Conflict prob: {Math.round(c.conflictProbability * 100)}%</span>
                        <span className="font-mono text-teal-300">
                          +{c.suggestedDelayMin}m → {c.affectedNodeId}
                        </span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.round(c.conflictProbability * 100)}%` }}
                        />
                      </div>
                    </div>
                    {c.status === "PENDING" ? (
                      <div className="pt-1 flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() => onResolveConflict(c.id, "approve")}
                          className="flex-1 px-3 py-1.5 rounded-full bg-[#F4F3EF] hover:bg-white text-[#09090B] font-semibold transition"
                        >
                          Approve +{c.suggestedDelayMin}m
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => onResolveConflict(c.id, "dismiss")}
                          className="px-3.5 py-1.5 rounded-full border border-white/[0.1] hover:bg-white/[0.06] text-zinc-300 transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-zinc-500">
                        STATUS // {c.status}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multilingual Bulbul Dispatches */}
      <div className="bento-surface rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold tracking-tight text-[#F4F3EF]">
              Sarvam Bulbul Multilingual Dispatches
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">{dispatches.length} LOGGED</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
          {dispatches.map((d) => (
            <div key={d.id} className="p-4 text-xs space-y-2.5 bento-cell-hover">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[#F4F3EF]">{d.recipient}</span>
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${
                    d.modeUsed === "tts_audio"
                      ? "bg-teal-400/10 text-teal-300 border-teal-400/25"
                      : "bg-white/[0.04] text-zinc-400 border-white/[0.08]"
                  }`}
                >
                  {d.modeUsed}
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed">{d.text}</p>
              {d.audioBase64 && (
                <audio
                  controls
                  src={`data:audio/wav;base64,${d.audioBase64}`}
                  className="mt-1 w-full h-8"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
