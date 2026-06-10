import type { ProgramDifficulty, ProgramStatus } from './program.repository';

export interface ProgramDetailImage {
    imageUrl: string;
    // 파트너 상세에서만 채워진다(편집 화면 이미지 삭제·대표지정용). 퍼블릭 상세는 생략.
    programImageId?: string;
    isThumbnail?: boolean;
}

export interface ProgramDetail {
    id: string;
    storeId: string;
    title: string;
    description: string | null;
    materials: string | null;
    caution: string | null;
    price: number;
    durationMinutes: number;
    // 퍼블릭 상세에서만 채워진다(정원 = Store.maxCapacityPerSlot, 공방 단위). 파트너 상세는 생략.
    capacity?: number | null;
    leadTimeDays: number;
    deliverable: boolean;
    childFriendly: boolean;
    difficulty: ProgramDifficulty;
    status: ProgramStatus;
    images: ProgramDetailImage[];
}

export interface ProgramDetailResult {
    program: ProgramDetail;
}

export interface PartnerStoreProgramListItem {
    id: string;
    title: string;
    price: number;
    durationMinutes: number;
    difficulty: ProgramDifficulty;
    leadTimeDays: number;
    deliverable: boolean;
    status: ProgramStatus;
}

export interface PartnerStoreProgramsResult {
    programs: PartnerStoreProgramListItem[];
}

/**
 * 파트너 클래스 상세 조회. 소유권(program → store → partner.userId)은 단일 조회로 함께
 * 검증한다(store 의 PartnerStoreDetailReader 와 동일한 결).
 */
export abstract class PartnerProgramDetailReader {
    abstract execute(
        userId: string,
        storeId: string,
        programId: string,
    ): Promise<ProgramDetailResult>;
}

/**
 * 퍼블릭 클래스 상세 조회 — 공방 slug 로 식별하고 ACTIVE 클래스만 노출한다(인가 없음).
 */
export abstract class PublicProgramDetailReader {
    abstract execute(slug: string, programId: string): Promise<ProgramDetailResult>;
}

/**
 * 파트너센터 클래스 목록 조회 — storeId 기준 순수 조회. 소유권은 use-case 가 검증한다.
 */
export abstract class PartnerStoreProgramsReader {
    abstract execute(storeId: string): Promise<PartnerStoreProgramsResult>;
}
