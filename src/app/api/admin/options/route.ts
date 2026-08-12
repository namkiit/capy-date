import { NextResponse } from "next/server";
import { optionInputSchema } from "@/lib/admin-schemas";
import { createOption, getAllOptions } from "@/lib/db/queries";

export async function GET() {
  const options = await getAllOptions();
  return NextResponse.json({ ok: true, options });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body không hợp lệ" }, { status: 400 });
  }
  const parsed = optionInputSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: `Option không hợp lệ: ${issue.path.join(".")} — ${issue.message}` },
      { status: 400 }
    );
  }
  const option = await createOption(parsed.data);
  return NextResponse.json({ ok: true, option });
}
