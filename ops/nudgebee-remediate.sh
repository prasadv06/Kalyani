#!/usr/bin/env bash
set -euo pipefail

echo "[NudgeBee Runbook] Starting remediation for voice-dispatch-worker..."

if [[ -n "${FLAGSMITH_API_KEY:-}" && -n "${FLAGSMITH_ENVIRONMENT_ID:-}" && -n "${FLAGSMITH_FEATURE_STATE_ID:-}" ]]; then
  curl -sf -X PATCH \
    "https://api.flagsmith.com/api/v1/environments/${FLAGSMITH_ENVIRONMENT_ID}/featurestates/${FLAGSMITH_FEATURE_STATE_ID}/" \
    -H "Authorization: Api-Key ${FLAGSMITH_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"enabled": true, "feature_state_value": "vip_audio_plus_guest_text"}' >/dev/null
  echo "[NudgeBee Runbook] Flagsmith dispatch_degradation_mode set to vip_audio_plus_guest_text."
else
  echo "[NudgeBee Runbook] Flagsmith env vars not set; notifying local app state."
fi

if kubectl get deployment voice-dispatch-worker -n mandapsla >/dev/null 2>&1; then
  kubectl rollout restart deployment/voice-dispatch-worker -n mandapsla
  kubectl rollout status deployment/voice-dispatch-worker -n mandapsla --timeout=60s
  echo "[NudgeBee Runbook] Kubernetes deployment restarted."
fi

APP_BASE_URL="${APP_BASE_URL:-http://localhost:3000}"
curl -sf -X POST "${APP_BASE_URL}/api/flags/toggle" \
  -H "Content-Type: application/json" \
  -d '{"key":"dispatch_degradation_mode","value":"vip_audio_plus_guest_text","healedByNudgeBee":true}' >/dev/null || true

echo "[NudgeBee Runbook] Remediation complete."
