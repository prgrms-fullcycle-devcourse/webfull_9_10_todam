import { cloneElement } from "react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";

export type ButtonVariant = "filled" | "outline" | "ghost" | "overlay";
export type ButtonLayout = "onlyLabel" | "iconLabel" | "onlyIcon";
export type ButtonSize = "lg" | "sm";

export type ButtonProps = {
  variant?: ButtonVariant;
  layout?: ButtonLayout;
  size?: ButtonSize;
  icon?: ReactElement<{ size?: number }>;
  children?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClasses: Record<ButtonVariant, string> = {
  filled:
    "bg-primary text-foreground-inverse hover:opacity-90 disabled:bg-muted disabled:text-foreground-disabled disabled:opacity-100",
  outline:
    "bg-surface text-foreground border-2 border-border-subtle hover:border-primary hover:text-primary disabled:bg-muted disabled:text-foreground-disabled disabled:border-foreground-disabled",
  ghost:
    "bg-transparent text-foreground hover:bg-primary-subtle hover:text-primary disabled:text-foreground-disabled",
  overlay:
    "bg-inverse/30 text-foreground-inverse rounded-full hover:bg-inverse/50",
};

const iconSizeMap: Record<ButtonSize, number> = { lg: 24, sm: 20 };

export function Button({
  variant = "filled",
  layout = "onlyLabel",
  size = "lg",
  icon,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const isIconOnly = layout === "onlyIcon";
  const isOverlay = variant === "overlay";

  const dimensionClass =
    isIconOnly || isOverlay
      ? size === "lg"
        ? "h-14 w-14"
        : "h-10 w-10"
      : size === "lg"
        ? "h-14 px-4 gap-2"
        : "h-10 px-4 gap-2";

  const radiusClass =
    isOverlay
      ? ""
      : size === "lg"
        ? "rounded-2xl"
        : "rounded-xl";

  const textClass =
    isIconOnly
      ? ""
      : size === "lg"
        ? "text-base font-semibold"
        : "text-sm font-semibold";

  const clonedIcon = icon
    ? cloneElement(icon, { size: iconSizeMap[size] })
    : null;

  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center transition-opacity cursor-pointer disabled:cursor-not-allowed",
        dimensionClass,
        radiusClass,
        textClass,
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {layout !== "onlyLabel" && clonedIcon}
      {layout !== "onlyIcon" && children}
    </button>
  );
}
