// 클래스(program) 상태·난이도 도메인 타입 — prisma 의존 없이 문자열 리터럴로 표현한다.
export type ProgramStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type ProgramDifficulty = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

/**
 * 소유권·상태 검증용 projection.
 * program → store → partner.userId 경로의 소유자와, 변경 판단에 필요한 현재 값을 함께 노출한다.
 */
export interface ProgramOwnership {
    id: string;
    storeId: string;
    ownerUserId: string;
    status: ProgramStatus;
    price: number;
    leadTimeDays: number;
}

export interface CreateProgramInput {
    title: string;
    description: string | null;
    materials: string | null;
    caution: string | null;
    price: number;
    durationMinutes: number;
    difficulty: ProgramDifficulty;
    childFriendly: boolean;
    leadTimeDays: number;
    deliverable: boolean;
}

export interface CreatedProgram {
    id: string;
    storeId: string;
    title: string;
    status: ProgramStatus;
    createdAt: Date;
}

export interface UpdateProgramFields {
    title?: string;
    description?: string | null;
    materials?: string | null;
    caution?: string | null;
    price?: number;
    leadTimeDays?: number;
    durationMinutes?: number;
    difficulty?: ProgramDifficulty;
    childFriendly?: boolean;
    deliverable?: boolean;
}

export interface UpdatedProgram {
    id: string;
    title: string;
    price: number;
    status: ProgramStatus;
    updatedAt: Date;
}

export interface UpdatedProgramStatus {
    id: string;
    status: ProgramStatus;
    updatedAt: Date;
}

export interface ProgramOrder {
    id: string;
    sortOrder: number;
}

/**
 * 클래스 쓰기 포트. 조회 전용 흐름은 program-readers 의 Reader 들이 담당한다.
 */
export abstract class ProgramRepository {
    abstract findOwnership(programId: string): Promise<ProgramOwnership | null>;
    abstract create(storeId: string, input: CreateProgramInput): Promise<CreatedProgram>;
    // createSnapshot=true 이면 트랜잭션 내부의 갱신 결과값(price/leadTimeDays)으로 스냅샷을 만든다.
    // 실제 생성은 해당 프로그램에 예약이 1건 이상일 때만 일어난다.
    abstract update(
        programId: string,
        fields: UpdateProgramFields,
        createSnapshot: boolean,
    ): Promise<UpdatedProgram>;
    abstract updateStatus(programId: string, status: ProgramStatus): Promise<UpdatedProgramStatus>;
    abstract listIds(storeId: string): Promise<string[]>;
    abstract reorder(orders: ProgramOrder[]): Promise<void>;
}
