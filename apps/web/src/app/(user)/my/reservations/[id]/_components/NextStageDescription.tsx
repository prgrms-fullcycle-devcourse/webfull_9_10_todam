'use client';

import { DescriptionBlock, SparkleIcon } from '@todam/ui';

// 디자인 정본 (변형 A — 체험 전) — Figma `8087:1249` type=default DescriptionBlock.
// "다음 단계" + 정해진 안내 문구.
// status=CONFIRMED/PENDING 등 체험 전 구간에서 표시.
export function NextStageDescription() {
    return (
        <DescriptionBlock title="다음 단계" icon={<SparkleIcon />}>
            체험이 끝나면 작품 제작 과정을 공유해 드릴게요. 내가 만든 작품이 완성되는 과정을 이
            곳에서 지켜볼 수 있어요.
        </DescriptionBlock>
    );
}
