import type { ReactNode } from 'react';

export type OverlayProps = {
    onClose: () => void;
    children: ReactNode;
};

// 딤 + 바깥클릭 닫기 + 중앙 정렬. @todam/ui Modal 패널을 감싸는 마운트 레이어.
export function Overlay({ onClose, children }: OverlayProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-inverse/40 p-4"
            role="dialog"
            aria-modal="true"
            onClick={onClose}
        >
            <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
