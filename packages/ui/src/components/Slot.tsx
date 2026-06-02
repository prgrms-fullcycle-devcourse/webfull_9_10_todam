import type { ButtonHTMLAttributes, ReactNode } from "react";

export type SlotProps = {
  children?: ReactNode;
  selected?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

// 선택형 슬롯. 상태: default / selected / disabled.
export function Slot({
  children,
  selected = false,
  disabled = false,
  className,
  ...props
}: SlotProps) {
  const base =
    "inline-flex h-12 items-center justify-center rounded-2xl px-4 text-base leading-5 transition-colors";
  const state = disabled
    ? "cursor-not-allowed border border-border-subtle bg-transparent font-normal text-foreground-disabled"
    : selected
      ? "bg-inverse font-semibold text-foreground-inverse"
      : "cursor-pointer border border-border-subtle bg-surface font-normal text-foreground-secondary";

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      className={[base, state, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
