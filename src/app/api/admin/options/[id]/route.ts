import { NextResponse } from "next/server";
import { optionInputSchema } from "@/lib/admin-schemas";
import { requireAdmin } from "@/lib/require-admin";
import { editOption, removeOption } from "@/lib/services/options";

function parseId(id: string): number | null {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export async function PUT(request: Request, { params }: RouteContext<"/api/admin/options/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const optionId = parseId(id);
  if (optionId === null) {
    return NextResponse.json({ ok: false, error: "Id không hợp lệ" }, { status: 400 });
  }

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

  const option = await editOption(optionId, parsed.data);
  if (!option) {
    return NextResponse.json({ ok: false, error: `Không tìm thấy option #${optionId}` }, { status: 404 });
  }
  return NextResponse.json({ ok: true, option });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/options/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const optionId = parseId(id);
  if (optionId === null) {
    return NextResponse.json({ ok: false, error: "Id không hợp lệ" }, { status: 400 });
  }
  const deleted = await removeOption(optionId);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: `Không tìm thấy option #${optionId}` }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
