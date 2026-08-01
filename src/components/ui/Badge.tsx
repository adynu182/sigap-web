import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "brand" | "conform" | "minor" | "major" | "empty";
}

const tones: Record<string, string> = {
  brand: "bg-brand-soft text-brand-dark",
  conform: "bg-conform-soft text-conform",
  minor: "bg-minor-soft text-minor",
  major: "bg-major-soft text-major",
  empty: "bg-empty-soft text-empty",
};

export function Badge({ className, tone = "brand", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
