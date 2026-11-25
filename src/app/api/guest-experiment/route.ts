import { NextResponse } from "next/server";
import { evaluateGuestExperiment } from "@/lib/flagsmith";
import { getStore } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const guestId = searchParams.get("guestId") || "guest-101";
  const role = (searchParams.get("role") as "guest" | "vip_family") || "guest";
  const evalRes = await evaluateGuestExperiment(guestId, role);

  const store = getStore();
  store.experimentStats[evalRes.variant].impressions += 1;

  return NextResponse.json({
    guestId,
    role,
    variant: evalRes.variant,
    source: evalRes.source,
    stats: store.experimentStats,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const store = getStore();

  if (body.action === "simulate20") {
    for (let i = 1; i <= 20; i++) {
      const id = `sim-guest-${Date.now()}-${i}`;
      const r = await evaluateGuestExperiment(id, i % 5 === 0 ? "vip_family" : "guest");
      store.experimentStats[r.variant].impressions += 1;
      const converted = r.variant === "chaat_diversion" ? Math.random() < 0.82 : Math.random() < 0.54;
      if (converted) store.experimentStats[r.variant].conversions += 1;
    }
    return NextResponse.json({ ok: true, stats: store.experimentStats });
  }

  const variant = body.variant === "chaat_diversion" ? "chaat_diversion" : "transparent_eta";
  if (body.converted) {
    store.experimentStats[variant].conversions += 1;
  }
  return NextResponse.json({ ok: true, stats: store.experimentStats });
}
