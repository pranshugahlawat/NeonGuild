"use client";

import { cn } from "@/lib/cn";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "solid" | "ghost" | "danger";
  }
) {
  const { className, variant = "solid", ...rest } = props;

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 disabled:opacity-60 disabled:cursor-not-allowed";

  const styles =
    variant === "solid"
      ? "bg-neon text-black shadow-neon2 hover:opacity-90"
      : variant === "danger"
        ? "bg-[rgba(255,77,109,0.18)] hover:bg-[rgba(255,77,109,0.28)]"
        : "bg-panel2 hover:bg-[rgba(255,255,255,0.14)]";

  return <button className={cn(base, styles, className)} {...rest} />;
}