import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { listAllSubmissions } from "@/lib/services/submission";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const submissions = await listAllSubmissions();
  return NextResponse.json({ ok: true, submissions });
}
