import type { HTMLAttributes, ReactNode } from "react";

export type MenuItem = {
  label: string;
  selected?: boolean;
  /** 우측 트레일링 슬롯. 선택 표시 등 아이콘을 자유롭게 전달한다. */
  icon?: ReactNode;
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
        <p className="p-1 text-center text-xs font-normal leading-4 text-foreground-tertiary">
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
          className="flex items-center px-1 py-1 cursor-pointer"
        >
          <span className="flex h-8 flex-1 items-center justify-between gap-2.5 rounded-lg px-2 text-sm font-normal leading-[18px] text-foreground transition-colors duration-200 ease-in-out hover:bg-muted">
            <span>{item.label}</span>
            {item.icon && <span className="flex shrink-0">{item.icon}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
