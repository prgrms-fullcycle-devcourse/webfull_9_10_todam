import type { ProgramDeliveryOption } from '@todam/shared';

// 대기 이미지 타입은 shared/model 단일 출처 재노출.
export type { PendingImage } from '../../../../shared/model';

// 운영 정보 수정 폼 상태
export interface ProgramOperationsFormState {
    price: number;
    capacity: number;
    leadTimeDays: number;
    durationMinutes: number;
    deliveryOption: ProgramDeliveryOption;
    childrenAllowed: boolean;
    deliveryAvailable: boolean;
}
