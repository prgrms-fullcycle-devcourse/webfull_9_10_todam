import type { ButtonHTMLAttributes, ReactNode } from "react";

export type StatusFilterChipProps = {
  selected?: boolean;
  count?: number;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function StatusFilterChip({
  selected = false,
  count,
  children,
  className,
  type = "button",
  ...props
}: StatusFilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[
        "inline-flex h-8 items-center gap-1 rounded-full px-3 text-sm cursor-pointer disabled:cursor-not-allowed",
        selected
          ? "bg-inverse font-medium text-foreground-inverse"
          : "border border-border bg-surface font-normal text-foreground-secondary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span>{children}</span>
      {count !== undefined && <span>{count}</span>}
    </button>
  );
}
