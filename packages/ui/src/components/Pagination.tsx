import type { HTMLAttributes } from "react";

export type PaginationProps = {
  count: number;
  activeIndex?: number;
  /** 지정 시 점이 버튼이 되어 클릭으로 해당 인덱스 이동 가능. 미지정 시 표시 전용. */
  onDotClick?: (index: number) => void;
} & HTMLAttributes<HTMLDivElement>;

export function Pagination({
  count,
  activeIndex = 0,
  onDotClick,
  className,
  ...props
}: PaginationProps) {
  return (
    <div
      className={["flex items-center gap-2", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {Array.from({ length: count }).map((_, index) => {
        const dotClass = `h-2 w-2 rounded-full ${
          index === activeIndex ? "bg-primary" : "bg-border"
        }`;
        if (!onDotClick) return <span key={index} className={dotClass} />;
        return (
          <button
            key={index}
            type="button"
            aria-label={`${index + 1}번째로 이동`}
            aria-current={index === activeIndex}
            className={dotClass}
            onClick={() => onDotClick(index)}
          />
        );
      })}
    </div>
  );
}
