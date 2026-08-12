import { ImageResponse } from "next/og";

/**
 * OG image khi share link qua Messenger/Zalo — chỉ có tên site + capybara,
 * KHÔNG chứa tên thật của hai người (privacy).
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Capy Date? — một proposal đang chờ được duyệt";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#faf6ef",
          gap: 24,
        }}
      >
        {/* capybara tối giản vẽ bằng svg — satori hỗ trợ inline svg */}
        <svg width="260" height="200" viewBox="0 0 140 110">
          <rect x="32" y="92" width="9" height="12" rx="4" fill="#8b6b4f" />
          <rect x="50" y="94" width="9" height="12" rx="4" fill="#8b6b4f" />
          <rect x="72" y="94" width="9" height="12" rx="4" fill="#8b6b4f" />
          <rect x="90" y="92" width="9" height="12" rx="4" fill="#8b6b4f" />
          <ellipse cx="62" cy="70" rx="46" ry="30" fill="#b08968" />
          <rect x="64" y="16" width="46" height="40" rx="19" fill="#b08968" />
          <circle cx="72" cy="19" r="5" fill="#8b6b4f" />
          <circle cx="96" cy="16" r="5" fill="#8b6b4f" />
          <ellipse cx="103" cy="45" rx="13" ry="10" fill="#c9a87c" />
          <circle cx="108" cy="42" r="1.6" fill="#6f5138" />
          <circle cx="86" cy="34" r="2.8" fill="#3e2f23" />
          <circle cx="82" cy="11" r="7.5" fill="#f4a259" />
          <ellipse cx="87" cy="3.5" rx="3.4" ry="1.8" fill="#8a9a5b" />
        </svg>
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#3e2f23",
            display: "flex",
          }}
        >
          Capy Date?
        </div>
        <div style={{ fontSize: 34, color: "#8a9a5b", display: "flex" }}>
          Một proposal quan trọng đang chờ được duyệt 🍊
        </div>
      </div>
    ),
    size
  );
}
