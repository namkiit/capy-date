/** Helper gọi API admin từ client — luôn trả JSON đã kiểm tra ok, lỗi thì throw message server */

export class AdminApiError extends Error {}

export async function adminApi<T>(url: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const res = await fetch(url, {
    ...init,
    headers: isFormData
      ? init?.headers
      : { "Content-Type": "application/json", ...init?.headers },
  });
  const data = (await res.json().catch(() => null)) as
    | ({ ok: boolean; error?: string } & T)
    | null;
  if (!res.ok || !data?.ok) {
    // cookie hết hạn → đưa thẳng về trang login (full reload chủ đích để xóa
    // sạch state admin trong RAM) thay vì chỉ hiện chữ đỏ
    if (res.status === 401 && !url.includes("/login") && !url.includes("/logout")) {
      window.location.assign(new URL("/admin/login", window.location.origin));
    }
    throw new AdminApiError(data?.error ?? `Lỗi ${res.status} khi gọi ${url}`);
  }
  return data;
}
