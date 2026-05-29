import type { HTMLAttributes } from "react";

export type PaginationProps = {
  count: number;
  activeIndex?: number;
} & HTMLAttributes<HTMLDivElement>;

export function Pagination({
  count,
  activeIndex = 0,
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
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className={`h-2 w-2 rounded-full ${
            index === activeIndex ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}
