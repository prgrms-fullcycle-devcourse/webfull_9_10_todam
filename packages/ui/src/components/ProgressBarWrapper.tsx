import type { HTMLAttributes } from "react";
import { ProgressBar, type ProgressBarSize } from "./ProgressBar";

export type ProgressBarWrapperProps = {
  value: number;
  leftLabel?: string;
  rightLabel?: string;
  size?: ProgressBarSize;
} & HTMLAttributes<HTMLDivElement>;

export function ProgressBarWrapper({
  value,
  leftLabel,
  rightLabel,
  size = "sm",
  className,
  ...props
}: ProgressBarWrapperProps) {
  const hasLabel = Boolean(leftLabel || rightLabel);

  return (
    <div
      className={["flex w-full flex-col gap-2", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {hasLabel && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-foreground-tertiary">{leftLabel}</span>
          <span className="text-xs font-medium text-foreground-tertiary">
            {rightLabel}
          </span>
        </div>
      )}
      <ProgressBar value={value} size={size} />
    </div>
  );
}
