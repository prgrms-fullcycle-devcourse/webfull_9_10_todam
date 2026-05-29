import type { ButtonHTMLAttributes } from "react";

export type RadioProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type" | "role">;

export function Radio({
  checked = false,
  onCheckedChange,
  disabled,
  className,
  onClick,
  ...props
}: RadioProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onCheckedChange?.(!checked);
      }}
      className={[
        "inline-flex h-6 w-6 shrink-0 rounded-full bg-surface transition-colors duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-[6px] border-primary" : "border-2 border-border",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
