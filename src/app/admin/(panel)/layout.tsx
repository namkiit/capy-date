import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/AdminNav";

/** Layout cho các trang admin (trừ /admin/login — nằm ngoài route group này) */
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh">
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
