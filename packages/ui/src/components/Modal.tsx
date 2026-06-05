import type { ReactNode } from "react";
import { Button } from "./Button";

export type ModalType = "shortText" | "longText";

export type ModalProps = {
  type?: ModalType;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  danger?: boolean;
};

export function Modal({
  type = "shortText",
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
  danger = false,
}: ModalProps) {
  const confirmClassName = [
    type === "shortText" ? "flex-1" : "w-full",
    danger ? "!bg-danger hover:!bg-danger" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // 백드롭/딤/바깥클릭 닫기는 마운트 측(AppModal)이 담당. 여기선 패널만 렌더.
  return (
    <div
      className="flex w-full flex-col gap-4 rounded-3xl bg-surface p-4 shadow-[0_0_10px_rgba(0,0,0,0.10)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-3 py-3">
          <p className="text-xl font-semibold leading-6 text-foreground">
            {title}
          </p>
          {description && (
            <div className="text-base font-medium leading-6 text-foreground-secondary">
              {description}
            </div>
          )}
        </div>

        {type === "shortText" ? (
          <div className="flex gap-3">
            <Button
              variant="filled"
              size="lg"
              className="flex-1 !bg-muted !text-foreground"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
            <Button
              variant="filled"
              size="lg"
              className={confirmClassName}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              variant="filled"
              size="lg"
              className={confirmClassName}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          </div>
        )}
      </div>
  );
}
