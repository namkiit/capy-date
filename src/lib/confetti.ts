import confetti from "canvas-confetti";

/**
 * Confetti ăn mừng theo theme capybara: quả cam + lá, KHÔNG trái tim.
 * Tôn trọng prefers-reduced-motion.
 */
export function fireCelebration(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const orange = confetti.shapeFromText({ text: "🍊", scalar: 2 });
  const leaf = confetti.shapeFromText({ text: "🍃", scalar: 2 });
  const emojiDefaults = {
    spread: 75,
    ticks: 140,
    gravity: 0.9,
    scalar: 1.8,
    shapes: [orange, leaf],
  };

  confetti({ ...emojiDefaults, particleCount: 30, origin: { x: 0.15, y: 0.75 } });
  confetti({ ...emojiDefaults, particleCount: 30, origin: { x: 0.85, y: 0.75 } });
  // lớp nền chấm tròn màu palette cho dày
  confetti({
    particleCount: 60,
    spread: 100,
    ticks: 120,
    scalar: 0.9,
    shapes: ["circle"],
    colors: ["#e8874a", "#f4a259", "#8a9a5b", "#e8dcc8"],
    origin: { x: 0.5, y: 0.7 },
  });
  window.setTimeout(() => {
    confetti({ ...emojiDefaults, particleCount: 25, origin: { x: 0.5, y: 0.6 } });
  }, 300);
}
