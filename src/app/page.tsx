import { InviteFlowLoader } from "@/components/InviteFlowLoader";
import { getAppConfig } from "@/lib/services/app-config";

// Dữ liệu đổi qua admin panel phải hiện ngay — không prerender tĩnh
export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getAppConfig();
  return <InviteFlowLoader content={config.content} />;
}
