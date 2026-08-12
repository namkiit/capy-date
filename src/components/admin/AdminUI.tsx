/** Class name dùng chung cho form admin — giữ style thống nhất, không lặp chuỗi */

export const inputCls =
  "w-full rounded-xl border-2 border-latte bg-cream px-3 py-2 text-sm text-ink outline-none focus:border-capy";

export const labelCls =
  "mb-1 mt-4 block text-xs font-bold uppercase tracking-wide text-ink-soft";

export const btnPrimaryCls =
  "rounded-full bg-tangerine px-6 py-2.5 font-display font-bold text-cream shadow-md shadow-tangerine/20 active:scale-95 disabled:opacity-60";

export const btnGhostCls =
  "rounded-full border-2 border-latte px-5 py-2 font-semibold text-ink-soft hover:bg-sand";

export const cardCls = "rounded-2xl bg-sand/70 p-4";

interface StatusMessageProps {
  message: { kind: "ok" | "error"; text: string } | null;
}

export function StatusMessage({ message }: StatusMessageProps) {
  if (!message) return null;
  return (
    <p
      className={`mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold ${
        message.kind === "ok" ? "bg-olive-soft text-olive" : "bg-tangerine/10 text-tangerine"
      }`}
    >
      {message.text}
    </p>
  );
}

export type AdminMessage = StatusMessageProps["message"];
