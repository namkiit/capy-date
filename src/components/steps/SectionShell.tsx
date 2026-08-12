"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

interface SectionShellProps {
  id: string;
  /** Nhãn nhỏ kiểu brief phía trên title, VD "HẠNG MỤC 02 — MEDIA PLAN" */
  eyebrow: string;
  title: string;
  children: ReactNode;
}

/*
 * Dùng animate (không phải whileInView): section chỉ xuất hiện sau khi user
 * hoàn thành bước trước và trang tự cuộn tới, nếu chờ vào viewport mới chạy thì
 * có lúc section nằm im vô hình.
 */
const container: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut", staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

/** Khung section chung: từng phần hiện lệch nhau, style thống nhất kiểu campaign brief */
export function SectionShell({ id, eyebrow, title, children }: SectionShellProps) {
  return (
    <motion.section
      id={id}
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-xl scroll-mt-6 px-5 py-10"
    >
      <motion.p
        variants={item}
        className="text-xs font-bold uppercase tracking-[0.18em] text-olive"
      >
        {eyebrow}
      </motion.p>
      <motion.h2 variants={item} className="mt-1.5 font-display text-2xl font-bold text-ink">
        {title}
      </motion.h2>
      <motion.div variants={item} className="mt-5">
        {children}
      </motion.div>
    </motion.section>
  );
}
