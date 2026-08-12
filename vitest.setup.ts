/**
 * jsdom không implement matchMedia, trong khi motion (useReducedMotion) và
 * confetti đều gọi tới nó. Stub tối thiểu, chỉ chạy ở test dùng environment jsdom.
 */
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
