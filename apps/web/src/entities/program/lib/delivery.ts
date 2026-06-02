import { ProgramDeliveryOption } from '@todam/shared';

// 작품 수령 방법 표시 label.
export const DELIVERY_LABEL: Record<ProgramDeliveryOption, string> = {
    [ProgramDeliveryOption.DELIVERY]: '택배',
    [ProgramDeliveryOption.PICKUP]: '직접 수령',
    [ProgramDeliveryOption.CUSTOMER_SELECT]: '택배・직접 수령',
};

export function getDeliveryLabel(option: ProgramDeliveryOption): string {
    return DELIVERY_LABEL[option];
}

// 택배 옵션 노출 여부 (배송 가능한 클래스에만 택배 토글 노출).
export function isDeliveryCapable(option: ProgramDeliveryOption): boolean {
    return (
        option === ProgramDeliveryOption.DELIVERY ||
        option === ProgramDeliveryOption.CUSTOMER_SELECT
    );
}
