import { InviteFlowLoader } from "@/components/InviteFlowLoader";
import { getAppConfig } from "@/lib/services/app-config";
import { buildCalendar, getTodayInVietnam } from "@/lib/services/schedule";

// Dữ liệu đổi qua admin panel phải hiện ngay — không prerender tĩnh
export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getAppConfig();
  const days = buildCalendar(config.schedule, getTodayInVietnam());
  return <InviteFlowLoader content={config.content} days={days} />;
}
