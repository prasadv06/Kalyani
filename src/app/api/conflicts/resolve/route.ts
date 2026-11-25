import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(req: Request) {
  const { id, decision } = await req.json();
  const store = getStore();
  const item = store.conflicts.find((c) => c.id === id);
  if (!item) {
    return NextResponse.json({ error: "Conflict not found" }, { status: 404 });
  }

  item.status = decision === "approve" ? "APPROVED" : "DISMISSED";
  if (decision === "approve") {
    store.delaysByNode[item.affectedNodeId] = item.suggestedDelayMin;
  }

  return NextResponse.json({ ok: true, item });
}
