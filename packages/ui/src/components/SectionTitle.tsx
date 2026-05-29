import type { ReactElement } from "react";

export type SectionTitleSize = "lg" | "md" | "sm";

export type SectionTitleProps = {
  title: string;
  size?: SectionTitleSize;
  subText?: string;
  icon?: ReactElement;
  className?: string;
};

const titleClasses: Record<SectionTitleSize, string> = {
  lg: "text-2xl font-semibold",
  md: "text-lg font-semibold",
  sm: "text-xs font-semibold",
};

export function SectionTitle({
  title,
  size = "lg",
  subText,
  icon,
  className,
}: SectionTitleProps) {
  const hasRight = icon != null || subText != null;

  return (
    <div
      className={["flex items-center justify-between py-2 w-full", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={["text-foreground", titleClasses[size]].join(" ")}>
        {title}
      </span>
      {hasRight && (
        <div className="flex items-center gap-1 text-foreground-tertiary text-xs">
          {icon}
          {subText && <span>{subText}</span>}
        </div>
      )}
    </div>
  );
}
