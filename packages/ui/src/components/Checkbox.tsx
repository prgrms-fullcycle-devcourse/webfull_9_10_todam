import type { ButtonHTMLAttributes } from "react";
import { CheckIcon } from "../icons";

export type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type" | "role">;

export function Checkbox({
  checked = false,
  onCheckedChange,
  disabled,
  className,
  onClick,
  ...props
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onCheckedChange?.(!checked);
      }}
      className={[
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-primary border-primary text-foreground-inverse"
          : "bg-muted border-border",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {checked && <CheckIcon size={18} />}
    </button>
  );
}
