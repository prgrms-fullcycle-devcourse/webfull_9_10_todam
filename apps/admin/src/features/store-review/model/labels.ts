import { BusinessState, StoreStatus, VerificationStatus } from '@todam/shared';
import type { BadgeTone } from '@todam/ui';

// 공방 상태 한글 라벨 + 디자인 시스템 배지 톤 매핑.
export const STORE_STATUS_LABEL: Record<StoreStatus, string> = {
    [StoreStatus.DRAFT]: '작성중',
    [StoreStatus.PENDING]: '검수대기',
    [StoreStatus.PUBLISHED]: '노출중',
    [StoreStatus.REJECTED]: '반려',
    [StoreStatus.SUSPENDED]: '노출중단',
};

export const STORE_STATUS_TONE: Record<StoreStatus, BadgeTone> = {
    [StoreStatus.DRAFT]: 'neutral',
    [StoreStatus.PENDING]: 'secondary',
    [StoreStatus.PUBLISHED]: 'success',
    [StoreStatus.REJECTED]: 'danger',
    [StoreStatus.SUSPENDED]: 'info',
};

// 검수 목록 필터로 노출하는 상태 순서(DRAFT 제외 — 어드민 검수 대상 아님).
export const STORE_STATUS_FILTERS: StoreStatus[] = [
    StoreStatus.PENDING,
    StoreStatus.PUBLISHED,
    StoreStatus.REJECTED,
    StoreStatus.SUSPENDED,
];

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
    [VerificationStatus.PENDING]: '미확인',
    [VerificationStatus.VERIFIED]: '진위확인',
    [VerificationStatus.MISMATCH]: '불일치',
    [VerificationStatus.ERROR]: '확인오류',
};

export const VERIFICATION_STATUS_TONE: Record<VerificationStatus, BadgeTone> = {
    [VerificationStatus.PENDING]: 'neutral',
    [VerificationStatus.VERIFIED]: 'success',
    [VerificationStatus.MISMATCH]: 'danger',
    [VerificationStatus.ERROR]: 'danger',
};

export const BUSINESS_STATE_LABEL: Record<BusinessState, string> = {
    [BusinessState.ACTIVE]: '계속사업자',
    [BusinessState.CLOSED]: '폐업',
    [BusinessState.SUSPENDED]: '휴업',
};

export const BUSINESS_STATE_TONE: Record<BusinessState, BadgeTone> = {
    [BusinessState.ACTIVE]: 'success',
    [BusinessState.CLOSED]: 'danger',
    [BusinessState.SUSPENDED]: 'secondary',
};
