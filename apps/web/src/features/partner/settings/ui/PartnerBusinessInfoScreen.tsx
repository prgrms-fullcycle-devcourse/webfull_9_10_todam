'use client';

import { DescriptionBlock, SpaceBlock, TextInput } from '@todam/ui';

import { useCurrentStudioId } from '@/entities/studio/model';
import { usePartnerStudioDetail } from '@/entities/studio';
import { useHeaderOverride } from '@/shared/lib/useHeaderOverride';

// 설정 - 사업자 정보. 전 항목 읽기 전용(증빙 목적, 직접 수정 불가).
export function PartnerBusinessInfoScreen() {
    const storeId = useCurrentStudioId();

    // sub 헤더 기본 우측 noti 숨김.
    useHeaderOverride({ hideRightAction: true });

    const { data, isLoading } = usePartnerStudioDetail(storeId);
    const doc = data?.store.businessDocument ?? null;

    const v = (value: string | null | undefined) => (isLoading ? '' : (value ?? ''));

    return (
        <div className="flex flex-col px-4 pb-16">
            <div className="flex flex-col gap-4 py-2">
                <TextInput
                    id="biz-number"
                    label="사업자 등록번호"
                    value={v(doc?.businessNumber)}
                    readOnly
                    disabled
                />
                <TextInput
                    id="biz-name"
                    label="상호명"
                    value={v(doc?.businessName)}
                    readOnly
                    disabled
                />
                <TextInput
                    id="biz-owner"
                    label="대표자명"
                    value={v(doc?.ownerName)}
                    readOnly
                    disabled
                />
                <TextInput
                    id="biz-address"
                    label="사업장 주소"
                    value={v(doc?.businessAddress)}
                    readOnly
                    disabled
                />
                <TextInput
                    id="biz-email"
                    label="이메일"
                    type="email"
                    value={v(doc?.email)}
                    readOnly
                    disabled
                />
            </div>

            <SpaceBlock size={8} />

            <DescriptionBlock type="negative" title="사업자 정보 수정 안내">
                사업자 정보는 증빙을 위해 직접 수정이 불가합니다. 상호명 변경이나 사업자 전환이
                필요하신 경우 고객센터로 문의해 주세요.
            </DescriptionBlock>
        </div>
    );
}
