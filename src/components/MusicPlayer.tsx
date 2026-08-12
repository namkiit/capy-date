"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

/** Nguồn nhạc — thay file cùng tên là đổi được bài, không cần sửa code */
const MUSIC_SRC = "/music/lofi.mp3";
/** CC BY 4.0 bắt buộc ghi công tác giả */
export const MUSIC_CREDIT = "Chill beats 001 — Mo71 (CC BY 4.0)";

const STORAGE_KEY = "capy-date-music";
/** Nhạc nền chỉ làm nền — to quá là phá */
const TARGET_VOLUME = 0.25;
const FADE_MS = 1400;

export interface MusicPlayerHandle {
  /**
   * Bắt đầu phát. Phải gọi TRONG event handler của một cú bấm thật (nút
   * "Xem brief") — trình duyệt chặn phát nhạc có tiếng khi trang chưa có
   * tương tác, iOS Safari còn khắt khe hơn nếu gọi trễ ngoài gesture.
   */
  start: () => void;
}

interface MusicPlayerProps {
  ref?: Ref<MusicPlayerHandle>;
}

function readWanted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function persistWanted(wanted: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, wanted ? "on" : "off");
  } catch {
    // storage bị chặn — chỉ mất việc nhớ lựa chọn, không ảnh hưởng phát nhạc
  }
}

/** Nhạc nền lofi + nút loa bật/tắt, nhớ lựa chọn của khách */
export function MusicPlayer({ ref }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeTimer = useRef<number | null>(null);
  /** File nhạc có tồn tại không — host xóa file thì ẩn hẳn nút */
  const [available, setAvailable] = useState(true);
  const [playing, setPlaying] = useState(false);
  /** Trình duyệt chặn phát tự động → mời khách bấm nút loa */
  const [blocked, setBlocked] = useState(false);

  /*
   * Dùng interval + mốc thời gian thật thay cho requestAnimationFrame: rAF
   * ngừng chạy khi tab bị ẩn, khiến âm lượng kẹt ở 0 nếu khách chuyển tab ngay
   * lúc nhạc vừa bật. Interval bị bóp còn ~1 nhịp/giây ở nền nhưng vẫn tới đích.
   */
  const fadeTo = useCallback((target: number, onDone?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeTimer.current !== null) clearInterval(fadeTimer.current);
    const from = audio.volume;
    const startedAt = performance.now();
    fadeTimer.current = window.setInterval(() => {
      const el = audioRef.current;
      if (!el) return;
      const progress = Math.min(1, (performance.now() - startedAt) / FADE_MS);
      el.volume = from + (target - from) * progress;
      if (progress >= 1) {
        if (fadeTimer.current !== null) clearInterval(fadeTimer.current);
        fadeTimer.current = null;
        onDone?.();
      }
    }, 40);
  }, []);

  /** Media đã chạy thật — bám sự kiện của phần tử audio thay vì đoán qua promise */
  const handlePlaying = useCallback(() => {
    setPlaying(true);
    setBlocked(false);
    fadeTo(TARGET_VOLUME);
  }, [fadeTo]);

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    // Chrome hoãn tải media (suspend) cho tới khi load() được gọi tường minh,
    // khiến play() nằm chờ mãi vì chưa có byte nào
    if (audio.readyState === 0) audio.load();
    // Chrome/Safari từ chối phát khi chưa đủ điều kiện — không phải lỗi, chờ khách bấm nút loa
    audio.play().catch(() => setBlocked(true));
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      start: () => {
        // đọc lại localStorage thay vì state: đây là nguồn sự thật, và tránh
        // giữ giá trị cũ trong closure của handle
        if (!readWanted()) return;
        startMusic();
      },
    }),
    [startMusic]
  );

  useEffect(
    () => () => {
      if (fadeTimer.current !== null) clearInterval(fadeTimer.current);
    },
    []
  );

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      persistWanted(false);
      fadeTo(0, () => audioRef.current?.pause());
      return;
    }
    persistWanted(true);
    startMusic();
  }, [playing, fadeTo, startMusic]);

  return (
    <>
      <audio
        ref={audioRef}
        src={MUSIC_SRC}
        loop
        preload="auto"
        onPlaying={handlePlaying}
        onPause={() => setPlaying(false)}
        onError={() => setAvailable(false)}
      />
      {available && (
        <motion.button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
          title={`Nhạc nền: ${MUSIC_CREDIT}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-4 left-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border-2 border-latte bg-cream/90 text-lg shadow-md backdrop-blur"
        >
          {playing ? (
            /* 3 vạch nhún như thanh equalizer khi đang phát */
            <span className="flex h-4 items-end gap-[3px]" aria-hidden>
              {[0, 0.18, 0.36].map((delay, i) => (
                <motion.span
                  key={delay}
                  className="w-[3px] rounded-full bg-capy-deep"
                  animate={{ height: ["35%", "100%", "45%", "85%", "35%"] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay, ease: "easeInOut" }}
                  style={{ height: i === 1 ? "100%" : "50%" }}
                />
              ))}
            </span>
          ) : (
            <motion.span
              aria-hidden
              animate={blocked ? { scale: [1, 1.15, 1] } : undefined}
              transition={
                blocked ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined
              }
            >
              🔈
            </motion.span>
          )}
        </motion.button>
      )}
    </>
  );
}
