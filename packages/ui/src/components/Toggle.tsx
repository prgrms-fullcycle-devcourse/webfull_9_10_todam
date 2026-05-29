import type { ButtonHTMLAttributes } from "react";

export type ToggleProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type" | "role">;

export function Toggle({
  checked = false,
  onCheckedChange,
  disabled,
  className,
  onClick,
  ...props
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onCheckedChange?.(!checked);
      }}
      className={[
        "inline-flex h-6 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-muted",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span
        className={[
          "h-5 w-5 rounded-full bg-surface shadow-sm transition-transform duration-200 ease-in-out",
          checked ? "translate-x-6" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
