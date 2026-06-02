import type { ReactNode } from "react";
import { Button } from "./Button";

export type FormBottomSheetProps = {
  title?: string;
  subTitle?: string;
  children?: ReactNode;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
  subLabel?: string;
  onSub?: () => void;
};

export function FormBottomSheet({
  title,
  subTitle,
  children,
  actionLabel = "확인",
  actionDisabled,
  onAction,
  subLabel,
  onSub,
}: FormBottomSheetProps) {
  // dim 배경 + slide/drag 애니메이션은 시트 렌더러(AppSheet)가 담당. 패널만 렌더.
  return (
    <div className="flex flex-col rounded-t-3xl bg-surface px-4 pt-6 pb-4 shadow-[0_0_10px_rgba(0,0,0,0.10)]">
      <div className="flex flex-col gap-7">
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

        {children && <div className="w-full">{children}</div>}

        <div className="flex flex-col">
          <Button
            variant="filled"
            size="lg"
            className="w-full"
            disabled={actionDisabled}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
          {subLabel && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full hover:!bg-transparent hover:!text-foreground"
              onClick={onSub}
            >
              {subLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
