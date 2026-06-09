import type { ReactElement } from "react";

export type SectionTitleSize = "lg" | "md" | "sm";

export type SectionTitleProps = {
  title: string;
  size?: SectionTitleSize;
  subText?: string;
  icon?: ReactElement;
  className?: string;
  // 지정 시 우측 영역(icon+subText)을 버튼으로 렌더 → 모두보기/자세히보기 네비용.
  onSubTextClick?: () => void;
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
  onSubTextClick,
}: SectionTitleProps) {
  const hasRight = icon != null || subText != null;
  const rightClassName = "flex items-center gap-1 text-foreground-tertiary text-xs";

  return (
    <div
      className={["flex items-center justify-between py-2 w-full", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={["text-foreground", titleClasses[size]].join(" ")}>
        {title}
      </span>
      {hasRight &&
        (onSubTextClick ? (
          <button
            type="button"
            onClick={onSubTextClick}
            className={`${rightClassName} cursor-pointer transition-colors hover:text-foreground-secondary`}
          >
            {icon}
            {subText && <span>{subText}</span>}
          </button>
        ) : (
          <div className={rightClassName}>
            {icon}
            {subText && <span>{subText}</span>}
          </div>
        ))}
    </div>
  );
}
