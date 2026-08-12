export type MascotExpression = "idle" | "happy" | "sleepy";

interface MascotProps {
  expression?: MascotExpression;
  className?: string;
}

/**
 * Mascot capybara vẽ SVG thuần (không dùng ảnh ngoài) — 3 biểu cảm:
 * idle (mắt tròn), happy (mắt cong + má hồng), sleepy (mắt nhắm + zzz).
 * Quả cam trên đầu là chữ ký của mascot, luôn hiển thị.
 */
export function Mascot({ expression = "idle", className }: MascotProps) {
  return (
    <svg
      viewBox="0 0 140 110"
      className={className}
      role="img"
      aria-label={`Capybara mascot (${expression})`}
    >
      {/* chân */}
      <rect x="32" y="92" width="9" height="12" rx="4" fill="#8b6b4f" />
      <rect x="50" y="94" width="9" height="12" rx="4" fill="#8b6b4f" />
      <rect x="72" y="94" width="9" height="12" rx="4" fill="#8b6b4f" />
      <rect x="90" y="92" width="9" height="12" rx="4" fill="#8b6b4f" />
      {/* thân */}
      <ellipse cx="62" cy="70" rx="46" ry="30" fill="#b08968" />
      {/* đầu */}
      <rect x="64" y="16" width="46" height="40" rx="19" fill="#b08968" />
      {/* tai */}
      <circle cx="72" cy="19" r="5" fill="#8b6b4f" />
      <circle cx="96" cy="16" r="5" fill="#8b6b4f" />
      {/* mõm */}
      <ellipse cx="103" cy="45" rx="13" ry="10" fill="#c9a87c" />
      <circle cx="108" cy="42" r="1.6" fill="#6f5138" />
      {/* miệng */}
      <path
        d="M100 51 q3.5 2.5 7 0"
        stroke="#6f5138"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* mắt theo biểu cảm */}
      {expression === "idle" && <circle cx="86" cy="34" r="2.8" fill="#3e2f23" />}
      {expression === "happy" && (
        <path
          d="M82 36 Q86 30.5 90 36"
          stroke="#3e2f23"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {expression === "sleepy" && (
        <path
          d="M82 34.5 H90"
          stroke="#3e2f23"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
      {/* má hồng khi vui */}
      {expression === "happy" && (
        <circle cx="82" cy="44" r="4" fill="#d99e7b" opacity="0.75" />
      )}
      {/* zzz khi ngủ */}
      {expression === "sleepy" && (
        <g fill="#8a9a5b" fontFamily="inherit" fontWeight="700">
          <text x="112" y="20" fontSize="13">
            z
          </text>
          <text x="122" y="12" fontSize="9">
            z
          </text>
        </g>
      )}
      {/* quả cam trên đầu — chữ ký capybara */}
      <circle cx="82" cy="11" r="7.5" fill="#f4a259" />
      <path
        d="M82 4.5 q0 -2.5 2.5 -3"
        stroke="#8a9a5b"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="87" cy="3.5" rx="3.4" ry="1.8" fill="#8a9a5b" transform="rotate(24 87 3.5)" />
      <circle cx="79.5" cy="8.5" r="1.8" fill="#f7bd83" />
    </svg>
  );
}
