"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-client";

const TABS = [
  { href: "/admin/submissions", label: "Submissions 💌" },
  { href: "/admin/schedule", label: "Lịch 🗓️" },
  { href: "/admin/options", label: "Quán & Phim 🍜" },
  { href: "/admin/content", label: "Nội dung ✏️" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await adminApi("/api/admin/logout", { method: "POST" });
    } catch (err) {
      // API fail vẫn đưa về trang login — cookie có thể đã hết hạn sẵn
      console.error("Logout API thất bại:", err);
    } finally {
      router.push("/admin/login");
    }
  }

  return (
    <nav className="sticky top-0 z-40 border-b-2 border-latte bg-cream/95 px-4 py-2.5 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-1.5 overflow-x-auto">
        <span className="mr-1 hidden font-display text-lg font-bold text-capy-deep sm:block">
          Capy Admin
        </span>
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              pathname.startsWith(tab.href)
                ? "bg-capy text-cream"
                : "text-ink-soft hover:bg-sand"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-soft hover:bg-sand"
        >
          Thoát ↩
        </button>
      </div>
    </nav>
  );
}
