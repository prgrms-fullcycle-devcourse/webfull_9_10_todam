"use client";

import type { TextareaHTMLAttributes, ReactNode } from "react";
import { useState } from "react";

export type TextAreaProps = {
  label?: string;
  // 기본은 필수. 선택 필드만 표시(라벨에 " (선택)").
  optional?: boolean;
  actionLabel?: string;
  onActionClick?: () => void;
  helperText?: ReactNode;
  error?: boolean;
  showCount?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({
  label,
  optional,
  actionLabel,
  onActionClick,
  helperText,
  error,
  showCount,
  maxLength,
  className,
  disabled,
  id,
  value,
  defaultValue,
  onChange,
  ...props
}: TextAreaProps) {
  const isControlled = value !== undefined;
  const [internalCount, setInternalCount] = useState(
    typeof defaultValue === "string" ? defaultValue.length : 0,
  );
  const count = isControlled ? String(value ?? "").length : internalCount;

  return (
    <div className="flex w-full flex-col gap-2">
      {(label || actionLabel) && (
        <div className="flex items-center justify-between">
          {label ? (
            <label
              htmlFor={id}
              className="text-sm font-semibold text-foreground-tertiary"
            >
              {label}
              {optional && <span className="font-normal"> (선택)</span>}
            </label>
          ) : (
            <span />
          )}
          {actionLabel && (
            <button
              type="button"
              onClick={onActionClick}
              className="cursor-pointer text-sm font-semibold text-primary"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
      <textarea
        id={id}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={error || undefined}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          if (!isControlled) setInternalCount(e.target.value.length);
          onChange?.(e);
        }}
        className={[
          "min-h-[120px] w-full resize-none rounded-xl border bg-surface px-4 py-3 text-base text-foreground outline-none transition-colors duration-200 ease-in-out",
          "placeholder:text-foreground-tertiary",
          "focus:border-primary focus:shadow-[0_0_20px_rgba(59,69,84,0.04)]",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-secondary",
          error ? "border-danger" : "border-border-subtle",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {(helperText || showCount) && (
        <div className="flex items-center justify-between gap-2">
          <span
            className={[
              "text-xs",
              error ? "text-danger" : "text-foreground-tertiary",
            ].join(" ")}
          >
            {helperText}
          </span>
          {showCount && (
            <span className="text-xs text-foreground-tertiary">
              {count} / {maxLength ?? 0}자
            </span>
          )}
        </div>
      )}
    </div>
  );
}
