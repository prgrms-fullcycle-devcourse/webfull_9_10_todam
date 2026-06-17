import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";

export type TextInputProps = {
  label?: string;
  // 기본은 필수. 선택 필드만 표시(라벨에 " (선택)").
  optional?: boolean;
  helperText?: ReactNode;
  error?: boolean;
  icon?: ReactElement<{ size?: number }>;
  // 아이콘 위치. 기본 trailing(우측, 기존 동작 유지). leading=좌측.
  iconPosition?: "leading" | "trailing";
} & InputHTMLAttributes<HTMLInputElement>;

export function TextInput({
  label,
  optional,
  helperText,
  error,
  icon,
  iconPosition = "trailing",
  className,
  disabled,
  id,
  ...props
}: TextInputProps) {
  const leading = Boolean(icon) && iconPosition === "leading";
  const trailing = Boolean(icon) && iconPosition === "trailing";
  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold text-foreground-tertiary"
        >
          {label}
          {optional && <span className="font-normal"> (선택)</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={[
            "h-12 w-full rounded-xl border bg-surface px-4 text-base text-foreground outline-none transition-colors duration-200 ease-in-out",
            "placeholder:text-foreground-tertiary",
            "focus:border-primary focus:shadow-[0_0_20px_rgba(59,69,84,0.04)]",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-secondary",
            error ? "border-danger" : "border-border-subtle",
            trailing ? "pr-11" : "",
            leading ? "pl-11" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {icon && (
          <span
            className={[
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-foreground-tertiary",
              leading ? "left-4" : "right-4",
            ].join(" ")}
          >
            {icon}
          </span>
        )}
      </div>
      {helperText && (
        <p
          className={[
            "text-xs",
            error ? "text-danger" : "text-foreground-tertiary",
          ].join(" ")}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
