"use client";

import { cn } from "@/lib/cn";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select
      className={cn(
        "mt-1 w-full rounded-xl bg-[rgba(0,0,0,0.35)] px-3 py-2 text-sm",
        "border border-[rgba(255,255,255,0.10)] focus-visible:outline focus-visible:outline-2",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}