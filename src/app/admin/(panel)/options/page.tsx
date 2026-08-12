"use client";

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import {
  StatusMessage,
  btnGhostCls,
  btnPrimaryCls,
  cardCls,
  inputCls,
  labelCls,
  type AdminMessage,
} from "@/components/admin/AdminUI";
import { adminApi } from "@/lib/admin-client";
import type { OptionInput } from "@/lib/admin-schemas";
import type { OptionRow } from "@/lib/db/schema";
import type { OptionType } from "@/lib/types";

const TYPE_LABELS: Record<OptionType, string> = {
  food: "🍜 Quán ăn",
  movie: "🎬 Phim",
  cafe: "🧋 Cafe",
};

interface EditorState {
  /** null = tạo mới */
  id: number | null;
  input: OptionInput;
}

function emptyInput(type: OptionType): OptionInput {
  return {
    type,
    name: "",
    description: "",
    images: [],
    priceRange: null,
    address: null,
    mapUrl: null,
    hostNote: null,
    extra: null,
    isActive: true,
    sortOrder: 0,
  };
}

function rowToInput(row: OptionRow): OptionInput {
  return {
    type: row.type,
    name: row.name,
    description: row.description,
    images: row.images,
    priceRange: row.priceRange,
    address: row.address,
    mapUrl: row.mapUrl,
    hostNote: row.hostNote,
    extra: row.extra ?? null,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export default function AdminOptionsPage() {
  const [options, setOptions] = useState<OptionRow[] | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [imagesStr, setImagesStr] = useState("");
  const [message, setMessage] = useState<AdminMessage>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(() => {
    adminApi<{ options: OptionRow[] }>("/api/admin/options")
      .then((data) => setOptions(data.options))
      .catch((err) =>
        setMessage({ kind: "error", text: err instanceof Error ? err.message : "Lỗi tải options" })
      );
  }, []);

  useEffect(reload, [reload]);

  function openEditor(state: EditorState) {
    setEditor(state);
    setImagesStr(state.input.images.join("\n"));
    setMessage(null);
  }

  function setInput<K extends keyof OptionInput>(key: K, value: OptionInput[K]) {
    setEditor((prev) => (prev === null ? prev : { ...prev, input: { ...prev.input, [key]: value } }));
  }

  /** "" → null cho các field optional */
  function textOrNull(value: string): string | null {
    return value.trim() === "" ? null : value;
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await adminApi<{ url: string }>("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      setImagesStr((prev) => (prev.trim() === "" ? data.url : `${prev}\n${data.url}`));
      setMessage({ kind: "ok", text: "Upload xong — URL đã thêm vào danh sách ảnh" });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Upload thất bại" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!editor) return;
    if (editor.input.name.trim() === "") {
      setMessage({ kind: "error", text: "Tên không được để trống" });
      return;
    }
    const images = imagesStr
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const body = JSON.stringify({ ...editor.input, images });

    setSaving(true);
    setMessage(null);
    try {
      if (editor.id === null) {
        await adminApi("/api/admin/options", { method: "POST", body });
      } else {
        await adminApi(`/api/admin/options/${editor.id}`, { method: "PUT", body });
      }
      setEditor(null);
      reload();
      setMessage({ kind: "ok", text: "Đã lưu ✓" });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Lưu thất bại" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: OptionRow) {
    if (!window.confirm(`Xóa "${row.name}"? Hành động này không hoàn tác được.`)) return;
    try {
      await adminApi(`/api/admin/options/${row.id}`, { method: "DELETE" });
      reload();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Xóa thất bại" });
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Quán & Phim 🍜</h1>
      <StatusMessage message={message} />

      {options === null && !message && <p className="mt-4 text-ink-soft">Đang tải...</p>}

      {(["food", "movie", "cafe"] as const).map((type) => (
        <section key={type} className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-ink">{TYPE_LABELS[type]}</h2>
            <button
              onClick={() => openEditor({ id: null, input: emptyInput(type) })}
              className={btnGhostCls}
            >
              + Thêm
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {options
              ?.filter((o) => o.type === type)
              .map((row) => (
                <div key={row.id} className={`${cardCls} flex items-center gap-3`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">
                      {row.name}
                      {!row.isActive && (
                        <span className="ml-2 rounded-full bg-latte px-2 py-0.5 text-xs text-ink-soft">
                          đang ẩn
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      #{row.id} · thứ tự {row.sortOrder} · {row.images.length} ảnh
                    </p>
                  </div>
                  <button onClick={() => openEditor({ id: row.id, input: rowToInput(row) })} className={btnGhostCls}>
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(row)}
                    className="rounded-full px-3 py-2 text-sm font-semibold text-tangerine hover:bg-tangerine/10"
                  >
                    Xóa
                  </button>
                </div>
              ))}
          </div>
        </section>
      ))}

      {editor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center" onClick={() => setEditor(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-t-blob bg-cream p-5 sm:rounded-blob"
          >
            <h3 className="font-display text-xl font-bold text-ink">
              {editor.id === null ? "Thêm" : "Sửa"} — {TYPE_LABELS[editor.input.type]}
            </h3>

            <label className={labelCls}>Tên *</label>
            <input value={editor.input.name} onChange={(e) => setInput("name", e.target.value)} className={inputCls} />

            <label className={labelCls}>Mô tả ngắn (hiện trên card)</label>
            <textarea
              value={editor.input.description}
              onChange={(e) => setInput("description", e.target.value)}
              rows={2}
              className={inputCls}
            />

            <label className={labelCls}>Ảnh (mỗi dòng một URL)</label>
            <textarea value={imagesStr} onChange={(e) => setImagesStr(e.target.value)} rows={3} className={inputCls} />
            <label className={`${btnGhostCls} mt-2 inline-block cursor-pointer`}>
              {uploading ? "Đang upload..." : "📤 Upload ảnh"}
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>

            <div className="grid gap-x-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Khoảng giá</label>
                <input
                  value={editor.input.priceRange ?? ""}
                  onChange={(e) => setInput("priceRange", textOrNull(e.target.value))}
                  className={inputCls}
                  placeholder="250–350k/người"
                />
              </div>
              <div>
                <label className={labelCls}>Thứ tự hiển thị</label>
                <input
                  type="number"
                  min={0}
                  value={editor.input.sortOrder}
                  onChange={(e) => setInput("sortOrder", Number(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>
            </div>

            <label className={labelCls}>Địa chỉ</label>
            <input
              value={editor.input.address ?? ""}
              onChange={(e) => setInput("address", textOrNull(e.target.value))}
              className={inputCls}
            />
            <label className={labelCls}>Link Google Maps</label>
            <input
              value={editor.input.mapUrl ?? ""}
              onChange={(e) => setInput("mapUrl", textOrNull(e.target.value))}
              className={inputCls}
            />
            <label className={labelCls}>Ghi chú của host (hiện trong popup)</label>
            <input
              value={editor.input.hostNote ?? ""}
              onChange={(e) => setInput("hostNote", textOrNull(e.target.value))}
              className={inputCls}
              placeholder="Quán này anh review 5 sao..."
            />

            {editor.input.type === "movie" && (
              <>
                <div className="grid gap-x-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCls}>Thể loại</label>
                    <input
                      value={editor.input.extra?.genre ?? ""}
                      onChange={(e) =>
                        setInput("extra", { ...editor.input.extra, genre: e.target.value || undefined })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Suất chiếu gợi ý</label>
                    <input
                      value={editor.input.extra?.suggestedShowtime ?? ""}
                      onChange={(e) =>
                        setInput("extra", {
                          ...editor.input.extra,
                          suggestedShowtime: e.target.value || undefined,
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                <label className={labelCls}>Link trailer</label>
                <input
                  value={editor.input.extra?.trailerUrl ?? ""}
                  onChange={(e) =>
                    setInput("extra", { ...editor.input.extra, trailerUrl: e.target.value || undefined })
                  }
                  className={inputCls}
                />
              </>
            )}

            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={editor.input.isActive}
                onChange={(e) => setInput("isActive", e.target.checked)}
              />
              Đang hiển thị cho khách
            </label>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setEditor(null)} className={btnGhostCls}>
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving} className={`${btnPrimaryCls} flex-1`}>
                {saving ? "Đang lưu..." : "Lưu 💾"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
