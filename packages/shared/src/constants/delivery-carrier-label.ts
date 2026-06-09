import { DeliveryCarrier } from '../contracts/partner-artwork-management';

// 택배사 enum → 한글 표시 라벨.
// DeliveryCarrier(contract enum)가 SSOT. FE 여러 화면(수령 정보 입력/배송 시작 등)이 공유한다.
export type DeliveryCarrierValue = (typeof DeliveryCarrier)[keyof typeof DeliveryCarrier];

export const DELIVERY_CARRIER_LABEL: Record<DeliveryCarrierValue, string> = {
    CJ_LOGISTICS: 'CJ대한통운',
    LOTTE: '롯데택배',
    HANJIN: '한진택배',
    KOREA_POST: '우체국 택배',
    LOGEN: '로젠택배',
    COUPANG_LOGISTICS: '쿠팡로지스틱스',
};
