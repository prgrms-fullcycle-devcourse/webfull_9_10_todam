import type { InputHTMLAttributes, ReactElement, ReactNode } from "react";

export type TextInputProps = {
  label?: string;
  required?: boolean;
  helperText?: ReactNode;
  error?: boolean;
  icon?: ReactElement<{ size?: number }>;
} & InputHTMLAttributes<HTMLInputElement>;

export function TextInput({
  label,
  required,
  helperText,
  error,
  icon,
  className,
  disabled,
  id,
  ...props
}: TextInputProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-semibold text-foreground-tertiary"
        >
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={[
            "h-12 w-full rounded-xl border-2 bg-surface px-4 text-base text-foreground outline-none transition-colors duration-200 ease-in-out",
            "placeholder:text-foreground-tertiary",
            "focus:border-primary focus:shadow-[0_0_20px_rgba(59,69,84,0.04)]",
            "disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-secondary",
            error ? "border-danger" : "border-border",
            icon ? "pr-11" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {icon && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground-tertiary">
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
