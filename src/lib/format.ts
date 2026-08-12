const WEEKDAY_NAMES = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

/** "2026-08-20" → "Thứ Năm, 20/08/2026" — tính weekday bằng UTC nên không lệch múi giờ */
export function formatFullVietnameseDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAY_NAMES[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${weekday}, ${dd}/${mm}/${y}`;
}
