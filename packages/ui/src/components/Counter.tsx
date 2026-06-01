import { Button } from "./Button";
import { MinusCircleIcon, PlusCircleIcon } from "../icons";

export type CounterProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
};

// 숫자 +/- 카운터. min/max 경계를 내부에서 처리한다.
export function Counter({
  value,
  onChange,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  disabled = false,
  className,
}: CounterProps) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <div
      className={[
        "flex h-12 items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Button
        variant="ghost"
        layout="onlyIcon"
        size="sm"
        icon={<MinusCircleIcon />}
        aria-label="감소"
        disabled={disabled || value <= min}
        onClick={decrement}
        className="hover:!bg-transparent"
      />
      <span className="min-w-3 text-center text-base text-foreground-secondary">
        {value}
      </span>
      <Button
        variant="ghost"
        layout="onlyIcon"
        size="sm"
        icon={<PlusCircleIcon />}
        aria-label="증가"
        disabled={disabled || value >= max}
        onClick={increment}
        className="hover:!bg-transparent"
      />
    </div>
  );
}
