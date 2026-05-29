import type { HTMLAttributes } from "react";

export type ProgressBarSize = "sm" | "lg";

export type ProgressBarProps = {
  value: number;
  size?: ProgressBarSize;
} & Omit<HTMLAttributes<HTMLDivElement>, "role">;

const trackHeight: Record<ProgressBarSize, string> = {
  sm: "h-1",
  lg: "h-1.5",
};

export function ProgressBar({
  value,
  size = "lg",
  className,
  ...props
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={[
        "w-full overflow-hidden rounded-full bg-muted",
        trackHeight[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
