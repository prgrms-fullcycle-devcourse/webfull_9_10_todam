import { cloneElement } from "react";
import type { ReactElement, ReactNode } from "react";

export type ToastType = "icon" | "button";

export type ToastProps = {
  type?: ToastType;
  message: ReactNode;
  icon?: ReactElement<{ size?: number }>;
  actionLabel?: string;
  onAction?: () => void;
};

export function Toast({
  type = "icon",
  message,
  icon,
  actionLabel = "취소",
  onAction,
}: ToastProps) {
  const clonedIcon = icon ? cloneElement(icon, { size: 16 }) : null;

  return (
    <div className="flex w-full items-center gap-2 rounded-xl bg-inverse/90 px-4 py-3 text-foreground-inverse">
      {clonedIcon}
      <p className="flex-1 text-base leading-5 text-foreground-inverse">
        {message}
      </p>
      {type === "button" && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 cursor-pointer text-sm leading-[18px] text-foreground-inverse underline underline-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
