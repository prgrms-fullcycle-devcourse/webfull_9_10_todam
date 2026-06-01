'use client';

// 공통 시간 입력 필드 (등록·수정 영업정보 공유). 값+핸들러 props, store 비종속.
export function TimeField({
    label,
    value,
    onChange,
    invalid,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    invalid?: boolean;
}) {
    return (
        <label className="flex flex-1 flex-col gap-2">
            <span className="px-[5px] text-sm font-semibold text-foreground-tertiary">{label}</span>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={[
                    'h-12 w-full rounded-xl border bg-surface px-4 text-base text-foreground outline-none',
                    invalid ? 'border-danger' : 'border-border-subtle',
                ].join(' ')}
            />
        </label>
    );
}
