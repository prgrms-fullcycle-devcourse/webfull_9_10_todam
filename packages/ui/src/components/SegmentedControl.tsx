import type { HTMLAttributes } from "react";

export type SegmentedControlProps = {
  options: string[];
  selected: number;
  onSelectedChange?: (index: number) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange">;

export function SegmentedControl({
  options,
  selected,
  onSelectedChange,
  className,
  ...props
}: SegmentedControlProps) {
  return (
    <div
      role="group"
      className={[
        "inline-flex h-10 w-full items-center gap-1 rounded-xl bg-muted p-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {options.map((option, index) => {
        const isSelected = index === selected;
        return (
          <button
            key={`${option}-${index}`}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectedChange?.(index)}
            className={[
              "flex h-full min-w-0 flex-1 basis-0 items-center justify-center truncate rounded-lg text-sm text-foreground transition-colors duration-200 ease-in-out cursor-pointer",
              isSelected ? "bg-surface font-bold shadow-sm" : "font-medium",
            ].join(" ")}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
