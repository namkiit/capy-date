"use client";

import { useEffect, useState } from "react";
import {
  StatusMessage,
  btnPrimaryCls,
  inputCls,
  labelCls,
  type AdminMessage,
} from "@/components/admin/AdminUI";
import { adminApi } from "@/lib/admin-client";
import type { AppConfig, ContentConfig, TimelineDurations } from "@/lib/types";

/** Textarea nhập danh sách — mỗi dòng một mục */
function toLines(items: string[]): string {
  return items.join("\n");
}

function fromLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export default function AdminContentPage() {
  const [content, setContent] = useState<ContentConfig | null>(null);
  const [durations, setDurations] = useState<TimelineDurations | null>(null);
  const [captionsStr, setCaptionsStr] = useState("");
  const [vibesStr, setVibesStr] = useState("");
  const [colorsStr, setColorsStr] = useState("");
  const [dressImagesStr, setDressImagesStr] = useState("");
  const [message, setMessage] = useState<AdminMessage>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi<{ config: AppConfig }>("/api/admin/config")
      .then(({ config }) => {
        setContent(config.content);
        setDurations(config.durations);
        setCaptionsStr(toLines(config.content.noButtonCaptions));
        setVibesStr(toLines(config.content.vibeChoices));
        setColorsStr(config.content.dresscode.colors.join(", "));
        setDressImagesStr(toLines(config.content.dresscode.imageUrls));
      })
      .catch((err) =>
        setMessage({ kind: "error", text: err instanceof Error ? err.message : "Lỗi tải config" })
      );
  }, []);

  if (!content || !durations) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Nội dung ✏️</h1>
        <StatusMessage message={message} />
        {!message && <p className="mt-4 text-ink-soft">Đang tải...</p>}
      </div>
    );
  }

  function set<K extends keyof ContentConfig>(key: K, value: ContentConfig[K]) {
    setContent((prev) => (prev === null ? prev : { ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!content || !durations) return;
    const colors = colorsStr
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (!colors.every((c) => /^#[0-9a-fA-F]{6}$/.test(c))) {
      setMessage({ kind: "error", text: "Màu dresscode phải dạng #rrggbb, cách nhau dấu phẩy" });
      return;
    }
    const captions = fromLines(captionsStr);
    if (captions.length < 2) {
      setMessage({ kind: "error", text: "Cần ít nhất 2 caption nút No (dòng cuối dùng khi hết lượt)" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await adminApi("/api/admin/config", {
        method: "PUT",
        body: JSON.stringify({
          content: {
            ...content,
            noButtonCaptions: captions,
            vibeChoices: fromLines(vibesStr),
            dresscode: { ...content.dresscode, colors, imageUrls: fromLines(dressImagesStr) },
          },
          durations,
        }),
      });
      setMessage({ kind: "ok", text: "Đã lưu nội dung ✓" });
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Lưu thất bại" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Nội dung ✏️</h1>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Tên site</label>
          <input value={content.siteName} onChange={(e) => set("siteName", e.target.value)} className={inputCls} />
        </div>
        <div />
        <div>
          <label className={labelCls}>Tên host (anh)</label>
          <input value={content.hostName} onChange={(e) => set("hostName", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Tên khách mời (em)</label>
          <input value={content.guestName} onChange={(e) => set("guestName", e.target.value)} className={inputCls} />
        </div>
      </div>

      <label className={labelCls}>Lời mở đầu (landing)</label>
      <textarea value={content.landingIntro} onChange={(e) => set("landingIntro", e.target.value)} rows={3} className={inputCls} />

      <label className={labelCls}>Câu hỏi Yes/No</label>
      <input value={content.yesNoQuestion} onChange={(e) => set("yesNoQuestion", e.target.value)} className={inputCls} />

      <label className={labelCls}>Caption nút No (mỗi dòng một câu, dòng cuối = khi hết lượt né)</label>
      <textarea value={captionsStr} onChange={(e) => setCaptionsStr(e.target.value)} rows={6} className={inputCls} />

      <label className={labelCls}>Điểm đón (hiện trong timeline)</label>
      <input value={content.pickupPlace} onChange={(e) => set("pickupPlace", e.target.value)} className={inputCls} />

      <h2 className="mt-6 font-display text-lg font-bold text-ink">Dresscode 🧥</h2>
      <label className={labelCls}>Mô tả</label>
      <textarea
        value={content.dresscode.description}
        onChange={(e) => set("dresscode", { ...content.dresscode, description: e.target.value })}
        rows={3}
        className={inputCls}
      />
      <label className={labelCls}>Bảng màu (#rrggbb, cách nhau dấu phẩy)</label>
      <input value={colorsStr} onChange={(e) => setColorsStr(e.target.value)} className={inputCls} />
      <label className={labelCls}>Ảnh mood (mỗi dòng một URL)</label>
      <textarea value={dressImagesStr} onChange={(e) => setDressImagesStr(e.target.value)} rows={2} className={inputCls} />
      <label className={labelCls}>Lựa chọn vibe (mỗi dòng một lựa chọn)</label>
      <textarea value={vibesStr} onChange={(e) => setVibesStr(e.target.value)} rows={3} className={inputCls} />

      <h2 className="mt-6 font-display text-lg font-bold text-ink">Luồng & thời lượng ⏱️</h2>
      <div className="mt-2 flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={content.allowSkipMovie}
            onChange={(e) => set("allowSkipMovie", e.target.checked)}
          />
          Cho phép bỏ qua phim
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={content.allowSkipCafe}
            onChange={(e) => set("allowSkipCafe", e.target.checked)}
          />
          Cho phép bỏ qua cafe
        </label>
      </div>
      <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
        {(
          [
            ["pickupMinutes", "Đón (phút)"],
            ["foodMinutes", "Ăn (phút)"],
            ["movieMinutes", "Phim (phút)"],
            ["cafeMinutes", "Cafe (phút)"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <input
              type="number"
              min={0}
              value={durations[key]}
              onChange={(e) =>
                setDurations((prev) =>
                  prev === null ? prev : { ...prev, [key]: Number(e.target.value) || 0 }
                )
              }
              className={inputCls}
            />
          </div>
        ))}
      </div>

      <StatusMessage message={message} />
      <button onClick={handleSave} disabled={saving} className={`${btnPrimaryCls} mt-4`}>
        {saving ? "Đang lưu..." : "Lưu nội dung 💾"}
      </button>
    </div>
  );
}
