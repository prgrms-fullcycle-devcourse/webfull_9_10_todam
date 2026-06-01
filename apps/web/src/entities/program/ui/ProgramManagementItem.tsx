import type { HTMLAttributes, ReactNode } from 'react';

export type ProgramManagementItemProps = {
    programName: ReactNode;
    // 서브텍스트 항목들. `・` 로 구분 렌더링. 예: ['기본', '2시간', '평균 28일'].
    metaItems: string[];
    price: ReactNode;
    // 비공개(INACTIVE) 상태 표현. true 면 흐리게 + '비공개' 표기.
    isClosed?: boolean;
} & HTMLAttributes<HTMLDivElement>;

// 파트너 클래스 관리 카드. white 카드, 좌(클래스명+메타) / 우(가격) space-between.
// isClosed=true(=status INACTIVE) → dim 처리 + 비공개 라벨.
export function ProgramManagementItem({
    programName,
    metaItems,
    price,
    isClosed = false,
    className,
    ...props
}: ProgramManagementItemProps) {
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
