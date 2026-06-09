'use client';

import { CheckIcon, StandardBottomSheet } from '@todam/ui';
import { DeliveryCarrier } from '@todam/shared';

// 택배사 enum → 한글 라벨. contract DeliveryCarrier(6종) 기준.
export const CARRIER_LABEL: Record<DeliveryCarrierValue, string> = {
    CJ_LOGISTICS: 'CJ대한통운',
    LOTTE: '롯데택배',
    HANJIN: '한진택배',
    KOREA_POST: '우체국 택배',
    LOGEN: '로젠택배',
    COUPANG_LOGISTICS: '쿠팡로지스틱스',
};

export type DeliveryCarrierValue = (typeof DeliveryCarrier)[keyof typeof DeliveryCarrier];

const CARRIERS = Object.values(DeliveryCarrier) as DeliveryCarrierValue[];

export interface CarrierSelectSheetProps {
    selected: DeliveryCarrierValue | null;
    onSelect: (carrier: DeliveryCarrierValue) => void;
    onClose: () => void;
}

function CarrierRow({
    carrier,
    selected,
    onClick,
}: {
    carrier: DeliveryCarrierValue;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full cursor-pointer items-center bg-surface text-left transition-colors hover:bg-muted"
        >
            <span className="flex min-w-0 flex-1 items-center py-4">
                <span className="text-base font-medium text-foreground">
                    {CARRIER_LABEL[carrier]}
                </span>
            </span>
            {selected && <CheckIcon size={16} className="shrink-0 text-primary" />}
        </button>
    );
}

export function CarrierSelectSheet({ selected, onSelect, onClose }: CarrierSelectSheetProps) {
    return (
        <StandardBottomSheet
            title="택배사를 선택해 주세요"
            actionLabel="닫기"
            actionVariant="ghost"
            onAction={onClose}
        >
            <div className="flex flex-col gap-2">
                {CARRIERS.map((carrier) => (
                    <CarrierRow
                        key={carrier}
                        carrier={carrier}
                        selected={carrier === selected}
                        onClick={() => {
                            onSelect(carrier);
                            onClose();
                        }}
                    />
                ))}
            </div>
        </StandardBottomSheet>
    );
}
