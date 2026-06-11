import type { ReactNode } from 'react';

// 상세 화면 섹션 카드 + 라벨/값 행. 디자인 토큰(surface/border/foreground) 기준.

export function DetailCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-5">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <dl className="flex flex-col gap-3">{children}</dl>
        </section>
    );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex gap-4 text-sm">
            <dt className="w-28 shrink-0 text-foreground-tertiary">{label}</dt>
            <dd className="flex-1 text-foreground">{children ?? '-'}</dd>
        </div>
    );
}
