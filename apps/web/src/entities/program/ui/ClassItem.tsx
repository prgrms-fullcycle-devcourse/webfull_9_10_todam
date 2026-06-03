import type { HTMLAttributes, ReactNode } from 'react';

export type ClassItemProps = {
    programName: ReactNode;
    metaItems: string[];
    price: ReactNode;
    isClosed?: boolean;
} & HTMLAttributes<HTMLDivElement>;

// 파트너 클래스 관리·공방 상세 운영 클래스 목록 공통 사용
// isClosed=true(=status INACTIVE) → dim 처리 + 비공개 라벨.
export function ClassItem({
    programName,
    metaItems,
    price,
    isClosed = false,
    className,
    ...props
}: ClassItemProps) {
    return (
        <div
            className={[
                'flex w-full items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface p-4',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            {...props}
        >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex items-center gap-1.5">
                    <span
                        className={[
                            'truncate text-base font-semibold leading-5',
                            isClosed ? 'text-foreground-tertiary' : 'text-foreground',
                        ].join(' ')}
                    >
                        {programName}
                    </span>
                    {isClosed && (
                        <span className="shrink-0 text-xs font-medium leading-4 text-foreground-tertiary">
                            비공개
                        </span>
                    )}
                </span>
                <span className="truncate text-xs font-normal leading-4 text-foreground-tertiary">
                    {metaItems.join(' ・ ')}
                </span>
            </div>
            <span
                className={[
                    'shrink-0 text-base font-medium leading-5',
                    isClosed ? 'text-foreground-tertiary' : 'text-foreground',
                ].join(' ')}
            >
                {price}
            </span>
        </div>
    );
}
