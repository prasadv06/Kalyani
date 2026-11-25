"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Sparkles, Users, Utensils } from "lucide-react";
import { fmtTimeIST, SolverOutput } from "@/lib/dag-solver";
import { MandapFlags } from "@/lib/flagsmith";
import { ExperimentStat } from "@/lib/store";

interface Props {
  solver: SolverOutput;
  flags?: MandapFlags;
}

export default function GuestStatusPortal({ solver, flags }: Props) {
  const [guestId, setGuestId] = useState("guest-101");
  const [role, setRole] = useState<"guest" | "vip_family">("guest");
  const [variant, setVariant] = useState<"transparent_eta" | "chaat_diversion">("chaat_diversion");
  const [source, setSource] = useState<string>("deterministic-fallback");
  const [acknowledged, setAcknowledged] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [stats, setStats] = useState<Record<"transparent_eta" | "chaat_diversion", ExperimentStat>>({
    transparent_eta: { variant: "transparent_eta", impressions: 12, conversions: 7 },
    chaat_diversion: { variant: "chaat_diversion", impressions: 12, conversions: 10 },
  });

  async function loadVariant(id = guestId, r = role) {
    setAcknowledged(false);
    const res = await fetch(
      `/api/guest-experiment?guestId=${encodeURIComponent(id)}&role=${encodeURIComponent(r)}`
    );
    const data = await res.json();
    setVariant(data.variant);
    setSource(data.source);
    if (data.stats) setStats(data.stats);
  }

  useEffect(() => {
    loadVariant("guest-101", "guest");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAck() {
    setAcknowledged(true);
    const res = await fetch("/api/guest-experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variant, converted: true }),
    });
    const data = await res.json();
    if (data.stats) setStats(data.stats);
  }

  async function handleSim20() {
    setSimulating(true);
    try {
      const res = await fetch("/api/guest-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate20" }),
      });
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } finally {
      setSimulating(false);
    }
  }

  const muhuratNode = solver.nodes.find((n) => n.id === "muhurat");
  const etaStr = muhuratNode ? fmtTimeIST(muhuratNode.computedStartMin) : "7:30 PM";

  const rateA = stats.transparent_eta.impressions
    ? Math.round((stats.transparent_eta.conversions / stats.transparent_eta.impressions) * 100)
    : 0;
  const rateB = stats.chaat_diversion.impressions
    ? Math.round((stats.chaat_diversion.conversions / stats.chaat_diversion.impressions) * 100)
    : 0;
  const lift = rateB - rateA;

  return (
    <div className="max-w-5xl mx-auto bento-surface rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
      {/* Left Cell: Guest Experience */}
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-teal-400">
            01 // GUEST EXPERIMENTATION
          </span>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-white/[0.09] bg-white/[0.04] text-zinc-300">
            {source}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {["guest-101", "guest-102", "vip-sharma-ji"].map((id) => (
            <button
              key={id}
              onClick={() => {
                const nextRole = id.startsWith("vip") ? "vip_family" : "guest";
                setGuestId(id);
                setRole(nextRole);
                loadVariant(id, nextRole);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono border transition ${
                guestId === id
                  ? "bg-[#F4F3EF] border-[#F4F3EF] text-[#09090B] font-semibold"
                  : "bg-white/[0.03] border-white/[0.09] text-zinc-400 hover:text-white"
              }`}
            >
              {id}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#09090B]/90 p-5 space-y-4">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">
              VARIANT // <strong className="text-teal-300">{variant}</strong>
            </span>
            <span className="text-zinc-500">{role}</span>
          </div>

          {variant === "chaat_diversion" ? (
            <p className="text-sm text-[#F4F3EF] leading-relaxed">
              <strong className="text-teal-300">
                Hot Chaat & Filter Coffee is live at Courtyard West.
              </strong>{" "}
              Sacred Muhurat is locked for <strong>{etaStr}</strong> — enjoy warm snacks and live
              acoustic music while the procession arrives.
            </p>
          ) : (
            <p className="text-sm text-[#F4F3EF] leading-relaxed">
              <strong>Schedule Update:</strong> Sacred Muhurat target is <strong>{etaStr}</strong>.
              Current SLA state: <strong>{solver.slaStatus}</strong>. Thank you for your patience.
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300">
              <MapPin className="w-3 h-3 text-amber-400" />
              {flags?.indoor_hall_fallback ? "Sangeet: Indoor Banquet" : "Sangeet: Main Lawn"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300">
              <Utensils className="w-3 h-3 text-teal-400" />
              {flags?.open_buffet_early ? "Buffet: Open Early" : "Buffet: Standard"}
            </span>
          </div>

          <button
            onClick={handleAck}
            className={`w-full justify-center inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition active:scale-[0.98] ${
              acknowledged
                ? "bg-teal-400/20 border border-teal-400/40 text-teal-200"
                : "bg-[#F4F3EF] hover:bg-white text-[#09090B]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {acknowledged ? "Response Logged" : "Got It — Heading There"}
          </button>
        </div>
      </div>

      {/* Right Cell: Telemetry */}
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold tracking-tight text-[#F4F3EF]">
              Conversion Telemetry
            </h3>
          </div>
          <button
            disabled={simulating}
            onClick={handleSim20}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.09] px-3.5 py-1.5 text-xs font-medium text-[#F4F3EF] transition active:scale-[0.98] disabled:opacity-50"
          >
            {simulating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Users className="w-3.5 h-3.5" />
            )}
            Simulate 20 Guests
          </button>
        </div>

        <div className="rounded-xl border border-teal-400/20 bg-teal-400/[0.05] px-4 py-3 flex items-center justify-between text-xs">
          <span className="text-zinc-300">Chaat Diversion Lift</span>
          <span className="font-mono font-semibold text-teal-300">
            {lift >= 0 ? `+${lift}%` : `${lift}%`} vs transparent_eta
          </span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-white/[0.08] bg-[#09090B]/80 p-4 space-y-2.5">
            <div className="flex justify-between font-medium text-zinc-300">
              <span className="font-mono">transparent_eta</span>
              <span className="font-mono">
                {stats.transparent_eta.conversions}/{stats.transparent_eta.impressions} ({rateA}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <div
                className="h-full bg-zinc-400 rounded-full transition-all duration-500"
                style={{ width: `${rateA}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-teal-400/25 bg-[#09090B]/80 p-4 space-y-2.5">
            <div className="flex justify-between font-medium text-teal-300">
              <span className="font-mono">chaat_diversion</span>
              <span className="font-mono">
                {stats.chaat_diversion.conversions}/{stats.chaat_diversion.impressions} ({rateB}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${rateB}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
