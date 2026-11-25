# Kalyani — Real-Time Wedding Operations & SLA Control Plane

**Kalyani** treats an Indian wedding schedule as a real-time **Service-Level Agreement (SLA)** control plane. It protects immutable ceremonial anchors (like the 7:30 PM IST **Muhurat**) and hard city regulations (like Bengaluru's **10:00 PM outdoor sound curfew**), resolves conflicting multilingual vendor updates using AI, mitigates cascade delays via live feature flags, and self-heals overloaded voice-dispatch infrastructure.

---

## Why Kalyani?

Indian weddings involve tightly coupled physical resources (`Main_Lawn`, `Indoor_Banquet`, `Sound_Rig`, `Couple`), perishable catering SLAs, strict local sound cutoffs, and ground teams communicating across **Kannada, Hindi, Tamil, and code-mixed English**.

When one event slips (for example, a Baraat stuck in Hebbal traffic):
1. Upstream delays ripple into decorator lawn flips, Muhurat rituals, stage portraits, and Sangeet.
2. Conflicting reports arrive simultaneously from family members and drivers.
3. Unchecked delays cause venue/generator overtime burn (₹/min), cold buffet food, and outdoor sound curfew breaches.
4. Broadcasting hundreds of voice alerts at once can overwhelm TTS worker memory.

Kalyani solves this by combining a **constrained DAG solver** with **Sarvam AI**, **Flagsmith**, and **NudgeBee**.

---

## End-to-End Architecture & Flow

```text
Vendor Voice (kn/hi/ta/en)
   │
   ▼  [1] Sarvam Saaras v4 (Codemix STT)
Transcript
   │
   ▼  [2] Sarvam Prism (/v2/systemone)
Risk Triage & Conflict Detection
   ├── Conflicting / Low-Confidence ──▶ Human Conflict Queue (/api/conflicts/resolve)
   └── Actionable ────────────────────▶ [3] Sarvam-105B (Delay + Native Copy Extraction)
                                              │
                                              ▼
                                 Constrained Wedding DAG Solver
                             (+ Live Flagsmith Policy Overrides)
                                              │
         ┌────────────────────────────────────┴────────────────────────────────────┐
         ▼                                                                         ▼
[4a] Sarvam Bulbul v4 Flash TTS                                   [4b] Guest A/B Portal (Flagsmith)
(or VIP-audio + text if degraded)                                  chaat_diversion vs transparent_eta
         │
         ▼  (400-Guest Storm -> 128Mi Worker OOM Spike)
NudgeBee Approval-Gated Runbook (ops/nudgebee-remediate.sh)
   └─▶ Patches Flagsmith dispatch_degradation_mode + Restarts K8s Worker
```

### Step-by-Step Flow

1. **Multilingual Voice Intake (`Saaras v4`)**: Vendors record live audio or trigger venue-safe presets in Kannada, Hindi, or Tamil via the **Vendor Voice** tab (`POST /api/voice-intake`). `saaras:v4` transcribes code-mixed speech using custom wedding keyterms (`Muhurat`, `Mandap`, `Baraat`, `Sangeet`, `Varmala`, `Haldi`, `Hebbal`, `Chaat`).
2. **AI Triage & Conflict Gate (`Sarvam Prism`)**: `sarvam-prism` classifies the incident (`P0_MUHURAT_THREAT`, `P1_SOUND_CURFEW`, `P2_FOOD_SPOILAGE`, `RESOURCE_DEADLOCK`, `CONFLICTING_UPDATE`, `LOW_PRIORITY`) and scores conflict probability. Conflicting or low-confidence reports are held in the **Prism Conflict Queue** until approved or dismissed by the host.
3. **Constrained DAG Re-Computation (`src/lib/dag-solver.ts`)**:
   - **7 Timeline Nodes (3:00 PM – 10:30 PM IST)**: `haldi`, `lawn_flip`, `baraat`, `varmala`, `muhurat` (`IMMUTABLE_ANCHOR` at 7:30 PM), `stage_photos`, and `sangeet` (10:00 PM BLR outdoor sound cutoff).
   - **Buffer Compression**: `FLEX_BUFFER` nodes absorb delays down to their `minDurationMin` before slipping downstream nodes.
   - **Deadlock & Curfew Checks**: Flags adjacent nodes colliding on the same `ResourceLock` (`Main_Lawn`, `Indoor_Banquet`, `Sound_Rig`, `Couple`), computes live overtime burn rate (`₹/min`) and `estimatedOvertimeINR`, tracks buffet hold time (`buffetRemainingMin`), and emits `recommendedActions`.
4. **Native Audio Dispatch (`Sarvam-105B` + `Bulbul v4 Flash`)**: `sarvam-105b-conversations` extracts `{ affectedNodeId, delayMinutes, targetLanguageCode, nativeDispatchText, guestSummary }`, and `bulbul:v4-flash` synthesizes playable WAV audio dispatches in the vendor's language.
5. **Self-Healing Under Broadcast Storms (`Flagsmith` + `NudgeBee`)**: Triggering a 400-guest broadcast storm hits `POST /dispatch` on `voice-dispatch-worker`, simulating a >128Mi memory spike (`OOMKill` in Kubernetes). Approving the NudgeBee runbook (`ops/nudgebee-remediate.sh` or the **Approve NudgeBee Runbook** action) flips Flagsmith's `dispatch_degradation_mode` to `vip_audio_plus_guest_text`, restarts the worker, and restores healthy status.

---

## Core Integrations

### 1. Sarvam AI (`src/lib/sarvam.ts`)
| Model / Endpoint | Purpose in Kalyani |
| :--- | :--- |
| `saaras:v4` (`POST /speech-to-text`) | Codemix STT for multilingual vendor audio notes |
| `sarvam-prism` (`POST /v2/systemone`) | Incident classification, severity scoring, and human-review conflict detection |
| `sarvam-105b-conversations` (`POST /v1/chat/completions`) | Structured extraction of affected node, delay minutes, localized vendor copy, and English guest summary |
| `bulbul:v4-flash` (`POST /text-to-speech`) | Native WAV voice synthesis (`hi-IN`, `kn-IN`, `ta-IN`, `en-IN`) for vendor/stage dispatches |

*(Includes deterministic/heuristic fallbacks if `SARVAM_API_KEY` is not yet configured.)*

### 2. Flagsmith (`src/lib/flagsmith.ts`)
Evaluated via `flagsmith-nodejs` (`getIdentityFlags`) and updated via the Flagsmith Management API (`PATCH /environments/{envId}/featurestates/{id}/`):

| Feature Key | Type / Values | Effect |
| :--- | :--- | :--- |
| `open_buffet_early` | Boolean (`false` / `true`) | Extends buffet freshness hold window (90m → 115m) and applies a 20% overtime burn discount |
| `indoor_hall_fallback` | Boolean (`false` / `true`) | Routes Sangeet indoors before 10:00 PM to clear curfew breach and applies a 35% burn discount |
| `stage_photo_cap_mins` | Integer (`45`, `25`, `15`) | Compresses Couple & Family Stage Portraits to reclaim downstream slack |
| `dispatch_degradation_mode` | String (`full_tts` \| `vip_audio_plus_guest_text`) | Sheds non-VIP TTS audio load during broadcast storms |
| `guest_delay_messaging_experiment` | Multivariate (`transparent_eta` \| `chaat_diversion`) | A/B tests guest messaging copy and tracks conversion telemetry per guest/VIP ID |

### 3. NudgeBee & Kubernetes Worker (`worker/`, `k8s/`, `ops/`)
- **`worker/index.ts`**: Lightweight HTTP worker exposing `GET /healthz` and `POST /dispatch` on port `4000`. Allocates `6 × 32 MB` buffers when `mode === "full_tts"` and `recipientsCount >= 200` to reproduce a 128Mi container OOM spike.
- **`k8s/`**: Namespace (`mandapsla`), Deployment (`voice-dispatch-worker` with `128Mi` memory limit and `/healthz` liveness probe), and Service.
- **`ops/nudgebee-remediate.sh`**: Approval-gated remediation runbook that patches Flagsmith `dispatch_degradation_mode=vip_audio_plus_guest_text`, runs `kubectl rollout restart deployment/voice-dispatch-worker -n mandapsla`, and updates the app state via `POST /api/flags/toggle`.

---

## Application Views & API Routes

### UI Views (`src/components/`)
- **Home (`HomeOverview.tsx`)**: Problem statement, guarded invariants, `01 → 04` pipeline walkthrough, and sponsor architecture cards.
- **War Room (`HostCommandCenter.tsx`)**: Live SLA/burn/buffet/deadlock KPI matrix, solver recommendations, 4 chaos & remediation triggers, proportional Gantt DAG timeline (`15:00`–`23:00` IST), Flagsmith toggles, Sarvam Prism Conflict Queue, and Bulbul audio dispatch log.
- **Vendor Voice (`VendorVoiceConsole.tsx`)**: Browser mic recording, one-tap Kannada/Hindi/Tamil presets, custom text input, structured extraction breakdown, and synthesized audio playback.
- **Guest A/B (`GuestStatusPortal.tsx`)**: Identity switcher (`guest-101`, `guest-102`, `vip-sharma-ji`), live venue/buffet context badges, acknowledgement tracking, and a 20-guest conversion simulator.

### API Endpoints (`src/app/api/`)
- `GET / POST /api/state` — Computes current `solveWeddingDAG` output, evaluates Flagsmith flags, polls worker `/healthz`, or resets demo state (`{ action: "reset" }`).
- `POST /api/voice-intake` — Runs `Saaras v4` (for audio uploads) → `Sarvam Prism` → `Sarvam-105B` → `Bulbul v4` (or queues conflicts).
- `POST /api/conflicts/resolve` — Approves or dismisses pending items in the Prism Conflict Queue.
- `POST /api/flags/toggle` — Updates local policy overrides, patches Flagsmith Management API, and records NudgeBee remediation state.
- `GET / POST /api/guest-experiment` — Evaluates `guest_delay_messaging_experiment`, logs conversions, or simulates 20 guest impressions.
- `POST /api/chaos` — Triggers `baraat_75_conflict`, `curfew_945_warning`, or `guest_400_storm`.

---

## Project Structure

```text
Kalyani/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chaos/route.ts
│   │   │   ├── conflicts/resolve/route.ts
│   │   │   ├── flags/toggle/route.ts
│   │   │   ├── guest-experiment/route.ts
│   │   │   ├── state/route.ts
│   │   │   └── voice-intake/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── GuestStatusPortal.tsx
│   │   ├── HomeOverview.tsx
│   │   ├── HostCommandCenter.tsx
│   │   └── VendorVoiceConsole.tsx
│   └── lib/
│       ├── dag-solver.ts
│       ├── flagsmith.ts
│       ├── sarvam.ts
│       └── store.ts
├── worker/
│   ├── Dockerfile
│   ├── index.ts
│   └── package.json
├── k8s/
│   ├── namespace.yaml
│   ├── worker-deployment.yaml
│   └── worker-service.yaml
├── ops/
│   └── nudgebee-remediate.sh
├── .env.example
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Setup & Running Locally

### 1. Configure Environment Variables

```bash
cp .env.example .env.local
```

Populate `.env.local`:

```env
SARVAM_API_KEY=...
FLAGSMITH_ENVIRONMENT_KEY=...
FLAGSMITH_API_KEY=...
FLAGSMITH_PROJECT_ID=...
FLAGSMITH_ENVIRONMENT_ID=...
WORKER_URL=http://localhost:4000
APP_BASE_URL=http://localhost:3000
```

- **Sarvam API Key**: Generate at [dashboard.sarvam.ai](https://dashboard.sarvam.ai) → **API Keys**.
- **Flagsmith Keys & IDs**: From [app.flagsmith.com](https://app.flagsmith.com) → **Environment Settings → SDK Keys** (`FLAGSMITH_ENVIRONMENT_KEY`), **Organisation Settings → API Access** (`FLAGSMITH_API_KEY`), and project/environment numeric IDs.

### 2. Run the Next.js App

```bash
npm install
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Run the Worker (Local or Kubernetes)

**Option A — Local Node Worker (fast local demo):**

```bash
cd worker
npm install
npm start
```

**Option B — Kubernetes (`kind`) + NudgeBee Agent:**

```bash
kind create cluster --name mandapsla
docker build -t mandapsla-worker:local ./worker
kind load docker-image mandapsla-worker:local --name mandapsla
kubectl apply -f k8s/namespace.yaml -f k8s/worker-deployment.yaml -f k8s/worker-service.yaml
kubectl port-forward -n mandapsla svc/voice-dispatch-worker 4000:4000
```

Connect your cluster in `app.nudgebee.com` and register `ops/nudgebee-remediate.sh` as an approval-gated runbook.

---

## Quick Demo Walkthrough

1. Start on **Home** to review the operational problem, `01 → 04` pipeline, and sponsor architecture.
2. Open **War Room** and click **1. Baraat 75m Late** → approve the conflict in **Prism Conflict Queue** to watch the DAG timeline, ₹ burn rate, and buffet SLA update live.
3. Click **2. 10 PM BLR Warning** to observe the curfew alert and Hindi **Bulbul v4** dispatch audio, then toggle `indoor_hall_fallback` and `open_buffet_early` in **Flagsmith Policies**.
4. Switch to **Vendor Voice** and trigger a Kannada/Hindi/Tamil preset (or record live audio).
5. Switch to **Guest A/B** and click **Simulate 20 Guests** to compare `chaat_diversion` vs `transparent_eta` conversion lift.
6. Return to **War Room**, click **3. 400-Guest Storm**, and click **4. Approve NudgeBee Runbook** to degrade TTS dispatch mode and heal the worker.
