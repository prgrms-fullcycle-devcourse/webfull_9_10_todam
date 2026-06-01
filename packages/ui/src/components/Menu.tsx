import { cloneElement } from "react";
import type { HTMLAttributes, ReactElement } from "react";
import { CheckIcon } from "../icons";

export type MenuItem = {
  label: string;
  selected?: boolean;
  // 우측 trailing 아이콘 (selected 가 아닐 때 노출). 예: 공방 등록 '+'.
  icon?: ReactElement<{ size?: number }>;
  // 비활성 항목. native disabled 로 클릭 차단 + 흐리게 표시. 예: 클래스 1개 이하 → 순서 변경 불가.
  disabled?: boolean;
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
        "flex w-full flex-col overflow-hidden rounded-xl bg-surface shadow-[0_0_10px_rgba(0,0,0,0.1)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {title && (
        <p className="p-1 text-center text-xs font-normal text-foreground-tertiary">
          {title}
        </p>
      )}
      {items.map((item, index) => (
        <button
          key={`${item.label}-${index}`}
          type="button"
          role="menuitemcheckbox"
          aria-checked={item.selected ?? false}
          disabled={item.disabled ?? false}
          onClick={() => onItemSelect?.(index)}
          className="group flex h-10 w-full items-center border-t border-border-subtle px-1 disabled:cursor-not-allowed"
        >
          <span className="flex h-8 w-full items-center justify-between gap-2.5 rounded-lg px-2 text-sm text-foreground transition-colors duration-200 ease-in-out group-hover:bg-muted group-disabled:text-foreground-disabled group-disabled:group-hover:bg-transparent">
            <span>{item.label}</span>
            {item.selected ? (
              <CheckIcon size={20} className="shrink-0 text-inverse" />
            ) : (
              item.icon &&
              cloneElement(item.icon, { size: 20 })
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
