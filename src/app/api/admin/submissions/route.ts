import { NextResponse } from "next/server";
import { listSubmissions } from "@/lib/db/queries";

export async function GET() {
  const submissions = await listSubmissions();
  return NextResponse.json({ ok: true, submissions });
}
