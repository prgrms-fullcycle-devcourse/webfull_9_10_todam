import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";

export type StandardBottomSheetProps = {
  title?: string;
  subTitle?: string;
  children?: ReactNode;
  actionLabel?: string;
  actionVariant?: ButtonVariant;
  actionDisabled?: boolean;
  onAction?: () => void;
  subLabel?: string;
  onSub?: () => void;
};

export function StandardBottomSheet({
  title,
  subTitle,
  children,
  actionLabel = "확인",
  actionVariant = "filled",
  actionDisabled,
  onAction,
  subLabel,
  onSub,
}: StandardBottomSheetProps) {
  // dim 배경 + slide/drag 애니메이션은 시트 렌더러(AppSheet)가 담당. 패널만 렌더.
  return (
    <div className="mx-2 mb-10 flex flex-col items-center gap-8 rounded-3xl bg-surface p-4 shadow-[0_0_10px_rgba(0,0,0,0.10)]">
      <div className="h-4 w-9 cursor-pointer pt-[5px]">
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
          <Button variant={actionVariant} size="lg" className="w-full" disabled={actionDisabled} onClick={onAction}>
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
  );
}
