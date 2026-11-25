# Kalyani

Real-time wedding operations SLA control plane with constrained DAG scheduling, multilingual vendor voice intake & dispatch (Sarvam AI), dynamic policy & A/B experimentation (Flagsmith), and self-healing Kubernetes worker remediation (NudgeBee).

## Stack & Integrations

- **Next.js 15 + React 19 + Tailwind CSS**: Home Overview, Host War Room, Vendor Voice Console, and Guest A/B Portal
- **Constrained Wedding DAG Solver** (`src/lib/dag-solver.ts`): Protects the immutable Muhurat anchor (7:30 PM IST) and Bengaluru 10:00 PM outdoor sound cutoff while tracking resource deadlocks, burn rate (₹/min), and buffet cold-food SLA
- **Sarvam AI** (`src/lib/sarvam.ts`):
  - `saaras:v4` for codemix STT (`kn-IN`, `hi-IN`, `ta-IN`, `en-IN`)
  - `sarvam-prism` (`/v2/systemone`) for incident triage & conflict detection
  - `sarvam-105b-conversations` for delay extraction & multilingual dispatch copy
  - `bulbul:v4-flash` for TTS audio dispatches
- **Flagsmith** (`src/lib/flagsmith.ts`): Live policy flags (`open_buffet_early`, `indoor_hall_fallback`, `stage_photo_cap_mins`, `dispatch_degradation_mode`) & guest A/B experiment (`guest_delay_messaging_experiment`)
- **Kubernetes Worker + NudgeBee Runbook** (`worker/`, `k8s/`, `ops/nudgebee-remediate.sh`): `voice-dispatch-worker` with 128Mi limit and approval-gated Flagsmith degradation + rollout restart runbook

## Local Setup

```bash
cp .env.example .env.local
# Add your SARVAM_API_KEY and FLAGSMITH_* keys to .env.local

npm install
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

*(Optional local worker on port `4000`:)*

```bash
cd worker && npm install && npm start
```

## Kubernetes (`kind`) + Worker Setup

```bash
kind create cluster --name mandapsla
docker build -t mandapsla-worker:local ./worker
kind load docker-image mandapsla-worker:local --name mandapsla
kubectl apply -f k8s/namespace.yaml -f k8s/worker-deployment.yaml -f k8s/worker-service.yaml
```

Register `ops/nudgebee-remediate.sh` in NudgeBee as your approval-gated runbook.
