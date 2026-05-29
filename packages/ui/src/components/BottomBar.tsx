import type { ReactNode } from "react";

export type BottomBarProps = {
  children: ReactNode;
  className?: string;
};

export function BottomBar({ children, className }: BottomBarProps) {
  return (
    <div
      className={[
        "bg-surface border-t border-border-subtle pt-4 px-4 pb-7 w-full flex flex-col items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
