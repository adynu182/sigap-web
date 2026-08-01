import { cn } from "@/lib/utils";

const cellTones = [
  "bg-conform",
  "bg-brand",
  "bg-minor",
  "bg-brand",
  "bg-major",
  "bg-brand",
];

export function Mark({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-3 gap-[3px]", className)}>
      {cellTones.map((tone, i) => (
        <span key={i} className={cn("size-[7px] rounded-[2px]", tone)} />
      ))}
    </div>
  );
}

export function Logo({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Mark />
      <div className="leading-tight">
        <div className="font-display text-lg font-extrabold tracking-tight text-ink">
          SIGAP
        </div>
        {subtitle && (
          <div className="text-[11px] font-medium text-ink-soft -mt-0.5">
            Gap Assessment SPPG
          </div>
        )}
      </div>
    </div>
  );
}
