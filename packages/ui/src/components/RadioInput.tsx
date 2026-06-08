import type { HTMLAttributes, KeyboardEvent } from "react";
import { Radio } from "./Radio";

export type RadioInputProps = {
  title: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, "onSelect" | "title">;

export function RadioInput({
  title,
  description,
  selected = false,
  disabled = false,
  onSelect,
  className,
  onClick,
  onKeyDown,
  ...props
}: RadioInputProps) {
  const select = () => {
    if (!disabled) onSelect?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      select();
    }
  };

  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) select();
      }}
      onKeyDown={handleKeyDown}
      className={[
        "flex w-full cursor-pointer min-h-16 items-center gap-3 rounded-2xl border bg-surface p-3 text-left transition-colors duration-200",
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        selected ? "border-primary-darker" : "border-border-subtle",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <Radio
        checked={selected}
        disabled={disabled}
        aria-hidden
        tabIndex={-1}
        className="pointer-events-none"
      />
      <span className="flex flex-col gap-1">
        <span
          className={[
            "text-base font-semibold leading-5",
            selected ? "text-primary-darker" : "text-foreground-secondary",
          ].join(" ")}
        >
          {title}
        </span>
        {description && (
          <span className="text-xs leading-4 text-foreground-tertiary">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}
