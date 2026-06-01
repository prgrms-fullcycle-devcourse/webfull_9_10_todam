import { cloneElement } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";

export type BadgeTone =
  | "info"
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  info: "bg-info-subtle text-info-darker",
  primary: "bg-primary-subtle text-primary-darker",
  secondary: "bg-secondary-subtle text-secondary-darker",
  success: "bg-success-subtle text-success-darker",
  danger: "bg-danger-subtle text-danger-darker",
  warning: "bg-warning-subtle text-warning-darker",
  neutral: "bg-muted text-foreground-secondary",
};

export type BadgeProps = {
  tone?: BadgeTone;
  icon?: ReactElement<{ size?: number }>;
  children?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

export function Badge({
  tone = "info",
  icon,
  children,
  className,
  ...props
}: BadgeProps) {
  const clonedIcon = icon ? cloneElement(icon, { size: 12 }) : null;

  return (
    <span
      className={[
        "inline-flex h-5 items-center gap-1 rounded-full px-2",
        toneClasses[tone],
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
