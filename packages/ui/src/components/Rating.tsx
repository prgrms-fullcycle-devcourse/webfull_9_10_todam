import type { HTMLAttributes } from "react";
import { StarFillIcon } from "../icons";

const TOTAL_STARS = 5;

export type RatingProps = {
  scope?: number;
} & HTMLAttributes<HTMLDivElement>;

export function Rating({ scope = 0, className, ...props }: RatingProps) {
  const filled = Math.min(TOTAL_STARS, Math.max(0, Math.round(scope)));

  return (
    <div
      role="img"
      aria-label={`별점 ${filled}점 (5점 만점)`}
      className={["inline-flex items-center gap-1", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {Array.from({ length: TOTAL_STARS }).map((_, index) => (
        <StarFillIcon
          key={index}
          size={12}
          className={index < filled ? "text-primary-lighter" : "text-border"}
        />
      ))}
    </div>
  );
}
