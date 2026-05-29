import type { HTMLAttributes } from "react";

export type TooltipProps = {
  title: string;
  description?: string;
} & HTMLAttributes<HTMLDivElement>;

export function Tooltip({
  title,
  description,
  className,
  ...props
}: TooltipProps) {
  return (
    <div
      role="tooltip"
      className={[
        "inline-flex w-fit max-w-[400px] flex-col items-start gap-2 rounded-xl bg-inverse px-4 py-2.5 text-foreground-inverse",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="text-sm font-medium">{title}</span>
      {description && (
        <span className="text-sm font-normal">{description}</span>
      )}
    </div>
  );
}
