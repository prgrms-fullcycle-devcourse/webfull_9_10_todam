"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { StarFillIcon, StarIcon } from "../icons";

const TOTAL_STARS = 5;
const STARS = [1, 2, 3, 4, 5] as const;

export type RatingInputProps = {
  /** 현재 선택값 0~5 (0 = 미선택). 부모가 소유하는 controlled 값. */
  value: number;
  /** 별 클릭/키보드 선택 시 1~5 전달. */
  onChange: (value: number) => void;
  /** 별 한 변 px (= hit target). 기본 36. */
  size?: number;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

// 입력용 별점 — 읽기전용 `Rating` 과 별개(D20). value/onChange controlled,
// hover/focus 프리뷰만 내부 state. radiogroup + roving tabindex 로 키보드 접근.
export function RatingInput({
  value,
  onChange,
  size = 36,
  disabled = false,
  className,
  "aria-label": ariaLabel = "별점 선택",
}: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // 프리뷰 우선순위: hover/focus 중인 별 > 확정값.
  const activeCount = hovered ?? value;

  const select = (next: number) => {
    if (!disabled) onChange(next);
  };

  const focusStar = (star: number) => {
    buttonsRef.current[star - 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, star: number) => {
    if (disabled) return;
    let next: number;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(TOTAL_STARS, star + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = Math.max(1, star - 1);
        break;
      case "Home":
        next = 1;
        break;
      case "End":
        next = TOTAL_STARS;
        break;
      default:
        return;
    }
    e.preventDefault();
    select(next);
    focusStar(next);
  };

  // roving tabindex: 확정값(없으면 1번)만 Tab 진입 가능.
  const tabbableStar = value >= 1 && value <= TOTAL_STARS ? value : 1;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={["inline-flex items-center gap-1", className]
        .filter(Boolean)
        .join(" ")}
      onMouseLeave={() => setHovered(null)}
    >
      {STARS.map((star) => {
        const filled = star <= activeCount;
        const Icon = filled ? StarFillIcon : StarIcon;
        return (
          <button
            key={star}
            ref={(el) => {
              buttonsRef.current[star - 1] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star}점`}
            disabled={disabled}
            tabIndex={star === tabbableStar ? 0 : -1}
            className="inline-flex items-center justify-center disabled:cursor-not-allowed"
            style={{ width: size, height: size }}
            onClick={() => select(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onFocus={() => !disabled && setHovered(star)}
            onBlur={() => setHovered(null)}
            onKeyDown={(e) => handleKeyDown(e, star)}
          >
            <Icon
              size={size}
              className={
                filled ? "text-primary" : "text-foreground-tertiary"
              }
            />
          </button>
        );
      })}
    </div>
  );
}
