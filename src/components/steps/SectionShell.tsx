"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface SectionShellProps {
  id: string;
  /** Nhãn nhỏ kiểu brief phía trên title, VD "HẠNG MỤC 02 — MEDIA PLAN" */
  eyebrow: string;
  title: string;
  children: ReactNode;
}

/** Khung section chung: fade-in khi xuất hiện, style thống nhất kiểu campaign brief */
export function SectionShell({ id, eyebrow, title, children }: SectionShellProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto w-full max-w-xl scroll-mt-6 px-5 py-10"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{eyebrow}</p>
      <h2 className="mt-1.5 font-display text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}
