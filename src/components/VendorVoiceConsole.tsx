"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  Mic,
  Send,
  Square,
  Volume2,
} from "lucide-react";

interface Props {
  onSubmitted: () => void;
}

interface VoiceIntakeResponse {
  queuedForConflictReview?: boolean;
  transcript?: string;
  sttSource?: string;
  ttsSource?: string;
  audioBase64?: string | null;
  prism?: {
    incidentType: string;
    confidence: number;
    conflictProbability: number;
    severityScore: string;
    source: string;
  };
  extracted?: {
    affectedNodeId: string;
    delayMinutes: number;
    targetLanguageCode: string;
    nativeDispatchText: string;
    guestSummary: string;
  };
}

const PRESET_CLIPS = [
  {
    index: "01",
    label: "Kannada • Baraat Hebbal Jam (75m)",
    vendorRole: "Decorator",
    languageCode: "kn-IN",
    transcript:
      "Sir, Baraat mattu mandap flowers Hebbal bridge traffic alli stuck aagide, 75 minutes late barthivi.",
  },
  {
    index: "02",
    label: "Hindi • Chafing Fuel Low (35m)",
    vendorRole: "Caterer",
    languageCode: "hi-IN",
    transcript:
      "Sir बफ़े काउंटर पर वार्मर फ्यूल कम है, 35 मिनट में स्टार्टर और मेन कोर्स परोसना बेहतर रहेगा।",
  },
  {
    index: "03",
    label: "Tamil/Code-mix • Sound Delay (40m)",
    vendorRole: "DJ",
    languageCode: "ta-IN",
    transcript:
      "Anna outdoor sound rig setup 40 minutes late aagum, 10 PM curfew munnaadi mudikkanum.",
  },
];

export default function VendorVoiceConsole({ onSubmitted }: Props) {
  const [vendorRole, setVendorRole] = useState("Decorator");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [customText, setCustomText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [response, setResponse] = useState<VoiceIntakeResponse | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  async function startRecording() {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setProcessing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const form = new FormData();
          form.append("audio", blob, "vendor-voice.webm");
          form.append("vendorRole", vendorRole);
          const res = await fetch("/api/voice-intake", { method: "POST", body: form });
          const data: VoiceIntakeResponse = await res.json();
          setResponse(data);
          setAudioSrc(data.audioBase64 ? `data:audio/wav;base64,${data.audioBase64}` : null);
          onSubmitted();
        } catch {
          setErrorMsg("Failed to process voice note. Try a preset clip below.");
        } finally {
          setProcessing(false);
        }
      };
      mr.start();
      recorderRef.current = mr;
      setRecording(true);
    } catch {
      setErrorMsg("Mic permission unavailable — use a one-tap venue preset or text input below.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function sendTextOrPreset(text: string, role = vendorRole, lang = "hi-IN") {
    setErrorMsg("");
    setProcessing(true);
    try {
      const res = await fetch("/api/voice-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, vendorRole: role, languageCode: lang }),
      });
      const data: VoiceIntakeResponse = await res.json();
      setResponse(data);
      setAudioSrc(data.audioBase64 ? `data:audio/wav;base64,${data.audioBase64}` : null);
      onSubmitted();
    } catch {
      setErrorMsg("Failed to reach /api/voice-intake.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 4-Stage Pipeline Bar */}
      <div className="bento-surface rounded-2xl overflow-hidden grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
        {[
          ["01", "Saaras v4 STT"],
          ["02", "Sarvam Prism"],
          ["03", "Sarvam-105B"],
          ["04", "Bulbul v4 TTS"],
        ].map(([num, label]) => (
          <div
            key={num}
            className={`px-4 py-3 flex items-center justify-between text-xs transition ${
              processing ? "bg-teal-400/[0.07]" : ""
            }`}
          >
            <span className="font-mono text-[10px] text-zinc-500">{num} //</span>
            <span className={`font-medium ${processing ? "text-teal-300" : "text-zinc-200"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Main Voice Console */}
      <div className="bento-surface rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-teal-400">
              MULTILINGUAL INTAKE
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#F4F3EF]">
              Vendor Voice & Text Dispatcher
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Speak in Kannada, Hindi, Tamil, or code-mixed English — Kalyani triages and replies in native audio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={vendorRole}
              disabled={processing || recording}
              onChange={(e) => setVendorRole(e.target.value)}
              className="rounded-full bg-zinc-900 border border-white/[0.12] px-4 py-2 text-xs font-medium text-[#F4F3EF] focus:outline-none focus:border-teal-400"
            >
              <option value="Decorator">Decorator (Kannada)</option>
              <option value="Caterer">Caterer (Hindi)</option>
              <option value="DJ">DJ / Sound (Tamil)</option>
              <option value="Pandit">Pandit (Hindi)</option>
            </select>

            {!recording ? (
              <button
                disabled={processing}
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-full bg-[#F4F3EF] hover:bg-white text-[#09090B] font-semibold px-5 py-2 text-xs transition active:scale-[0.98] disabled:opacity-50"
              >
                {processing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
                {processing ? "Processing..." : "Record Voice"}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-semibold px-5 py-2 text-xs animate-pulse transition"
              >
                <Square className="w-3.5 h-3.5" /> Stop & Send
              </button>
            )}
          </div>
        </div>

        {/* One-Tap Presets Bento */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-b border-white/[0.08]">
          {PRESET_CLIPS.map((clip) => (
            <button
              key={clip.label}
              disabled={processing || recording}
              onClick={() => sendTextOrPreset(clip.transcript, clip.vendorRole, clip.languageCode)}
              className="group p-5 text-left bento-cell-hover active:scale-[0.99] disabled:opacity-50"
            >
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-zinc-500">
                <span>PRESET {clip.index}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-teal-300 transition" />
              </div>
              <div className="mt-2 text-xs font-semibold text-[#F4F3EF] group-hover:text-teal-300 transition">
                {clip.label}
              </div>
              <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                {clip.transcript}
              </p>
            </button>
          ))}
        </div>

        {/* Custom Text Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customText.trim() && !processing) {
              sendTextOrPreset(customText.trim());
              setCustomText("");
            }
          }}
          className="p-5 flex flex-col sm:flex-row gap-3"
        >
          <input
            value={customText}
            disabled={processing}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type a vendor update in Kannada, Hindi, Tamil, or English..."
            className="flex-1 rounded-full bg-[#09090B] border border-white/[0.1] px-5 py-2.5 text-sm text-[#F4F3EF] placeholder:text-zinc-500 focus:outline-none focus:border-teal-400"
          />
          <button
            type="submit"
            disabled={processing || !customText.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.1] px-5 py-2.5 text-xs font-semibold text-[#F4F3EF] transition disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" /> Dispatch
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="bento-surface rounded-2xl border-rose-500/35 p-4 text-xs text-rose-200">
          {errorMsg}
        </div>
      )}

      {/* Structured Output Card */}
      {response && (
        <div className="bento-surface rounded-2xl p-5 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {response.queuedForConflictReview ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
              )}
              <span className="font-semibold text-sm text-[#F4F3EF]">
                {response.queuedForConflictReview
                  ? "Queued in Sarvam Prism Conflict Queue"
                  : `DAG Updated: +${response.extracted?.delayMinutes ?? 0}m on ${response.extracted?.affectedNodeId}`}
              </span>
            </div>

            {response.prism && (
              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-400/10 text-teal-300 border border-teal-400/25">
                  {response.prism.incidentType} • {Math.round(response.prism.confidence * 100)}%
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                  {response.prism.source}
                </span>
              </div>
            )}
          </div>

          {response.transcript && (
            <div className="rounded-xl border border-white/[0.08] bg-[#09090B]/80 p-3 text-zinc-300">
              <span className="font-mono text-[10px] text-zinc-500 mr-2">
                TRANSCRIPT ({response.sttSource})
              </span>
              &ldquo;{response.transcript}&rdquo;
            </div>
          )}

          {response.extracted && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.08] bg-[#09090B]/80 p-3.5 space-y-1.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-300">
                  Vendor Dispatch ({response.extracted.targetLanguageCode})
                </div>
                <p className="text-zinc-100 leading-relaxed">
                  {response.extracted.nativeDispatchText}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#09090B]/80 p-3.5 space-y-1.5">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal-300">
                  Guest Summary
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {response.extracted.guestSummary}
                </p>
              </div>
            </div>
          )}

          {audioSrc && (
            <div className="rounded-xl border border-teal-400/25 bg-[#09090B]/90 p-3.5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-teal-300 mb-2">
                <Volume2 className="w-3.5 h-3.5" /> Bulbul v4 Flash Dispatch Audio
              </div>
              <audio controls autoPlay src={audioSrc} className="w-full h-9" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
