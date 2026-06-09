export type EmptyBoxProps = {
    description: string;
    actionLabel?: string;
    action?: () => void;
    className?: string;
};

// 빈 상태 박스. 점선(dash 4 / gap 4) 테두리 + 설명 + 선택적 액션 텍스트.
// 점선 dash/gap 은 CSS border 로 정밀 제어 불가 → SVG rect strokeDasharray 로 그린다.
export function EmptyBox({ description, actionLabel, action, className }: EmptyBoxProps) {
    return (
        <div
            className={[
                'min-h-20 relative flex flex-col items-center gap-2 rounded-2xl p-4',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <svg
                className="pointer-events-none absolute inset-0 size-full text-border"
                fill="none"
                aria-hidden="true"
            >
                <rect
                    x="0.5"
                    y="0.5"
                    rx="15.5"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)' }}
                />
            </svg>

            <span className="text-xs leading-4 text-foreground-tertiary">{description}</span>

            {actionLabel && (
                <button
                    type="button"
                    onClick={action}
                    className="cursor-pointer border-b border-foreground-tertiary py-px text-xs font-semibold leading-4 text-foreground-tertiary"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
