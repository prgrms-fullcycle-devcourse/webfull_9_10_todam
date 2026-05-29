import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { Checkbox } from "./Checkbox";

export type CheckboxInputProps = {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** 기본 false(테두리 없음). true 시 border 표시. */
  bordered?: boolean;
  /** 우측 슬롯 (예: "보기" 버튼). */
  action?: ReactNode;
  disabled?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange">;

export function CheckboxInput({
  label,
  checked = false,
  onCheckedChange,
  bordered = false,
  action,
  disabled = false,
  className,
  onClick,
  onKeyDown,
  ...props
}: CheckboxInputProps) {
  const toggle = () => {
    if (!disabled) onCheckedChange?.(!checked);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) toggle();
      }}
      onKeyDown={handleKeyDown}
      className={[
        "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-surface px-3 py-3 text-left transition-colors duration-200",
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        bordered ? "border border-border-subtle" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Checkbox
          checked={checked}
          disabled={disabled}
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none"
        />
        <span className="truncate text-base text-foreground-secondary">{label}</span>
      </span>
      {action && (
        // 우측 액션 클릭은 체크 토글로 버블되지 않도록 차단
        <span onClick={(e) => e.stopPropagation()}>{action}</span>
      )}
    </div>
  );
}
