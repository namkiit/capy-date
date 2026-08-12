"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Mascot } from "@/components/Mascot";
import { btnPrimaryCls, inputCls } from "@/components/admin/AdminUI";
import { adminApi } from "@/lib/admin-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminApi("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      router.push("/admin/submissions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-5">
      <form onSubmit={handleSubmit} className="w-full max-w-xs text-center">
        <Mascot expression="idle" className="mx-auto w-28" />
        <h1 className="mt-3 font-display text-2xl font-bold text-ink">Khu vực của host 🔐</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu admin"
          autoFocus
          className={`${inputCls} mt-5 text-center`}
        />
        {error && <p className="mt-2 text-sm font-semibold text-tangerine">{error}</p>}
        <button type="submit" disabled={loading || password.length === 0} className={`${btnPrimaryCls} mt-4 w-full`}>
          {loading ? "Đang kiểm tra..." : "Vào admin"}
        </button>
      </form>
    </main>
  );
}
