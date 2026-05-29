import { cloneElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

export type FilterDropdownProps = {
  icon?: ReactElement<{ size?: number }>;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function FilterDropdown({
  icon,
  children,
  className,
  type = "button",
  ...props
}: FilterDropdownProps) {
  const clonedIcon = icon ? cloneElement(icon, { size: 16 }) : null;

  return (
    <button
      type={type}
      className={[
        "inline-flex h-8 items-center gap-1 rounded-r-full border-y border-r border-border-strong bg-surface pl-1 pr-2 text-sm font-medium text-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {clonedIcon}
      {children && <span>{children}</span>}
    </button>
  );
}
