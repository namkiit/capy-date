"use client";

import dynamic from "next/dynamic";
import { Mascot } from "@/components/Mascot";
import type { ContentConfig } from "@/lib/types";

/**
 * InviteFlow render client-only (ssr:false) để đọc localStorage ngay trong
 * useState initializer mà không gây hydration mismatch. Site noindex nên
 * không cần SSR content.
 */
const InviteFlow = dynamic(
  () => import("./InviteFlow").then((m) => m.InviteFlow),
  {
    ssr: false,
    loading: () => (
      <main className="flex min-h-svh items-center justify-center">
        <Mascot expression="sleepy" className="w-36 animate-pulse" />
      </main>
    ),
  }
);

interface InviteFlowLoaderProps {
  content: ContentConfig;
}

export function InviteFlowLoader({ content }: InviteFlowLoaderProps) {
  return <InviteFlow content={content} />;
}
