import { Tag } from '@todam/ui';
import type { ConvenienceInfo } from '@todam/shared';

export type ConvenienceChipsProps = {
    convenienceInfo: ConvenienceInfo;
};

// 편의 정보 태그. convenienceInfo 의 true 항목만 노출. 순수 표현 컴포넌트.
// API Contract: convenienceInfo = { parking, pet, wifi }. parking·pet·wifi 노출(기능명세).
// 공방명 위 태그 행으로 배치(디자인). 표시할 항목 없으면 미노출(null).
export function ConvenienceChips({ convenienceInfo }: ConvenienceChipsProps) {
    const items = [
        { key: 'parking', label: '주차 가능', on: convenienceInfo.parking },
        { key: 'pet', label: '반려동물 동반 가능', on: convenienceInfo.pet },
        { key: 'wifi', label: 'WiFi 가능', on: convenienceInfo.wifi },
    ].filter((item) => item.on);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {items.map((item) => (
                <Tag key={item.key}>{item.label}</Tag>
            ))}
        </div>
    );
}
