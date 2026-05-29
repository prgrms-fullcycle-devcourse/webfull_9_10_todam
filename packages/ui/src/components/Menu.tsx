import type { HTMLAttributes } from "react";
import { CheckIcon } from "../icons";

export type MenuItem = {
  label: string;
  selected?: boolean;
};

export type MenuProps = {
  title?: string;
  items: MenuItem[];
  onItemSelect?: (index: number) => void;
} & HTMLAttributes<HTMLDivElement>;

export function Menu({
  title,
  items,
  onItemSelect,
  className,
  ...props
}: MenuProps) {
  return (
    <div
      role="menu"
      className={[
        "flex w-full flex-col divide-y divide-border-subtle overflow-hidden rounded-xl bg-surface shadow-[0_0_10px_rgba(0,0,0,0.1)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {title && (
        <p className="px-5 py-4 text-center text-xs font-normal text-foreground-tertiary">
          {title}
        </p>
      )}
      {items.map((item, index) => (
        <button
          key={`${item.label}-${index}`}
          type="button"
          role="menuitemcheckbox"
          aria-checked={item.selected ?? false}
          onClick={() => onItemSelect?.(index)}
          className="flex items-center justify-between gap-4 px-5 py-4 text-sm text-foreground transition-colors duration-200 ease-in-out cursor-pointer hover:bg-muted"
        >
          <span>{item.label}</span>
          {item.selected && (
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-inverse text-foreground-inverse">
              <CheckIcon size={18} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
