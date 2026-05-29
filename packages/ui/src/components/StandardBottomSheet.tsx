import type { ReactNode } from "react";
import { Button } from "./Button";

export type StandardBottomSheetProps = {
  title?: string;
  subTitle?: string;
  children?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  subLabel?: string;
  onSub?: () => void;
  onBackdropClick?: () => void;
};

export function StandardBottomSheet({
  title,
  subTitle,
  children,
  actionLabel = "확인",
  onAction,
  subLabel,
  onSub,
  onBackdropClick,
}: StandardBottomSheetProps) {
  return (
    <div
      className="absolute inset-0 bg-inverse/40"
      onClick={onBackdropClick}
    >
      <div
        className="absolute bottom-10 left-2 right-2 flex flex-col items-center gap-8 rounded-3xl bg-surface p-4 shadow-[0_0_10px_rgba(0,0,0,0.10)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-4 w-9 pt-[5px]">
          <div className="h-1 w-9 rounded-full bg-border" />
        </div>

        <div className="flex w-full flex-col gap-7">
          {(title || subTitle) && (
            <div className="flex flex-col gap-1">
              {title && (
                <p className="text-2xl font-bold leading-8 text-foreground">
                  {title}
                </p>
              )}
              {subTitle && (
                <p className="text-lg font-normal leading-6 text-foreground-secondary">
                  {subTitle}
                </p>
              )}
            </div>
          )}

          {children && (
            <div className="w-full">{children}</div>
          )}

          <div className="flex w-full flex-col">
            <Button variant="filled" size="lg" className="w-full" onClick={onAction}>
              {actionLabel}
            </Button>
            {subLabel && (
              <Button variant="ghost" size="lg" className="w-full hover:!bg-transparent hover:!text-foreground" onClick={onSub}>
                {subLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
