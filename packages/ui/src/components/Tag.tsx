import type { HTMLAttributes, ReactNode } from "react";

export type TagProps = {
  children?: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

export function Tag({ children, className, ...props }: TagProps) {
  return (
    <span
      className={[
        "inline-flex h-5 items-center rounded-sm bg-muted px-2 text-[10px] font-medium leading-[15px] text-foreground-secondary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </span>
  );
}
