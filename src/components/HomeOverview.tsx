"use client";

import React from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Cpu,
  Lock,
  Radio,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Utensils,
} from "lucide-react";

interface Props {
  onNavigate: (tab: "host" | "vendor" | "guest") => void;
  flagSource: string;
  workerStatus: string;
}

const FLOW_STEPS = [
  {
    num: "01",
    title: "Multilingual Voice Intake",
    subtitle: "Ground teams speak naturally",
    desc: "Decorators, caterers, and DJs report delays in Kannada, Hindi, Tamil, or code-mixed English. Sarvam Saaras v4 transcribes noisy venue audio with custom wedding keyterms.",
    tag: "Saaras v4 STT",
    target: "vendor" as const,
    cta: "Try Vendor Voice",
  },
  {
    num: "02",
    title: "AI Triage & Conflict Gate",
    subtitle: "Catch contradictory updates early",
    desc: "Sarvam Prism classifies operational risk (Muhurat threat, 10 PM sound curfew, resource deadlock) and pauses conflicting reports in a human approval queue before altering the timeline.",
    tag: "Sarvam Prism",
    target: "host" as const,
    cta: "Open Conflict Queue",
  },
  {
    num: "03",
    title: "Constrained DAG & Policy Flags",
    subtitle: "Compress buffers, protect anchors",
    desc: "Our DAG solver locks the 7:30 PM Muhurat, checks shared lawn/hall/sound locks, calculates ₹/min overtime burn, and reacts instantly to Flagsmith toggles and guest A/B diversion.",
    tag: "DAG + Flagsmith",
    target: "guest" as const,
    cta: "View Guest A/B",
  },
  {
    num: "04",
    title: "Native Audio & Self-Healing",
    subtitle: "Zero-downtime broadcast recovery",
    desc: "Sarvam 105B + Bulbul v4 Flash send native voice instructions back to vendors. Under a 400-guest storm, NudgeBee catches worker OOM spikes and flips Flagsmith to VIP-audio + guest text.",
    tag: "Bulbul + NudgeBee",
    target: "host" as const,
    cta: "Open War Room",
  },
];

export default function HomeOverview({ onNavigate, flagSource, workerStatus }: Props) {
  return (
    <div className="space-y-8">
      {/* Why Kalyani Exists: Problem & Mission */}
      <div className="bento-surface rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
        <div className="lg:col-span-2 p-6 sm:p-8 space-y-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-teal-400">
            WHY KALYANI // THE REAL-WORLD PROBLEM
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[#F4F3EF]">
            Indian weddings don&apos;t fail from lack of effort — they fail from cascading slippage.
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            When a Baraat hits Bengaluru traffic, a single late update ripples across the decorator&apos;s lawn flip, the Pandit&apos;s immutable astrological{" "}
            <span className="text-zinc-200 font-medium">Muhurat</span>, chafing-dish buffet freshness, and the strict{" "}
            <span className="text-zinc-200 font-medium">10:00 PM outdoor sound curfew</span> — while vendors coordinate across Kannada, Hindi, Tamil, and English.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
            Kalyani treats the wedding schedule as a live <span className="text-zinc-200 font-medium">Service-Level Agreement (SLA)</span>: absorbing delays inside flexible buffers, resolving vendor conflicts with AI, and executing instant policy &amp; infrastructure failovers.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate("host")}
              className="inline-flex items-center gap-2 rounded-full bg-[#F4F3EF] hover:bg-white text-[#09090B] font-semibold px-5 py-2.5 text-xs transition active:scale-[0.98]"
            >
              Launch Host War Room
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate("vendor")}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-[#F4F3EF] font-medium px-5 py-2.5 text-xs transition"
            >
              Test Multilingual Voice
            </button>
          </div>
        </div>

        {/* Hard Constraints Matrix */}
        <div className="p-6 sm:p-8 flex flex-col justify-between gap-4 bg-white/[0.015]">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
            GUARDED INVARIANTS
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#F4F3EF]">Immutable 7:30 PM Muhurat</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Sacred anchor never shifts; upstream Haldi/Baraat buffers compress first.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#F4F3EF]">10:00 PM BLR Sound Curfew</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Automatic Indoor Banquet acoustic failover before outdoor fines hit.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cpu className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#F4F3EF]">4 Physical Resource Locks</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Detects Main_Lawn, Indoor_Banquet, Sound_Rig &amp; Couple collisions.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Utensils className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#F4F3EF]">Live ₹ Burn &amp; Buffet SLA</div>
                <div className="text-xs text-zinc-400 mt-0.5">
                  Quantifies overtime cost per minute and triggers early buffet mitigation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete End-to-End Flow */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400">
            END-TO-END FLOW // VOICE TO SELF-HEALING
          </div>
          <div className="text-[11px] font-mono text-zinc-500">01 → 04 PIPELINE</div>
        </div>

        <div className="bento-surface rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
          {FLOW_STEPS.map((step) => (
            <div
              key={step.num}
              className="p-6 flex flex-col justify-between gap-5 bento-cell-hover"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em]">
                  <span className="text-teal-400">STEP {step.num}</span>
                  <span className="px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-zinc-400">
                    {step.tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F4F3EF]">{step.title}</h3>
                  <div className="text-[11px] text-zinc-500 mt-0.5">{step.subtitle}</div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
              </div>

              <button
                onClick={() => onNavigate(step.target)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F4F3EF] hover:text-teal-300 transition w-fit"
              >
                {step.cta}
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* How We Use Sarvam AI, Flagsmith, and NudgeBee */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-400">
            SPONSOR ARCHITECTURE // HOW EACH PLATFORM POWERS KALYANI
          </div>
          <div className="text-[11px] font-mono text-zinc-500">3 CORE INTEGRATIONS</div>
        </div>

        <div className="bento-surface rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
          {/* Sarvam AI */}
          <div className="p-6 space-y-4 bento-cell-hover">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#F4F3EF]">
                <Radio className="w-4 h-4 text-teal-400" />
                Sarvam AI
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-teal-400/10 text-teal-300 border border-teal-400/25">
                VOICE + TRIAGE
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Powers the entire multilingual ground-ops loop so vendors never need an English dashboard.
            </p>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex gap-2">
                <span className="font-mono text-teal-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">Saaras v4:</strong> Codemix speech-to-text for Kannada, Hindi &amp; Tamil voice notes.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-teal-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">Sarvam Prism:</strong> Classifies SLA severity &amp; flags conflicting updates for human review.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-teal-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">Sarvam-105B + Bulbul v4:</strong> Extracts delay minutes and generates native TTS audio dispatches.
                </span>
              </li>
            </ul>
          </div>

          {/* Flagsmith */}
          <div className="p-6 space-y-4 bento-cell-hover">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#F4F3EF]">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                Flagsmith
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25">
                {flagSource}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Acts as our real-time operational policy control plane and guest messaging A/B engine without redeploying.
            </p>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex gap-2">
                <span className="font-mono text-amber-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">Policy Flags:</strong> <code className="text-zinc-200">open_buffet_early</code>, <code className="text-zinc-200">indoor_hall_fallback</code> &amp; <code className="text-zinc-200">stage_photo_cap_mins</code> reshape the DAG live.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-amber-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">Graceful Degradation:</strong> <code className="text-zinc-200">dispatch_degradation_mode</code> sheds TTS load during broadcast storms.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-amber-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">A/B Experiment:</strong> Routes guests to <code className="text-zinc-200">chaat_diversion</code> vs <code className="text-zinc-200">transparent_eta</code>.
                </span>
              </li>
            </ul>
          </div>

          {/* NudgeBee */}
          <div className="p-6 space-y-4 bento-cell-hover">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#F4F3EF]">
                <Server className="w-4 h-4 text-teal-400" />
                NudgeBee
              </div>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.09]">
                {workerStatus}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Keeps the voice-dispatch worker healthy under sudden 400-guest broadcast spikes via approval-gated runbooks.
            </p>
            <ul className="space-y-2 text-xs text-zinc-300">
              <li className="flex gap-2">
                <span className="font-mono text-teal-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">OOM Detection:</strong> Monitors <code className="text-zinc-200">voice-dispatch-worker</code> memory spikes when full TTS runs at scale.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-teal-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">Approval-Gated Runbook:</strong> Executes <code className="text-zinc-200">nudgebee-remediate.sh</code> to patch Flagsmith &amp; restart the worker.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-teal-400">•</span>
                <span>
                  <strong className="text-[#F4F3EF]">Zero Missed VIPs:</strong> Automatically downgrades bulk guest audio to text while preserving VIP voice alerts.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Demo Walkthrough Strip */}
      <div className="bento-surface rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          <div className="text-xs text-zinc-300">
            <strong className="text-[#F4F3EF]">Suggested Demo Flow:</strong> Trigger{" "}
            <span className="text-teal-300">Baraat 75m Late</span> in the War Room → Resolve in Prism Conflict Queue → Dispatch a Kannada/Hindi clip in Vendor Voice → Check Guest A/B lift → Trigger &amp; Heal the 400-Guest Storm.
          </div>
        </div>
        <button
          onClick={() => onNavigate("host")}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.09] px-4 py-2 text-xs font-medium text-[#F4F3EF] transition shrink-0"
        >
          Go to War Room
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
