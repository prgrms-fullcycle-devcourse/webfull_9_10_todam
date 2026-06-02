'use client';

// timeline.length === 0 인 경우. Figma 미확보 — 일반 EmptyState 텍스트 패턴.
// (plan §EmptyState — "디자인 추후 확보 시 갱신")
export function ArtworkDetailEmpty() {
    return (
        <p className="py-10 text-center text-sm text-foreground-tertiary">
            아직 등록된 제작 단계가 없어요.
        </p>
    );
}
