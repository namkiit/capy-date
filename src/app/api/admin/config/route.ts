import { NextResponse } from "next/server";
import { configUpdateSchema } from "@/lib/admin-schemas";
import {
  getAppConfig,
  saveContentConfig,
  saveDurationsConfig,
  saveScheduleConfig,
} from "@/lib/services/app-config";

export async function GET() {
  const config = await getAppConfig();
  return NextResponse.json({ ok: true, config });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body không hợp lệ" }, { status: 400 });
  }
  const parsed = configUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: `Config không hợp lệ: ${issue.path.join(".")} — ${issue.message}` },
      { status: 400 }
    );
  }

  const { content, schedule, durations } = parsed.data;
  if (content) await saveContentConfig(content);
  if (schedule) await saveScheduleConfig(schedule);
  if (durations) await saveDurationsConfig(durations);

  const config = await getAppConfig();
  return NextResponse.json({ ok: true, config });
}
