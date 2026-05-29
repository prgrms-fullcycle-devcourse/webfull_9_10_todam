import { cloneElement } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type BadgeProps = {
  icon?: ReactElement<{ size?: number }>;
  children?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

export function Badge({ icon, children, className, ...props }: BadgeProps) {
  const clonedIcon = icon ? cloneElement(icon, { size: 12 }) : null;

  return (
    <span
      className={[
        "inline-flex h-5 items-center gap-1 rounded-full bg-info-subtle px-2 text-info-darker",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {clonedIcon}
      {children && (
        <span className="text-[10px] font-medium leading-[15px]">
          {children}
        </span>
      )}
    </span>
  );
}
