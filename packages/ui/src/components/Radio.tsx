import type { ButtonHTMLAttributes } from "react";

export type RadioSize = "sm" | "md";

export type RadioProps = {
  checked?: boolean;
  size?: RadioSize;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type" | "role">;

// sm = 16px(기본), md = 24px. checked 시 안쪽 도트는 border 두께로 표현.
const SIZE_CLASSES: Record<RadioSize, { box: string; checked: string }> = {
  sm: { box: "h-4 w-4", checked: "border-[5px]" },
  md: { box: "h-6 w-6", checked: "border-[6px]" },
};

export function Radio({
  checked = false,
  size = "sm",
  onCheckedChange,
  disabled,
  className,
  onClick,
  ...props
}: RadioProps) {
  const sizeClasses = SIZE_CLASSES[size];
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
        "inline-flex shrink-0 rounded-full bg-surface transition-colors duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses.box,
        checked
          ? `${sizeClasses.checked} border-primary`
          : "border-2 border-border",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
