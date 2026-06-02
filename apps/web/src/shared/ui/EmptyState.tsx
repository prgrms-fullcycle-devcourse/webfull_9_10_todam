import type { ReactNode } from 'react';

export type EmptyStateProps = {
    message: ReactNode;
    children?: ReactNode;
    className?: string;
};

// 빈 상태 공용 컴포넌트. 대부분 메시지 텍스트만 바뀐다.
export function EmptyState({ message, children, className }: EmptyStateProps) {
    return (
        <div
            className={['flex w-full flex-col items-center py-2', className]
                .filter(Boolean)
                .join(' ')}
        >
            <div className="flex flex-col items-center gap-2.5 py-2">
                <p className="text-base font-semibold leading-5 text-foreground">{message}</p>
                {children}
            </div>
        </div>
    );
}
